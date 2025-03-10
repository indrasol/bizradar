import React, { useState } from "react";
import { 
  Search, Settings, ChevronDown, X, Filter, Bell, Download, 
  MessageCircle, Plus, Shield, BarChart2, ChevronRight, ChevronLeft, Share
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import SideBar from "../components/layout/SideBar";

export default function Dashboard() {
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
  
  // Initial dummy data - will be replaced with search results
  const initialOpportunities = [
    {
      id: "security-guard-bdaach",
      title: "Security Guard Service for BDAACH",
      agency: "DEPT OF DEFENSE.DEPT OF THE ARMY.AMC.ACC.ACC-OO.411TH CSB.0411 AQ HQ CONTRACT AUG",
      jurisdiction: "Federal",
      type: "RFP: Double Envelope Proposal",
      posted: "December 17th, 2024",
      dueDate: "January 23rd, 2025",
      value: 2500000,
      status: "Active",
      naicsCode: "561612",
      platform: "sam.gov",
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam pharetra, quam vel efficitur ultrices, quam nisl lacinia metus, eget tincidunt enim nunc vel tortor. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; Sed at magna vel nunc commodo..."
    },
    {
      id: "security-guard-services",
      title: "Security Guard Services",
      agency: "INTERNATIONAL BOUNDARY AND WATER COMMISSION: US-MEXICO.INTERNATIONAL BOUNDARY AND WATER COMMISSION: US-MEXICO.INTERNAT BOUNDARY AND WATER COMM",
      jurisdiction: "Federal",
      type: "RFP: Double Envelope Proposal",
      posted: "January 5th, 2025",
      dueDate: "February 10th, 2025",
      value: 1800000,
      status: "Active",
      naicsCode: "561612",
      platform: "sam.gov",
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nam ut dui in nunc efficitur pretium. Duis consequat leo at leo dictum, sed tincidunt augue vulputate. Fusce pellentesque neque nec turpis vulputate, sit amet tempor eros ultricies. Nulla facilisi. Phasellus gravida..."
    },
    {
      id: "protective-security-officer",
      title: "Protective Security Officer (PSO) services at the IRS facility in Andover, MA",
      agency: "HOMELAND SECURITY, DEPARTMENT OF.OFFICE OF PROCUREMENT OPERATIONS.FPS EAST CCG DIV 1 ACQ DIV",
      jurisdiction: "Federal",
      type: "RFP",
      posted: "January 8th, 2025",
      dueDate: "February 15th, 2025",
      value: 3200000,
      status: "Active",
      naicsCode: "561612",
      platform: "sam.gov",
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Cras ac dui erat. Sed cursus bibendum sodales. Sed vel arcu vitae massa convallis luctus. Integer eu tristique est. Aenean volutpat nunc ut lacus interdum, vel sodales magna porta. Phasellus euismod..."
    },
    {
      id: "cyber-security-risk-management",
      title: "Cyber Security Risk Management",
      agency: "SOCIAL SECURITY ADMINISTRATION.SOCIAL SECURITY ADMINISTRATION.SSA OFC OF ACQUISITION GRANTS",
      jurisdiction: "Federal",
      type: "RFI",
      posted: "January 12th, 2025",
      dueDate: "February 28th, 2025",
      value: 4500000,
      status: "Active",
      naicsCode: "541512",
      platform: "sam.gov",
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi facilisis ex eget risus facilisis, id efficitur magna molestie. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; Fusce iaculis quam vel nisi faucibus dapibus. Maecenas..."
    },
    {
      id: "offensive-security-services",
      title: "Offensive Security Services",
      agency: "DEPT OF DEFENSE.DEPT OF THE NAVY.USMC.MARCOR SYSCOM.SUPPLY OFFICER",
      jurisdiction: "Federal",
      type: "RFP",
      posted: "January 15th, 2025",
      dueDate: "March 1st, 2025",
      value: 5800000,
      status: "Active",
      naicsCode: "541519",
      platform: "sam.gov",
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent euismod diam ac tortor pulvinar, quis dapibus mauris sollicitudin. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; Nulla feugiat, urna sed eleifend ultricies..."
    },
    {
      id: "enterprise-security-services",
      title: "Enterprise Security Services (ESS)",
      agency: "DEPT OF DEFENSE.DEPT OF THE AIR FORCE.AIR FORCE MATERIEL COMMAND.AIR FORCE LIFE CYCLE MANAGEMENT CENTER.DIGITAL.FA8102 AFLCMC HBK",
      jurisdiction: "Federal",
      type: "RFP",
      posted: "January 18th, 2025",
      dueDate: "March 5th, 2025",
      value: 7500000,
      status: "Active", 
      naicsCode: "541513",
      platform: "sam.gov",
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec feugiat mi vel enim convallis, vel tincidunt nulla ultricies. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; Pellentesque habitant morbi tristique senectus et netus..."
    },
    {
      id: "defense-personal-property",
      title: "DEFENSE PERSONAL PROPERTY SYSTEM (DPS) TECHNICAL SUPPORT CENTER (DTSC) RFI",
      agency: "DEPT OF DEFENSE.US TRANSPORTATION COMMAND (USTRANSCOM).USTRANSCOM-AQ",
      jurisdiction: "Federal",
      type: "RFI",
      posted: "January 20th, 2025",
      dueDate: "March 10th, 2025",
      value: 3800000,
      status: "Active",
      naicsCode: "541512",
      platform: "sam.gov",
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis aliquet magna nec turpis tincidunt, nec aliquet nulla fringilla. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; Sed vel justo eros. Nullam sed metus vel dui..."
    },
    {
      id: "uscg-ia-rmf",
      title: "USCG Information Assurance (IA) Risk Management Framework (RMF) Support Services",
      agency: "HOMELAND SECURITY, DEPARTMENT OF.US COAST GUARD.C5I DIVISION 3 PORTSMOUTH",
      jurisdiction: "Federal",
      type: "RFP",
      posted: "January 22nd, 2025",
      dueDate: "March 15th, 2025",
      value: 4200000,
      status: "Active",
      naicsCode: "541512",
      platform: "sam.gov",
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nam sollicitudin, magna eget commodo vehicula, est enim finibus orci, a ultrices nibh ante at justo. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; Nullam consequat..."
    },
    {
      id: "hpc-modernization",
      title: "High Performance Computing Modernization Program Cybersecurity Service Provider Support Services",
      agency: "DEPT OF DEFENSE.DEPT OF THE ARMY.USACE.OTHER_DIVISION.W2R2 USA ENGR R AND D CTR",
      jurisdiction: "Federal",
      type: "RFP",
      posted: "January 25th, 2025",
      dueDate: "March 20th, 2025",
      value: 9500000,
      status: "Active",
      naicsCode: "541512",
      platform: "sam.gov",
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean commodo dui quis lacus tristique, vel volutpat arcu venenatis. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; Nullam maximus commodo sapien vel pharetra. Aenean..." 
    }
  ];
  
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

  // Function to clear search query
  const clearSearch = () => {
    setSearchQuery("");
    setOpportunities(initialOpportunities);
    setTotalResults(initialOpportunities.length);
    setCurrentPage(1);
  };

  // Function to handle search input change
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // Function to handle search form submission
  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    
    try {
      const response = await fetch("http://localhost:5000/search-opportunities", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: searchQuery,
          contract_type: null, // You can add filter values here if needed
          platform: null
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Search results:", data.results);
      
      if (data.results && Array.isArray(data.results)) {
        // Map the API results to our opportunity format
        const formattedResults = data.results.map((job, index) => ({
          id: `job-${index}-${Date.now()}`,
          title: job.title || "Untitled Opportunity",
          agency: job.agency || "Unknown Agency",
          jurisdiction: "Federal", // Default as this isn't in API response
          type: "RFP", // Default as this isn't in API response
          posted: job.posted || "Recent",
          dueDate: job.dueDate || "TBD",
          value: Math.floor(Math.random() * 5000000) + 1000000, // Random value as it's not in API
          status: "Active",
          naicsCode: job.naicsCode || "000000",
          platform: job.platform || "sam.gov",
          description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; Sed at magna vel nunc commodo..."
        }));
        
        setOpportunities(formattedResults);
        setTotalResults(formattedResults.length);
        setCurrentPage(1); // Reset to first page on new search
      }
    } catch (error) {
      console.error("Error searching opportunities:", error);
    } finally {
      setIsSearching(false);
    }
  };

  // Function to change pagination page
  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Function to handle navigation to RFP writer with contract data
  const handleBeginResponse = (contractId, contractData) => {
    // Create a contract object with the necessary details
    const contract = {
      id: contractId,
      title: contractData.title || "Default Title",
      agency: contractData.agency || "Default Agency",
      dueDate: contractData.dueDate || "2025-01-01",
      value: contractData.value || 0,
      status: contractData.status || "Open",
      naicsCode: contractData.naicsCode || "000000", 
      description: contractData.description || "",
      // Add any other needed fields
    };

    // Store contract data in sessionStorage for access in RFP Writer
    sessionStorage.setItem('currentContract', JSON.stringify(contract));
    
    // Navigate to the RFP Writer page
    navigate(`/contracts/rfp/${contractId}`);
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
        {/* Sidebar - Now imported as a component */}
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
                    onClick={() => {
                      console.log("Clicked settings button")
                      navigate('/settings')
                    }}
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
                  <span>{totalResults} {totalResults === 1 ? 'result' : 'results'}</span>
                </div>
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
              </div>

              {/* Results List */}
              <div className="flex-1 overflow-y-auto">
                {/* Show loading state while searching */}
                {isSearching && (
                  <div className="p-6 mx-4 my-4 bg-white border border-gray-200 rounded-lg shadow-sm flex justify-center">
                    <p>Searching...</p>
                  </div>
                )}

                {!isSearching && (
                  <>
                    {/* AI Recommendations Card */}
                    <div className="p-6 mx-4 my-4 bg-white border border-gray-200 rounded-lg shadow-sm">
                      <div className="flex items-center gap-2 mb-6 pb-3 border-b border-gray-100">
                        <span className="text-blue-500 bg-blue-50 p-1 rounded-md">⚡</span>
                        <h2 className="font-semibold text-lg">AI Recommendations</h2>
                      </div>

                      <div className="space-y-6">
                        {/* Recommendation content - omitted for brevity */}
                      </div>
                    </div>

                    {/* Dynamic Opportunity Cards */}
                    {currentOpportunities.map((opportunity, index) => (
                      <div key={opportunity.id} className="mx-4 my-6 p-6 bg-white border border-gray-200 rounded-xl shadow-sm">
                        <div className="flex justify-between mb-4">
                          <div className="flex items-center gap-2">
                            {index % 2 === 0 ? (
                              <Shield className="text-blue-500" size={20} />
                            ) : (
                              <BarChart2 className="text-blue-500" size={20} />
                            )}
                            <h2 className="text-xl font-semibold text-gray-800">{opportunity.title}</h2>
                          </div>
                          <div className="flex items-center gap-2">
                            <button className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-blue-600 hover:bg-blue-50">
                              <Share size={18} className="text-gray-400" />
                            </button>
                          </div>
                        </div>

                        {/* Tags */}
                        <div className="mt-2 flex items-center gap-2 flex-wrap">
                          <div className="px-2.5 py-1 bg-blue-50 text-blue-600 rounded-md text-xs font-medium">
                            {opportunity.platform || "sam.gov"}
                          </div>
                          <div className="px-2.5 py-1 bg-green-50 text-green-600 rounded-md text-xs font-medium">
                            {opportunity.status}
                          </div>
                          {opportunity.naicsCode && (
                            <div className="px-2.5 py-1 bg-purple-50 text-purple-600 rounded-md text-xs font-medium">
                              NAICS: {opportunity.naicsCode}
                            </div>
                          )}
                        </div>

                        {/* Description with Read More */}
                        <div className="mt-4">
                          <p className="text-gray-600">
                            {opportunity.description} 
                            <button className="text-blue-600 font-medium ml-1 hover:underline">
                              Read more
                            </button>
                          </p>
                        </div>

                        {/* Details Grid - Only show in expanded view for first item */}
                        {index === 0 && (
                          <div className="grid grid-cols-2 gap-6 mt-6 mb-6 bg-gray-50 p-4 rounded-lg">
                            <div>
                              <h3 className="text-xs font-semibold text-gray-500 mb-1 uppercase">BUYER</h3>
                              <p className="text-gray-800">{opportunity.agency}</p>
                            </div>
                            <div>
                              <h3 className="text-xs font-semibold text-gray-500 mb-1 uppercase">JURISDICTION</h3>
                              <p className="text-gray-800">{opportunity.jurisdiction}</p>
                            </div>
                            <div>
                              <h3 className="text-xs font-semibold text-gray-500 mb-1 uppercase">TYPE</h3>
                              <p className="text-gray-800">{opportunity.type}</p>
                            </div>
                            <div>
                              <h3 className="text-xs font-semibold text-gray-500 mb-1 uppercase">POSTED</h3>
                              <p className="text-gray-800">{opportunity.posted}</p>
                            </div>
                            <div>
                              <h3 className="text-xs font-semibold text-gray-500 mb-1 uppercase">DUE</h3>
                              <p className="text-gray-800">{opportunity.dueDate}</p>
                            </div>
                            <div>
                              <h3 className="text-xs font-semibold text-gray-500 mb-1 uppercase">RESPONSE DUE IN</h3>
                              <p className="text-blue-600 font-medium">{opportunity.status}</p>
                            </div>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex items-center gap-3 mt-4">
                          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 shadow-sm">
                            <MessageCircle size={16} />
                            <span>Ask Bizradar AI</span>
                          </button>
                          <button 
                            onClick={() => handleBeginResponse(opportunity.id, opportunity)}
                            className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm flex items-center gap-2 shadow-sm hover:bg-gray-50 hover:border-blue-200 hover:text-blue-600 transition-colors"
                          >
                            <MessageCircle size={16} className="text-blue-500" />
                            <span>Begin Response</span>
                          </button>
                          <button className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm flex items-center gap-2 shadow-sm hover:bg-gray-50">
                            <Search size={16} className="text-blue-500" />
                            <span>Find Similar</span>
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* Pagination */}
                    {totalResults > resultsPerPage && (
                      <div className="mx-4 my-6 flex justify-center">
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => paginate(currentPage - 1)}
                            disabled={currentPage === 1}
                            className={`w-8 h-8 flex items-center justify-center rounded-md ${
                              currentPage === 1 
                                ? 'text-gray-300 cursor-not-allowed' 
                                : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'
                            }`}
                          >
                            <ChevronLeft size={16} />
                          </button>
                          
                          {Array.from({ length: Math.ceil(totalResults / resultsPerPage) }).map((_, index) => (
                            <button
                              key={index}
                              onClick={() => paginate(index + 1)}
                              className={`w-8 h-8 flex items-center justify-center rounded-md ${
                                currentPage === index + 1
                                  ? 'bg-blue-600 text-white'
                                  : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'
                              }`}
                            >
                              {index + 1}
                            </button>
                          ))}
                          
                          <button 
                            onClick={() => paginate(currentPage + 1)}
                            disabled={currentPage === Math.ceil(totalResults / resultsPerPage)}
                            className={`w-8 h-8 flex items-center justify-center rounded-md ${
                              currentPage === Math.ceil(totalResults / resultsPerPage)
                                ? 'text-gray-300 cursor-not-allowed'
                                : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'
                            }`}
                          >
                            <ChevronRight size={16} />
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}