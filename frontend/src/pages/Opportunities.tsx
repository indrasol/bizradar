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
import { reportsApi } from '@/api/reports';
import { trackersApi } from '@/api/trackers';
import { rfpUsageApi } from '@/api/rfpUsage';
import { useRfpUsage } from '@/hooks/useRfpUsage';

import { toast } from "sonner";
import { FilterValues, Opportunity, SearchParams } from "@/models/opportunities";
import { ResponsivePatterns, DashboardTemplate } from "../utils/responsivePatterns";
import { API_ENDPOINTS } from "@/config/apiEndpoints";
import { getApiUrl } from "@/config/env";
import { useTrack } from "@/logging";

 const API_BASE_URL = getApiUrl();

 



// Fallback UUID generation for browsers that don't support crypto.randomUUID()
const generateFallbackUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const OpportunitiesPage: React.FC = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { isLimitReached, usageStatus, refetch: refetchUsage } = useRfpUsage();
  
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
    customPostedDateFrom: "",
    customPostedDateTo: "",
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

  const track = useTrack();

  useEffect(() => {
    track({
      event_name: "opportunities",
      event_type: "View",
      metadata: {search_query: null, stage: null, section: null, opportunity_id: null, title: null, naics_code: null}    // explicitly pass empty metadata
    });
  }, [track]);
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
    // Apply filters when filter values change and we have an active search
    if (searchQuery.trim() && hasSearched && allEnhancedResults.length > 0) {
      applyFilters();
    }
  }, [filterValues.opportunityType, filterValues.dueDate, filterValues.postedDate, filterValues.naicsCode, filterValues.customPostedDateFrom, filterValues.customPostedDateTo]);

  useEffect(() => {
    // Apply sort when sort value changes and we have an active search
    if (searchQuery.trim() && hasSearched && allEnhancedResults.length > 0) {
      applySort();
    }
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

  const PAGE_SIZE = 5;

  // Local cache of the latest enhanced results for client-side pagination
  const [allEnhancedResults, setAllEnhancedResults] = useState<Opportunity[]>([]);
  // Current filtered results for pagination
  const [currentFilteredResults, setCurrentFilteredResults] = useState<Opportunity[]>([]);

  // Single API call to fetch up to 25 results; pagination is client-side (5/page)
  const fetchInitialEnhancedResults = async (
    query: string,
    onlyActive: boolean
  ): Promise<Opportunity[]> => {
    const response = await fetch(API_ENDPOINTS.ENHANCED_VECTOR_SEARCH, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query,
        top_k: 25,
        only_active: onlyActive,
        user_id: tokenService.getUserIdFromToken(),
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.detail || data?.message || "Search failed");
    }

    const docs = Array.isArray(data.results) ? data.results : [];
    const processedResults = processSearchResults(docs);
    return processedResults;
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
    setIsSearching(true);
    setHasSearched(false);

    try {
      // Single API call to fetch all results, then slice locally
      const results = await fetchInitialEnhancedResults(query, false);
      setAllEnhancedResults(results);
      
      // Initialize filtered results with all results (no filters applied initially)
      setCurrentFilteredResults(results);
      
      const total = results.length;
      const total_pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
      const page = 1;
      setOpportunities(results.slice(0, PAGE_SIZE));
      setTotalResults(total);
      setTotalPages(total_pages);
      setCurrentPage(page);
      setHasSearched(true);
      setRefinedQuery("");
      setShowRefinedQuery(false);
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
    
    // Use filtered results if available, otherwise use all results
    const resultsToPaginate = currentFilteredResults.length > 0 ? currentFilteredResults : allEnhancedResults;
    
    const total_pages = Math.max(1, Math.ceil(resultsToPaginate.length / PAGE_SIZE));
    const safePage = Math.min(Math.max(1, pageNumber), total_pages);
    const start = (safePage - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    setOpportunities(resultsToPaginate.slice(start, end));
    setCurrentPage(safePage);
  };

  const applyFilters = async () => {
    if (!searchQuery.trim() || allEnhancedResults.length === 0) return;

    console.log(`🔍 applyFilters called with filterValues:`, filterValues);
    console.log(`📊 Total opportunities to filter: ${allEnhancedResults.length}`);

    // Apply client-side filters to the already fetched results
    const filteredResults = applyClientSideFilters(allEnhancedResults, filterValues);
    
    // Update the current filtered results for pagination
    setCurrentFilteredResults(filteredResults);
    
    // Update the displayed results with filtered data
    const total = filteredResults.length;
    const total_pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const page = 1;
    
    console.log(`📈 Filter results: ${total} opportunities, ${total_pages} pages`);
    
    setOpportunities(filteredResults.slice(0, PAGE_SIZE));
    setTotalResults(total);
    setTotalPages(total_pages);
    setCurrentPage(page);
    setHasSearched(true);
  };

  const applySort = async () => {
    if (!searchQuery.trim() || allEnhancedResults.length === 0) return;

    // Get the current filtered results or use all results if no filters applied
    const baseResults = currentFilteredResults.length > 0 ? currentFilteredResults : allEnhancedResults;
    
    // Apply client-side sorting to the results
    let sortedResults = [...baseResults];
    
    switch (sortBy) {
      case "relevance":
        // Keep original order (already sorted by relevance from vector search)
        break;
      case "due_date":
        sortedResults.sort((a, b) => {
          if (!a.response_date && !b.response_date) return 0;
          if (!a.response_date) return 1;
          if (!b.response_date) return -1;
          return new Date(a.response_date).getTime() - new Date(b.response_date).getTime();
        });
        break;
      case "posted_date":
        sortedResults.sort((a, b) => {
          if (!a.published_date && !b.published_date) return 0;
          if (!a.published_date) return 1;
          if (!b.published_date) return -1;
          return new Date(b.published_date).getTime() - new Date(a.published_date).getTime();
        });
        break;
      case "budget":
        sortedResults.sort((a, b) => {
          const budgetA = parseFloat(a.budget?.replace(/[^0-9.-]/g, '') || '0');
          const budgetB = parseFloat(b.budget?.replace(/[^0-9.-]/g, '') || '0');
          return budgetB - budgetA; // Descending order (highest first)
        });
        break;
      default:
        break;
    }
    
    // Update the current filtered results for pagination
    setCurrentFilteredResults(sortedResults);
    
    // Update the displayed results with sorted data
    const total = sortedResults.length;
    const total_pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const page = 1;
    
    setOpportunities(sortedResults.slice(0, PAGE_SIZE));
    setTotalResults(total);
    setTotalPages(total_pages);
    setCurrentPage(page);
    setHasSearched(true);
  };

  const handleSuggestedQueryClick = async (query) => {
    setSearchQuery(query);
    handleSearch(null, query);
  }

  const handleAddToTracker = async (opportunity: Opportunity) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      console.log('🔍 handleAddToTracker: Checking for existing tracker');
      console.log('📋 Opportunity title:', opportunity.title);
      
      // Check if already tracked using API
      const trackersResponse = await trackersApi.getTrackers(user.id);
      console.log('📋 Available trackers:', trackersResponse.trackers.map(t => ({ id: t.id, title: t.title })));
      
      const existingTracker = trackersResponse.trackers.find(t => {
        const match = t.title === opportunity.title;
        console.log(`🔍 Comparing: "${t.title}" === "${opportunity.title}" = ${match}`);
        return match;
      });

      if (existingTracker) {
        console.log('✅ Found existing tracker, removing it:', existingTracker.id);
        // Already tracked → toggle OFF by deleting
        await trackersApi.deleteTracker(existingTracker.id, user.id);
        setPursuitCount((prev) => Math.max(0, prev - 1));
        // Dispatch custom event to update SideBar count
        window.dispatchEvent(new CustomEvent('trackerUpdated'));
        try {
          toast.success("Removed from Tracker", {
            description: "This opportunity is no longer being tracked.",
            duration: 2500,
          });
        } catch {}
        return;
      }

      console.log('❌ No existing tracker found, creating new one');

      // Create new tracker using API
      const newTracker = await trackersApi.createTracker({
        title: opportunity.title,
        description: opportunity.description || "",
        stage: "Review",
        due_date: opportunity.response_date,
        opportunity_id: Number(opportunity.id)
      }, user.id);

      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
      setPursuitCount((prev) => prev + 1);
      // Dispatch custom event to update SideBar count
      window.dispatchEvent(new CustomEvent('trackerUpdated'));
      
      // Refresh usage status to ensure limits are correctly applied
      refetchUsage();
      // Immediate feedback toast
      try {
        toast.success("Added to Tracker", {
          description: "This opportunity is now being tracked in My Tracker.",
          duration: 2500,
        });
      } catch {}
    } catch (error) {
      console.error("Error adding to tracker:", error);
    }
  };

  // Replace the handleBeginResponse function with this:
const handleBeginResponse = async (contractId: string, contractData: Opportunity) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // NEW: Check if user can generate a report for this opportunity
    const numericOpportunityId = Number(contractData.id);
    const check = await rfpUsageApi.checkOpportunity(numericOpportunityId);
    
    if (!check.can_generate) {
      toast.error(check.status.message);
      return;
    }
    
    // If under limit and not an existing report, record usage immediately
    if (check.reason === 'under_limit') {
      await rfpUsageApi.recordUsage(numericOpportunityId);
    }

    // SIMPLE LOGIC: Check if response exists, if yes load it, if no create new
    const { reportsApi } = await import('../api/reports');
    
    let responseId;
    let isExisting = false;
    
    try {
      // Try to find existing report by title
      const existingReports = await reportsApi.getReports(user.id);
      const existingReport = existingReports.reports.find(r => 
        r.title && r.title.toLowerCase().trim() === contractData.title.toLowerCase().trim()
      );
      
      if (existingReport) {
        console.log('✅ Found existing response, loading it:', existingReport.response_id);
        responseId = existingReport.response_id;
        isExisting = true;
      }
    } catch (error) {
      console.log('No existing reports found, will create new one');
    }

    if (!isExisting) {
      console.log('❌ No existing response found, creating new one');
      // Generate new response ID
      responseId = (typeof window !== "undefined" && window.crypto && "randomUUID" in window.crypto)
        ? window.crypto.randomUUID()
        : generateFallbackUUID();
    }

    // Clear any old session storage
    sessionStorage.removeItem("currentContract");
    sessionStorage.removeItem("currentTrackerId");

    // 2) Create new report only if it doesn't exist
    if (!isExisting) {
      try {
        await reportsApi.upsertReport(
          responseId,
          {
            logo: null,
            companyName: "",
            companyWebsite: "",
            letterhead: "",
            phone: "",
            rfpTitle: contractData.title || "",
            naicsCode: String(contractData.naics_code || "000000"),
            solicitationNumber: contractData.solicitation_number || "",
            issuedDate: contractData.published_date || new Date().toISOString(),
            submittedBy: "",
            theme: "professional",
            sections: [],
            isSubmitted: false,
            dueDate: contractData.response_date || null
          },
          0, // completion_percentage
          false, // is_submitted
          user.id,
          Number(contractData.id) // opportunity_id
        );
        console.log(`Created new report entry for response ${responseId}`);
      } catch (apiError) {
        console.error("Failed to create report via API:", apiError);
        toast.error("Failed to initialize report. Please try again.");
        return;
      }
    }

    // 3) Save contract + pursuit_id for the RFP page to read
    const contract = {
      id: contractData.id, // Use the actual opportunity ID from contractData
      title: contractData.title,
      department: contractData.agency,
      noticeId: contractData.id,
      dueDate: contractData.response_date || null,
      response_date: contractData.response_date || null,
      published_date: contractData.published_date || "",
      value: contractData.budget || "0",
      status: contractData.active === false ? "Inactive" : "Active",
      naicsCode: contractData.naics_code || "000000",
      solicitation_number: contractData.solicitation_number || "",
      description: contractData.description || "",
      external_url: contractData.external_url || "",
      budget: contractData.budget || "",
      pursuit_id: responseId, // Use the response ID
    };

    sessionStorage.setItem("currentContract", JSON.stringify(contract));
    sessionStorage.setItem("currentTrackerId", responseId);

    try {
      toast.success(isExisting ? "Loading existing response" : "Report initialized", {
        description: isExisting ? "Opening your saved response." : "Opening RFP Builder for this opportunity.",
        duration: 1500,
      });
    } catch {}

    // 4) Always redirect to response builder
    navigate(`/contracts/rfp/${responseId}`);

  } catch (error) {
    console.error("Error initializing report:", error);
    toast.error("An error occurred. Please try again.");
  }
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
    setAllEnhancedResults([]);
    setCurrentFilteredResults([]);
    setFilterValues({
      dueDate: "none",
      postedDate: "all",
      naicsCode: "",
      opportunityType: "all",
      contractType: null,
      platform: null,
      customPostedDateFrom: "",
      customPostedDateTo: "",
    });
  };

  // Client-side filter functions
  const filterByDueDate = (opportunities: Opportunity[], dueDateFilter: string): Opportunity[] => {
    if (dueDateFilter === "none") return opportunities;
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    return opportunities.filter(opp => {
      // Exclude items with no due date in filtered views
      if (!opp.response_date) return false;
      
      const dueDate = new Date(opp.response_date);
      const daysDiff = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      switch (dueDateFilter) {
        case "active_only":
          // Only show truly active items and not past due
          return opp.active === true && daysDiff >= 0;
        case "due_in_7_days":
          return daysDiff >= 0 && daysDiff <= 7;
        case "next_30_days":
          return daysDiff >= 0 && daysDiff <= 30;
        case "next_3_months":
          return daysDiff >= 0 && daysDiff <= 90;
        case "next_12_months":
          return daysDiff >= 0 && daysDiff <= 365;
        default:
          return true;
      }
    });
  };

  const filterByPostedDate = (opportunities: Opportunity[], postedDateFilter: string, customFrom?: string, customTo?: string): Opportunity[] => {
    if (postedDateFilter === "all") return opportunities;
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    return opportunities.filter(opp => {
      if (!opp.published_date) return false;
      
      const postedDate = new Date(opp.published_date);
      const daysDiff = Math.ceil((today.getTime() - postedDate.getTime()) / (1000 * 60 * 60 * 24));
      
      switch (postedDateFilter) {
        case "past_day":
          return daysDiff <= 1;
        case "past_week":
          return daysDiff <= 7;
        case "past_month":
          return daysDiff <= 30;
        case "past_year":
          return daysDiff <= 365;
        case "custom_date":
          if (!customFrom || !customTo) return true;
          const fromDate = new Date(customFrom);
          const toDate = new Date(customTo);
          return postedDate >= fromDate && postedDate <= toDate;
        default:
          return true;
      }
    });
  };

  const filterByNaicsCode = (opportunities: Opportunity[], naicsCode: string): Opportunity[] => {
    if (!naicsCode || naicsCode.trim() === "") return opportunities;
    
    const searchCode = naicsCode.trim();
    console.log(`🏷️ Filtering by NAICS code: "${searchCode}"`);
    
    const filtered = opportunities.filter(opp => {
      if (!opp.naics_code) {
        console.log(`❌ Opportunity "${opp.title}" has no NAICS code`);
        return false;
      }
      
      // Check for exact match or starts with (for partial codes)
      const oppNaics = opp.naics_code.toString();
      const matches = oppNaics === searchCode || oppNaics.startsWith(searchCode);
      
      if (matches) {
        console.log(`✅ Opportunity "${opp.title}" matches NAICS: ${oppNaics}`);
      }
      
      return matches;
    });
    
    console.log(`🏷️ NAICS filter result: ${filtered.length} out of ${opportunities.length} opportunities`);
    return filtered;
  };

  const filterByOpportunityType = (opportunities: Opportunity[], opportunityType: string): Opportunity[] => {
    if (opportunityType === "all") return opportunities;
    
    return opportunities.filter(opp => {
      switch (opportunityType) {
        case "federal":
          return opp.platform === "sam.gov" || opp.platform === "sam";
        default:
          return true;
      }
    });
  };

  const applyClientSideFilters = (opportunities: Opportunity[], filters: FilterValues): Opportunity[] => {
    let filtered = [...opportunities];
    
    console.log(`🔍 Applying client-side filters to ${opportunities.length} opportunities:`, filters);
    
    // Apply each filter in sequence
    filtered = filterByDueDate(filtered, filters.dueDate);
    console.log(`📅 After due date filter (${filters.dueDate}): ${filtered.length} results`);
    
    filtered = filterByPostedDate(filtered, filters.postedDate, filters.customPostedDateFrom, filters.customPostedDateTo);
    console.log(`📆 After posted date filter (${filters.postedDate}): ${filtered.length} results`);
    
    filtered = filterByNaicsCode(filtered, filters.naicsCode);
    console.log(`🏷️ After NAICS filter (${filters.naicsCode}): ${filtered.length} results`);
    
    filtered = filterByOpportunityType(filtered, filters.opportunityType);
    console.log(`🏛️ After opportunity type filter (${filters.opportunityType}): ${filtered.length} results`);
    
    console.log(`✅ Final filtered results: ${filtered.length} opportunities`);
    return filtered;
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
                      <Target className="h-4 w-4 mr-2 text-blue-500" />
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
      {/* <NotificationToast show={showNotification} /> */}
    </div>
  );
};

export default OpportunitiesPage;