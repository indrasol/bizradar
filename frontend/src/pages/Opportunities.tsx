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
  FileText
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import SideBar from "../components/layout/SideBar";
import { supabase } from "../utils/supabase";
import RefinedQueryDisplay from "../components/admin/RefinedQueryDisplay"

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
}

export default function Opportunities() {
  const navigate = useNavigate(); // Initialize the navigate function
  
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
  
  // Add debugging useEffect to monitor state changes
  useEffect(() => {
    console.log("AI Recommendations state changed:", {
      count: aiRecommendations.length,
      isLoading: isLoadingRecommendations,
      hasData: aiRecommendations.length > 0 && !isLoadingRecommendations,
    });
  }, [aiRecommendations, isLoadingRecommendations]);
  
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
    if (
      hasSearched &&
      opportunities.length > 0 &&
      !requestInProgressRef.current
    ) {
      console.log(
        "Page changed, fetching new recommendations for page",
        currentPage
      );
          fetchAiRecommendations();
      }
  }, [currentPage, opportunities]);

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
    requestInProgressRef.current = false;
    lastSearchIdRef.current = "";
    
    // Reset filter values to defaults
    setFilterValues({
      dueDate: "next_30_days",
      postedDate: "past_week",
      naicsCode: "",
      opportunityType: ""
    });
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleSuggestedQueryClick = (query) => {
    setSearchQuery(query);
    handleSearch(null, query);
  };

  const handleSearch = async (e, suggestedQuery = null) => {
    if (e) e.preventDefault();
    
    const query = suggestedQuery || searchQuery;
    if (!query.trim()) return;
    
    setIsSearching(true);
    setAiRecommendations([]);
    requestInProgressRef.current = false;
    lastSearchIdRef.current = "";

    // Reset filters when doing a new search
    setFilterValues({
        dueDate: "next_30_days",
        postedDate: "past_week",
        naicsCode: "",
        opportunityType: ""
    });

    try {
        const searchParams = {
            query: query,
            contract_type: null,
            platform: null,
            page: 1,
            page_size: resultsPerPage,
            due_date_filter: filterValues.dueDate,
            posted_date_filter: filterValues.postedDate,
            naics_code: filterValues.naicsCode,
            is_new_search: true  // Flag this as a new search to trigger query refinement
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
        console.log("Search results:", data);
        
        // Check if the API returned a refined query
        if (data.refined_query) {
            setRefinedQuery(data.refined_query);
            setShowRefinedQuery(true); // Show the refined query - no auto-hide
        }
        
        if (data.results && Array.isArray(data.results)) {
            setHasSearched(true);
            
            const formattedResults = data.results.map((job) => {
                // Normalize platform name for display
                let platformForDisplay = job.platform === "sam_gov" ? "sam.gov" : job.platform;

                return {
                    id: job.id || `job-${Math.random()}-${Date.now()}`,
                    title: job.title || "Untitled Opportunity",
                    agency: job.agency || job.department || "Unknown Agency",
                    jurisdiction: "Federal",
                    type: "RFP",
                    posted: job.published_date || job.posted || "Recent",
                    dueDate: job.response_date || job.dueDate || "TBD",
                    value: job.value || Math.floor(Math.random() * 5000000) + 1000000,
                    status: job.active !== undefined ? (job.active ? "Active" : "Inactive") : "Active",
                    naicsCode: job.naics_code?.toString() || job.naicsCode || "000000",
                    platform: platformForDisplay,
                    description: job.description?.substring(0, 150) + "..." || 
                      "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
                    external_url: job.external_url || job.url || null,
                    url: job.url || null,
                    solicitation_number: job.solicitation_number || null,
                    notice_id: job.notice_id || null,
                    published_date: job.published_date || null,
                    response_date: job.response_date || null
                };
            });
            
            setOpportunities(formattedResults);
            setTotalResults(data.total || formattedResults.length);
            setCurrentPage(data.page || 1);
            setTotalPages(
                data.total_pages || Math.ceil(data.total / resultsPerPage)
            );
        }
    } catch (error) {
        console.error("Error searching opportunities:", error);
    } finally {
        setIsSearching(false);
    }
};

  const paginate = async (pageNumber) => {
    if (pageNumber === currentPage) return;

    setIsSearching(true);

    try {
        // Prepare parameters with current filters and the existing refined query
        const params = {
            query: searchQuery,
            contract_type: null,
            platform: null,
            page: pageNumber,
            page_size: resultsPerPage,
            is_new_search: false,              // Add this flag
            existing_refined_query: refinedQuery // Pass the existing refined query
        };
        
        // Add active filters
        if (filterValues.dueDate && filterValues.dueDate !== "active_only") {
            params["due_date_filter"] = filterValues.dueDate;
        }
        
        if (filterValues.postedDate && filterValues.postedDate !== "all") {
            params["posted_date_filter"] = filterValues.postedDate;
        }
        
        if (filterValues.naicsCode && filterValues.naicsCode.trim() !== "") {
            params["naics_code"] = filterValues.naicsCode.trim();
        }

        const response = await fetch(`${API_BASE_URL}/search-opportunities`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(params),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log(`Page ${pageNumber} data:`, data);

        if (data.results && Array.isArray(data.results)) {
            setOpportunities(data.results);
            setCurrentPage(data.page || pageNumber);
            setTotalResults(data.total || 0);
            setTotalPages(data.total_pages || 1);
        }
    } catch (error) {
        console.error(`Error fetching page ${pageNumber}:`, error);
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
              onClick={() => paginate(currentPage - 1)}
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
              onClick={() => paginate(currentPage + 1)}
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
    dueDate: "next_30_days",
    postedDate: "past_week",
    naicsCode: "", // Changed from nigpCode
    opportunityType: ""
    // Removed jurisdiction and unspscCode
  });

  // Add applyFilters function
  const applyFilters = async () => {
    setIsSearching(true);
    
    // Prepare filter parameters with the new type
    const filterParams: SearchParams = {
      query: searchQuery,
      contract_type: null,
      platform: null,
      page: 1,
      page_size: resultsPerPage,
    };
    
    // Add date filters
    if (filterValues.dueDate && filterValues.dueDate !== "active_only") {
      filterParams.due_date_filter = filterValues.dueDate; // No linter error now
    }
    
    if (filterValues.postedDate && filterValues.postedDate !== "all") {
      filterParams.posted_date_filter = filterValues.postedDate; // No linter error now
    }
    
    // Add NAICS code filter if present
    if (filterValues.naicsCode && filterValues.naicsCode.trim() !== "") {
      filterParams.naics_code = filterValues.naicsCode.trim(); // No linter error now
    }
    
    try {
      console.log("Applying filters:", filterParams);
      
      const response = await fetch(`${API_BASE_URL}/search-opportunities`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(filterParams),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Filtered search results:", data);
      
      if (data.results && Array.isArray(data.results)) {
        setHasSearched(true);
        
        const formattedResults = data.results.map((job) => {
          // Normalize platform name for display
          let platformForDisplay = job.platform === "sam_gov" ? "sam.gov" : job.platform;

          return {
            id: job.id || `job-${Math.random()}-${Date.now()}`,
            title: job.title || "Untitled Opportunity",
            agency: job.agency || job.department || "Unknown Agency",
            jurisdiction: "Federal",
            type: "RFP",
            posted: job.published_date || job.posted || "Recent",
            dueDate: job.response_date || job.dueDate || "TBD",
            value: job.value || Math.floor(Math.random() * 5000000) + 1000000,
            status: job.active !== undefined ? (job.active ? "Active" : "Inactive") : "Active",
            naicsCode: job.naics_code?.toString() || job.naicsCode || "000000",
            platform: platformForDisplay,
            description: job.description?.substring(0, 150) + "..." || 
              "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
            external_url: job.external_url || job.url || null,
            url: job.url || null,
            solicitation_number: job.solicitation_number || null,
            notice_id: job.notice_id || null,
            published_date: job.published_date || null,
            response_date: job.response_date || null
          };
        });
        
        setOpportunities(formattedResults);
        setTotalResults(data.total || formattedResults.length);
        setCurrentPage(data.page || 1);
        setTotalPages(
          data.total_pages || Math.ceil(data.total / resultsPerPage)
        );
      }
    } catch (error) {
      console.error("Error applying filters:", error);
    } finally {
      setIsSearching(false);
    }
  };

  // Add a new state variable for job type
  const [jobType, setJobType] = useState("All");

  // Update the toggleFilter function to handle job type selection
  const toggleJobType = (type) => {
    setJobType(type);
  };

  // Modify the opportunities rendering logic based on job type
  const filteredOpportunities = opportunities.filter((opportunity) => {
    if (jobType === "Federal") {
      return opportunity.platform === "sam.gov"; // Show only sam.gov opportunities
    } else if (jobType === "Freelancer") {
      return opportunity.platform !== "sam.gov"; // Show only freelancer opportunities
    }
    return true; // Show all opportunities if "All" is selected
  });

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
                <ChevronRight size={16} className="text-gray-400" />
                <span className="font-medium text-gray-800">Contract Opportunities</span>
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
                            { id: "active-only", value: "active_only", label: "Active only" },
                            { id: "next-30", value: "next_30_days", label: "Next 30 days" },
                            { id: "next-3", value: "next_3_months", label: "Next 3 months" },
                            { id: "next-12", value: "next_12_months", label: "Next 12 months" },
                            { id: "custom-date-due", value: "custom_date", label: "Custom date" },
                          ].map((option) => (
                            <li key={option.id} className="flex items-center gap-2">
                              <input
                                type="radio"
                                id={option.id}
                                name="due-date"
                                className="accent-blue-500 w-4 h-4"
                                checked={filterValues.dueDate === option.value}
                                onChange={() => setFilterValues({ ...filterValues, dueDate: option.value })}
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
                  <div className={`py-3 px-1 border-b-2 ${selectedTab === 'newest' ? 'border-blue-500 text-blue-600 font-medium' : 'border-transparent text-gray-500 hover:text-gray-700'} cursor-pointer`} onClick={() => setSelectedTab('newest')}>
                    Newest
                  </div>
                  <div className={`py-3 px-1 border-b-2 ${selectedTab === 'relevant' ? 'border-blue-500 text-blue-600 font-medium' : 'border-transparent text-gray-500 hover:text-gray-700'} cursor-pointer`} onClick={() => setSelectedTab('relevant')}>
                    Most Relevant
                  </div>
                  <div className={`py-3 px-1 border-b-2 ${selectedTab === 'ending' ? 'border-blue-500 text-blue-600 font-medium' : 'border-transparent text-gray-500 hover:text-gray-700'} cursor-pointer`} onClick={() => setSelectedTab('ending')}>
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
                    {hasSearched && (
                      <div
                        className={`mb-5 bg-gradient-to-r from-blue-50 to-white backdrop-blur-lg border border-blue-200 rounded-xl 
                                      shadow-lg transition-all duration-300 overflow-hidden
                                      ${
                                        expandRecommendations
                                          ? "fixed inset-8 z-50 overflow-auto"
                                          : ""
                                      }`}
                      >
                        <div className="flex items-center justify-between px-6 py-4 border-b border-blue-100">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center p-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-md">
                              <Sparkles className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <h2 className="font-semibold text-lg text-gray-800">
                                BizradarAI Assistant
                              </h2>
                              <p className="text-xs text-gray-500">Personalized recommendations based on your profile</p>
                            </div>
                            {aiRecommendations.length > 0 && (
                              <span className="ml-2 text-xs font-medium bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full">
                                {aiRecommendations.length} recommendations
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => setAiComponentCollapsed((prev) => !prev)}
                              className="text-gray-500 hover:text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors"
                            >
                              {aiComponentCollapsed ? (
                                <ChevronDown size={20} />
                              ) : (
                                <ChevronUp size={20} />
                              )}
                            </button>
                            <button 
                              onClick={toggleRecommendationsExpand}
                              className="text-gray-500 hover:text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors"
                            >
                              {expandRecommendations ? (
                                <Minimize size={20} />
                              ) : (
                                <Maximize size={20} />
                              )}
                            </button>
                          </div>
                        </div>
                        
                        {/* Container for content with white background for contrast */}
                        {!aiComponentCollapsed && (
                          <div className="transition-all duration-300">
                            {isLoadingRecommendations && aiRecommendations.length === 0 ? (
                              <div className="flex flex-col items-center justify-center py-12 bg-gradient-to-r from-blue-50/30 to-white">
                                <div className="animate-pulse flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                                  <TrendingUp className="h-8 w-8 text-blue-500" />
                                </div>
                                <p className="text-blue-700 font-medium mb-2">
                                  Analyzing opportunities...
                                </p>
                                <p className="text-sm text-gray-500">
                                  Finding matches for your company profile
                                </p>
                              </div>
                            ) : (
                              <div className={`${expandRecommendations ? "max-h-none" : "max-h-96"} overflow-y-auto`}>
                                {aiRecommendations.length === 0 ? (
                                  <div className="py-12 text-center bg-gradient-to-r from-blue-50/30 to-white">
                                    <div className="mx-auto flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                                      <Info className="h-8 w-8 text-blue-500" />
                                    </div>
                                    <p className="text-gray-800 font-medium mb-2">
                                      Analyzing your search results
                                    </p>
                                    <p className="text-sm text-gray-500 max-w-md mx-auto">
                                      We'll provide personalized recommendations based on your profile and search.
                                    </p>
                                  </div>
                                ) : (
                                  <div className="divide-y divide-gray-100">
                                    {aiRecommendations.map((rec, index) => {
                                      const opportunity = rec.opportunity || currentOpportunities[0];
                                      
                                      return (
                                        <div key={rec.id || `rec-${index}`} className="p-4 hover:bg-gray-50 transition-colors">
                                          <div className="flex items-start">
                                            <div className="flex-1">
                                              <div className="font-medium text-gray-800 mb-1">
                                                {opportunity ? opportunity.title : "Unknown Opportunity"}
                                              </div>
                                              <div className="text-sm text-gray-600 mb-2">
                                                {rec.title || "Match found based on your profile"}
                                              </div>
                                              
                                              <div className="flex flex-wrap items-center gap-2 text-xs mb-3">
                                                <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full">
                                                  {opportunity?.agency || "Unknown Agency"}
                                                </span>
                                                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full">
                                                  {opportunity?.platform || "sam.gov"}
                                                </span>
                                                <span className="flex items-center gap-1 text-gray-500">
                                                  <Calendar className="h-3 w-3" />
                                                  Published: {opportunity?.posted || "TBD"}
                                                </span>
                                              </div>

                                              {/* Match Analysis Box - Always visible */}
                                              <div className="mt-3 bg-blue-50 p-4 rounded-lg border border-blue-100">
                                                <div className="flex items-start">
                                                  <div className="bg-white p-1.5 rounded-full mr-3 mt-0.5 border border-blue-200 shadow-sm">
                                                    <Info size={14} className="text-blue-600" />
                                                  </div>
                                                  <div className="flex-1">
                                                    <h4 className="font-medium text-blue-700 text-sm mb-1">Match Analysis</h4>
                                                    <p className="text-sm leading-relaxed text-gray-700 line-clamp-2">
                                                      {rec.description || "No detailed explanation available."}
                                                    </p>
                                                    
                                                    <button
                                                      onClick={() => toggleDetailedReason(index)}
                                                      className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1 mt-2"
                                                    >
                                                      Check for detailed analysis
                                                      {rec.showDetailedReason ? (
                                                        <ChevronUp size={16} className="ml-1" />
                                                      ) : (
                                                        <ChevronDown size={16} className="ml-1" />
                                                      )}
                                                    </button>
                                                  </div>
                                                </div>

                                                {/* Show ONLY Key Insights and match criteria table when expanded */}
                                                {rec.showDetailedReason && (
                                                  <div className="mt-4">
                                                    {/* Key Insights box */}
                                                    <div className="bg-white rounded-md p-4 border border-gray-200 mb-4">
                                                      <h5 className="font-medium text-gray-800 mb-2">Key Insights</h5>
                                                      <ul className="space-y-2">
                                                        {rec.keyInsights?.map((insight, idx) => (
                                                          <li key={idx} className="flex items-start">
                                                            <div className="h-2 w-2 bg-blue-500 rounded-full mt-1.5 mr-2"></div>
                                                            <span className="text-sm text-gray-700">{insight}</span>
                                                          </li>
                                                        ))}
                                                      </ul>
                                                    </div>

                                                    {/* Match Criteria Table */}
                                                    <div className="overflow-hidden rounded-md border border-gray-200">
                                                      <table className="min-w-full divide-y divide-gray-200">
                                                        <thead className="bg-gray-50">
                                                          <tr>
                                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                                              Match Criterion
                                                            </th>
                                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                                              Relevance
                                                            </th>
                                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                                              Notes
                                                            </th>
                                                          </tr>
                                                        </thead>
                                                        <tbody className="bg-white divide-y divide-gray-200">
                                                          {rec.matchCriteria?.map((crit, i) => (
                                                            <tr key={i}>
                                                              <td className="px-4 py-3 text-sm text-gray-900 font-medium">{crit.criterion}</td>
                                                              <td className="px-4 py-3">
                                                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                                                  crit.relevance === 'Strong match'
                                                                    ? 'bg-green-100 text-green-800'
                                                                    : crit.relevance === 'Partial match'
                                                                    ? 'bg-yellow-100 text-yellow-800'
                                                                    : 'bg-gray-100 text-gray-600'
                                                                }`}>
                                                                  {crit.relevance}
                                                                </span>
                                                              </td>
                                                              <td className="px-4 py-3 text-sm text-gray-500">{crit.notes}</td>
                                                            </tr>
                                                          ))}
                                                        </tbody>
                                                      </table>
                                                    </div>

                                                    {/* Verdict Section */}
                                                    <div className="mt-4 bg-white rounded-md p-4 border border-gray-200">
                                                      <h5 className="font-semibold text-gray-800 mb-1">✅ Verdict:</h5>
                                                      <p className="text-sm text-gray-700">{rec.matchReason}</p>
                                                    </div>
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                            
                                            <div className="ml-4 flex flex-col items-end">
                                              {rec.matchScore ? (
                                                <div className="flex flex-col items-center">
                                                  <div className="relative w-16 h-16 flex items-center justify-center mb-2">
                                                    <svg className="w-full h-full" viewBox="0 0 36 36">
                                                      <path
                                                        d="M18 2.0845
                                                          a 15.9155 15.9155 0 0 1 0 31.831
                                                          a 15.9155 15.9155 0 0 1 0 -31.831"
                                                        fill="none"
                                                        stroke="#E5E7EB"
                                                        strokeWidth="3"
                                                      />
                                                      <path
                                                        d="M18 2.0845
                                                          a 15.9155 15.9155 0 0 1 0 31.831
                                                          a 15.9155 15.9155 0 0 1 0 -31.831"
                                                        fill="none"
                                                        stroke={rec.matchScore > 80 ? "#10B981" : rec.matchScore > 60 ? "#3B82F6" : "#9CA3AF"}
                                                        strokeWidth="3"
                                                        strokeDasharray={`${rec.matchScore}, 100`}
                                                        strokeLinecap="round"
                                                      />
                                                    </svg>
                                                    <div className="absolute inset-0 flex items-center justify-center text-sm font-semibold">
                                                      {rec.matchScore}%
                                                    </div>
                                                  </div>
                                                  <button
                                                    onClick={() => handleAddToPursuit(opportunity)}
                                                    className="px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5"
                                                  >
                                                    <Plus size={14} />
                                                    <span>Add to Pursuits</span>
                                                  </button>
                                                </div>
                                              ) : (
                                                <button className="text-blue-600 px-3 py-1.5 bg-blue-50 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors">
                                                  View Details
                                                </button>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Show suggested searches when no search has been performed */}
                    {!hasSearched && (
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
                    )}

                    {/* AI-Matched Opportunities */}
                    {!hasSearched && (
                      <div className="mb-6 bg-white rounded-xl border border-gray-200 shadow-md max-w-8xl mx-auto overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-50 rounded-lg">
                              <Sparkles className="h-5 w-5  text-emerald-500" />
                            </div>
                            <h2 className="text-lg font-semibold text-gray-800">
                              New AI-Matched Opportunities
                            </h2>
                          </div>
                          <button className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 flex items-center gap-1.5 transition-colors">
                            <Settings className="h-4 w-4" />
                            <span>Edit settings</span>
                          </button>
                        </div>

                        {/* Alert */}
                        <div className="m-6 bg-amber-50 border border-amber-200 rounded-lg p-4 text-amber-800 flex items-start">
                          <AlertCircle className="h-5 w-5 mr-3 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-medium mb-1">No highly relevant matches found</p>
                            <p className="text-sm">
                              We couldn't find any highly relevant new opportunities for your
                              organization. Please check back tomorrow!
                            </p>
                          </div>
                        </div>

                        {/* Opportunity cards */}
                        <div className="m-6 space-y-4">
                          {/* Card 1 */}
                          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden transition-all hover:shadow-md hover:border-blue-200 group">
                            <div className="p-5">
                              <h3 className="text-lg font-medium text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                                Joint Service General Protective Masks M50, M51, and M53A1
                              </h3>
                              <p className="text-sm text-gray-600 mb-3">
                                Sources Sought • The Department of Defense, specifically
                                the Army, is seeking industry capabilities to produce
                                and...
                              </p>
                              <div className="flex items-center flex-wrap gap-2 text-xs mb-3">
                                <div className="px-2 py-1 bg-blue-50 text-blue-600 rounded-full flex items-center">
                                  <span className="inline-block w-1.5 h-1.5 bg-blue-500 rounded-full mr-1.5"></span>
                                  DEPT OF DEFENSE
                                </div>
                                <div className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full flex items-center">
                                  <Clock className="h-3 w-3 mr-1" />
                                  Published: Mar 5, 2025
                                </div>
                                <div className="px-2 py-1  bg-emerald-50 text-emerald-500 rounded-full flex items-center">
                                  <DollarSign className="h-3 w-3 mr-1" />
                                  Price Budget: {formatCurrency(750000)}
                                </div>
                              </div>
                            </div>
                            <div className="border-t border-gray-100 px-5 py-3 bg-gray-50 flex justify-between items-center">
                              <div className="text-xs text-gray-500">
                                Est. Value: <span className="font-medium">$750K-$1.5M</span>
                              </div>
                              <button 
                                onClick={() => handleAddToPursuit(opportunities[0])}
                                className="px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 hover:text-blue-600 transition-colors flex items-center gap-1"
                              >
                                <Plus size={12} />
                                Add to Pursuits
                              </button>
                            </div>
                          </div>

                          {/* Card 2 */}
                          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden transition-all hover:shadow-md hover:border-blue-200 group">
                            <div className="p-5">
                              <h3 className="text-lg font-medium text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                                Context-Aware Decision Support
                              </h3>
                              <p className="text-sm text-gray-600 mb-3">
                                SBIR/STTR • Description &lt;p&gt;In today&rsquo;s training
                                and operational environments, commanders are confronted
                                with...
                              </p>
                              <div className="flex items-center flex-wrap gap-2 text-xs mb-3">
                                <div className="px-2 py-1 bg-blue-50 text-blue-600 rounded-full flex items-center">
                                  <span className="inline-block w-1.5 h-1.5 bg-blue-500 rounded-full mr-1.5"></span>
                                  DOD
                                </div>
                                <div className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full flex items-center">
                                  <Clock className="h-3 w-3 mr-1" />
                                  Published: Mar 5, 2025
                                </div>
                                <div className="px-2 py-1 bg-green-50 text-green-600 rounded-full flex items-center">
                                  <DollarSign className="h-3 w-3 mr-1" />
                                  Price Budget: {formatCurrency(100000)}
                                </div>
                              </div>
                            </div>
                            <div className="border-t border-gray-100 px-5 py-3 bg-gray-50 flex justify-between items-center">
                              <div className="text-xs text-gray-500">
                                Est. Value: <span className="font-medium">$100K-$250K</span>
                              </div>
                              <button 
                                onClick={() => handleAddToPursuit(opportunities[1])}
                                className="px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 hover:text-blue-600 transition-colors flex items-center gap-1"
                              >
                                <Plus size={12} />
                                Add to Pursuits
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Dynamic Opportunity Cards - Only shown after a search */}
                    {hasSearched && !isSearching && opportunities.length > 0 ? (
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
                              
                              {/* URL/Link with Read more */}
                              <div className="mt-3 text-sm truncate">
                                {opportunity.url ? (
                                  <>
                                    <span className="text-gray-500">
                                      {opportunity.url.includes("sam.gov/opp") 
                                        ? opportunity.url.replace("https://api.sam.gov/prod/opportunities/v1/noticedesc?noticeid=", "https://sam.gov/opp/") + "/view"
                                        : opportunity.url}
                                    </span>
                                    <a 
                                      href={opportunity.url} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-blue-600 font-medium ml-2 hover:underline text-sm"
                                    >
                                      Read more
                                    </a>
                                    <span className="text-gray-400 text-xs ml-1">(API key required)</span>
                                  </>
                                ) : opportunity.external_url ? (
                                  <>
                                    <span className="text-gray-500">{opportunity.external_url}</span>
                                    <a 
                                      href={opportunity.external_url} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-blue-600 font-medium ml-2 hover:underline text-sm"
                                    >
                                      Read more
                                    </a>
                                  </>
                                ) : null}
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
                      hasSearched && !isSearching && (
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
                    )}

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

