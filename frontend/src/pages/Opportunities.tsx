import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Search, Calendar, Bookmark, Target } from "lucide-react";
import { useAuth } from "@/components/Auth/useAuth";
import { supabase } from "../utils/supabase";
import tokenService from "../utils/tokenService";
import SideBar from "@/components/layout/SideBar";
import MainContent from "@/components/opportunities/MainContent";
import ScrollToTopButton from "@/components/opportunities/ScrollToTopButton";
import NotificationToast from "@/components/opportunities/NotificationToast";

import { toast } from "sonner";
import { FilterValues, Opportunity, SearchParams } from "@/models/opportunities";
import { ResponsivePatterns, DashboardTemplate } from "../utils/responsivePatterns";
import { API_ENDPOINTS } from "@/config/apiEndpoints";
import { getApiUrl } from "@/config/env";

 const API_BASE_URL = getApiUrl();

 



const OpportunitiesPage: React.FC = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get current date for header
  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

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
    // Check if this is a page reload (not navigation)
    const isPageReload = !window.performance.getEntriesByType('navigation')[0] || 
      (window.performance.getEntriesByType('navigation')[0] as any).type === 'reload';
    
    if (isPageReload) {
      // Clear search state on page reload
      sessionStorage.removeItem("lastOpportunitiesSearchState");
      sessionStorage.removeItem("aiRecommendations");
      sessionStorage.removeItem("allOpportunitiesForExport");
      return;
    }
    
    try {
      const saved = sessionStorage.getItem("lastOpportunitiesSearchState");
      if (saved) {
        const parsed = JSON.parse(saved);
        // Only restore if the saved state belongs to the current user
        const currentUserId = tokenService.getUserIdFromToken();
        if (!currentUserId || parsed.userId !== currentUserId) {
          sessionStorage.removeItem("lastOpportunitiesSearchState");
        } else {
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
          .from("trackers")
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

  const PAGE_SIZE = 7;

  // Fetch top-k results from enhanced search and slice locally for pagination
  const fetchEnhancedResults = async (
    params: { query: string; page?: number; pageSize?: number; onlyActive?: boolean }
  ): Promise<SearchResult> => {
    const query = params.query;
    const pageSize = params.pageSize || PAGE_SIZE;
    const page = params.page || 1;
    const onlyActive = params.onlyActive ?? false;

    const k = Math.max(page * pageSize, pageSize);

    const response = await fetch(API_ENDPOINTS.ENHANCED_VECTOR_SEARCH, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query,
        k,
        only_active: onlyActive,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.detail || data?.message || "Search failed");
    }

    const docs = Array.isArray(data.results) ? data.results : [];
    const processedResults = processSearchResults(docs);

    const total = processedResults.length; // equals returned top-k
    const total_pages = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(Math.max(1, page), total_pages);
    const start = (safePage - 1) * pageSize;
    const end = start + pageSize;
    const pageItems = processedResults.slice(start, end);

    return {
      opportunities: pageItems,
      total,
      total_pages,
      page: safePage,
    };
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
      const page = params.page || 1;
      const result = await fetchEnhancedResults({ query, page, pageSize: PAGE_SIZE });
      setOpportunities(result.opportunities);
      setTotalResults(result.total);
      setTotalPages(result.total_pages);
      setCurrentPage(result.page);
      setHasSearched(true);
      setRefinedQuery("");
      setShowRefinedQuery(false);
      saveSearchStateToSession(
        query,
        result.opportunities,
        result.total,
        result.total_pages,
        ""
      );
    } catch (error: any) {
      toast.error(error.message || "An error occurred during search", ResponsivePatterns.toast.config);
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

  const handleAddToTracker = async (opportunity: Opportunity) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: existingTrackers } = await supabase
        .from("trackers")
        .select("id")
        .eq("user_id", user.id)
        .eq("title", opportunity.title);

      if (existingTrackers && existingTrackers.length > 0) return;

      const { data, error } = await supabase
        .from("trackers")
        .insert([{ title: opportunity.title, description: opportunity.description || "", stage: "Assessment", user_id: user.id, due_date: opportunity.response_date }])
        .select();
      if (error) throw error;

      if (data && data.length > 0) {
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 3000);
        setPursuitCount((prev) => prev + 1);
      }
    } catch (error) {
      console.error("Error adding to tracker:", error);
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
    return results.map((result, index) => {
      // Check if this is the new JSON format
      if (result.description && result.timelines && result.details) {
        return {
          id: result.id || `auto-${index + 1}`,
          title: result.title || "Untitled Opportunity",
          agency: result.description.sponsor || "Unknown Agency",
          description: result.description.objective || result.description.expected_outcome || "",
          platform: result.platform || "unknown",
          external_url: result.external_url || result.url || "#",
          naics_code: result.details.naics_code || "N/A",
          published_date: result.timelines.published_date || new Date().toISOString(),
          response_date: result.timelines.due_date || null,
          budget: result.details.funding || "Not specified",
          solicitation_number: result.details.solicitation || "N/A",
          objective: result.description.objective || result.objective || "",
          expected_outcome: result.description.expected_outcome || result.expected_outcome || "",
          eligibility: (result.description.eligibility || result.eligibility || "") as string,
          key_facts: (result.details.key_facts || result.key_facts || "") as string,
          summary: undefined,
          active: true,
          type: "RFP",
        } as Opportunity;
      }
      
      // Fallback to existing format
      return {
        id: result.id || `temp-${Math.random().toString(36).substring(2, 9)}`,
        title: result.title || "Untitled Opportunity",
        agency: result.agency || result.department || "Unknown Agency",
        description: result.description || result.additional_description || "No description available",
        platform: result.platform || "unknown",
        external_url: result.external_url || result.url || "#",
        naics_code: result.naics_code || result.naicsCode || "N/A",
        published_date: result.published_date || result.posted || new Date().toISOString(),
        response_date: result.response_date || result.dueDate || null,
        budget: result.budget || "Not specified",
        solicitation_number: result.solicitation_number || "N/A",
        objective: (result.objective || "") as string,
        expected_outcome: (result.expected_outcome || "") as string,
        eligibility: (result.eligibility || "") as string,
        key_facts: (result.key_facts || "") as string,
        ...result,
      } as Opportunity;
    });
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
      userId: tokenService.getUserIdFromToken(),
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
    <div className={DashboardTemplate.wrapper}>
      <div className="flex flex-1 overflow-hidden">
        <SideBar />
        <div className={DashboardTemplate.main}>
          {/* Page content */}
          <div className={DashboardTemplate.content}>
            <div className="w-full">
              {/* Page header - moved to top for seamless UI */}
              <div className="flex items-center mb-6 bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="mr-6 w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-md">
                  <Search className="h-8 w-8" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Opportunities
                  </h1>
                  <div className="flex items-center mt-1 text-sm text-gray-500">
                    <Calendar className="h-4 w-4 mr-1" />
                    <span>{currentDate}</span>
                    <span className="mx-2">•</span>
                    <span className="flex items-center">
                      <Target className="h-4 w-4 mr-1 text-blue-500" />
                      Discover Opportunities
                    </span>
                  </div>
                </div>
                <div className="ml-auto flex space-x-3">
                  {/* My Tracker button removed - accessible via sidebar */}
                </div>
              </div>
              
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
            handleAddToPursuit={handleAddToTracker}
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
        </div>
      </div>
      <ScrollToTopButton isVisible={showScrollToTop} scrollToTop={handleScrollToTop} />
      <NotificationToast show={showNotification} />
    </div>
  );
};

export default OpportunitiesPage;