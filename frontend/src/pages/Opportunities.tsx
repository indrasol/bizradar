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
  ListFilter
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

  const paginate = async (pageNumber) => {
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

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);
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
                  <h2 className="font-semibold text-lg text-gray-800">
                    Filters
                  </h2>
                )}

                {/* Filters Toggle Button */}
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

              {/* Filter content */}
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
                </div>
              )}

              {/* Due Date Filter */}
              {filtersOpen && (
                <div className="border-b border-gray-100">
                  <div
                    onClick={() => toggleFilter("dueDate")}
                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Clock size={18} className="text-blue-500" />
                      <h2 className="font-medium text-gray-800">Due Date</h2>
                    </div>
                    <div>
                      {activeFilters.dueDate ? (
                        <ChevronUp size={16} className="text-gray-400" />
                      ) : (
                        <ChevronDown size={16} className="text-gray-400" />
                      )}
                    </div>
                  </div>
                  {activeFilters.dueDate && (
                    <div className="px-5 pb-4">
                      <ul className="space-y-2 ml-7">
                        <li className="flex items-center gap-2">
                          <input
                            type="radio"
                            id="active-only"
                            name="due-date"
                            className="accent-blue-500 w-4 h-4"
                          />
                          <label htmlFor="active-only" className="text-sm text-gray-700">
                            Active only
                          </label>
                        </li>
                        <li className="flex items-center gap-2">
                          <input
                            type="radio"
                            id="next-30"
                            name="due-date"
                            className="accent-blue-500 w-4 h-4"
                            checked
                          />
                          <label htmlFor="next-30" className="text-sm text-gray-700">
                            Next 30 days
                          </label>
                        </li>
                        <li className="flex items-center gap-2">
                          <input
                            type="radio"
                            id="next-3"
                            name="due-date"
                            className="accent-blue-500 w-4 h-4"
                          />
                          <label htmlFor="next-3" className="text-sm text-gray-700">
                            Next 3 months
                          </label>
                        </li>
                        <li className="flex items-center gap-2">
                          <input
                            type="radio"
                            id="next-12"
                            name="due-date"
                            className="accent-blue-500 w-4 h-4"
                          />
                          <label htmlFor="next-12" className="text-sm text-gray-700">
                            Next 12 months
                          </label>
                        </li>
                        <li className="flex items-center gap-2">
                          <input
                            type="radio"
                            id="custom-date-due"
                            name="due-date"
                            className="accent-blue-500 w-4 h-4"
                          />
                          <label htmlFor="custom-date-due" className="text-sm text-gray-700">
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
                <div className="border-b border-gray-100">
                  <div
                    onClick={() => toggleFilter("postedDate")}
                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Calendar size={18} className="text-gray-500" />
                      <h2 className="font-medium text-gray-800">Posted Date</h2>
                    </div>
                    <div>
                      {activeFilters.postedDate ? (
                        <ChevronUp size={16} className="text-gray-400" />
                      ) : (
                        <ChevronDown size={16} className="text-gray-400" />
                      )}
                    </div>
                  </div>
                  {activeFilters.postedDate && (
                    <div className="px-5 pb-4">
                      <ul className="space-y-2 ml-7">
                        <li className="flex items-center gap-2">
                          <input
                            type="radio"
                            id="past-day"
                            name="posted-date"
                            className="accent-blue-500 w-4 h-4"
                          />
                          <label htmlFor="past-day" className="text-sm text-gray-700">
                            Past day
                          </label>
                        </li>
                        <li className="flex items-center gap-2">
                          <input
                            type="radio"
                            id="past-week"
                            name="posted-date"
                            className="accent-blue-500 w-4 h-4"
                            checked
                          />
                          <label htmlFor="past-week" className="text-sm text-gray-700">
                            Past week
                          </label>
                        </li>
                        <li className="flex items-center gap-2">
                          <input
                            type="radio"
                            id="past-month"
                            name="posted-date"
                            className="accent-blue-500 w-4 h-4"
                          />
                          <label htmlFor="past-month" className="text-sm text-gray-700">
                            Past month
                          </label>
                        </li>
                        <li className="flex items-center gap-2">
                          <input
                            type="radio"
                            id="past-year"
                            name="posted-date"
                            className="accent-blue-500 w-4 h-4"
                          />
                          <label htmlFor="past-year" className="text-sm text-gray-700">
                            Past year
                          </label>
                        </li>
                        <li className="flex items-center gap-2">
                          <input
                            type="radio"
                            id="custom-date-posted"
                            name="posted-date"
                            className="accent-blue-500 w-4 h-4"
                          />
                          <label
                            htmlFor="custom-date-posted"
                            className="text-sm text-gray-700"
                          >
                            Custom date
                          </label>
                        </li>
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Jurisdiction Filter */}
              {filtersOpen && (
                <div className="border-b border-gray-100">
                  <div
                    onClick={() => toggleFilter("jurisdiction")}
                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Building size={18} className="text-gray-500" />
                      <h2 className="font-medium text-gray-800">Jurisdiction(s)</h2>
                    </div>
                    <div>
                      {activeFilters.jurisdiction ? (
                        <ChevronUp size={16} className="text-gray-400" />
                      ) : (
                        <ChevronDown size={16} className="text-gray-400" />
                      )}
                    </div>
                  </div>
                  {activeFilters.jurisdiction && (
                    <div className="px-5 pb-4">
                      <div className="relative ml-7">
                        <input
                          type="text"
                          placeholder="Ex: New York"
                          className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 bg-gray-50"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* NIGP Code(s) Filter */}
              {filtersOpen && (
                <div className="border-b border-gray-100">
                  <div
                    onClick={() => toggleFilter("nigpCode")}
                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Tag size={18} className="text-gray-500" />
                      <h2 className="font-medium text-gray-800">NIGP Code(s)</h2>
                    </div>
                    <div>
                      {activeFilters.nigpCode ? (
                        <ChevronUp size={16} className="text-gray-400" />
                      ) : (
                        <ChevronDown size={16} className="text-gray-400" />
                      )}
                    </div>
                  </div>
                  {activeFilters.nigpCode && (
                    <div className="px-5 pb-4">
                      <div className="relative ml-7">
                        <input
                          type="text"
                          placeholder="Ex: 78500"
                          className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 bg-gray-50"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* UNSPSC Code(s) Filter */}
              {filtersOpen && (
                <div className="border-b border-gray-100">
                  <div
                    onClick={() => toggleFilter("unspscCode")}
                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Layers size={18} className="text-gray-500" />
                      <h2 className="font-medium text-gray-800">UNSPSC Code(s)</h2>
                    </div>
                    <div>
                      {activeFilters.unspscCode ? (
                        <ChevronUp size={16} className="text-gray-400" />
                      ) : (
                        <ChevronDown size={16} className="text-gray-400" />
                      )}
                    </div>
                  </div>
                  {activeFilters.unspscCode && (
                    <div className="px-5 pb-4">
                      <div className="relative ml-7">
                        <input
                          type="text"
                          placeholder="Ex: 10101501"
                          className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 bg-gray-50"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {filtersOpen && (
                <div className="p-4">
                  <button className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
                    <ListFilter size={16} />
                    <span>Apply Filters</span>
                  </button>
                </div>
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
                  <div className="p-6 mx-auto my-4 bg-white border border-gray-200 rounded-xl shadow-sm max-w-4xl">
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
                                                  Due: {opportunity?.dueDate || "TBD"}
                                                </span>
                                              </div>

                                              <button
                                                onClick={() => toggleDetailedReason(index)}
                                                className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1 hover:underline"
                                              >
                                                Why is this relevant?
                                                {rec.showDetailedReason ? (
                                                  <ChevronUp size={16} />
                                                ) : (
                                                  <ChevronDown size={16} />
                                                )}
                                              </button>

                                              {/* Improved detailed reason display */}
                                              {rec.showDetailedReason && (
                                                <div className="mt-3 bg-blue-50 p-4 rounded-lg border border-blue-100">
                                                  <div className="flex items-start">
                                                    <div className="bg-white p-1.5 rounded-full mr-3 mt-0.5 border border-blue-200 shadow-sm">
                                                      <Info size={14} className="text-blue-600" />
                                                    </div>
                                                    <div className="flex-1">
                                                      <h4 className="font-medium text-blue-700 text-sm mb-1">Match Analysis</h4>
                                                      <p className="text-sm leading-relaxed text-gray-700">
                                                        {rec.description || "No detailed explanation available."}
                                                      </p>
                                                    </div>
                                                  </div>
                                                </div>
                                              )}
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
                      <div className="p-6 bg-white rounded-xl border border-gray-200 shadow-md mb-6 max-w-4xl mx-auto">
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
                      <div className="mb-6 bg-white rounded-xl border border-gray-200 shadow-md max-w-4xl mx-auto overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                              <Sparkles className="h-5 w-5 text-blue-600" />
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
                              <div className="flex items-center flex-wrap gap-2 text-xs">
                                <div className="px-2 py-1 bg-blue-50 text-blue-600 rounded-full flex items-center">
                                  <span className="inline-block w-1.5 h-1.5 bg-blue-500 rounded-full mr-1.5"></span>
                                  DEPT OF DEFENSE
                                </div>
                                <div className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full flex items-center">
                                  <Clock className="h-3 w-3 mr-1" />
                                  Released: Mar 5, 2025
                                </div>
                                <div className="px-2 py-1 bg-amber-100 text-amber-600 rounded-full flex items-center">
                                  <Clock className="h-3 w-3 mr-1" />
                                  Due: Mar 28, 2025
                                </div>
                              </div>
                            </div>
                            <div className="border-t border-gray-100 px-5 py-3 bg-gray-50 flex justify-between items-center">
                              <div className="text-xs text-gray-500">
                                Est. Value: <span className="font-medium">$750K-$1.5M</span>
                              </div>
                              <button className="px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 hover:text-blue-600 transition-colors flex items-center gap-1">
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
                              <div className="flex items-center flex-wrap gap-2 text-xs">
                                <div className="px-2 py-1 bg-blue-50 text-blue-600 rounded-full flex items-center">
                                  <span className="inline-block w-1.5 h-1.5 bg-blue-500 rounded-full mr-1.5"></span>
                                  DOD
                                </div>
                                <div className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full flex items-center">
                                  <Clock className="h-3 w-3 mr-1" />
                                  Released: Mar 5, 2025
                                </div>
                                <div className="px-2 py-1 bg-green-100 text-green-600 rounded-full flex items-center">
                                  <Clock className="h-3 w-3 mr-1" />
                                  Due: Apr 23, 2025
                                </div>
                              </div>
                            </div>
                            <div className="border-t border-gray-100 px-5 py-3 bg-gray-50 flex justify-between items-center">
                              <div className="text-xs text-gray-500">
                                Est. Value: <span className="font-medium">$100K-$250K</span>
                              </div>
                              <button className="px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 hover:text-blue-600 transition-colors flex items-center gap-1">
                                <Plus size={12} />
                                Add to Pursuits
                              </button>
                            </div>
                          </div>

                          {/* Additional cards would go here */}
                        </div>
                      </div>
                    )}

                    {/* Dynamic Opportunity Cards - Only shown after a search */}
                    {hasSearched && !isSearching && opportunities.length > 0 ? (
                      <div className="space-y-5 max-w-4xl mx-auto">
                        {opportunities.map((opportunity, index) => (
                          <div
                            key={opportunity.id}
                            className="p-5 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all hover:border-blue-200"
                            onMouseEnter={() => setCurrentHoveredCard(opportunity.id)}
                            onMouseLeave={() => setCurrentHoveredCard(null)}
                          >
                            <div className="flex justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-start gap-3 mb-3">
                                  <div className="p-2 rounded-lg bg-blue-50 mt-1">
                                    {opportunity.title.toLowerCase().includes("cyber") || 
                                     opportunity.title.toLowerCase().includes("security") ? (
                                      <Shield className="text-blue-500" size={18} />
                                    ) : opportunity.title.toLowerCase().includes("software") ? (
                                      <Code className="text-amber-500" size={18} />
                                    ) : (
                                      <BarChart2 className="text-blue-500" size={18} />
                                    )}
                                  </div>
                                  <div>
                                    <h2 className="text-lg font-semibold text-gray-800 hover:text-blue-600 transition-colors">
                                      {opportunity.title}
                                    </h2>
                                    <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                                      <Building size={14} />
                                      <span>{opportunity.agency}</span>
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                                  <div className="flex flex-col p-3 bg-gray-50 rounded-lg">
                                    <span className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                                      <Calendar size={12} />
                                      Due Date
                                    </span>
                                    <span className="text-sm font-medium text-gray-700">
                                      {opportunity.dueDate || "TBD"}
                                    </span>
                                  </div>
                                  <div className="flex flex-col p-3 bg-gray-50 rounded-lg">
                                    <span className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                                      <DollarSign size={12} />
                                      Estimated Value
                                    </span>
                                    <span className="text-sm font-medium text-gray-700">
                                      {formatCurrency(opportunity.value)}
                                    </span>
                                  </div>
                                  <div className="flex flex-col p-3 bg-gray-50 rounded-lg">
                                    <span className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                                      <Tag size={12} />
                                      NAICS Code
                                    </span>
                                    <span className="text-sm font-medium text-gray-700">
                                      {opportunity.naicsCode || "N/A"}
                                    </span>
                                  </div>
                                </div>

                                {/* Description with Read More */}
                                <div className="mb-4">
                                  <p className="text-sm text-gray-600">
                                    {opportunity.description}
                                    <button className="text-blue-600 font-medium ml-1 hover:underline text-xs">
                                      Read more
                                    </button>
                                  </p>
                                </div>

                                {/* Tags */}
                                <div className="flex items-center gap-2 flex-wrap mb-4">
                                  <div className="px-2.5 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-medium">
                                    {opportunity.platform || "sam.gov"}
                                  </div>
                                  <div className="px-2.5 py-1 bg-green-50 text-green-600 rounded-full text-xs font-medium">
                                    {opportunity.status}
                                  </div>
                                  <div className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                                    {opportunity.type || "RFP"}
                                  </div>
                                  <div className="px-2.5 py-1 bg-purple-50 text-purple-600 rounded-full text-xs font-medium">
                                    {opportunity.jurisdiction}
                                  </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
                                  <button 
                                    onClick={() => handleAddToPursuit(opportunity)}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center gap-2"
                                  >
                                    <Plus size={16} />
                                    <span>Add to Pursuits</span>
                                  </button>
                                  <button className="px-4 py-2 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 border border-green-200">
                                    <MessageCircle size={16} />
                                    <span>Ask AI</span>
                                  </button>
                                  <button
                                    onClick={() => navigate(`/opportunities/${opportunity.id}`)}
                                    className="px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 border border-gray-200"
                                  >
                                    <ExternalLink size={16} className="text-gray-500" />
                                    <span>View Details</span>
                                  </button>
                                  <button className="ml-auto p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors">
                                    <Share size={18} />
                                  </button>
                                </div>
                              </div>
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

