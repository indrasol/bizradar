import React, { useState, useEffect, useRef } from "react";
import { 
  Search, Settings, ChevronDown, ChevronUp, X, Filter, Bell, Download, 
  MessageCircle, Plus, Shield, BarChart2, ChevronRight, ChevronLeft, Share,
  Zap, Lock, Database, Code, Maximize, Minimize, Info
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import SideBar from "../components/layout/SideBar";

export default function Opportunities() {
  const navigate = useNavigate(); // Initialize the navigate function
  
  const [activeFilters, setActiveFilters] = useState({
    dueDate: true,
    postedDate: true,
    jurisdiction: true,
    nigpCode: true,
    unspscCode: true
  });
  
  const [expandedCard, setExpandedCard] = useState("state-executive");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [aiRecommendations, setAiRecommendations] = useState([]);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [expandRecommendations, setExpandRecommendations] = useState(false);
  const [aiComponentCollapsed, setAiComponentCollapsed] = useState(false); // New state for collapsing AI component
  const [scrollToTopVisible, setScrollToTopVisible] = useState(false); // State for scroll to top button
  
  // Use a ref to track if recommendations request is in progress to prevent duplicate requests
  const requestInProgressRef = useRef(false);
  const lastSearchIdRef = useRef("");
  
  // Suggested search queries
  const suggestedQueries = [
    { 
      id: "cybersecurity",
      title: "Cybersecurity Contracts",
      icon: <Shield size={20} className="text-blue-500" />,
      description: "Find government contracts related to cybersecurity services, threat monitoring, and security operations."
    },
    { 
      id: "ai-ml",
      title: "AI & Machine Learning",
      icon: <Zap size={20} className="text-purple-500" />,
      description: "Explore opportunities involving artificial intelligence, machine learning, and data science."
    },
    { 
      id: "data-management",
      title: "Data Management",
      icon: <Database size={20} className="text-green-500" />,
      description: "Discover contracts focused on data management, analytics, and information systems."
    },
    { 
      id: "software-dev",
      title: "Software Development",
      icon: <Code size={20} className="text-amber-500" />,
      description: "Find contracts for custom software development, maintenance, and IT services."
    }
  ];
  
  // Initial dummy data - will be replaced with search results
  const initialOpportunities = [];
  
  // State to hold the opportunities data
  const [opportunities, setOpportunities] = useState(initialOpportunities);
  
  // State for pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalResults, setTotalResults] = useState(initialOpportunities.length);
  const resultsPerPage = 5;
  
  // Calculate displayed opportunities based on pagination
  const indexOfLastResult = currentPage * resultsPerPage;
  const indexOfFirstResult = indexOfLastResult - resultsPerPage;
  const currentOpportunities = opportunities.slice(indexOfFirstResult, indexOfLastResult);
  
  // Add debugging useEffect to monitor state changes
  useEffect(() => {
    console.log("AI Recommendations state changed:", {
      count: aiRecommendations.length,
      isLoading: isLoadingRecommendations,
      hasData: aiRecommendations.length > 0 && !isLoadingRecommendations
    });
  }, [aiRecommendations, isLoadingRecommendations]);
  
  // Fetch user profile from settings
  const getUserProfile = () => {
    try {
      const profileData = sessionStorage.getItem('userProfile');
      if (profileData) {
        return JSON.parse(profileData);
      }
      return {
        companyUrl: "https://bizradar.com",
        companyDescription: "Bizradar specializes in AI-powered contract analytics and opportunity matching for government procurement."
      };
    } catch (error) {
      console.error("Error fetching user profile:", error);
      return {
        companyUrl: "https://bizradar.com", 
        companyDescription: "Default company description"
      };
    }
  };
  
  // Fetch AI recommendations
  const fetchAiRecommendations = async () => {
    if (requestInProgressRef.current || currentOpportunities.length === 0) return;
    
    const searchId = `${searchQuery}-${currentPage}-${currentOpportunities.length}`;
    
    if (searchId === lastSearchIdRef.current) {
      console.log("Skipping duplicate search request for:", searchId);
      return;
    }
    
    requestInProgressRef.current = true;
    lastSearchIdRef.current = searchId;
    setIsLoadingRecommendations(true);
    
    console.log("Starting to fetch AI recommendations for", currentOpportunities.length, "opportunities");
    
    try {
      const userProfile = getUserProfile();
      console.log("Using company profile for recommendations:", userProfile);
      
      const response = await fetch("http://localhost:5000/ai-recommendations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          companyUrl: userProfile.companyUrl,
          companyDescription: userProfile.companyDescription,
          opportunities: currentOpportunities,
          responseFormat: "json",
          includeMatchReason: true
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("AI Recommendations raw response:", data);
      
      if (data.recommendations && Array.isArray(data.recommendations)) {
        console.log(`Received ${data.recommendations.length} AI recommendations`);
        
        const enhancedRecommendations = data.recommendations.map(rec => {
          const oppIndex = typeof rec.opportunityIndex === 'number' 
            ? Math.min(rec.opportunityIndex, currentOpportunities.length - 1) 
            : 0;
          const opportunity = currentOpportunities[oppIndex];
          
          return {
            ...rec,
            opportunity,
            showDetailedReason: false // Add this to track the expanded state
          };
        });
        
        setAiRecommendations(enhancedRecommendations);
      } else {
        console.warn("Received invalid recommendations format:", data);
        setAiRecommendations([]);
      }
    } catch (error) {
      console.error("Error fetching AI recommendations:", error);
      setAiRecommendations([{
        id: "fallback-rec-1",
        title: "AI Recommendation Service Temporarily Unavailable",
        description: "We couldn't retrieve personalized recommendations at this time. Please try again later.",
        matchScore: 75,
        opportunityIndex: 0,
        matchReason: "This is a fallback recommendation while the service is temporarily unavailable."
      }]);
    } finally {
      setTimeout(() => {
        setIsLoadingRecommendations(false);
        requestInProgressRef.current = false;
      }, 500);
    }
  };
  
  // useEffect to prevent infinite loop of requests
  useEffect(() => {
    if (hasSearched && currentOpportunities.length > 0 && !requestInProgressRef.current) {
      const searchId = `${searchQuery}-${currentPage}-${currentOpportunities.length}`;
      if (searchId !== lastSearchIdRef.current) {
        console.log("Triggering fetchAiRecommendations from useEffect for search:", searchId);
        const timer = setTimeout(() => {
          fetchAiRecommendations();
        }, 1000); 
        
        return () => {
          clearTimeout(timer);
        };
      }
    }
  }, [currentOpportunities, hasSearched, currentPage, searchQuery]);

  const toggleFilter = (filter) => {
    setActiveFilters({
      ...activeFilters,
      [filter]: !activeFilters[filter]
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
      const response = await fetch("http://localhost:5000/search-opportunities", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: query,
          contract_type: null,
          platform: null
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Search results:", data.results);
      
      if (data.results && Array.isArray(data.results)) {
        setHasSearched(true);
        
        const formattedResults = data.results.map((job, index) => ({
          id: `job-${index}-${Date.now()}`,
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
          description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit."
        }));
        
        setOpportunities(formattedResults);
        setTotalResults(formattedResults.length);
        setCurrentPage(1);
      }
    } catch (error) {
      console.error("Error searching opportunities:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
    requestInProgressRef.current = false;
    lastSearchIdRef.current = "";
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

    sessionStorage.setItem('currentContract', JSON.stringify(contract));
    navigate(`/contracts/rfp/${contractId}`);
  };

  const forceRender = () => {
    if (aiRecommendations.length > 0 && isLoadingRecommendations) {
      setIsLoadingRecommendations(false);
    }
  };

  // Scroll to top functionality
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const toggleDetailedReason = (index) => {
    const updatedRecommendations = aiRecommendations.map((rec, i) =>
      i === index ? { ...rec, showDetailedReason: !rec.showDetailedReason } : rec
    );
    setAiRecommendations(updatedRecommendations);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50 text-gray-800">
      {/* Trial Notification */}
      <div className="w-full bg-blue-600 text-white text-center py-2 px-4">
        <div className="flex items-center justify-center">
          <span>Subscription Plans.</span>
          <a href="#" className="ml-2 font-medium underline decoration-2 underline-offset-2">
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
                <span className="font-medium">State and Local Contract Opportunities</span>
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
                  {filtersOpen ? <ChevronLeft size={14} className="text-blue-600" /> : <Filter size={14} className="text-blue-600" />}
                </button>
              </div>

              {/* Filter content - omitted for brevity */}
              {filtersOpen && (
                <>
                  {/* Due Date Filter */}
                  <div className="border-b border-gray-200">
                    {/* Filter content */}
                  </div>
                  
                  {/* Other filters */}
                </>
              )}
              
              {/* Non-expanded state showing only filter icon */}
              {!filtersOpen && (
                <div className="flex flex-col items-center py-4">
                  <Filter size={18} className="text-gray-400 mb-2" />
                </div>
              )}
            </div>

            {/* Results Column */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Search Bar */}
              <div className="p-4 border-b border-gray-200 bg-white">
                <form onSubmit={handleSearch} className="flex items-center gap-2">
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
                    onClick={() => navigate('/settings')}
                    className="p-2.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors shadow-sm"
                  >
                    <Settings size={16} />
                  </button>
                  <button 
                    type="button" 
                    className="p-2.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors shadow-sm"
                  >
                    <Filter size={16} />
                  </button>
                </form>
              </div>

              {/* Results Count & Actions */}
              <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between bg-gray-50">
                <div className="text-sm font-medium py-1 px-2.5 bg-blue-100 text-blue-700 rounded-full flex items-center">
                  {hasSearched ? (
                    <span>{totalResults} {totalResults === 1 ? 'result' : 'results'}</span>
                  ) : (
                    <span>Search for opportunities</span>
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
                      <div className={`p-4 mx-4 mt-4 bg-blue-50/80 backdrop-blur-lg border border-blue-200 rounded-lg 
                                      shadow-[0_8px_20px_rgba(59,130,246,0.3)] transition-all duration-300
                                      ${expandRecommendations ? 'fixed inset-8 z-50 overflow-auto' : ''}`}>
                        <div className="flex items-center justify-between mb-3 pb-2 border-b border-blue-200/40">
                          <div className="flex items-center gap-2">
                            <span className="text-blue-500 bg-blue-100 p-1.5 rounded-md shadow-sm">⚡</span>
                            <h2 className="font-semibold text-lg text-blue-700">BizradarAI Assistant</h2>
                            <span className="text-xs text-blue-600 bg-blue-100/70 px-2 py-0.5 rounded-full ml-2">
                              {aiRecommendations.length > 0 
                                ? `${aiRecommendations.length} recommendations found` 
                                : ""}
                            </span>
                            {aiRecommendations.length > 0 && isLoadingRecommendations && (
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
                              onClick={() => setAiComponentCollapsed(prev => !prev)}
                              className="text-blue-500 hover:text-blue-700 p-1"
                            >
                              {aiComponentCollapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                            </button>
                            <button 
                              onClick={toggleRecommendationsExpand}
                              className="text-blue-500 hover:text-blue-700 bg-blue-50 p-1 rounded-md"
                            >
                              {expandRecommendations ? <Minimize size={18} /> : <Maximize size={18} />}
                            </button>
                          </div>
                        </div>
                        
                        {/* Container for content with white background for contrast */}
                        {!aiComponentCollapsed && (
                          <div className="bg-white rounded-md shadow-sm overflow-hidden transition-all duration-300">
                            {(isLoadingRecommendations && aiRecommendations.length === 0) ? (
                              <div className="flex justify-center py-6 bg-blue-50/50">
                                <p className="text-blue-700 font-medium">Analyzing opportunities...</p>
                              </div>
                            ) : (
                              <div className={`overflow-y-auto ${expandRecommendations ? 'h-full' : 'max-h-96'}`}>
                                {aiRecommendations.length === 0 ? (
                                  <div className="py-6 text-center bg-blue-50/50">
                                    <p className="text-blue-700 font-medium">Here is what I think</p>
                                  </div>
                                ) : (
                                  <table className="w-full table-auto">
                                    <tbody>
                                      {aiRecommendations.map((rec, index) => {
                                        const opportunity = rec.opportunity || currentOpportunities[0];
                                        
                                        return (
                                          <tr key={rec.id || `rec-${index}`} className={index % 2 === 0 ? 'bg-gray-50 border-b border-gray-100' : 'bg-white border-b border-gray-100'}>
                                            <td className="py-3 px-4">
                                              <div className="font-medium text-sm text-gray-800">
                                                {opportunity ? opportunity.title : "Unknown Opportunity"}
                                              </div>
                                              <div className="text-xs text-gray-600 mt-1">
                                                {rec.title || "Match found based on your profile"}
                                              </div>
                                              
                                              {/* Enhanced Check Why button */}
                                              <button 
                                                onClick={() => toggleDetailedReason(index)}
                                                className="mt-2 text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-md text-sm flex items-center font-medium border border-blue-200 transition-colors"
                                              >
                                                Check Why {rec.showDetailedReason ? <ChevronDown size={16} className="ml-1" /> : <ChevronRight size={16} className="ml-1" />}
                                              </button>
                                              
                                              {/* Improved detailed reason display */}
                                              {rec.showDetailedReason && (
                                                <div className="mt-3 bg-blue-50 p-4 rounded-md border border-blue-200 shadow-sm">
                                                  <div className="flex items-start">
                                                    <div className="bg-blue-100 p-1 rounded-full mr-3 mt-1">
                                                      <Info size={16} className="text-blue-700" />
                                                    </div>
                                                    <p className="text-sm leading-relaxed text-gray-700">
                                                      {rec.description || "No detailed explanation available."}
                                                    </p>
                                                  </div>
                                                </div>
                                              )}
                                            </td>
                                            <td className="py-3 px-4 text-right">
                                              <div className="flex flex-col items-end">
                                                {rec.matchScore ? (
                                                  <span className={`text-xs font-medium px-2 py-0.5 rounded shadow-sm ${
                                                    rec.matchScore > 70 ? 'bg-green-100 text-green-700' : 
                                                    rec.matchScore > 50 ? 'bg-blue-100 text-blue-700' : 
                                                    'bg-gray-100 text-gray-700'
                                                  }`}>
                                                    {rec.matchScore}% match
                                                  </span>
                                                ) : (
                                                  <span className="text-xs font-medium text-blue-600">View</span>
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
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">Popular Searches</h2>
                        <p className="text-gray-600 mb-6">
                          Click on any of these suggestions or use the search bar above to find contract opportunities:
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {suggestedQueries.map((query) => (
                            <div 
                              key={query.id}
                              onClick={() => handleSuggestedQueryClick(query.id)}
                              className="bg-white rounded-lg border border-gray-200 p-4 cursor-pointer hover:border-blue-300 hover:shadow-xl transition-all"
                            >
                              <div className="flex items-center mb-2">
                                {query.icon}
                                <h3 className="font-medium text-gray-800 ml-2">{query.title}</h3>
                              </div>
                              <p className="text-gray-600 text-sm">{query.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Dynamic Opportunity Cards - Only shown after a search */}
                    {hasSearched && currentOpportunities.map((opportunity, index) => (
                      <div key={opportunity.id} className="mx-4 my-4 p-4 bg-white border border-gray-200 rounded-lg shadow-lg hover:shadow-xl transition-all">
                        <div className="flex justify-between">
                          <div className="flex items-start gap-2">
                            <div className="mt-1">
                              {opportunity.title.toLowerCase().includes('cyber') || opportunity.title.toLowerCase().includes('security') ? (
                                <Shield className="text-blue-500" size={18} />
                              ) : opportunity.title.toLowerCase().includes('software') ? (
                                <Code className="text-amber-500" size={18} />
                              ) : (
                                <BarChart2 className="text-blue-500" size={18} />
                              )}
                            </div>
                            <div>
                              <h2 className="text-lg font-semibold text-gray-800">{opportunity.title}</h2>
                              <p className="text-sm text-gray-500">{opportunity.agency}</p>
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
                            onClick={() => handleBeginResponse(opportunity.id, opportunity)}
                            className="bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-md text-xs flex items-center gap-1 shadow-sm hover:bg-gray-50 hover:border-blue-200 hover:text-blue-600 transition-colors"
                          >
                            <MessageCircle size={14} className="text-blue-500" />
                            <span>Begin Response</span>
                          </button>
                          <button className="bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-md text-xs flex items-center gap-1 shadow-sm hover:bg-gray-50">
                            <Search size={14} className="text-blue-500" />
                            <span>Find Similar</span>
                          </button>
                        </div>
                      </div>
                    ))}
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
    </div>
  );
}
