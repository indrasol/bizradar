
import React, { useState } from "react";
import { 
  Search, Settings, ChevronDown, X, Filter, Bell, Download, 
  MessageCircle, Plus, Shield, BarChart2, ChevronRight, ChevronLeft, Share
} from "lucide-react";
import { Link } from "react-router-dom";
import SideBar from "../components/layout/SideBar";

export default function Dashboard() {
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

              {/* Due Date Filter */}
              {filtersOpen && (
                <div className="border-b border-gray-200">
                  <div 
                    onClick={() => toggleFilter('dueDate')} 
                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                  >
                    <h3 className="font-medium">Due Date</h3>
                    <div>
                      <ChevronDown size={18} className="text-gray-400" />
                    </div>
                  </div>
                  {activeFilters.dueDate && (
                    <div className="px-4 pb-4">
                      <ul className="space-y-2">
                        <li className="flex items-center gap-2">
                          <input type="radio" id="active-only" name="due-date" className="accent-blue-500" />
                          <label htmlFor="active-only" className="text-sm">Active only</label>
                        </li>
                        <li className="flex items-center gap-2">
                          <input type="radio" id="next-30" name="due-date" className="accent-blue-500" />
                          <label htmlFor="next-30" className="text-sm">Next 30 days</label>
                        </li>
                        <li className="flex items-center gap-2">
                          <input type="radio" id="next-3" name="due-date" className="accent-blue-500" />
                          <label htmlFor="next-3" className="text-sm">Next 3 months</label>
                        </li>
                        <li className="flex items-center gap-2">
                          <input type="radio" id="next-12" name="due-date" className="accent-blue-500" />
                          <label htmlFor="next-12" className="text-sm">Next 12 months</label>
                        </li>
                        <li className="flex items-center gap-2">
                          <input type="radio" id="custom-date-due" name="due-date" className="accent-blue-500" />
                          <label htmlFor="custom-date-due" className="text-sm">Custom date</label>
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
                    <h3 className="font-medium">Posted Date</h3>
                    <div>
                      <ChevronDown size={18} className="text-gray-400" />
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
                    <h3 className="font-medium">Jurisdiction(s)</h3>
                    <div>
                      <ChevronDown size={18} className="text-gray-400" />
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
                    <h3 className="font-medium">NIGP Code(s)</h3>
                    <div>
                      <ChevronDown size={18} className="text-gray-400" />
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
                    <h3 className="font-medium">UNSPSC Code(s)</h3>
                    <div>
                      <ChevronDown size={18} className="text-gray-400" />
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
                    {/* Recommendation 1 */}
                    <div className="p-3 hover:bg-blue-50/30 rounded-md transition-colors">
                      <div className="flex items-start gap-3">
                        <div className="bg-blue-100 text-blue-700 h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0 font-medium text-sm">
                          1
                        </div>
                        <div>
                          <a href="#" className="text-blue-600 hover:underline font-medium">FY2022 Cybersecurity Grant Program</a>
                          <div className="mt-2">
                            <div className="flex items-start gap-2 text-sm">
                              <span className="font-medium text-gray-700 min-w-20">Why it's relevant:</span>
                              <p className="text-gray-700">
                                This grant program aims to enhance cybersecurity capabilities for local jurisdictions in New York State. It fits well within your organization's focus on cybersecurity training and data protection, supporting the broader goal of risk management.
                              </p>
                            </div>
                            <div className="flex items-center gap-2 text-sm mt-3 text-gray-500">
                              <span className="font-medium">Active until 2025-03-12,</span>
                              <span>Posted 2025-02-18</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Recommendation 2 */}
                    <div className="p-3 hover:bg-blue-50/30 rounded-md transition-colors">
                      <div className="flex items-start gap-3">
                        <div className="bg-blue-100 text-blue-700 h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0 font-medium text-sm">
                          2
                        </div>
                        <div>
                          <a href="#" className="text-blue-600 hover:underline font-medium">Cybersecurity for Small Business Pilot Program (Mitigation/Remediation Services)...</a>
                          <div className="mt-2">
                            <div className="flex items-start gap-2 text-sm">
                              <span className="font-medium text-gray-700 min-w-20">Why it's relevant:</span>
                              <p className="text-gray-700">
                                This initiative involves the Maryland Department of Commerce providing cybersecurity services to small businesses, which may also relate to government training and mitigation strategies, aligning with your organization's focus on threat detection and risk management.
                              </p>
                            </div>
                            <div className="flex items-center gap-2 text-sm mt-3 text-gray-500">
                              <span>Posted 1970-01-01</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Recommendation 3 */}
                    <div className="p-3 hover:bg-blue-50/30 rounded-md transition-colors">
                      <div className="flex items-start gap-3">
                        <div className="bg-blue-100 text-blue-700 h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0 font-medium text-sm">
                          3
                        </div>
                        <div>
                          <a href="#" className="text-blue-600 hover:underline font-medium">State Executive Cyber Protection</a>
                          <div className="mt-2">
                            <div className="flex items-start gap-2 text-sm">
                              <span className="font-medium text-gray-700 min-w-20">Why it's relevant:</span>
                              <p className="text-gray-700">
                                This contract seeks to enhance cybersecurity for state executives in Maryland. It includes services related to threat monitoring, which relates directly to the query on threat...
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded Card: State Executive Cyber Protection */}
                <div className="mx-4 my-6 p-6 bg-white border border-gray-200 rounded-xl shadow-sm">
                  <div className="flex justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Shield className="text-blue-500" size={20} />
                      <h2 className="text-xl font-semibold text-gray-800">State Executive Cyber Protection</h2>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-blue-600 hover:bg-blue-50">
                        <Share size={18} className="text-gray-400" />
                      </button>
                    </div>
                  </div>

                  <div className="mb-6">
                    <p className="text-gray-700 mb-4 leading-relaxed">
                      The Maryland Department of Information Technology (DoIT) is seeking proposals for State Executive Cyber Protection Services to enhance 
                      <span className="text-blue-600 font-medium"> cybersecurity</span> for key state executives and their families. The procurement aims to provide comprehensive services, including the prevention of 
                      misuse of Personally Identifiable Information (PII) and Sensitive Personal Information (SPI), threat monitoring, asset hardening, and <span className="text-blue-600 font-medium">cybersecurity</span> 
                      training. This initiative underscores the importance of safeguarding government officials against <span className="text-blue-600 font-medium">cyber</span> threats, reflecting Maryland's commitment to 
                      robust <span className="text-blue-600 font-medium">cybersecurity</span> measures. Proposals must be submitted electronically via the eMaryland Marketplace Advantage (eMMA) by January 24, 2025.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-6 mb-6 bg-gray-50 p-4 rounded-lg">
                    <div>
                      <h3 className="text-xs font-semibold text-gray-500 mb-1 uppercase">BUYER</h3>
                      <p className="text-gray-800">DoIT - Dept Of Information Technology - Administration</p>
                    </div>
                    <div>
                      <h3 className="text-xs font-semibold text-gray-500 mb-1 uppercase">JURISDICTION</h3>
                      <p className="text-gray-800">Maryland</p>
                    </div>
                    <div>
                      <h3 className="text-xs font-semibold text-gray-500 mb-1 uppercase">TYPE</h3>
                      <p className="text-gray-800">RFP: Double Envelope Proposal</p>
                    </div>
                    <div>
                      <h3 className="text-xs font-semibold text-gray-500 mb-1 uppercase">POSTED</h3>
                      <p className="text-gray-800">December 17th, 2024</p>
                    </div>
                    <div>
                      <h3 className="text-xs font-semibold text-gray-500 mb-1 uppercase">DUE</h3>
                      <p className="text-gray-800">January 23rd, 2025</p>
                    </div>
                    <div>
                      <h3 className="text-xs font-semibold text-gray-500 mb-1 uppercase">RESPONSE DUE IN</h3>
                      <p className="text-blue-600 font-medium">Past Due</p>
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
                    <button className="bg-white border border-gray-200 text-gray-700 px-4 py-2.5 rounded-lg text-sm flex items-center gap-2 shadow-sm hover:bg-gray-50">
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
                      <h2 className="text-xl font-semibold text-gray-800">Caterpillar Software Subscription</h2>
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
                    <p className="text-gray-600 line-clamp-2">Annual subscription renewal for Caterpillar Fleet Management software suite including GPS tracking, maintenance scheduling, and analytics dashboard...</p>
                  </div>
                  
                  <div className="mt-4 flex justify-end">
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