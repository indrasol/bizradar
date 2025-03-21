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
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import SideBar from "../components/layout/SideBar";

// Import the environment variable
const isDevelopment =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";
const API_BASE_URL = isDevelopment
  ? "http://localhost:5000"
  : "https://bizradar-backend.onrender.com";

export default function Opportunities() {
  const navigate = useNavigate(); // Initialize the navigate function
  
  const [activeFilters, setActiveFilters] = useState({
    dueDate: true,
    postedDate: true,
    jurisdiction: true,
    nigpCode: true,
    unspscCode: true,
  });
  
  const [expandedCard, setExpandedCard] = useState("state-executive");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [aiRecommendations, setAiRecommendations] = useState([]);
  const [isLoadingRecommendations, setIsLoadingRecommendations] =
    useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [expandRecommendations, setExpandRecommendations] = useState(false);
  const [aiComponentCollapsed, setAiComponentCollapsed] = useState(false); // New state for collapsing AI component
  const [scrollToTopVisible, setScrollToTopVisible] = useState(false); // State for scroll to top button

  // New state variables
  const [pursuitCount, setPursuitCount] = useState(0); // State to track the number of pursuits
  const [showNotification, setShowNotification] = useState(false); // State to manage notification visibility
  
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
      const profileData = sessionStorage.getItem("userProfile");
      if (profileData) {
        return JSON.parse(profileData);
      }
      return {
        companyUrl: "https://bizradar.com",
        companyDescription:
          "Bizradar specializes in AI-powered contract analytics and opportunity matching for government procurement.",
      };
    } catch (error) {
      console.error("Error fetching user profile:", error);
      return {
        companyUrl: "https://bizradar.com", 
        companyDescription: "Default company description",
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
      
      const response = await fetch(`${API_BASE_URL}/ai-recommendations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          companyUrl: userProfile.companyUrl,
          companyDescription: userProfile.companyDescription,
          opportunities: opportunities, // Use the current page's opportunities
          responseFormat: "json",
          includeMatchReason: true,
        }),
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
    requestInProgressRef.current = false;
    lastSearchIdRef.current = "";
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

    try {
      const response = await fetch(`${API_BASE_URL}/search-opportunities`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: query,
          contract_type: null,
          platform: null,
          page: 1, // Start with page 1
          page_size: resultsPerPage,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Search results:", data);
      
      if (data.results && Array.isArray(data.results)) {
        setHasSearched(true);
        
        const formattedResults = data.results.map((job) => ({
          id: job.id || `job-${Math.random()}-${Date.now()}`,
          title: job.title || "Untitled Opportunity",
          agency: job.agency || "Unknown Agency",
          jurisdiction: "Federal",
          type: "RFP",
          posted: job.posted || "Recent",
          dueDate: job.dueDate || "TBD",
          value: Math.floor(Math.random() * 5000000) + 1000000,
          status: "Active",
          naicsCode: job.naicsCode || "000000",
          platform: job.platform || "sam.gov",
          description:
            job.description?.substring(0, 150) + "..." ||
            "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
        }));
        
        setOpportunities(formattedResults);
        setTotalResults(data.total || formattedResults.length);
        setCurrentPage(data.page || 1);
        setTotalPages(
          data.total_pages || Math.ceil(data.total / resultsPerPage)
        );

        console.log(
          `Loaded ${formattedResults.length} opportunities. Total: ${data.total}, Pages: ${data.total_pages}`
        );
      }
    } catch (error) {
      console.error("Error searching opportunities:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const paginate = async (pageNumber: number) => {
    if (pageNumber === currentPage) return;

    console.log(
      `Requesting to navigate from page ${currentPage} to page ${pageNumber}`
    );

    // Check page bounds
    if (pageNumber < 1 || (totalPages > 0 && pageNumber > totalPages)) {
      console.warn(
        `Invalid page ${pageNumber}. Valid range is 1-${totalPages}`
      );
      return;
    }

    setIsSearching(true);

    try {
      const response = await fetch(`${API_BASE_URL}/search-opportunities`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: searchQuery,
          contract_type: null,
          platform: null,
          page: pageNumber,
          page_size: resultsPerPage,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log(`Page ${pageNumber} data:`, data);

      if (data.results && Array.isArray(data.results)) {
        console.log(
          `Received ${data.results.length} results for page ${data.page}`
        );

        // If no results were returned but there should be, revert to page 1
        if (data.results.length === 0 && data.total > 0) {
          console.warn(
            "No results returned for this page, returning to page 1"
          );
          paginate(1);
          return;
        }

        const formattedResults = data.results.map((job) => ({
          id: job.id ? `job-${job.id}` : `job-${Date.now()}-${Math.random()}`,
          title: job.title || "Untitled Opportunity",
          agency: job.agency || "Unknown Agency",
          jurisdiction: "Federal",
          type: "RFP",
          posted: job.posted || "Recent",
          dueDate: job.dueDate || "TBD",
          value: job.value || Math.floor(Math.random() * 5000000) + 1000000,
          status: "Active",
          naicsCode: job.naicsCode || "000000",
          platform: job.platform || "sam.gov",
          description:
            job.description?.substring(0, 150) + "..." ||
            "Lorem ipsum dolor sit amet",
        }));

        // Update the state with the new results
        setOpportunities(formattedResults);
        setCurrentPage(data.page || pageNumber);
        setTotalResults(data.total || 0);
        setTotalPages(data.total_pages || 1);

        // Clear recommendations since we're on a new page
        setAiRecommendations([]);
        requestInProgressRef.current = false;
        lastSearchIdRef.current = "";

        // Scroll back to top
        const resultsContainer = document.querySelector(".results-container");
        if (resultsContainer) {
          resultsContainer.scrollTop = 0;
        }
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
          <div className="flex items-center gap-2">
            <button
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
              className={`p-2 rounded-md ${
                currentPage === 1
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-white text-blue-600 hover:bg-blue-50 border border-gray-200"
              }`}
            >
              <ChevronLeft size={16} />
            </button>

            <div className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </div>

            <button
              onClick={() => paginate(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`p-2 rounded-md ${
                currentPage === totalPages
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-white text-blue-600 hover:bg-blue-50 border border-gray-200"
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
    const contract = {
      id: contractId,
      title: contractData.title || "Default Title",
      agency: contractData.agency || "Default Agency",
      dueDate: contractData.dueDate || "2025-01-01",
      value: contractData.value || 0,
      status: contractData.status || "Open",
      naicsCode: contractData.naicsCode || "000000", 
      description: contractData.description || "",
    };

    sessionStorage.setItem("currentContract", JSON.stringify(contract));
    navigate(`/contracts/rfp/${contractId}`);
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
    const pursuits = JSON.parse(localStorage.getItem("pursuits") || "[]");
    setPursuitCount(pursuits.length);
  }, []);

  // New function to handle adding to pursuits
  const handleAddToPursuit = (opportunity) => {
    const currentPursuits = JSON.parse(
      localStorage.getItem("pursuits") || "[]"
    );
    const isAlreadyInPursuits = currentPursuits.some(
      (p) => p.id === opportunity.id
    );

    if (!isAlreadyInPursuits) {
      const updatedPursuits = [...currentPursuits, opportunity];
      localStorage.setItem("pursuits", JSON.stringify(updatedPursuits));
      setPursuitCount((prevCount) => prevCount + 1);
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50 text-gray-800">
      {/* Trial Notification */}
      <div className="w-full bg-blue-600 text-white text-center py-2 px-4">
        <div className="flex items-center justify-center">
          <span>Subscription Plans.</span>
          <a
            href="#"
            className="ml-2 font-medium underline decoration-2 underline-offset-2"
          >
            Book a demo here
          </a>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <SideBar />

        {/* Main Dashboard Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="border-b border-gray-200 bg-white shadow-sm">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-2">
                <span className="text-gray-500 text-sm">Portfolio</span>
                <ChevronRight size={16} className="text-gray-400" />
                <span className="font-medium">
                  State and Local Contract Opportunities
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button className="bg-blue-600 text-white px-4 py-1.5 rounded-md text-sm flex items-center gap-1 shadow-sm">
                  <span>Upgrade</span>
                </button>
                <div className="relative">
                  <Bell size={20} className="text-gray-500" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white"></div>
                </div>
                <button className="bg-blue-50 text-blue-600 px-4 py-1.5 rounded-md text-sm flex items-center gap-1 border border-blue-100">
                  <MessageCircle size={14} />
                  <span>Live Support</span>
                </button>
              </div>
            </div>
          </div>

          {/* Body - Two Column Layout */}
          <div className="flex-1 flex overflow-hidden">
            {/* Filters Column */}
            <div 
              className="border-r border-gray-200 overflow-y-auto relative bg-white shadow-sm"
              style={{ width: filtersOpen ? "18rem" : "3rem" }}
            >
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                {filtersOpen && (
                  <h2 className="font-medium text-lg whitespace-nowrap text-blue-700">
                    Filters
                  </h2>
                )}
                
                {/* Filters Toggle Button */}
                <button
                  className="bg-white border border-gray-200 rounded-full w-6 h-6 flex items-center justify-center shadow-sm hover:bg-blue-50 hover:border-blue-200"
                  onClick={toggleFiltersBar}
                >
                  {filtersOpen ? (
                    <ChevronLeft size={14} className="text-blue-600" />
                  ) : (
                    <Filter size={14} className="text-blue-600" />
                  )}
                </button>
              </div>

              {/* Filter content */}

                  {/* Due Date Filter */}
              {filtersOpen && (
                  <div className="border-b border-gray-200">
                  <div
                    onClick={() => toggleFilter("dueDate")}
                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                  >
                    <h2 className="font-medium">Due Date</h2>
                    <div>
                      <ChevronDown size={14} className="text-gray-400" />
                  </div>
                  </div>
                  {activeFilters.dueDate && (
                    <div className="px-4 pb-4">
                      <ul className="space-y-2">
                        <li className="flex items-center gap-2">
                          <input
                            type="radio"
                            id="active-only"
                            name="due-date"
                            className="accent-blue-500"
                          />
                          <label htmlFor="active-only" className="text-sm">
                            Active only
                          </label>
                        </li>
                        <li className="flex items-center gap-2">
                          <input
                            type="radio"
                            id="next-30"
                            name="due-date"
                            className="accent-blue-500"
                          />
                          <label htmlFor="next-30" className="text-sm">
                            Next 30 days
                          </label>
                        </li>
                        <li className="flex items-center gap-2">
                          <input
                            type="radio"
                            id="next-3"
                            name="due-date"
                            className="accent-blue-500"
                          />
                          <label htmlFor="next-3" className="text-sm">
                            Next 3 months
                          </label>
                        </li>
                        <li className="flex items-center gap-2">
                          <input
                            type="radio"
                            id="next-12"
                            name="due-date"
                            className="accent-blue-500"
                          />
                          <label htmlFor="next-12" className="text-sm">
                            Next 12 months
                          </label>
                        </li>
                        <li className="flex items-center gap-2">
                          <input
                            type="radio"
                            id="custom-date-due"
                            name="due-date"
                            className="accent-blue-500"
                          />
                          <label htmlFor="custom-date-due" className="text-sm">
                            Custom date
                          </label>
                        </li>
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Posted Date Filter */}
              {filtersOpen && (
                <div className="border-b border-gray-200">
                  <div 
                    onClick={() => toggleFilter('postedDate')} 
                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                  >
                    <h2 className="font-medium">Posted Date</h2>
                    <div>
                      <ChevronDown size={14} className="text-gray-400" />
                    </div>
                  </div>
                  {activeFilters.postedDate && (
                    <div className="px-4 pb-4">
                      <ul className="space-y-2">
                        <li className="flex items-center gap-2">
                          <input type="radio" id="past-day" name="posted-date" className="accent-blue-500" />
                          <label htmlFor="past-day" className="text-sm">Past day</label>
                        </li>
                        <li className="flex items-center gap-2">
                          <input type="radio" id="past-week" name="posted-date" className="accent-blue-500" />
                          <label htmlFor="past-week" className="text-sm">Past week</label>
                        </li>
                        <li className="flex items-center gap-2">
                          <input type="radio" id="past-month" name="posted-date" className="accent-blue-500" />
                          <label htmlFor="past-month" className="text-sm">Past month</label>
                        </li>
                        <li className="flex items-center gap-2">
                          <input type="radio" id="past-year" name="posted-date" className="accent-blue-500" />
                          <label htmlFor="past-year" className="text-sm">Past year</label>
                        </li>
                        <li className="flex items-center gap-2">
                          <input type="radio" id="custom-date-posted" name="posted-date" className="accent-blue-500" />
                          <label htmlFor="custom-date-posted" className="text-sm">Custom date</label>
                        </li>
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Jurisdiction Filter */}
              {filtersOpen && (
                <div className="border-b border-gray-200">
                  <div 
                    onClick={() => toggleFilter('jurisdiction')} 
                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                  >
                    <h2 className="font-medium">Jurisdiction(s)</h2>
                    <div>
                      <ChevronDown size={14} className="text-gray-400" />
                    </div>
                  </div>
                  {activeFilters.jurisdiction && (
                    <div className="px-4 pb-4">
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Ex: New York"
                          className="w-full p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        />
                      </div>
                </div>
              )}
                </div>
              )}

              {/* NIGP Code(s) Filter */}
              {filtersOpen && (
                <div className="border-b border-gray-200">
                  <div 
                    onClick={() => toggleFilter('nigpCode')} 
                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                  >
                    <h2 className="font-medium">NIGP Code(s)</h2>
                    <div>
                      <ChevronDown size={14} className="text-gray-400" />
                    </div>
                  </div>
                  {activeFilters.nigpCode && (
                    <div className="px-4 pb-4">
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Ex: 78500"
                          className="w-full p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* UNSPSC Code(s) Filter */}
              {filtersOpen && (
                <div className="border-b border-gray-200">
                  <div 
                    onClick={() => toggleFilter('unspscCode')} 
                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                  >
                    <h2 className="font-medium">UNSPSC Code(s)</h2>
                    <div>
                      <ChevronDown size={14} className="text-gray-400" />
                    </div>
                  </div>
                  {activeFilters.unspscCode && (
                    <div className="px-4 pb-4">
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Ex: 10101501"
                          className="w-full p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* Results Column */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Search Bar */}
              <div className="p-4 border-b border-gray-200 bg-white">
                <form
                  onSubmit={handleSearch}
                  className="flex items-center gap-2"
                >
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search size={16} className="text-blue-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Search opportunities..."
                      value={searchQuery}
                      onChange={handleSearchChange}
                      className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all shadow-sm"
                    />
                    {searchQuery && (
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                        <button 
                          type="button" 
                          onClick={clearSearch}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                  <button 
                    type="button" 
                    onClick={() => navigate("/settings")}
                    className="p-2.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors shadow-sm"
                  >
                    <Settings size={16} />
                  </button>
                  
                </form>
              </div>

              {/* Results Count & Actions */}
              <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between bg-gray-50">
                <div className="text-sm font-medium py-1 px-2.5 bg-blue-100 text-blue-700 rounded-full flex items-center">
                  {hasSearched ? (
                    <span>
                      {totalResults} {totalResults === 1 ? "result" : "results"}
                    </span>
                  ) : (
                    <span>Search for Opportunities</span>
                  )}
                </div>
                {hasSearched && (
                  <div className="flex items-center gap-2">
                    <button className="bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5 shadow-sm hover:bg-gray-50 transition-colors">
                      <Download size={14} className="text-gray-500" />
                      <span>Export</span>
                    </button>
                    <button className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5 shadow-sm">
                      <Bell size={14} />
                      <span>Notify Me Daily</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Results List */}
              <div className="flex-1 overflow-y-auto">
                {/* Show loading state while searching */}
                {isSearching && (
                  <div className="p-6 mx-4 my-4 bg-white border border-gray-200 rounded-lg shadow-lg flex justify-center">
                    <p>Searching...</p>
                  </div>
                )}

                {!isSearching && (
                  <>
                    {/* BizradarAI Assistant Card - Only shown after a search */}
                    {hasSearched && (
                      <div
                        className={`p-4 mx-4 mt-4 bg-blue-50/80 backdrop-blur-lg border border-blue-200 rounded-lg 
                                      shadow-[0_8px_20px_rgba(59,130,246,0.3)] transition-all duration-300
                                      ${
                                        expandRecommendations
                                          ? "fixed inset-8 z-50 overflow-auto"
                                          : ""
                                      }`}
                      >
                        <div className="flex items-center justify-between mb-3 pb-2 border-b border-blue-200/40">
                          <div className="flex items-center gap-2">
                            <span className="text-blue-500 bg-blue-100 p-1.5 rounded-md shadow-sm">
                              ⚡
                            </span>
                            <h2 className="font-semibold text-lg text-blue-700">
                              BizradarAI Assistant
                            </h2>
                            <span className="text-xs text-blue-600 bg-blue-100/70 px-2 py-0.5 rounded-full ml-2">
                              {aiRecommendations.length > 0 
                                ? `${aiRecommendations.length} recommendations found` 
                                : ""}
                            </span>
                            {aiRecommendations.length > 0 &&
                              isLoadingRecommendations && (
                              <button 
                                onClick={forceRender}
                                  className="text-xs text-blue-500 underline ml-2 hover:text-blue-700"
                              >
                                (Show Results)
                              </button>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() =>
                                setAiComponentCollapsed((prev) => !prev)
                              }
                              className="text-blue-500 hover:text-blue-700 p-1"
                            >
                              {aiComponentCollapsed ? (
                                <ChevronDown size={18} />
                              ) : (
                                <ChevronUp size={18} />
                              )}
                            </button>
                          <button 
                            onClick={toggleRecommendationsExpand}
                              className="text-blue-500 hover:text-blue-700 bg-blue-50 p-1 rounded-md"
                            >
                              {expandRecommendations ? (
                                <Minimize size={18} />
                              ) : (
                                <Maximize size={18} />
                              )}
                          </button>
                          </div>
                        </div>
                        
                        {/* Container for content with white background for contrast */}
                        {!aiComponentCollapsed && (
                          <div className="bg-white rounded-md shadow-sm overflow-hidden transition-all duration-300">
                            {isLoadingRecommendations &&
                            aiRecommendations.length === 0 ? (
                              <div className="flex justify-center py-6 bg-blue-50/50">
                                <p className="text-blue-700 font-medium">
                                  Analyzing opportunities...
                                </p>
                            </div>
                          ) : (
                              <div
                                className={`overflow-y-auto ${
                                  expandRecommendations ? "h-full" : "max-h-96"
                                }`}
                              >
                              {aiRecommendations.length === 0 ? (
                                  <div className="py-6 text-center bg-blue-50/50">
                                    <p className="text-blue-700 font-medium">
                                      Here is what I think
                                    </p>
                                </div>
                              ) : (
                                <table className="w-full table-auto">
                                  <tbody>
                                    {aiRecommendations.map((rec, index) => {
                                        const opportunity =
                                          rec.opportunity ||
                                          currentOpportunities[0];

                                        return (
                                          <tr
                                            key={rec.id || `rec-${index}`}
                                            className={
                                              index % 2 === 0
                                                ? "bg-gray-50 border-b border-gray-100"
                                                : "bg-white border-b border-gray-100"
                                            }
                                          >
                                            <td className="py-3 px-4">
                                              <div className="font-medium text-sm text-gray-800">
                                                {opportunity
                                                  ? opportunity.title
                                                  : "Unknown Opportunity"}
                                              </div>
                                              <div className="text-xs text-gray-600 mt-1">
                                                {rec.title ||
                                                  "Match found based on your profile"}
                                              </div>

                                              {/* Enhanced Check Why button */}
                                              <button
                                                onClick={() =>
                                                  toggleDetailedReason(index)
                                                }
                                                className="mt-2 text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-md text-sm flex items-center font-medium border border-blue-200 transition-colors"
                                              >
                                                Check Why{" "}
                                                {rec.showDetailedReason ? (
                                                  <ChevronDown
                                                    size={16}
                                                    className="ml-1"
                                                  />
                                                ) : (
                                                  <ChevronRight
                                                    size={16}
                                                    className="ml-1"
                                                  />
                                                )}
                                              </button>

                                              {/* Improved detailed reason display */}
                                              {rec.showDetailedReason && (
                                                <div className="mt-3 bg-blue-50 p-4 rounded-md border border-blue-200 shadow-sm">
                                                  <div className="flex items-start">
                                                    <div className="bg-blue-100 p-1 rounded-full mr-3 mt-1">
                                                      <Info
                                                        size={16}
                                                        className="text-blue-700"
                                                      />
                                                    </div>
                                                    <p className="text-sm leading-relaxed text-gray-700">
                                                      {rec.description ||
                                                        "No detailed explanation available."}
                                                    </p>
                                                  </div>
                                                </div>
                                              )}
                                            </td>
                                            <td className="py-3 px-4 text-right">
                                              <div className="flex flex-col items-end">
                                                {rec.matchScore ? (
                                                  <span
                                                    className={`text-xs font-medium px-2 py-0.5 rounded shadow-sm ${
                                                      rec.matchScore > 70
                                                        ? "bg-green-100 text-green-700"
                                                        : rec.matchScore > 50
                                                        ? "bg-blue-100 text-blue-700"
                                                        : "bg-gray-100 text-gray-700"
                                                    }`}
                                                  >
                                                  {rec.matchScore}% match
                                                </span>
                                                ) : (
                                                  <span className="text-xs font-medium text-blue-600">
                                                    View
                                                  </span>
                                                )}
                                              </div>
                                            </td>
                                          </tr>
                                        );
                                    })}
                                  </tbody>
                                </table>
                              )}
                            </div>
                          )}
                        </div>
                        )}
                      </div>
                    )}

                    {/* Show suggested searches when no search has been performed */}
                    {!hasSearched && (
                      <div className="p-6 mx-4 my-4 bg-white rounded-lg border border-gray-200 shadow-lg">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">
                          Popular Searches
                        </h2>
                        <p className="text-gray-600 mb-6">
                          Click on any of these suggestions or use the search
                          bar above to find contract opportunities:
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {suggestedQueries.map((query) => (
                            <div 
                              key={query.id}
                              onClick={() =>
                                handleSuggestedQueryClick(query.id)
                              }
                              className="bg-white rounded-lg border border-gray-200 p-4 cursor-pointer hover:border-blue-300 hover:shadow-xl transition-all"
                            >
                              <div className="flex items-center mb-2">
                                {query.icon}
                                <h3 className="font-medium text-gray-800 ml-2">
                                  {query.title}
                                </h3>
                              </div>
                              <p className="text-gray-600 text-sm">
                                {query.description}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* AI-Matched Opportunities */}
                    {!hasSearched && (
                      <div className="mx-4 my-4 p-6 bg-white rounded-lg border border-gray-200 shadow-lg">
                        <div className="mb-8">
                          <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center space-x-2">
                              <Search className="h-5 w-5 text-gray-500" />
                              <h2 className="text-lg font-medium text-gray-700">
                                New AI-Matched Opportunities
                              </h2>
                            </div>
                            <button className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                              <Settings className="mr-2 h-4 w-4" />
                              Edit settings
                          </button>
                          </div>

                          {/* Alert */}
                          <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-md p-4 text-yellow-800">
                            We couldn't find any highly relevant new opportunities for your
                            organization. Please check back tomorrow!
                          </div>

                          {/* Opportunity cards */}
                          <div className="space-y-4">
                            {/* Card 1 */}
                            <div className="bg-white rounded-md border border-gray-200 overflow-hidden">
                              <div className="p-4">
                                <h3 className="text-lg font-medium text-gray-900 mb-1">
                                  Joint Service General Protective Masks M50, M51, and M53A1
                                </h3>
                                <p className="text-sm text-gray-600 mb-2">
                                  Sources Sought • The Department of Defense, specifically
                                  the Army, is seeking industry capabilities to produce
                                  and...
                                </p>
                                <div className="flex items-center space-x-4 text-xs">
                                  <div className="flex items-center text-gray-500">
                                    <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-1"></span>
                                    DEPT OF DEFENSE
                                  </div>
                                  <div className="flex items-center text-gray-500">
                                    <Clock className="h-3 w-3 mr-1" />
                                    Released: Mar 5, 2025
                                  </div>
                                  <div className="flex items-center text-gray-500">
                                    <Clock className="h-3 w-3 mr-1" />
                                    Due: Mar 28, 2025
                                  </div>
                                </div>
                              </div>
                              <div className="border-t border-gray-200 px-4 py-2 bg-gray-50 text-right">
                                <button className="inline-flex items-center px-3 py-1 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                                  Add to Pursuits
                            </button>
                              </div>
                            </div>

                            {/* Card 2 */}
                            <div className="bg-white rounded-md border border-gray-200 overflow-hidden">
                              <div className="p-4">
                                <h3 className="text-lg font-medium text-gray-900 mb-1">
                                  Context-Aware Decision Support
                                </h3>
                                <p className="text-sm text-gray-600 mb-2">
                                  SBIR/STTR • Description &lt;p&gt;In today&rsquo;s training
                                  and operational environments, commanders are confronted
                                  with...
                                </p>
                                <div className="flex items-center space-x-4 text-xs">
                                  <div className="flex items-center text-gray-500">
                                    <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-1"></span>
                                    DOD
                                  </div>
                                  <div className="flex items-center text-gray-500">
                                    <Clock className="h-3 w-3 mr-1" />
                                    Released: Mar 5, 2025
                                  </div>
                                  <div className="flex items-center text-gray-500">
                                    <Clock className="h-3 w-3 mr-1" />
                                    Due: Apr 23, 2025
                                  </div>
                                </div>
                              </div>
                              <div className="border-t border-gray-200 px-4 py-2 bg-gray-50 text-right">
                                <button className="inline-flex items-center px-3 py-1 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                                  Add to Pursuits
                          </button>
                        </div>
                      </div>

                            {/* Card 3 */}
                            <div className="bg-white rounded-md border border-gray-200 overflow-hidden">
                              <div className="p-4">
                                <h3 className="text-lg font-medium text-gray-900 mb-1">
                                  Context-Aware Decision Support
                                </h3>
                                <p className="text-sm text-gray-600 mb-2">
                                  SBIR/STTR • Description &lt;p&gt;In today&rsquo;s training
                                  and operational environments, commanders are confronted
                                  with...
                                </p>
                                <div className="flex items-center space-x-4 text-xs">
                                  <div className="flex items-center text-gray-500">
                                    <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-1"></span>
                                    DOD
              </div>
                                  <div className="flex items-center text-gray-500">
                                    <Clock className="h-3 w-3 mr-1" />
                                    Released: Mar 5, 2025
            </div>
                                  <div className="flex items-center text-gray-500">
                                    <Clock className="h-3 w-3 mr-1" />
                                    Due: Apr 23, 2025
          </div>
        </div>
      </div>
                              <div className="border-t border-gray-200 px-4 py-2 bg-gray-50 text-right">
                                <button className="inline-flex items-center px-3 py-1 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                                  Add to Pursuits
                                </button>
    </div>
                            </div>

                            {/* Card 4 */}
                            <div className="bg-white rounded-md border border-gray-200 overflow-hidden">
                              <div className="p-4">
                                <h3 className="text-lg font-medium text-gray-900 mb-1">
                                  Design & Installation of Playgrounds
                                </h3>
                                <p className="text-sm text-gray-600 mb-2">
                                  Construction • The City of North Myrtle Beach is
                                  soliciting proposals for the design and installation of
                                  playground...
                                </p>
                                <div className="flex items-center space-x-4 text-xs">
                                  <div className="flex items-center text-gray-500">
                                    <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-1"></span>
                                    City of North Myrtle Beach
                                  </div>
                                  <div className="flex items-center text-gray-500">
                                    <Clock className="h-3 w-3 mr-1" />
                                    Released: Mar 4, 2025
                                  </div>
                                  <div className="flex items-center text-gray-500">
                                    <Clock className="h-3 w-3 mr-1" />
                                    Due: Mar 25, 2025
                                  </div>
                                </div>
                              </div>
                              <div className="border-t border-gray-200 px-4 py-2 bg-gray-50 text-right">
                                <button className="inline-flex items-center px-3 py-1 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                                  Add to Pursuits
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Dynamic Opportunity Cards - Only shown after a search */}
                    {hasSearched && !isSearching && opportunities.length > 0
                      ? opportunities.map((opportunity, index) => (
                          <div
                            key={opportunity.id}
                            className="mx-4 my-4 p-4 bg-white border border-gray-200 rounded-lg shadow-lg hover:shadow-xl transition-all"
                          >
                        <div className="flex justify-between">
                          <div className="flex items-start gap-2">
                            <div className="mt-1">
                                  {opportunity.title
                                    .toLowerCase()
                                    .includes("cyber") ||
                                  opportunity.title
                                    .toLowerCase()
                                    .includes("security") ? (
                                    <Shield
                                      className="text-blue-500"
                                      size={18}
                                    />
                                  ) : opportunity.title
                                      .toLowerCase()
                                      .includes("software") ? (
                                    <Code
                                      className="text-amber-500"
                                      size={18}
                                    />
                                  ) : (
                                    <BarChart2
                                      className="text-blue-500"
                                      size={18}
                                    />
                              )}
                            </div>
                            <div>
                                  <h2 className="text-lg font-semibold text-gray-800">
                                    {opportunity.title}
                                  </h2>
                                  <p className="text-sm text-gray-500">
                                    {opportunity.agency}
                                  </p>
                            </div>
                          </div>
                          <button className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-blue-600 hover:bg-blue-50">
                            <Share size={16} className="text-gray-400" />
                          </button>
                        </div>

                        {/* Tags */}
                        <div className="mt-3 flex items-center gap-2 flex-wrap">
                          <div className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-md text-xs font-medium">
                            {opportunity.platform || "sam.gov"}
                          </div>
                          <div className="px-2 py-0.5 bg-green-50 text-green-600 rounded-md text-xs font-medium">
                            {opportunity.status}
                          </div>
                          {opportunity.naicsCode && (
                            <div className="px-2 py-0.5 bg-purple-50 text-purple-600 rounded-md text-xs font-medium">
                              NAICS: {opportunity.naicsCode}
                            </div>
                          )}
                        </div>

                        {/* Description with Read More */}
                        <div className="mt-3">
                          <p className="text-sm text-gray-600">
                            {opportunity.description} 
                            <button className="text-blue-600 font-medium ml-1 hover:underline text-xs">
                              Read more
                            </button>
                          </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 mt-3">
                          <button className="bg-blue-600 text-white px-3 py-1.5 rounded-md text-xs flex items-center gap-1 shadow-sm">
                            <MessageCircle size={14} />
                            <span>Ask AI</span>
                          </button>
                          <button 
                                onClick={() => handleAddToPursuit(opportunity)}
                                className="bg-green-600 text-white px-3 py-1.5 rounded-md text-xs flex items-center gap-1 shadow-sm hover:bg-green-700 transition-colors"
                          >
                                <Plus size={14} />
                                <span>Add to Pursuit</span>
                          </button>
                              <button
                                onClick={() =>
                                  navigate(`/opportunities/${opportunity.id}`)
                                }
                                className="bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-md text-xs flex items-center gap-1 shadow-sm hover:bg-gray-50"
                              >
                                <ExternalLink
                                  size={14}
                                  className="text-blue-500"
                                />
                                <span>View</span>
                          </button>
                        </div>
                      </div>
                        ))
                      : hasSearched &&
                        !isSearching && (
                          <div className="p-6 mx-4 my-4 bg-white border border-gray-200 rounded-lg shadow-lg text-center">
                            <p className="text-gray-600">
                              No results found for this page. Try another search
                              or go back to the first page.
                            </p>
                          </div>
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
          className="fixed bottom-4 right-4 bg-blue-600 text-white p-2 rounded-full shadow-lg hover:bg-blue-700 transition"
        >
          ↑
        </button>
      )}

      {/* Notification Toast */}
      {showNotification && (
        <div className="fixed bottom-4 right-4 bg-green-600 text-white py-2 px-4 rounded-md shadow-lg flex items-center gap-2 animate-fade-in-up z-50">
          <Check size={16} />
          <span>Added to Pursuits</span>
        </div>
                                              )}
                                            </div>

    
                                      );
}
