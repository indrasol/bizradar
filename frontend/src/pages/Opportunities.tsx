import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/components/Auth/useAuth";
import { supabase } from "../utils/supabase";
import tokenService from "../utils/tokenService";
import SideBar from "@/components/layout/SideBar";
import MainContent from "@/components/opportunities/MainContent";
import ScrollToTopButton from "@/components/opportunities/ScrollToTopButton";
import NotificationToast from "@/components/opportunities/NotificationToast";
import { toast } from "sonner";
import { FilterValues, Opportunity, SearchParams } from "@/models/opportunities";
import Header from "@/components/opportunities/Header";
import * as Toast from '@radix-ui/react-toast';

const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_BASE_URL = isDevelopment ? 'http://localhost:5000' : import.meta.env.VITE_API_BASE_URL;

const OpportunitiesPage: React.FC = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [filterValues, setFilterValues] = useState<FilterValues>({
    dueDate: "none",
    postedDate: "all",
    naicsCode: "",
    opportunityType: "all",
    contractType: null,
    platform: null,
  });
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalResults, setTotalResults] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [pursuitCount, setPursuitCount] = useState<number>(0);
  const [showNotification, setShowNotification] = useState<boolean>(false);
  const [refinedQuery, setRefinedQuery] = useState<string>("");
  const [showRefinedQuery, setShowRefinedQuery] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<string>("relevance");
  const [expandedDescriptions, setExpandedDescriptions] = useState<Record<string, boolean>>({});
  const requestInProgressRef = useRef<boolean>(false);
  const lastSearchIdRef = useRef<string>("");
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const resultsListRef = useRef<HTMLDivElement>(null);
  const [userProfile, setUserProfile] = useState<{ companyUrl?: string; companyDescription?: string }>({});
  const [open, setOpen] = useState(false);
  const isRestoringRef = useRef<boolean>(true);
  const hasRunInitialFilterEffectRef = useRef<boolean>(false);
  const hasRunInitialSortEffectRef = useRef<boolean>(false);

  // Restore last search state on mount without refetching
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("lastOpportunitiesSearchState");
      if (saved) {
        const parsed = JSON.parse(saved);
        // Set filters and sort first while searchQuery is still empty to avoid auto-fetch
        if (parsed.filters) {
          setFilterValues((prev) => ({
            ...prev,
            ...parsed.filters,
          }));
        }
        if (parsed.sortBy) {
          setSortBy(parsed.sortBy);
        }
        // Now set query and results
        setSearchQuery(parsed.query || "");
        if (Array.isArray(parsed.results)) {
          setOpportunities(parsed.results);
          setHasSearched(parsed.results.length > 0);
        }
        setTotalResults(parsed.total || 0);
        setTotalPages(parsed.totalPages || 1);
        setCurrentPage(1);
        setRefinedQuery(parsed.refinedQuery || "");
        setShowRefinedQuery(!!parsed.refinedQuery);
      }
    } catch (e) {
      // Ignore corrupted saved state
      console.warn("Failed to restore last opportunities search state", e);
    } finally {
      // Defer releasing the guard to the next tick to ensure effects triggered by
      // the above state updates do not auto-fetch.
      setTimeout(() => {
        isRestoringRef.current = false;
      }, 0);
    }
  }, []);

  useEffect(() => {
    if (!hasRunInitialFilterEffectRef.current) {
      hasRunInitialFilterEffectRef.current = true;
      return;
    }
    if (isRestoringRef.current) return;
    applyFilters();
  }, [filterValues.opportunityType, filterValues.dueDate, filterValues.postedDate, filterValues.naicsCode]);

  useEffect(() => {
    if (!hasRunInitialSortEffectRef.current) {
      hasRunInitialSortEffectRef.current = true;
      return;
    }
    if (isRestoringRef.current) return;
    applySort();
  }, [sortBy]);

  useEffect(() => {
    const fetchPursuitCount = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { count, error } = await supabase
          .from("pursuits")
          .select("id", { count: "exact" })
          .eq("user_id", user.id);
        if (error) throw error;
        setPursuitCount(count || 0);
      } catch (error) {
        console.error("Error fetching pursuit count:", error);
      }
    };
    fetchPursuitCount();
  }, []);

  useEffect(() => {
    const fetchUserProfile = async () => {
      // 1. Try sessionStorage first
      const userProfileStr = sessionStorage.getItem("userProfile");
      if (userProfileStr) {
        try {
          setUserProfile(JSON.parse(userProfileStr));
          return;
        } catch (e) {
          // continue to API fallback
        }
      }
      // 2. Fallback: fetch from Supabase
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        // Get user's companies
        const { data: userCompanies, error: userCompaniesError } = await supabase
          .from("user_companies")
          .select("*")
          .eq("user_id", user.id);
        if (userCompaniesError || !userCompanies || userCompanies.length === 0) return;
        const primaryCompany = userCompanies.find((c: any) => c.is_primary) || userCompanies[0];
        // Get company details
        const { data: companyDetails, error: companyDetailsError } = await supabase
          .from("companies")
          .select("*")
          .eq("id", primaryCompany.company_id)
          .single();
        if (companyDetailsError || !companyDetails) return;
        const profile = {
          companyUrl: companyDetails.url || "",
          companyDescription: companyDetails.description || ""
        };
        setUserProfile(profile);
        sessionStorage.setItem("userProfile", JSON.stringify(profile));
      } catch (e) {
        setUserProfile({});
      }
    };
    fetchUserProfile();
  }, []);

  const [generateSummary, setGenerateSummary] = useState(false)
  // useEffect(() => {
  //   if (generateSummary) {
  //     setGenerateSummary(false);
  //     const fetchSummaries = async () => {
  //       const resultsWithSummaries = await getSummariesForOpportunities(opportunities);
  //       setOpportunities(resultsWithSummaries);
  //       saveSearchStateToSession(searchQuery, resultsWithSummaries, totalResults, totalPages, refinedQuery);
  //     };
  //     fetchSummaries();
  //   }
  // }, [generateSummary]);

  // const handleSearch = async (e: React.FormEvent | null, suggestedQuery: string | null = null) => {
  //   e?.preventDefault();
  //   const query = suggestedQuery || searchQuery;
  //   if (!query.trim()) return;

  //   setIsSearching(true);
  //   setHasSearched(false);

  //   try {
  //     const response = await fetch(`${API_BASE_URL}/search-opportunities`, {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({
  //         query,
  //         user_id: tokenService.getUserIdFromToken(),
  //         page: 1,
  //         page_size: 7,
  //         is_new_search: true,
  //         ...filterValues,
  //         sort_by: sortBy,
  //       } as SearchParams),
  //     });

  //     const data = await response.json();
  //     if (data.success) {
  //       setRefinedQuery(data.refined_query || "");
  //       setShowRefinedQuery(!!data.refined_query);
  //       const processedResults = processSearchResults(data.results);
  //       setOpportunities(processedResults);
  //       setTotalResults(data.total);
  //       setTotalPages(data.total_pages);
  //       setCurrentPage(data.page);
  //       setHasSearched(true);
  //       saveSearchStateToSession(query, processedResults, data.total, data.total_pages, data.refined_query);
  //       setGenerateSummary(true);
  //       } else {
  //       toast.error(data.message || "Search failed");
  //       setOpportunities([]);
  //     }
  //   } catch (error) {
  //     console.error("Error fetching opportunities:", error);
  //     toast.error("An error occurred during search");
  //   } finally {
  //     setIsSearching(false);
  //   }
  // };

  // const paginate = async (pageNumber: number) => {
  //   if (pageNumber === currentPage) return;
  //   setIsSearching(true);

  //   try {
  //     const response = await fetch(`${API_BASE_URL}/search-opportunities`, {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({
  //         query: searchQuery,
  //         page: pageNumber,
  //         page_size: 7,
  //         user_id: tokenService.getUserIdFromToken(),
  //         is_new_search:false,
  //         ...filterValues,
  //       } as SearchParams),
  //     });

  //     const data = await response.json();
  //     if (data.success && Array.isArray(data.results)) {
  //       const processedResults = processSearchResults(data.results);
  //       const resultsWithSummaries = await getSummariesForOpportunities(processedResults);
  //       setOpportunities(resultsWithSummaries);
  //       setTotalResults(data.total);
  //       setCurrentPage(pageNumber);
  //       setTotalPages(data.total_pages);
  //       saveSearchStateToSession(searchQuery, resultsWithSummaries, data.total, data.total_pages, refinedQuery);
  //     }
  //   } catch (error) {
  //     console.error("Error during pagination:", error);
  //   } finally {
  //     setIsSearching(false);
  //   }
  // };

  // const applyFilters = async () => {
  //   try {
  //     if (searchQuery != '') {
  //       setIsSearching(true);
  //       const response = await fetch(`${API_BASE_URL}/search-opportunities`, {
  //         method: "POST",
  //         headers: { "Content-Type": "application/json" },
  //         body: JSON.stringify({
  //           query: searchQuery,
  //           ...filterValues,
  //           sort_by: sortBy,
  //           page: 1,
  //           page_size: 7,
  //           user_id: tokenService.getUserIdFromToken(),
  //         } as SearchParams),
  //       });

  //       const data = await response.json();
  //       if (data.success && Array.isArray(data.results)) {
  //         const processedResults = processSearchResults(data.results);
  //         const resultsWithSummaries = await getSummariesForOpportunities(processedResults);
  //         setOpportunities(resultsWithSummaries);
  //         setTotalResults(data.total);
  //         setCurrentPage(1);
  //         setTotalPages(data.total_pages);
  //         saveSearchStateToSession(searchQuery, resultsWithSummaries, data.total, data.total_pages, refinedQuery);
  //       }
  //     }
  //   } catch (error) {
  //     console.error("Error applying filters:", error);
  //   } finally {
  //     setIsSearching(false);
  //   }
  // };

  type SearchResult = {
    opportunities: Opportunity[];
    total: number;
    total_pages: number;
    page: number;
    refined_query?: string;
  };

  // Generator function to handle search with streaming results
  const executeSearch = async (
    params: Partial<SearchParams>
  ): Promise<SearchResult> => {
    console.log({
      user_id: tokenService.getUserIdFromToken(),
      page_size: 7,
      ...params,
    });
  
    const response = await fetch(`${API_BASE_URL}/search-opportunities`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: tokenService.getUserIdFromToken(),
        page_size: 7,
        ...params,
      } as SearchParams),
    });
  
    const data = await response.json();
  
    if (!data.success) {
      throw new Error(data.message || "Search failed");
    }
    if (!Array.isArray(data.results)) {
      throw new Error("Invalid data format received");
    }
  
    // Save all_results to sessionStorage for export
    if (Array.isArray(data.all_results)) {
      sessionStorage.setItem("allOpportunitiesForExport", JSON.stringify(data.all_results));
    }
  
    // Process results
    const processedResults = processSearchResults(data.results);
  
    // // Yield the complete search results with summaries
    // yield {
    //   opportunities: await Promise.all(
    //     processedResults.map(opp => getSummaryForOpportunity(opp))
    //   ),
    //   total: data.total || 0,
    //   total_pages: data.total_pages || 1,
    //   page: data.page || 1,
    //   refined_query: data.refined_query,
    // };
    
    // If you want to yield results one by one, you can use this instead:
    const summarized_results = []
    let tot = 0
    for (const opportunity of processedResults) {
      const summary = await getSummaryForOpportunity(opportunity);
      summarized_results.push(summary)
      setOpportunities(summarized_results)
      tot = tot+1;
      setTotalResults(tot);
      setOpen(true);
      
      setTotalPages(data.total_pages || 1);
      setCurrentPage(data.page || 1);
      setHasSearched(true);
      // saveSearchStateToSession(
      //   data.query,
      //   summarized_results,
      //   tot,
      //   data.total_pages,
      //   refinedQuery || ""
      // );
      console.log("Adding results")
    }
    return {
      opportunities: summarized_results,
      total: data.total || 0,
      total_pages: data.total_pages || 1,
      page: data.page || 1,
      refined_query: data.refined_query,
    };
  };

  // Helper to get refined/expanded query from backend
  const getRefinedQuery = async (query: string, contractType?: string | null, platform?: string | null) => {
    const response = await fetch(`${API_BASE_URL}/refine-query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, contract_type: contractType, platform, user_id: tokenService.getUserIdFromToken() }),
    });
    const data = await response.json();
    if (data.success) return data.refined_query;
    throw new Error(data.message || "Failed to refine query");
  };

  const performAndSetSearch = async (
    params: Partial<SearchParams>,
    query: string
  ) => {
    if (isRestoringRef.current) {
      return;
    }
    setIsSearching(true);
    setHasSearched(false);

    try {
      // 1. Get expanded query first
      const refinedQuery = await getRefinedQuery(query, params.contract_type, params.platform);
      setRefinedQuery(refinedQuery);
      setShowRefinedQuery(true);

      // 2. Now search using the expanded query
      const result = await executeSearch({ ...params, query: refinedQuery });
      setOpportunities(result.opportunities);
      setTotalResults(result.total);
      setTotalPages(result.total_pages);
      setCurrentPage(result.page);
      setHasSearched(true);
      saveSearchStateToSession(
        query,
        result.opportunities,
        result.total,
        result.total_pages,
        result.refined_query || ""
      );
    } catch (error: any) {
      toast.error(error.message || "An error occurred during search");
      setOpportunities([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = async (
    e: React.FormEvent | null,
    suggestedQuery: string | null = null
  ) => {
    e?.preventDefault();
    const query = suggestedQuery ?? searchQuery;
    if (!query.trim()) return;

    await performAndSetSearch(
      {
        query,
        page: 1,
        is_new_search: true,
        sort_by: sortBy,
        due_date_filter: filterValues.dueDate,
        posted_date_filter: filterValues.postedDate,
        naics_code: filterValues.naicsCode,
        opportunity_type: filterValues.opportunityType,
      },
      query
    );
  };

  const paginate = async (pageNumber: number) => {
    if (pageNumber === currentPage) return;

    await performAndSetSearch(
      {
        query: searchQuery,
        page: pageNumber,
        is_new_search: false,
        sort_by: sortBy,
        due_date_filter: filterValues.dueDate,
        posted_date_filter: filterValues.postedDate,
        naics_code: filterValues.naicsCode,
        opportunity_type: filterValues.opportunityType,
      },
      searchQuery
    );
  };

  const applyFilters = async () => {
    if (!searchQuery.trim()) return;

    await performAndSetSearch(
      {
        query: searchQuery,
        page: 1,
        sort_by: sortBy,
        is_new_search: true,
        due_date_filter: filterValues.dueDate,
        posted_date_filter: filterValues.postedDate,
        naics_code: filterValues.naicsCode,
        opportunity_type: filterValues.opportunityType,
      },
      searchQuery
    );
  };

  const applySort = async () => {
    if (!searchQuery.trim()) return;

    await performAndSetSearch(
      {
        query: searchQuery,
        page: 1,
        sort_by: sortBy,
        is_new_search: false,
        due_date_filter: filterValues.dueDate,
        posted_date_filter: filterValues.postedDate,
        naics_code: filterValues.naicsCode,
        opportunity_type: filterValues.opportunityType,
      },
      searchQuery
    );
  };

  const handleSuggestedQueryClick = async (query) => {
    setSearchQuery(query);
    handleSearch(null, query);
  }

  const handleAddToPursuit = async (opportunity: Opportunity) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: existingPursuits } = await supabase
        .from("pursuits")
        .select("id")
        .eq("user_id", user.id)
        .eq("title", opportunity.title);

      if (existingPursuits && existingPursuits.length > 0) return;

      const { data, error } = await supabase
        .from("pursuits")
        .insert([{ title: opportunity.title, description: opportunity.description || "", stage: "Assessment", user_id: user.id, due_date: opportunity.response_date }])
        .select();
      if (error) throw error;

      if (data && data.length > 0) {
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 3000);
        setPursuitCount((prev) => prev + 1);
      }
    } catch (error) {
      console.error("Error adding to pursuits:", error);
    }
  };

  const handleBeginResponse = (contractId: string, contractData: Opportunity) => {
    const contract = {
      id: contractId,
      title: contractData.title,
      department: contractData.agency,
      noticeId: contractData.id,
      dueDate: contractData.response_date || "2025-01-01",
      response_date: contractData.response_date || "2025-01-01",
      published_date: contractData.published_date || "",
      value: contractData.budget || "0",
      status: contractData.active === false ? "Inactive" : "Active",
      naicsCode: contractData.naics_code || "000000",
      solicitation_number: contractData.solicitation_number || "",
      description: contractData.description || "",
      external_url: contractData.external_url || "",
      budget: contractData.budget || "",
    };
    sessionStorage.setItem("currentContract", JSON.stringify(contract));
    navigate(`/contracts/rfp/${contractData.id}`);
  };

  const handleViewDetails = (opportunity: Opportunity) => {
    const url = opportunity.external_url || (opportunity.platform === "sam.gov" ? `https://sam.gov/opp/${opportunity.id}/view` : "");
    if (url) window.open(url, "_blank");
    else navigate(`/opportunities/${opportunity.id}`);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setOpportunities([]);
    setTotalResults(0);
    setCurrentPage(1);
    setHasSearched(false);
    setShowRefinedQuery(false);
    setRefinedQuery("");
    sessionStorage.removeItem("lastOpportunitiesSearchState");
    setFilterValues({
      dueDate: "none",
      postedDate: "all",
      naicsCode: "",
      opportunityType: "All",
      contractType: null,
      platform: null,
    });
  };

  const processSearchResults = (results: any[]): Opportunity[] => {
    if (!Array.isArray(results)) return [];
    return results.map((result) => ({
      id: result.id || `temp-${Math.random().toString(36).substring(2, 9)}`,
      title: result.title || "Untitled Opportunity",
      agency: result.agency || result.department || "Unknown Agency",
      description: result.description || result.additional_description || "No description available",
      platform: result.platform || "unknown",
      external_url: result.external_url || result.url || "#",
      naics_code: result.naics_code || result.naicsCode || "N/A",
      published_date: result.published_date || result.posted || new Date().toISOString(),
      response_date: result.response_date || result.dueDate || null,
      ...result,
    }));
  };

  const getSummariesForOpportunities = async (opps: Opportunity[]): Promise<Opportunity[]> => {
    if (!opps.length) return opps;
    
    try {
      const response = await fetch(`${API_BASE_URL}/summarize-descriptions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ opportunities: opps, user_id: tokenService.getUserIdFromToken() }),
      });

      if (!response.body) {
        console.error("No response body for streaming");
        return opps;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      const processedOpps: Opportunity[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim());

        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            if (data.success && data.opportunity) {
              const opp = {
                ...data.opportunity,
                summary_ai: data.opportunity.summary || data.opportunity.additional_description,
                // Use enhanced title if available
                title: data.opportunity.title,
              };
              processedOpps.push(opp);
            }
          } catch (parseError) {
            console.error("Error parsing streaming response line:", parseError);
          }
        }
      }

      return processedOpps.length > 0 ? processedOpps : opps;
    } catch (error) {
      console.error("Error getting summaries:", error);
      return opps;
    }
  };

  const getSummaryForOpportunity = async (opportunity: Opportunity): Promise<Opportunity> => {
    if (!opportunity) return opportunity;
    try {
      const response = await fetch(`${API_BASE_URL}/summarize-description`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ opportunity: opportunity, user_id: tokenService.getUserIdFromToken() }),
        });
        const data = await response.json();
        if (data.success && data.opportunity) {
          opportunity.summary_ai = data.opportunity.summary || data.opportunity.additional_description;
          // Use enhanced title if available
          if (data.opportunity.title) {
            opportunity.title = data.opportunity.title;
          }
          return opportunity;
        }
    } catch (error) {
      console.error("Error getting summaries for opportunity:", error);
      return opportunity;
    }
  };

  const saveSearchStateToSession = (query: string, results: Opportunity[], total: number, totalPages: number, refinedQuery: string) => {
    const searchState = {
      query,
      results,
      total,
      totalPages,
      refinedQuery,
      filters: filterValues,
      sortBy,
      lastUpdated: new Date().toISOString(),
    };
    sessionStorage.setItem("lastOpportunitiesSearchState", JSON.stringify(searchState));
  };

  // Handler for ResultsList scroll
  const handleResultsScroll = (scrollTop: number) => {
    if (scrollTop > 100) {
      setShowScrollToTop(true);
    } else {
      setShowScrollToTop(false);
    }
  };

  const handleScrollToTop = () => {
    if (resultsListRef.current) {
      resultsListRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50 text-gray-800">
      <div className="flex flex-1 overflow-hidden">
        <SideBar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header logout={logout} pursuitCount={pursuitCount} />
          <MainContent
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            handleSearch={handleSearch}
            clearSearch={clearSearch}
            filterValues={filterValues}
            setFilterValues={setFilterValues}
            opportunities={opportunities}
            isSearching={isSearching}
            hasSearched={hasSearched}
            totalResults={totalResults}
            currentPage={currentPage}
            totalPages={totalPages}
            paginate={paginate}
            handleAddToPursuit={handleAddToPursuit}
            handleBeginResponse={handleBeginResponse}
            handleViewDetails={handleViewDetails}
            refinedQuery={refinedQuery}
            showRefinedQuery={showRefinedQuery}
            setShowRefinedQuery={setShowRefinedQuery}
            sortBy={sortBy}
            setSortBy={setSortBy}
            expandedDescriptions={expandedDescriptions}
            setExpandedDescriptions={setExpandedDescriptions}
            handleSuggestedQueryClick={handleSuggestedQueryClick}
            applyFilters={applyFilters}
            onResultsScroll={handleResultsScroll}
            resultsListRef={resultsListRef}
            userProfile={userProfile}
          />
        </div>
      </div>
      <Toast.Provider>
        <Toast.Root 
          className="bg-white rounded-md shadow-[hsl(206_22%_7%_/_35%)_0px_10px_38px_-10px,_hsl(206_22%_7%_/_20%)_0px_10px_20px_-15px] p-4 grid [grid-template-areas:_'title_action'_'description_action'] grid-cols-[auto_max-content] gap-x-4 items-center data-[state=open]:animate-slideIn data-[state=closed]:animate-hide data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=cancel]:translate-x-0 data-[swipe=cancel]:transition-[transform_200ms_ease-out] data-[swipe=end]:animate-swipeOut"
          open={open} 
          onOpenChange={setOpen}
        >
          <Toast.Title className="[grid-area:_title] mb-1 font-medium text-slate12 text-lg">
            Searching...
          </Toast.Title>
          <Toast.Description asChild>
            <div className="[grid-area:_description] text-sm text-slate11">
              Found {totalResults} result{totalResults !== 1 ? 's' : ''}
            </div>
          </Toast.Description>
        </Toast.Root>
        <Toast.Viewport className="[--viewport-padding:_25px] fixed bottom-0 right-0 flex flex-col p-[var(--viewport-padding)] gap-2.5 w-[390px] max-w-[100vw] m-0 list-none z-[2147483647] outline-none" />
      </Toast.Provider>
      <ScrollToTopButton isVisible={showScrollToTop} scrollToTop={handleScrollToTop} />
      <NotificationToast show={showNotification} />
    </div>
  );
};

export default OpportunitiesPage;