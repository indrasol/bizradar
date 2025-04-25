import React, { useState, useEffect, useRef } from "react";
import { 
  Search,
  Settings,
  ChevronDown,
  ChevronUp,
  X,
  Filter,
  Bell,
  Download,
  MessageCircle,
  Plus,
  Shield,
  BarChart2,
  ChevronRight,
  ChevronLeft,
  Share,
  Zap,
  Lock,
  Database,
  Code,
  Maximize,
  Minimize,
  ExternalLink,
  Check,
  Info,
  Clock,
  Sparkles,
  Calendar,
  DollarSign,
  Building,
  Tag,
  Star,
  HelpCircle,
  Layers,
  TrendingUp,
  AlertCircle,
  Bookmark,
  SlidersHorizontal,
  ArrowRight,
  ListFilter,
  FileText,
  Loader,
  Play,
  Eye
} from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import SideBar from "../components/layout/SideBar";
import { supabase } from "../utils/supabase";
import RefinedQueryDisplay from "../components/admin/RefinedQueryDisplay"
import tokenService from "../utils/tokenService";
import RecommendationsPanel from "../components/dashboard/RecommendationsPanel"; // Import the component
import { J } from "node_modules/framer-motion/dist/types.d-6pKw1mTI";
// import '../../src/App.css'


// Import the environment variable
const isDevelopment =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";
const API_BASE_URL = isDevelopment
  ? "http://localhost:5000"
  : "https://bizradar-backend.onrender.com";

// Define a type for the request parameters
interface SearchParams {
  query: string;
  contract_type?: string | null;
  platform?: string | null;
  page: number;
  page_size: number;
  due_date_filter?: string | null; // New property
  posted_date_filter?: string | null; // New property
  naics_code?: string | null; // New property
  opportunity_type?: string | null; // New property for opportunity type
}

export default function Opportunities() {
  const navigate = useNavigate(); // Initialize the navigate function
  const location = useLocation();                

  
  const [activeFilters, setActiveFilters] = useState({
    dueDate: true,
    postedDate: true,
    naicsCode: true, // Changed from nigpCode
    opportunityType: true
    // Removed jurisdiction and unspscCode
  });
  
  const [expandedCard, setExpandedCard] = useState("state-executive");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [aiRecommendations, setAiRecommendations] = useState([]);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [expandRecommendations, setExpandRecommendations] = useState(false);
  const [aiComponentCollapsed, setAiComponentCollapsed] = useState(false);
  const [scrollToTopVisible, setScrollToTopVisible] = useState(false);

  // New state variables
  const [pursuitCount, setPursuitCount] = useState(0);
  const [showNotification, setShowNotification] = useState(false);
  const [selectedTab, setSelectedTab] = useState("newest");
  const [currentHoveredCard, setCurrentHoveredCard] = useState(null);
  const [refinedQuery, setRefinedQuery] = useState("");
  const [showRefinedQuery, setShowRefinedQuery] = useState(false);
  const [sortBy, setSortBy] = useState("relevance");  // Default to "relevance"
  const [showRecommendationsPanel, setShowRecommendationsPanel] = useState(true);

  // Add this with your other state variables
  const [expandedDescriptions, setExpandedDescriptions] = useState({});

  
  // Use a ref to track if recommendations request is in progress to prevent duplicate requests
  const requestInProgressRef = useRef(false);
  const lastSearchIdRef = useRef("");
  
  // Suggested search queries
  const suggestedQueries = [
    { 
      id: "cybersecurity",
      title: "Cybersecurity Contracts",
      icon: <Shield size={20} className="text-blue-500" />,
      description:
        "Find government contracts related to cybersecurity services, threat monitoring, and security operations.",
    },
    { 
      id: "ai-ml",
      title: "AI & Machine Learning",
      icon: <Zap size={20} className="text-purple-500" />,
      description:
        "Explore opportunities involving artificial intelligence, machine learning, and data science.",
    },
    { 
      id: "data-management",
      title: "Data Management",
      icon: <Database size={20} className="text-green-500" />,
      description:
        "Discover contracts focused on data management, analytics, and information systems.",
    },
    { 
      id: "software-dev",
      title: "Software Development",
      icon: <Code size={20} className="text-amber-500" />,
      description:
        "Find contracts for custom software development, maintenance, and IT services.",
    },
  ];
  
  // Initial dummy data - will be replaced with search results
  const initialOpportunities = [];
  
  // State to hold the opportunities data
  const [opportunities, setOpportunities] = useState(initialOpportunities);
  
  // State for pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const resultsPerPage = 7; // Using 7 results per page
  
  // Calculate displayed opportunities based on pagination
  const indexOfLastResult = currentPage * resultsPerPage;
  const indexOfFirstResult = indexOfLastResult - resultsPerPage;
  const currentOpportunities = opportunities.slice(
    indexOfFirstResult,
    indexOfLastResult
  );

  useEffect(() => {
    if (location.pathname === "/opportunities") {
      const raw = sessionStorage.getItem("lastOpportunitiesSearchState");
      if (!raw) return;

      try {
        const state = JSON.parse(raw);
        const hoursOld =
          (Date.now() - new Date(state.lastUpdated).getTime()) / 36e5;
        if (hoursOld < 4) {
          setSearchQuery(state.query);
          setOpportunities(state.results);
          setTotalResults(state.totalResults);
          setTotalPages(state.totalPages);
          setRefinedQuery(state.refinedQuery);
          setFilterValues(state.filters);
          setSortBy(state.sortBy);
          setHasSearched(true);
          fetchCachedRecommendations(state.results.map((r) => r.id));
        }
      } catch (e) {
        console.error("Failed to restore search state:", e);
      }
    }
  }, [location.pathname]);  // ← run this effect whenever the URL changes
  
  // Add debugging useEffect to monitor state changes
  useEffect(() => {
    console.log("AI Recommendations state changed:", {
      count: aiRecommendations.length,
      isLoading: isLoadingRecommendations,
      hasData: aiRecommendations.length > 0 && !isLoadingRecommendations,
    });
  }, [aiRecommendations, isLoadingRecommendations]);
  
  // Add this useEffect to restore the search state on component mount
  useEffect(() => {
    const raw = sessionStorage.getItem('lastOpportunitiesSearchState');
    if (!raw) return;
  
    try {
      const state = JSON.parse(raw);
      const lastUpdated = new Date(state.lastUpdated).getTime();
      const ageMs       = Date.now() - lastUpdated;
      const maxAgeMs    = 4 * 60 * 60 * 1000; // 4 hours
  
      // if older than 4 hrs, drop it
      if (ageMs > maxAgeMs) {
        sessionStorage.removeItem('lastOpportunitiesSearchState');
        console.log('Discarded stale search state (>4h old)');
        return;
      }
  
      // otherwise restore
      setSearchQuery(state.query);
      setOpportunities(state.results);
      setTotalResults(state.totalResults);
      setTotalPages(state.totalPages);
      setCurrentPage(state.currentPage || 1); // Restore current page
      setRefinedQuery(state.refinedQuery);
      setFilterValues(state.filters);
      setSortBy(state.sortBy);
      setHasSearched(true);
  
      // re‑hydrate any cached AI recs
      if (state.results?.length) {
        fetchCachedRecommendations(state.results.map((r) => r.id));
      }
      console.log('Restored previous search state from sessionStorage');
    } catch (e) {
      console.error('Failed to restore search state:', e);
      sessionStorage.removeItem('lastOpportunitiesSearchState');
    }
  }, []);


  // Fetch user profile from settings
  const getUserProfile = () => {
    try {
      console.log("Fetching user profile from session storage");
      const profileData = sessionStorage.getItem("userProfile");
      console.log("Raw profile data:", profileData);
      
      if (profileData) {
        const parsedData = JSON.parse(profileData);
        console.log("Parsed profile data:", parsedData);
        return parsedData;
      }
      
      console.warn("No profile data found in session storage");
      // Return empty or undefined values for graceful handling downstream
      return {
        companyUrl: "",
        companyDescription: "",
      };
    } catch (error) {
      console.error("Error fetching user profile:", error);
      return {
        companyUrl: "",
        companyDescription: "",
      };
    }
  };
  
// When search results are loaded successfully:
const saveSearchStateToSession = (query, results, totalResults, totalPages, refinedQuery) => {
  console.log("🏷️ [saveSearchStateToSession] called with:", {
    query,
    resultsLength: Array.isArray(results) ? results.length : results,
    totalResults,
    totalPages,
    refinedQuery,
    filters: filterValues,
    sortBy
  });
  const searchState = {
    query,
    results,
    totalResults,
    totalPages,
    refinedQuery,
    filters: filterValues,
    sortBy,
    lastUpdated: new Date().toISOString()
  };

  sessionStorage.setItem('lastOpportunitiesSearchState', JSON.stringify(searchState));
  console.log("✅ [saveSearchStateToSession] wrote key:", sessionStorage.getItem('lastOpportunitiesSearchState'));
};


  // Fetch AI recommendations
  const fetchAiRecommendations = async () => {
    if (requestInProgressRef.current || opportunities.length === 0) return;
    
    const searchId = `${searchQuery}-${currentPage}`;
    
    if (searchId === lastSearchIdRef.current) {
      console.log("Skipping duplicate recommendations request for:", searchId);
      return;
    }
    
    requestInProgressRef.current = true;
    lastSearchIdRef.current = searchId;
    setIsLoadingRecommendations(true);
    
    console.log("Starting to fetch AI recommendations for page", currentPage);
    
    try {
      const userProfile = getUserProfile();
      console.log("User profile for AI recommendations:", userProfile);
      
      const requestBody = {
        companyUrl: userProfile.companyUrl,
        companyDescription: userProfile.companyDescription || "", // Ensure this is set
        opportunities: opportunities,
        responseFormat: "json",
        includeMatchReason: true,
      };
      console.log("AI recommendations request body:", requestBody);
      
      const response = await fetch(`${API_BASE_URL}/ai-recommendations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("AI Recommendations raw response:", data);
      
      if (data.recommendations && Array.isArray(data.recommendations)) {
        console.log(
          `Received ${data.recommendations.length} AI recommendations`
        );

        const enhancedRecommendations = data.recommendations.map((rec) => {
          const oppIndex =
            typeof rec.opportunityIndex === "number"
              ? Math.min(rec.opportunityIndex, opportunities.length - 1)
              : 0;
          const opportunity = opportunities[oppIndex];
          
          return {
            ...rec,
            opportunity,
            showDetailedReason: false, // Add this to track the expanded state
          };
        });
        
        setAiRecommendations(enhancedRecommendations);
      } else {
        console.warn("Received invalid recommendations format:", data);
        setAiRecommendations([]);
      }
    } catch (error) {
      console.error("Error fetching AI recommendations:", error);
      setAiRecommendations([
        {
        id: "fallback-rec-1",
        title: "AI Recommendation Service Temporarily Unavailable",
          description:
            "We couldn't retrieve personalized recommendations at this time. Please try again later.",
        matchScore: 75,
        opportunityIndex: 0,
          matchReason:
            "This is a fallback recommendation while the service is temporarily unavailable.",
        },
      ]);
    } finally {
      setTimeout(() => {
        setIsLoadingRecommendations(false);
        requestInProgressRef.current = false;
      }, 500);
    }
  };
  
  // useEffect to prevent infinite loop of requests
  useEffect(() => {
    // No automatic recommendation fetching on page change
    console.log("Page changed to", currentPage);
  }, [currentPage]);

  // Inside Opportunities.tsx - add this useEffect


  const toggleFilter = (filter) => {
    setActiveFilters({
      ...activeFilters,
      [filter]: !activeFilters[filter],
    });
  };
  
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  const toggleFiltersBar = () => {
    setFiltersOpen(!filtersOpen);
  };

  const toggleRecommendationsExpand = () => {
    setExpandRecommendations(!expandRecommendations);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setOpportunities(initialOpportunities);
    setTotalResults(initialOpportunities.length);
    setCurrentPage(1);
    setHasSearched(false);
    setAiRecommendations([]);
    setShowRefinedQuery(false); // Hide the refined query
    setRefinedQuery(""); // Clear the refined query
    sessionStorage.removeItem('lastOpportunitiesSearchState');
    requestInProgressRef.current = false;
    lastSearchIdRef.current = "";
    
    // Reset filter values to defaults
    setFilterValues({
      dueDate: "none", // Set "none" as the default value
      postedDate: "all", // Default value
      naicsCode: "", // Default value
      opportunityType: "All" // Default value
    });
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleSuggestedQueryClick = (query) => {
    setSearchQuery(query);
    handleSearch(null, query);
  };

  // ── add this right above handleSearch ────────────────────────────

/**
 * Try to load a previous search from Redis cache.
 * Returns true if cached results were found & applied.
 */
const checkForCachedSearch = async (query: string) => {
  const user_id = tokenService.getUserIdFromToken();
  console.log("Checking for cached search with query:", query);
  
  try {
    const resp = await fetch(`${API_BASE_URL}/search-opportunities`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query,
        page: 1,
        page_size: resultsPerPage,
        is_new_search: false,
        sort_by: sortBy,
        user_id,
      }),
    });
    
    if (!resp.ok) {
      console.error("Cache check request failed:", await resp.text());
      return false;
    }
    
    const data = await resp.json();
    console.log("Cache check response:", data.results ? `Found ${data.results.length} results` : "No results found");
    
    if (resp.ok && data.results?.length) {
      setOpportunities(data.results);
      setTotalResults(data.total);
      setTotalPages(data.total_pages);
      if (data.refined_query) setRefinedQuery(data.refined_query);
      setHasSearched(true);
    
      // fetch any cached AI recs
      await fetchCachedRecommendations(data.results.map((r) => r.id));
    
      // Persist this cached search into sessionStorage so we can restore it later
      saveSearchStateToSession(
        query,
        data.results,
        data.total,
        data.total_pages,
        data.refined_query || ""
      );
    
      return true;
    }
    
    return false;
  } catch (error) {
    console.error("Error checking for cached search:", error);
    return false;
  }
};


// Add this function to check for cached recommendations
// Add this function to check for cached recommendations
const checkForCachedRecommendations = async (ids: string[]) => {
  if (!ids.length) return false;
  
  const userId = tokenService.getUserIdFromToken();
  
  try {
    // Check if recommendations exist in session storage first (fastest)
    const sessionRecs = sessionStorage.getItem('aiRecommendations');
    if (sessionRecs) {
      try {
        const parsed = JSON.parse(sessionRecs);
        const recommendations = parsed.recommendations || [];
        const searchQuery = parsed.searchQuery || "";
        const timestamp = parsed.timestamp || "";
        
        const hoursOld = (Date.now() - new Date(timestamp).getTime()) / 36e5;
        
        // Get current search query
        const searchState = sessionStorage.getItem('lastOpportunitiesSearchState');
        const currentQuery = searchState ? JSON.parse(searchState).query : "";
        
        // If fresh and matching query, use these
        if (hoursOld < 1 && searchQuery === currentQuery && recommendations.length > 0) {
          console.log("Found cached recommendations in session storage");
          return true;
        }
      } catch (e) {
        console.error("Error parsing cached recommendations:", e);
      }
    }
    
    // Otherwise, check Redis cache via backend
    const response = await fetch(`${API_BASE_URL}/check-recommendations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        opportunity_ids: ids,
        user_id: userId,
        checkOnly: true  // Just check existence, don't return full data
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.exists; // Just return if they exist, don't load yet
    }
    
    return false;
  } catch (error) {
    console.error("Error checking for cached recommendations:", error);
    return false;
  }
};

/**
 * Fetch any cached AI recommendations for a given list of IDs.
 */
const fetchCachedRecommendations = async (ids: string[]) => {
  const user_id = tokenService.getUserIdFromToken();
  const resp = await fetch(`${API_BASE_URL}/get-cached-recommendations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id, opportunity_ids: ids }),
  });
  const payload = await resp.json();
  if (payload.cached && payload.recommendations) {
    setAiRecommendations(payload.recommendations);
  }
};

// Add this function to check for cached recommendations


// Modify handleSearch to check for cached recommendations
const handleSearch = async (e: React.FormEvent | null, suggestedQuery: string | null = null) => {
  if (e) e.preventDefault();
  
  const query = suggestedQuery || searchQuery;
  console.log("▶️ [handleSearch] fired with query:", query);
  if (!query.trim()) return;

  setIsSearching(true);
  setHasSearched(false);

  try {
    // NEW CODE: Check if this query already exists in session storage
    let isNewSearch = true;
    const storedStateRaw = sessionStorage.getItem('lastOpportunitiesSearchState');
    
    if (storedStateRaw) {
      try {
        const storedState = JSON.parse(storedStateRaw);
        // If the stored query matches the current query and it's less than 24 hours old
        if (storedState.query === query) {
          const lastUpdated = new Date(storedState.lastUpdated).getTime();
          const now = Date.now();
          const hoursElapsed = (now - lastUpdated) / (1000 * 60 * 60);
          
          // If the stored results are less than 24 hours old
          if (hoursElapsed < 24) {
            isNewSearch = false;
            console.log("REPEAT SEARCH: Using cached results for:", query);
          }
        }
      } catch (e) {
        console.error("Error parsing stored search state:", e);
      }
    }
    
    // If it's a new search, log it
    if (isNewSearch) {
      console.log("NEW SEARCH: Starting fresh search for:", query);
    }

    // Prepare search parameters
    const searchParams = {
      query: query,
      contract_type: null,
      platform: null,
      page: 1,
      page_size: resultsPerPage,
      is_new_search: isNewSearch,
      user_id: tokenService.getUserIdFromToken(),
      sort_by: sortBy,
      timestamp: Date.now()
    };

    console.log("Search params:", JSON.stringify(searchParams));

    // Call backend search API
    const response = await fetch(`${API_BASE_URL}/search-opportunities`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(searchParams),
    });
    
    const rawText = await response.text(); // Get raw response for debugging
    console.log('Raw API Response:', rawText);

    let data;
    try {
      data = JSON.parse(rawText); // Parse the response
    } catch (error) {
      console.error('Error parsing JSON response:', error);
      setIsSearching(false);
      return;
    }

    console.log('Parsed Response:', data);

    if (data.success) {
      // Check for refined query in the response and display it
      if (data.refined_query) {
        setRefinedQuery(data.refined_query);
        setShowRefinedQuery(true);  // Make sure this is set to true
      } else {
        setShowRefinedQuery(false);
      }

      // Process and update opportunities state
      const processedResults = processSearchResults(data.results);
      console.log("Processed Results:", processedResults); // Debugging log
      setOpportunities(processedResults);
      setTotalResults(data.total);
      setTotalPages(data.total_pages);
      setCurrentPage(data.page);
      
      // Add this line to set hasSearched to true when search is successful
      setHasSearched(true);
      
      // Save search state to session storage
      saveSearchStateToSession(
        query,
        processedResults,
        data.total,
        data.total_pages,
        data.refined_query || ""
      );
    } else {
      // Handle error
      console.error(data.message);
      setOpportunities([]);
    }
  } catch (error) {
    console.error("Error fetching opportunities:", error);
  } finally {
    setIsSearching(false);
  }
};


const forcePageNavigation = (pageNumber) => {
  if (pageNumber === currentPage) return;
  
  console.log(`Direct pagination: Going to page ${pageNumber}`);
  setIsSearching(true);
  
  // Create a direct API request with minimal parameters
  const requestBody = {
    query: searchQuery,
    user_id: tokenService.getUserIdFromToken(),
    page: pageNumber,
    page_size: resultsPerPage,
    due_date_filter: filterValues.dueDate,
    posted_date_filter: filterValues.postedDate,
    naics_code: filterValues.naicsCode,
    opportunity_type: jobType,
    sort_by: sortBy
  };
  
  console.log("Direct pagination request:", requestBody);
  
  // Use the filter endpoint for pagination too
  fetch(`${API_BASE_URL}/filter-cached-results`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody)
  })
  .then(response => {
    console.log(`Direct pagination response status: ${response.status}`);
    
    if (!response.ok) {
      // If cache miss, fallback to regular search
      if (response.status === 404) {
        console.log("No cached results found, falling back to regular search");
        return handleSearch(null, searchQuery);
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  })
  .then(data => {
    console.log(`Direct pagination got ${data.results?.length || 0} results`);
    
    if (data.success && data.results && Array.isArray(data.results)) {
      // Update state
      setOpportunities(data.results);
      setTotalResults(data.total);
      setCurrentPage(pageNumber);
      setTotalPages(data.total_pages);
      
      // Save state to session
      saveSearchStateToSession(
        searchQuery, 
        data.results,
        data.total,
        data.total_pages,
        refinedQuery
      );
    }
  })
  .catch(error => {
    console.error("Direct pagination error:", error);
  })
  .finally(() => {
    setIsSearching(false);
  });
};


const paginate = async (pageNumber: number) => {
  if (pageNumber === currentPage) return;
  
  console.log(`PAGINATION: Attempting to navigate to page ${pageNumber}`);
  setIsSearching(true);
  
  try {
    // Prepare parameters with current filters and the existing refined query
    const params = {
      query: searchQuery,
      contract_type: null,
      platform: null,
      page: pageNumber,
      page_size: resultsPerPage,
      is_new_search: false,
      existing_refined_query: refinedQuery,
      sort_by: sortBy,
      user_id: tokenService.getUserIdFromToken(),
      // Current filters
      due_date_filter: filterValues.dueDate,
      posted_date_filter: filterValues.postedDate,
      naics_code: filterValues.naicsCode,
      opportunity_type: jobType
    };
    
    console.log(`PAGINATION: Request parameters:`, JSON.stringify(params));
    
    const response = await fetch(`${API_BASE_URL}/search-opportunities`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
    });

    console.log(`PAGINATION: Received response with status: ${response.status}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log(`PAGINATION: Received data with ${data.results?.length || 0} results`);

    if (data.results && Array.isArray(data.results)) {
      // Update the UI with paginated results
      setOpportunities(data.results);
      setCurrentPage(data.page || pageNumber);
      setTotalResults(data.total || 0);
      setTotalPages(data.total_pages || 1);
      
      // Also update session storage with the new page
      const currentSearchState = sessionStorage.getItem('lastOpportunitiesSearchState');
      if (currentSearchState) {
        try {
          const state = JSON.parse(currentSearchState);
          // Only update the current page, not the results
          state.currentPage = pageNumber;
          sessionStorage.setItem('lastOpportunitiesSearchState', JSON.stringify(state));
        } catch (e) {
          console.error("Error updating session storage:", e);
        }
      }
    } else {
      console.error("PAGINATION: No results array in response data:", data);
    }
  } catch (error) {
    console.error(`PAGINATION ERROR:`, error);
    alert(`Failed to load page ${pageNumber}. Please try again.`);
  } finally {
    setIsSearching(false);
  }
};

  // Pagination component
  const Pagination = () => {
    return (
      hasSearched &&
      !isSearching &&
      totalResults > resultsPerPage && (
        <div className="flex justify-center items-center my-6">
          <div className="bg-white rounded-full shadow-sm border border-gray-200 flex items-center gap-1 p-1">
            <button
              onClick={() => forcePageNavigation(currentPage - 1)} // Use the direct function
              disabled={currentPage === 1}
              className={`p-2 rounded-full ${
                currentPage === 1
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-blue-600 hover:bg-blue-50"
              }`}
            >
              <ChevronLeft size={16} />
            </button>
  
            <div className="text-sm font-medium text-gray-700 px-3">
              Page {currentPage} of {totalPages}
            </div>
  
            <button
              onClick={() => forcePageNavigation(currentPage + 1)} // Use the direct function
              disabled={currentPage === totalPages}
              className={`p-2 rounded-full ${
                currentPage === totalPages
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-blue-600 hover:bg-blue-50"
              }`}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )
    );
  };

  const handleBeginResponse = (contractId, contractData) => {
    console.log("Contract Data: ")
    console.log(contractData);
    // Make sure we're capturing all needed fields with consistent naming
    const contract = {
      id: contractId,
      title: contractData.title || "Default Title",
      department: contractData.agency || contractData.department || "Default Agency", // Added department field
      noticeId:contractData.notice_id,
      dueDate: contractData.response_date || contractData.dueDate || "2025-01-01",
      response_date: contractData.response_date || contractData.dueDate || "2025-01-01",
      published_date: contractData.published_date || "",
      value: contractData.value || 0,
      status: contractData.status || "Open",
      naicsCode: contractData.naics_code?.toString() || contractData.naicsCode || "000000",
      solicitation_number: contractData.solicitation_number || "",
      description: contractData.description || "",
      external_url: contractData.external_url || contractData.url || ""
    };

    // Log to verify data is being set correctly
    console.log("Saving contract to sessionStorage:", contract);
    sessionStorage.setItem("currentContract", JSON.stringify(contract));
    navigate(`/contracts/rfp/${contractData.notice_id}`);
  };

  const forceRender = () => {
    if (aiRecommendations.length > 0 && isLoadingRecommendations) {
      setIsLoadingRecommendations(false);
    }
  };

  // Scroll to top functionality
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Handle scroll event to show/hide scroll to top button
  const handleScroll = () => {
    if (window.scrollY > 300) {
      setScrollToTopVisible(true);
    } else {
      setScrollToTopVisible(false);
    }
  };

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    // Improved session detection logic
    const wasSessionClosed = () => {
      // Session marker only exists during a single browser session
      const sessionMarker = sessionStorage.getItem("userActiveSession");
      
      // If we have a token but no session marker, browser was likely closed
      const isLoggedIn = tokenService.getUserIdFromToken() !== null;
      
      if (isLoggedIn && !sessionMarker) {
        // First visit in a new browser session
        console.log("New browser session detected - refreshing cache");
        sessionStorage.setItem("userActiveSession", "true");
        return true;
      }
      
      // Already visited in this session
      sessionStorage.setItem("userActiveSession", "true");
      return false;
    };
    
    // Check if this is a new browser session
    const newSession = wasSessionClosed();
    
    // If this is a new session and user is logged in, refresh the search
    if (newSession && searchQuery && hasSearched) {
      console.log("Browser was closed - refreshing search data");
      // Set is_new_search to true to bypass cache
      handleSearch(null, searchQuery);
    }
  }, []);

  const toggleDetailedReason = (index) => {
    const updatedRecommendations = aiRecommendations.map((rec, i) =>
      i === index
        ? { ...rec, showDetailedReason: !rec.showDetailedReason }
        : rec
    );
    setAiRecommendations(updatedRecommendations);
  };

  // useEffect to load pursuit count on component mount
  useEffect(() => {
    const fetchPursuitCount = async () => {
      try {
        // Get the current user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          console.log("No user logged in");
          return;
        }
        
        // Count the user's pursuits
        const { count, error } = await supabase
          .from('pursuits')
          .select('id', { count: 'exact' })
          .eq('user_id', user.id);
          
        if (error) throw error;
        
        setPursuitCount(count || 0);
      } catch (error) {
        console.error("Error fetching pursuit count:", error);
      }
    };
    
    fetchPursuitCount();
  }, []);

  // Update handleAddToPursuit function
  const handleAddToPursuit = async (opportunity) => {
    try {
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log("No user logged in");
        // Could show a login prompt here
        return;
      }
      
      // Check if this opportunity is already in pursuits
      const { data: existingPursuits } = await supabase
        .from('pursuits')
        .select('id')
        .eq('user_id', user.id)
        .eq('title', opportunity.title);
        
      if (existingPursuits && existingPursuits.length > 0) {
        // Already exists, maybe show a notification
        console.log("Opportunity already in pursuits");
        return;
      }
      
      // Create the new pursuit in Supabase
      const { data, error } = await supabase
        .from('pursuits')
        .insert([
          {
            title: opportunity.title,
            description: opportunity.description || "",
            stage: "Assessment", // Default stage
            user_id: user.id,
            due_date: opportunity.response_date || opportunity.dueDate || opportunity.due_date // Add this line
          }
        ])
        .select();
        
      if (error) throw error;
      
      if (data && data.length > 0) {
        // Show notification
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 3000);
        
        // Update pursuit count
        setPursuitCount(prevCount => prevCount + 1);
      }
    } catch (error) {
      console.error("Error adding to pursuits:", error);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Add new state for filter values
  const [filterValues, setFilterValues] = useState({
    dueDate: "none", // Set "none" as the default value
    postedDate: "all", // Default value
    naicsCode: "", // Default value
    opportunityType: "All" // Default value
  });

  // New state for job type
  const [jobType, setJobType] = useState("All"); // Default to "All"

  // Apply all filters function
  const applyFilters = async () => {
    setIsSearching(true);
    
    const filterParams = {
      query: searchQuery,
      user_id: tokenService.getUserIdFromToken(),
      due_date_filter: filterValues.dueDate,
      posted_date_filter: filterValues.postedDate,
      naics_code: filterValues.naicsCode,
      opportunity_type: jobType,
      sort_by: sortBy,
      page: 1,
      page_size: resultsPerPage
    };
    
    try {
      console.log("Applying filters:", filterParams);
      
      // Use the new filter endpoint
      const response = await fetch(`${API_BASE_URL}/filter-cached-results`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(filterParams),
      });
      
      if (!response.ok) {
        // If cache miss, fallback to regular search
        if (response.status === 404) {
          console.log("No cached results found, falling back to regular search");
          return handleSearch(null, searchQuery);
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Filtered search results:", data);
      
      if (data.success && data.results && Array.isArray(data.results)) {
        setHasSearched(true);
        
        // Update state with the full data from the response
        setOpportunities(data.results);
        setTotalResults(data.total || data.results.length);
        setCurrentPage(data.page || 1);
        setTotalPages(data.total_pages || Math.ceil(data.total / resultsPerPage));
        
        // Save to session storage
        saveSearchStateToSession(
          searchQuery,
          data.results,
          data.total,
          data.total_pages,
          data.refined_query || refinedQuery
        );
      }
    } catch (error) {
      console.error("Error applying filters:", error);
    } finally {
      setIsSearching(false);
    }
  };

  // Update the opportunity type filter to use the applyFilters function
  const toggleJobType = (type) => {
    console.log(`Setting job type filter to: ${type}`);
    // Update job type state
    setJobType(type);
    
    // Apply filter immediately if we have search results
    if (hasSearched) {
      console.log(`Applying job type filter: ${type}`);
      fetchFilteredResults({
        ...filterValues,
        opportunityType: type
      });
    }
  };

  // Similarly, update the other filter handlers to trigger applyFilters
  const handleDueDateFilterChange = (value) => {
    console.log(`Setting due date filter to: ${value}`);
    setFilterValues((prev) => ({ ...prev, dueDate: value }));

    if (value === "none") {
        // If "None" is selected, trigger a new search with the original query
        console.log("No due date filter applied, fetching original results.");
        handleSearch(null, originalQuery); // Call handleSearch with the original query
    } else if (hasSearched) {
        fetchFilteredResults({ ...filterValues, dueDate: value });
    }
  };

  // Add similar handlers for other filters
  const handlePostedDateFilterChange = (value) => {
    console.log(`Setting posted date filter to: ${value}`);
    setFilterValues((prev) => ({ ...prev, postedDate: value }));
    
    if (hasSearched) {
      fetchFilteredResults({ ...filterValues, postedDate: value });
    }
  };

  const handleNaicsCodeChange = (value) => {
    console.log(`Setting NAICS code filter to: ${value}`);
    setFilterValues((prev) => ({ ...prev, naicsCode: value }));
    
    if (hasSearched) {
      fetchFilteredResults({ ...filterValues, naicsCode: value });
    }
  };

  // Add this function to handle viewing details
  const handleViewDetails = (opportunity) => {
    console.log("View Details clicked for opportunity:", opportunity);
    
    if (opportunity.external_url) {
      console.log("Opening external URL:", opportunity.external_url);
      window.open(opportunity.external_url, '_blank');
    } else if (opportunity.url) {
      console.log("Opening URL from database:", opportunity.url);
      window.open(opportunity.url, '_blank');
    } else {
      // Generate dynamic fallback URL based on platform
      if (opportunity.platform === "sam.gov" || opportunity.platform === "sam_gov") {
        // Use the opportunity's notice_id if available
        const noticeId = opportunity.notice_id || "778288d2aea24e14a253786bc0ec0369";
        const fallbackUrl = `https://sam.gov/opp/${noticeId}/view`;
        
        console.log("Using notice_id for SAM.gov opportunity:", fallbackUrl);
        window.open(fallbackUrl, '_blank');
      } else if (opportunity.platform === "freelancer") {
        // For Freelancer, use the best fallback approach
        if (opportunity.job_url) {
          console.log("Using job_url for Freelancer opportunity:", opportunity.job_url);
          window.open(opportunity.job_url, '_blank');
        } else {
          // If not, create a search URL with the title
          const searchQuery = encodeURIComponent(opportunity.title.split(' ').slice(0, 3).join(' '));
          const fallbackUrl = `https://www.freelancer.com/search/projects?q=${searchQuery}`;
          
          console.log("No direct URL for Freelancer opportunity. Using search fallback:", fallbackUrl);
          window.open(fallbackUrl, '_blank');
        }
      } else {
        // Internal fallback - only as a last resort
        console.log("No external URL or platform-specific fallback available. Navigating internally.");
        navigate(`/opportunities/${opportunity.id}`);
      }
    }
  };

  useEffect(() => {
    // Check if we have a direct opportunity ID in the URL
    const path = window.location.pathname;
    const match = path.match(/\/opportunities\/(\d+)/);
    
    if (match && match[1]) {
      const oppId = match[1];
      console.log(`Direct navigation to opportunity ID: ${oppId}`);
      
      // Fetch this specific opportunity
      const fetchOpportunity = async () => {
        try {
          const response = await fetch(`${API_BASE_URL}/get-opportunity/${oppId}`);
          if (response.ok) {
            const data = await response.json();
            if (data && data.external_url) {
              window.open(data.external_url, '_blank');
              // Redirect to main opportunities page
              navigate('/opportunities');
            } else {
              // Handle the case when the opportunity is found but has no external URL
              setOpportunities([data]);
              setHasSearched(true);
            }
          } else {
            // Handle 404 for opportunity
            console.error(`Opportunity ID ${oppId} not found`);
          }
        } catch (error) {
          console.error("Error fetching opportunity:", error);
        }
      };
      
      fetchOpportunity();
    }
  }, []);


  // Add browser session detection for cache refresh
// Add browser session detection for cache refresh
useEffect(() => {
  // Create or update session marker
  const sessionMarker = "opportunitiesPageVisited";
  const previouslyVisited = sessionStorage.getItem(sessionMarker);
  
  // Set the marker for this session
  sessionStorage.setItem(sessionMarker, "true");
  
  // If user is authenticated but no previous session marker exists,
  // this might be a browser that was closed and reopened
  if (!previouslyVisited && tokenService.getUserIdFromToken()) {
    console.log("New browser session detected - refreshing search data");
    
    // If we have an active search, rerun it with is_new_search=true
    if (searchQuery && hasSearched) {
      handleSearch(null, searchQuery);
    }
  }
}, []);

  const applySearchWithSort = async (newSortType) => {
    setIsSearching(true);
    
    try {
      const searchParams = {
        query: searchQuery,
        contract_type: null,
        platform: null,
        page: 1,  // Reset to page 1 when changing sort
        page_size: resultsPerPage,
        due_date_filter: filterValues.dueDate,
        posted_date_filter: filterValues.postedDate,
        naics_code: filterValues.naicsCode,
        is_new_search: false,  // Not a new search, just resorting
        existing_refined_query: refinedQuery,
        sort_by: newSortType  // Add the sort parameter
      };

      const response = await fetch(`${API_BASE_URL}/search-opportunities`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(searchParams),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Update state with new sorted results
      if (data.results && Array.isArray(data.results)) {
        setOpportunities(data.results);
        setTotalResults(data.total || data.results.length);
        setCurrentPage(data.page || 1);
        setTotalPages(data.total_pages || Math.ceil(data.total / resultsPerPage));
      }
    } catch (error) {
      console.error("Error applying sort:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSortByChange = (newSortBy) => {
    if (newSortBy === sortBy) return;  // No change
    
    setSortBy(newSortBy);
    
    // If we have search results already, reapply the search with the new sort
    if (hasSearched) {
      applySearchWithSort(newSortBy);
    }
  };

  // console.log("Opportunities "+opportun);

  // Filtered opportunities based on job type
  const filteredOpportunities = opportunities.filter((opportunity) => {

 


    if (jobType === "Federal") {
      return opportunity.platform === "sam.gov"; // Show only sam.gov opportunities
    } else if (jobType === "Freelancer") {
      return opportunity.platform !== "sam.gov"; // Show only freelancer opportunities
    }
    return true; // Show all opportunities if "All" is selected
  });

  // Functions to handle panel expansion/minimization
  const handleExpandPanel = () => {
    setExpandRecommendations(true);
  };

  const handleMinimizePanel = () => {
    setExpandRecommendations(false);
  };

  // Function to toggle panel visibility
  const toggleRecommendationsPanel = () => {
    setShowRecommendationsPanel(prev => !prev);
  };

  // Add this function
  const toggleDescription = (id) => {
    setExpandedDescriptions(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  console.log("RENDER STATE:", {
    hasSearched,
    isSearching,
    opportunitiesCount: opportunities.length,
    filteredCount: filteredOpportunities?.length || 0
  });

  // Add state for recommendation availability
  const [hasExistingRecommendations, setHasExistingRecommendations] = useState(false);

  const [originalResults, setOriginalResults] = useState([]); // State to store original results
  const [originalQuery, setOriginalQuery] = useState(""); // State to store the original query

  const fetchFilteredResults = async (filters) => {
    console.log("Fetching filtered results with filters:", filters);
    setIsSearching(true);
    
    const params = {
      query: searchQuery,
      user_id: tokenService.getUserIdFromToken(),
      due_date_filter: filters.dueDate,
      posted_date_filter: filters.postedDate,
      naics_code: filters.naicsCode,
      opportunity_type: filters.opportunityType,
      sort_by: sortBy,
      page: 1,
      page_size: resultsPerPage
    };

    try {
      // Use the new endpoint for filtering cached results
      const response = await fetch(`${API_BASE_URL}/filter-cached-results`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        // If cache miss, fallback to regular search
        if (response.status === 404) {
          console.log("No cached results found, falling back to regular search");
          return handleSearch(null, searchQuery);
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Filtered results received:", data);

      if (data.success && data.results && Array.isArray(data.results)) {
        // Update state with filtered results
        setOpportunities(data.results);
        setTotalResults(data.total);
        setTotalPages(data.total_pages);
        setCurrentPage(1);
        
        // Save filtered results to session storage
        saveSearchStateToSession(
          searchQuery,
          data.results,
          data.total,
          data.total_pages,
          data.refined_query || refinedQuery
        );
      } else {
        console.error("No results array in response data:", data);
        setOpportunities([]);
        setTotalResults(0);
        setTotalPages(0);
      }
    } catch (error) {
      console.error("Error fetching filtered results:", error);
    } finally {
      setIsSearching(false);
    }
  };

  // Add this in the same file as your search function
  const processSearchResults = (results) => {
    if (!results || !Array.isArray(results)) {
      console.error('Results is not an array:', results);
      return [];
    }
    
    // Log the first result for debugging
    if (results.length > 0) {
      console.log('First result sample:', results[0]);
    } else {
      console.log('No results returned from API');
    }
    
    // Ensure all results have the required fields with valid data
    return results.map(result => {
      // Create a normalized result with default values for all required fields
      const normalizedResult = {
        id: result.id || `temp-${Math.random().toString(36).substring(2, 9)}`,
        title: result.title || 'Untitled Opportunity',
        agency: result.agency || result.department || 'Unknown Agency',
        description: result.description || result.additional_description || 'No description available',
        platform: result.platform || 'unknown',
        external_url: result.external_url || result.url || '#',
        naics_code: result.naics_code || result.naicsCode || 'N/A',
        published_date: result.published_date || result.posted || new Date().toISOString(),
        response_date: result.response_date || result.dueDate || null,
        // Add any other fields your UI requires
        ...result
      };
      
      return normalizedResult;
    });
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50 text-gray-800">
      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <SideBar />

        {/* Main Dashboard Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="border-b border-gray-200 bg-white shadow-sm">
            <div className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-2">
                <span className="text-gray-500 text-sm font-medium">Portfolio</span>
                <ChevronRight size={16} className="text-gray-500" />
                <span className="font-medium text-gray-500">Opportunities</span>
              </div>
              <div className="flex items-center gap-4">
                <Link to="/pursuits" className="flex items-center gap-2 text-blue-600 hover:text-blue-800 px-3 py-1.5 rounded-md hover:bg-blue-50 transition-colors">
                  <Bookmark size={18} />
                  <span className="font-medium">Pursuits</span>
                  {pursuitCount > 0 && (
                    <span className="bg-blue-100 text-blue-700 text-xs font-semibold rounded-full px-2 py-0.5">
                      {pursuitCount}
                    </span>
                  )}
                </Link>
                <button className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm hover:shadow transition-all flex items-center gap-1">
                  <span>Upgrade</span>
                  <Star size={14} className="ml-1" />
                </button>
                <div className="relative">
                  <Bell size={20} className="text-gray-500 hover:text-gray-700 cursor-pointer" />
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full"></div>
                </div>
                <button className="bg-blue-50 text-blue-600 hover:bg-blue-100 px-4 py-1.5 rounded-lg text-sm flex items-center gap-1 border border-blue-100 transition-colors">
                  <MessageCircle size={16} />
                  <span className="font-medium">Live Support</span>
                </button>
              </div>
            </div>
          </div>

          {/* Body - Two Column Layout */}
          <div className="flex-1 flex overflow-hidden">
            {/* Filters Column */}
            <div 
              className={`border-r border-gray-200 overflow-y-auto relative bg-white shadow-sm transition-all duration-300 ease-in-out ${
                filtersOpen ? "w-72" : "w-16"
              }`}
            >
              <div className="sticky top-0 z-10 p-4 border-b border-gray-200 bg-white flex items-center justify-between">
                {filtersOpen && (
                  <h2 className="font-semibold text-lg text-gray-800">Filters</h2>
                )}
                <button
                  className={`rounded-full flex items-center justify-center transition-all duration-300 ${
                    filtersOpen
                      ? "ml-auto bg-gray-100 hover:bg-gray-200 w-8 h-8"
                      : "bg-blue-50 hover:bg-blue-100 text-blue-600 w-10 h-10 border border-blue-200"
                  }`}
                  onClick={toggleFiltersBar}
                >
                  {filtersOpen ? (
                    <ChevronLeft size={16} className="text-gray-600" />
                  ) : (
                    <SlidersHorizontal size={18} className="text-blue-600" />
                  )}
                </button>
              </div>

              {/* Filter Icons when Closed */}
              {!filtersOpen && (
                <div className="flex flex-col items-center p-3 gap-3">
                  <button className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                    <Clock size={18} />
                  </button>
                  <button className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
                    <Calendar size={18} />
                  </button>
                  <button className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
                    <Building size={18} />
                  </button>
                  <button className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
                    <Tag size={18} />
                  </button>
                  <button className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
                    <Layers size={18} />
                  </button>
                  <button className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
                    <ListFilter size={18} />
                  </button>
                </div>
              )}

              {/* Filter Content when Open */}
              {filtersOpen && (
                <>
                  {/* Due Date Filter */}
                  <div className="border-b border-gray-100">
                    <div
                      onClick={() => toggleFilter("dueDate")}
                      className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Clock size={18} className="text-blue-500" />
                        <h2 className="font-medium text-gray-800">Due Date</h2>
                      </div>
                      {activeFilters.dueDate ? (
                        <ChevronUp size={16} className="text-gray-400" />
                      ) : (
                        <ChevronDown size={16} className="text-gray-400" />
                      )}
                    </div>
                    {activeFilters.dueDate && (
                      <div className="px-5 pb-4">
                        <ul className="space-y-2 ml-7">
                          {[
                            { id: "none", value: "none", label: "None" },
                            { id: "active-only", value: "active_only", label: "Active only" },
                            { id: "due-in-7", value: "due_in_7_days", label: "Next 7 days" },
                            { id: "next-30", value: "next_30_days", label: "Next 30 days" },
                            { id: "next-3", value: "next_3_months", label: "Next 3 months" },
                            { id: "next-12", value: "next_12_months", label: "Next 12 months" },
                          ].map((option) => (
                            <li key={option.id} className="flex items-center gap-2">
                              <input
                                type="radio"
                                id={option.id}
                                name="due-date"
                                className="accent-blue-500 w-4 h-4"
                                checked={filterValues.dueDate === option.value}
                                onChange={() => handleDueDateFilterChange(option.value)}
                              />
                              <label htmlFor={option.id} className="text-sm text-gray-700">
                                {option.label}
                              </label>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  
                  {/* Posted Date Filter */}
                  <div className="border-b border-gray-100">
                    <div
                      onClick={() => toggleFilter("postedDate")}
                      className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Calendar size={18} className="text-gray-500" />
                        <h2 className="font-medium text-gray-800">Posted Date</h2>
                      </div>
                      {activeFilters.postedDate ? (
                        <ChevronUp size={16} className="text-gray-400" />
                      ) : (
                        <ChevronDown size={16} className="text-gray-400" />
                      )}
                    </div>
                    {activeFilters.postedDate && (
                      <div className="px-5 pb-4">
                        <ul className="space-y-2 ml-7">
                          {[
                            { id: "all", value: "all", label: "All dates" },
                            { id: "past-day", value: "past_day", label: "Past day" },
                            { id: "past-week", value: "past_week", label: "Past week" },
                            { id: "past-month", value: "past_month", label: "Past month" },
                            { id: "past-year", value: "past_year", label: "Past year" },
                            { id: "custom-date-posted", value: "custom_date", label: "Custom date" },
                          ].map((option) => (
                            <li key={option.id} className="flex items-center gap-2">
                              <input
                                type="radio"
                                id={option.id}
                                name="posted-date"
                                className="accent-blue-500 w-4 h-4"
                                checked={filterValues.postedDate === option.value}
                                onChange={() => setFilterValues({ ...filterValues, postedDate: option.value })}
                              />
                              <label htmlFor={option.id} className="text-sm text-gray-700">
                                {option.label}
                              </label>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* NAICS Code(s) Filter */}
                  <div className="border-b border-gray-100">
                    <div
                      onClick={() => toggleFilter("naicsCode")}
                      className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Tag size={18} className="text-gray-500" />
                        <h2 className="font-medium text-gray-800">NAICS Code</h2>
                      </div>
                      {activeFilters.naicsCode ? (
                        <ChevronUp size={16} className="text-gray-400" />
                      ) : (
                        <ChevronDown size={16} className="text-gray-400" />
                      )}
                    </div>
                    {activeFilters.naicsCode && (
                      <div className="px-5 pb-4">
                        <div className="ml-7">
                          <div className="mb-2">
                            <input
                              type="text"
                              placeholder="Ex: 541511"
                              className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 bg-gray-50"
                              value={filterValues.naicsCode}
                              onChange={(e) => setFilterValues({ ...filterValues, naicsCode: e.target.value })}
                            />
                          </div>
                          <div className="text-xs text-gray-500">
                            <p className="mb-1">Common NAICS codes:</p>
                            <ul className="space-y-1">
                              <li><span className="font-medium">541511</span> - Custom Computer Programming Services</li>
                              <li><span className="font-medium">541512</span> - Computer Systems Design Services</li>
                              <li><span className="font-medium">541519</span> - Other Computer Related Services</li>
                              <li><span className="font-medium">518210</span> - Data Processing, Hosting, and Related Services</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Opportunity Type Filter */}
                  <div className="border-b border-gray-100">
                    <div
                      onClick={() => toggleFilter("opportunityType")}
                      className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <ListFilter size={18} className="text-gray-500" />
                        <h2 className="font-medium text-gray-800">Opportunity Type</h2>
                      </div>
                      {activeFilters.opportunityType ? (
                        <ChevronUp size={16} className="text-gray-400" />
                      ) : (
                        <ChevronDown size={16} className="text-gray-400" />
                      )}
                    </div>
                    {activeFilters.opportunityType && (
                      <div className="px-5 pb-4">
                        <ul className="space-y-2 ml-7">
                          <li className="flex items-center gap-2">
                            <input
                              type="radio"
                              id="opp-type-all"
                              name="opportunity-type"
                              className="accent-blue-500 w-4 h-4"
                              checked={jobType === "All"}
                              onChange={() => setJobType("All")}
                            />
                            <label htmlFor="opp-type-all" className="text-sm text-gray-700">
                              All
                            </label>
                          </li>
                          <li className="flex items-center gap-2">
                            <input
                              type="radio"
                              id="opp-type-federal"
                              name="opportunity-type"
                              className="accent-blue-500 w-4 h-4"
                              checked={jobType === "Federal"}
                              onChange={() => setJobType("Federal")}
                            />
                            <label htmlFor="opp-type-federal" className="text-sm text-gray-700">
                              Federal (SAM.gov)
                            </label>
                          </li>
                          <li className="flex items-center gap-2">
                            <input
                              type="radio"
                              id="opp-type-freelancer"
                              name="opportunity-type"
                              className="accent-blue-500 w-4 h-4"
                              checked={jobType === "Freelancer"}
                              onChange={() => setJobType("Freelancer")}
                            />
                            <label htmlFor="opp-type-freelancer" className="text-sm text-gray-700">
                              Freelancer
                            </label>
                          </li>
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Apply Filters Button */}
                  <div className="p-4">
                    <button
                      onClick={applyFilters}
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <ListFilter size={16} />
                      <span>Apply Filters</span>
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Results Column */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Search Bar */}
              <div className="p-5 border-b border-gray-200 bg-white sticky top-0 z-20">
                <form
                  onSubmit={handleSearch}
                  className="flex items-center gap-3"
                >
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Search size={18} className="text-blue-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Search opportunities by keywords, agency, or location..."
                      value={searchQuery}
                      onChange={handleSearchChange}
                      className="w-full pl-12 pr-12 py-3 border border-gray-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-transparent transition-all shadow-sm bg-gray-50"
                    />
                    {searchQuery && (
                      <div className="absolute inset-y-0 right-12 pr-3 flex items-center">
                        <button 
                          type="button" 
                          onClick={clearSearch}
                          className="text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    )}
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <button 
                        type="submit"
                        className="p-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg flex items-center justify-center shadow-sm transition-all"
                      >
                        <ArrowRight size={16} />
                      </button>
                    </div>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => navigate("/settings")}
                    className="p-3 rounded-xl border border-gray-200 text-gray-600 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors shadow-sm"
                  >
                    <Settings size={18} />
                  </button>
                </form>
              </div>

              {/* Add the RefinedQueryDisplay component */}
              {showRefinedQuery && refinedQuery && (
                <RefinedQueryDisplay
                  originalQuery={searchQuery}
                  refinedQuery={refinedQuery}
                  isVisible={showRefinedQuery}
                  onClose={() => setShowRefinedQuery(false)}
                />
              )}

              {/* Results tabs and counters */}
              <div className="border-b border-gray-200 px-5 py-2 bg-white flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div 
                    className={`py-3 px-1 border-b-2 ${
                      sortBy === 'relevance' ? 'border-blue-500 text-blue-600 font-medium' : 'border-transparent text-gray-500 hover:text-gray-700'
                    } cursor-pointer`} 
                    onClick={() => handleSortByChange('relevance')}
                  >
                    Most Relevant
                  </div>
                  <div 
                    className={`py-3 px-1 border-b-2 ${
                      sortBy === 'ending_soon' ? 'border-blue-500 text-blue-600 font-medium' : 'border-transparent text-gray-500 hover:text-gray-700'
                    } cursor-pointer`} 
                    onClick={() => handleSortByChange('ending_soon')}
                  >
                    Ending Soon
                  </div>
                </div>
                
                {hasSearched && (
                  <div className="flex items-center gap-3">
                    <div className="py-1 px-3 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
                      {totalResults} {totalResults === 1 ? "result" : "results"}
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5 shadow-sm hover:bg-gray-50 transition-colors">
                        <Download size={14} className="text-gray-500" />
                        <span>Export</span>
                      </button>
                      <button className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5 shadow-sm hover:bg-blue-700 transition-colors">
                        <Bell size={14} />
                        <span>Notify Me Daily</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Results List */}
              <div className="flex-1 overflow-y-auto p-5 results-container">
                {/* Show loading state while searching */}
                {isSearching && (
                  <div className="p-6 mx-auto my-4 bg-white border border-gray-200 rounded-xl shadow-sm max-w-8xl">
                    <div className="flex flex-col items-center justify-center py-6">
                      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
                      <p className="mt-4 text-gray-600 font-medium">Searching opportunities...</p>
                    </div>
                  </div>
                )}

                {!isSearching && (
                  <>
                    {/* BizradarAI Assistant Card - Only shown after a search */}
                    {hasSearched && showRecommendationsPanel && (
                      <RecommendationsPanel
                        opportunities={opportunities}
                        userProfile={{
                          companyUrl: getUserProfile().companyUrl,
                          companyDescription: getUserProfile().companyDescription
                        }}
                        isExpanded={expandRecommendations}
                        onExpand={handleExpandPanel}
                        onMinimize={handleMinimizePanel}
                        hasExistingRecommendations={hasExistingRecommendations} // New prop
                      />
                    )}

                    {/* Optionally, add a button to show/hide the recommendations panel */}
                    {hasSearched && (
                      <button 
                        onClick={toggleRecommendationsPanel}
                        className="mb-4 px-4 py-2 bg-blue-50 text-blue-600 rounded-md font-medium flex items-center gap-2 hover:bg-blue-100 transition-colors"
                      >
                        {showRecommendationsPanel ? (
                          <>
                            <X size={16} />
                            <span>Hide Recommendations</span>
                          </>
                        ) : (
                          <>
                            <Sparkles size={16} />
                            <span>Show Recommendations</span>
                          </>
                        )}
                      </button>
                    )}

                    {hasSearched && !isSearching ? (
                      opportunities.length > 0 ? (
                        <div className="space-y-5 max-w-8xl mx-auto">
                          {filteredOpportunities.map((opportunity) => (
                            <div
                              key={opportunity.id}
                              className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all hover:border-blue-200"
                            >
                              {/* Header with icon and title */}
                              <div className="p-5 pb-3">
                                <div className="flex items-start gap-3">
                                  <div className="text-blue-500">
                                    <BarChart2 size={22} />
                                  </div>
                                  <div className="flex-1">
                                    <h2 className="text-lg font-semibold text-gray-800 hover:text-blue-600 transition-colors">
                                      {opportunity.title}
                                    </h2>
                                    <div className="flex items-center text-sm text-gray-500 mt-1">
                                      <span>{opportunity.agency}</span>
                                    </div>
                                  </div>
                                  
                                  {/* Due Date Blip - Positioned on the right side to capture focus */}
                                  {opportunity.response_date && (
                                    <div className="flex-shrink-0">
                                      <div className={`px-3 py-1.5 rounded-lg text-center ${
                                        new Date(opportunity.response_date) < new Date() 
                                          ? 'bg-red-50 text-red-600 border border-red-100' 
                                          : 'bg-blue-50 text-blue-600 border border-blue-100'
                                      }`}>
                                        <div className="text-xs font-medium">DUE</div>
                                        <div className="text-sm font-bold">{opportunity.response_date || "TBD"}</div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                                
                                {/* Info grid - 3 columns layout */}
                                <div className="grid grid-cols-3 gap-4 mt-4">
                                  <div>
                                    <div className="text-sm text-gray-500">Published</div>
                                    <div className="font-medium">{opportunity.published_date || "Recent"}</div>
                                  </div>
                                  
                                  <div>
                                    <div className="text-sm text-gray-500">NAICS Code</div>
                                    <div className="font-medium">{opportunity.naics_code || opportunity.naicsCode || "000000"}</div>
                                  </div>
                                  
                                  <div>
                                    <div className="text-sm text-gray-500">Solicitation #</div>
                                    <div className="font-medium truncate">
                                      {opportunity.solicitation_number || "N/A"}
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Enhanced Details Section */}
                                <div className="mt-3 bg-blue-50 shadow-md rounded-md border border-blue-200 transition-all duration-300 ease-in-out">
                                  <h3 className="font-medium text-gray-800 mb-2 p-4 border-b border-blue-200">Details</h3>
                                  <div className="text-sm text-gray-700 p-4">
                                    <p className={`transition-all duration-300 ${expandedDescriptions[opportunity.id] ? '' : 'line-clamp-3'}`}>
                                      {opportunity.additional_description || "No additional details available."}
                                    </p>
                                    <button 
                                      onClick={() => toggleDescription(opportunity.id)}
                                      className="mt-2 text-blue-600 hover:text-blue-800 inline-flex items-center text-sm font-medium transition-colors duration-200"
                                      aria-expanded={expandedDescriptions[opportunity.id]} // Accessibility improvement
                                    >
                                      {expandedDescriptions[opportunity.id] ? (
                                        <>
                                          <ChevronUp size={16} className="ml-1" />
                                          Show less
                                        </>
                                      ) : (
                                        <>
                                          <ChevronDown size={16} className="ml-1" />
                                          Read more
                                        </>
                                      )}
                                    </button>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Tags */}
                              <div className="px-5 py-1.5 flex flex-wrap items-center gap-2">
                                <div className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-sm">
                                  {opportunity.platform === 'sam_gov' ? 'sam.gov' : opportunity.platform}
                                </div>
                                <div className={`px-3 py-1 rounded-full text-sm ${opportunity.active === false ? 'bg-gray-100 text-gray-600' : 'bg-green-50 text-green-600'}`}>
                                  {opportunity.active === false ? "Inactive" : "Active"}
                                </div>
                                <div className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
                                  {opportunity.type || "RFP"}
                                </div>
                                <div className="px-3 py-1 bg-purple-50 text-purple-600 rounded-full text-sm">
                                  Federal
                                </div>
                                
                                {/* If there's a defined due date and it's soon (less than 7 days away), show this tag */}
                                {opportunity.response_date && new Date(opportunity.response_date) > new Date() && 
                                 (new Date(opportunity.response_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24) < 7 && (
                                  <div className="px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-sm flex items-center">
                                    <Clock size={12} className="mr-1" />
                                    Ending Soon
                                  </div>
                                )}
                              </div>
                              
                              {/* Action Buttons */}
                              <div className="p-3 flex items-center gap-2">
                                <button 
                                  onClick={() => handleAddToPursuit(opportunity)}
                                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center gap-2"
                                >
                                  <Plus size={16} />
                                  <span>Add to Pursuits</span>
                                </button>
                                <button 
                                  onClick={() => handleBeginResponse(opportunity.id, opportunity)}
                                  className="px-4 py-2 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 border border-green-200"
                                >
                                  <FileText size={16} />
                                  <span>Generate Response</span>
                                </button>
                                <button
                                  onClick={() => handleViewDetails(opportunity)}
                                  className="px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 border border-gray-200"
                                >
                                  <ExternalLink size={16} className="text-gray-500" />
                                  <span>View on SAM.gov</span>
                                </button>
                                <button className="ml-auto p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors">
                                  <Share size={18} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-8 bg-white border border-gray-200 rounded-xl shadow-sm text-center max-w-md mx-auto">
                          <div className="flex justify-center mb-4">
                            <div className="p-3 bg-blue-50 rounded-full">
                              <Search size={24} className="text-blue-500" />
                            </div>
                          </div>
                          <h3 className="text-lg font-semibold text-gray-800 mb-2">No results found</h3>
                          <p className="text-gray-600 mb-4">
                            Try adjusting your search terms or filters to find more opportunities.
                          </p>
                          <button 
                            onClick={clearSearch}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                          >
                            Clear Search
                          </button>
                        </div>
                      )
                    ) : !hasSearched ? (
                      /* Show suggested searches when no search has been performed */
                      <div className="p-6 bg-white rounded-xl border border-gray-200 shadow-md mb-6 max-w-8xl mx-auto">
                        <h2 className="text-xl font-bold text-gray-800 mb-2">
                          Popular Searches
                        </h2>
                        <p className="text-gray-600 mb-6">
                          Find contract opportunities that match your business capabilities:
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {suggestedQueries.map((query) => (
                            <div 
                              key={query.id}
                              onClick={() => handleSuggestedQueryClick(query.id)}
                              className="bg-white rounded-xl border border-gray-200 p-5 cursor-pointer hover:border-blue-300 hover:shadow-lg transition-all group"
                            >
                              <div className="flex items-center mb-3">
                                <div className="p-2 rounded-lg bg-gray-50 group-hover:bg-blue-50 transition-colors">
                                  {query.icon}
                                </div>
                                <h3 className="font-semibold text-gray-800 ml-3 group-hover:text-blue-600 transition-colors">
                                  {query.title}
                                </h3>
                              </div>
                              <p className="text-gray-600 text-sm">
                                {query.description}
                              </p>
                              <div className="mt-3 text-blue-600 text-sm font-medium flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <span>Search now</span>
                                <ChevronRight size={16} className="ml-1" />
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="mt-6 pt-6 border-t border-gray-100">
                          <div className="flex items-center gap-2">
                            <HelpCircle size={18} className="text-blue-500" />
                            <span className="text-sm text-gray-600">Need help finding opportunities? Try our <a href="#" className="text-blue-600 font-medium">guided search wizard</a> or <a href="#" className="text-blue-600 font-medium">contact support</a>.</span>
                          </div>
                        </div>
                      </div>
                    ) : null}

                    {/* Add pagination component */}
                    <Pagination />
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll to Top Button */}
      {scrollToTopVisible && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 bg-white text-blue-600 p-3 rounded-full shadow-lg hover:bg-blue-50 transition-colors border border-blue-200 group"
        >
          <ChevronUp size={20} />
          <span className="absolute right-full mr-2 whitespace-nowrap bg-gray-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity">
            Back to top
          </span>
        </button>
      )}

      {/* Notification Toast */}
      {showNotification && (
        <div className="fixed bottom-6 right-6 bg-green-500 text-white py-2 px-4 rounded-lg shadow-lg flex items-center gap-2 animate-fade-in-up z-50">
          <Check size={18} />
          <span className="font-medium">Added to Pursuits</span>
        </div>
      )}
    </div>
  );
}
