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

  // Sample data for the State Executive Cyber Protection contract
  const stateExecutiveData = {
    id: "state-executive-cyber",
    title: "State Executive Cyber Protection",
    agency: "DoIT - Dept Of Information Technology - Administration",
    jurisdiction: "Maryland",
    type: "RFP: Double Envelope Proposal",
    posted: "December 17th, 2024",
    dueDate: "January 23rd, 2025",
    value: 5000000,
    status: "Past Due",
    naicsCode: "541512",
    description: "The Maryland Department of Information Technology (DoIT) is seeking proposals for State Executive Cyber Protection Services to enhance cybersecurity for key state executives and their families. The procurement aims to provide comprehensive services, including the prevention of misuse of Personally Identifiable Information (PII) and Sensitive Personal Information (SPI), threat monitoring, asset hardening, and cybersecurity training. This initiative underscores the importance of safeguarding government officials against cyber threats, reflecting Maryland's commitment to robust cybersecurity measures. Proposals must be submitted electronically via the eMaryland Marketplace Advantage (eMMA) by January 24, 2025."
  };

  // Sample data for the Caterpillar Software contract
  const caterpillarData = {
    id: "caterpillar-software",
    title: "Caterpillar Software Subscription",
    agency: "Department of Transportation",
    jurisdiction: "Federal",
    type: "Contract Renewal",
    posted: "March 4th, 2025",
    dueDate: "April 15th, 2025",
    value: 250000,
    status: "Active",
    naicsCode: "511210",
    description: "Annual subscription renewal for Caterpillar Fleet Management software suite including GPS tracking, maintenance scheduling, and analytics dashboard."
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
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search size={16} className="text-blue-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Search opportunities..."
                      value=""
                      className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all shadow-sm"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <button className="text-gray-400 hover:text-gray-600">
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                  <button className="p-2.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors shadow-sm">
                    <Settings size={16} />
                  </button>
                  <button className="p-2.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors shadow-sm">
                    <Filter size={16} />
                  </button>
                </div>
              </div>

              {/* Results Count & Actions */}
              <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between bg-gray-50">
                <div className="text-sm font-medium py-1 px-2.5 bg-blue-100 text-blue-700 rounded-full flex items-center">
                  <span>50+ results</span>
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

                {/* Expanded Card: State Executive Cyber Protection */}
                <div className="mx-4 my-6 p-6 bg-white border border-gray-200 rounded-xl shadow-sm">
                  <div className="flex justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Shield className="text-blue-500" size={20} />
                      <h2 className="text-xl font-semibold text-gray-800">{stateExecutiveData.title}</h2>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-blue-600 hover:bg-blue-50">
                        <Share size={18} className="text-gray-400" />
                      </button>
                    </div>
                  </div>

                  <div className="mb-6">
                    <p className="text-gray-700 mb-4 leading-relaxed">
                      {stateExecutiveData.description}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-6 mb-6 bg-gray-50 p-4 rounded-lg">
                    <div>
                      <h3 className="text-xs font-semibold text-gray-500 mb-1 uppercase">BUYER</h3>
                      <p className="text-gray-800">{stateExecutiveData.agency}</p>
                    </div>
                    <div>
                      <h3 className="text-xs font-semibold text-gray-500 mb-1 uppercase">JURISDICTION</h3>
                      <p className="text-gray-800">{stateExecutiveData.jurisdiction}</p>
                    </div>
                    <div>
                      <h3 className="text-xs font-semibold text-gray-500 mb-1 uppercase">TYPE</h3>
                      <p className="text-gray-800">{stateExecutiveData.type}</p>
                    </div>
                    <div>
                      <h3 className="text-xs font-semibold text-gray-500 mb-1 uppercase">POSTED</h3>
                      <p className="text-gray-800">{stateExecutiveData.posted}</p>
                    </div>
                    <div>
                      <h3 className="text-xs font-semibold text-gray-500 mb-1 uppercase">DUE</h3>
                      <p className="text-gray-800">{stateExecutiveData.dueDate}</p>
                    </div>
                    <div>
                      <h3 className="text-xs font-semibold text-gray-500 mb-1 uppercase">RESPONSE DUE IN</h3>
                      <p className="text-blue-600 font-medium">{stateExecutiveData.status}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button className="bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm flex items-center gap-2 shadow-sm">
                      <MessageCircle size={16} />
                      <span>Ask Bizradar AI</span>
                    </button>
                    <button className="bg-white border border-gray-200 text-gray-700 px-4 py-2.5 rounded-lg text-sm flex items-center gap-2 shadow-sm hover:bg-gray-50">
                      <Plus size={16} className="text-blue-500" />
                      <span>Create Pursuit</span>
                    </button>
                    <button 
                      onClick={() => handleBeginResponse(stateExecutiveData.id, stateExecutiveData)}
                      className="bg-white border border-gray-200 text-gray-700 px-4 py-2.5 rounded-lg text-sm flex items-center gap-2 shadow-sm hover:bg-gray-50 hover:border-blue-200 hover:text-blue-600 transition-colors"
                    >
                      <MessageCircle size={16} className="text-blue-500" />
                      <span>Begin Response</span>
                    </button>
                    <button className="bg-white border border-gray-200 text-gray-700 px-4 py-2.5 rounded-lg text-sm flex items-center gap-2 shadow-sm hover:bg-gray-50">
                      <Search size={16} className="text-blue-500" />
                      <span>Find Similar</span>
                    </button>
                  </div>
                </div>

                {/* Additional Result: Caterpillar Software Subscription */}
                <div className="mx-4 mb-6 p-6 bg-white border border-gray-200 rounded-xl shadow-sm">
                  <div className="flex justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <BarChart2 className="text-blue-500" size={20} />
                      <h2 className="text-xl font-semibold text-gray-800">{caterpillarData.title}</h2>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-blue-600 hover:bg-blue-50">
                        <Share size={18} className="text-gray-400" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="mt-2 flex items-center gap-2">
                    <div className="px-2.5 py-1 bg-blue-50 text-blue-600 rounded-md text-xs font-medium">Software</div>
                    <div className="px-2.5 py-1 bg-green-50 text-green-600 rounded-md text-xs font-medium">Active</div>
                    <div className="text-sm text-gray-500 ml-2">Posted 3 days ago</div>
                  </div>
                  
                  <div className="mt-4">
                    <p className="text-gray-600 line-clamp-2">{caterpillarData.description}</p>
                  </div>
                  
                  <div className="mt-4 flex justify-between">
                    <button 
                      onClick={() => handleBeginResponse(caterpillarData.id, caterpillarData)}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
                    >
                      <span>Begin Response</span>
                    </button>
                    
                    <button className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1">
                      <span>View details</span>
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}