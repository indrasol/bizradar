import React from "react";
import {
  Bell,
  Settings,
  Search,
  Upload,
  Plus,
  ArrowUpRight,
  Clock,
  AlertTriangle,
  FileText,
  MessageSquare,
  ChevronRight,
  Calendar,
  TrendingUp,
  Shield,
  Target,
  ChevronDown,
  Info,
  CheckCircle2,
  ExternalLink
} from "lucide-react";
import { Link } from "react-router-dom";
import SideBar from "../components/layout/SideBar";
import { useAuth } from "../components/Auth/useAuth";

const BizRadarDashboard = () => {
  const { user } = useAuth();
  const firstName = user?.user_metadata?.first_name || '';
  const currentDate = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Now imported as a component */}
        <SideBar />
        
        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-auto">
          {/* Top navigation */}
          <div className="bg-white border-b border-gray-200 py-3 px-6 flex justify-between items-center shadow-sm">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-600">Portfolio</span>
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </div>
              <div className="h-5 w-px bg-gray-200"></div>
              <div className="flex space-x-6">
                <span className="text-sm font-medium text-blue-600 border-b-2 border-blue-600 pb-2 -mb-3">Home</span>
                <span className="text-sm font-medium text-gray-600 hover:text-gray-800">Analytics</span>
                <span className="text-sm font-medium text-gray-600 hover:text-gray-800">Reports</span>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 transition-all">
                Upgrade
              </button>
              <div className="relative">
                <button className="p-2 text-gray-500 hover:text-gray-600 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
                  <Bell className="h-5 w-5" />
                </button>
                <div className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></div>
              </div>
              <div className="relative">
                <button className="p-2 text-gray-500 hover:text-gray-600 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
                  <MessageSquare className="h-5 w-5" />
                </button>
                <div className="absolute top-0 right-0 w-2 h-2 bg-blue-500 rounded-full"></div>
              </div>
            </div>
          </div>

          {/* Page content */}
          <div className="flex-1 p-6 overflow-auto">
            <div className="max-w-7xl mx-auto">
              {/* User greeting */}
              <div className="flex items-center mb-8 bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="mr-6 w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-md">
                  {firstName.substring(0, 1)}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Welcome back, {firstName}!
                  </h1>
                  <div className="flex items-center mt-1 text-sm text-gray-500">
                    <Calendar className="h-4 w-4 mr-1" />
                    <span>{currentDate}</span>
                    <span className="mx-2">•</span>
                    <span className="flex items-center">
                      <Target className="h-4 w-4 mr-1 text-blue-500" />
                      Portfolio
                    </span>
                  </div>
                </div>
                <div className="ml-auto flex space-x-3">
                  <Link
                    to="/opportunites"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 flex items-center"
                  >
                    <Search className="mr-2 h-4 w-4" />
                    Find New Opportunities
                  </Link>
                  <button className="inline-flex items-center px-5 py-2.5 border border-transparent text-sm font-medium rounded-lg shadow-md text-white bg-emerald-500 hover:bg-emerald-600 transition-all duration-300 hover:shadow-lg transform hover:-translate-y-0.5">
                    <Plus className="mr-2 h-4 w-4" />
                    Import Pursuit
                  </button>
                  <button className="inline-flex items-center px-5 py-2.5 border border-transparent text-sm font-medium rounded-lg shadow-md text-white bg-blue-600 hover:bg-blue-700 transition-all duration-300 hover:shadow-lg transform hover:-translate-y-0.5">
                    <Upload className="mr-2 h-4 w-4" />
                    Upload
                  </button>
                </div>
              </div>

              {/* Dashboard layout - 2 columns */}
              <div className="grid grid-cols-3 gap-6">
                {/* Main column - 2/3 width */}
                <div className="col-span-2 space-y-6">
                  {/* Metrics */}
                  <div className="grid grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 transition-all hover:shadow-md">
                      <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-semibold text-gray-700 flex items-center">
                          <FileText className="h-5 w-5 mr-2 text-blue-500" />
                          New Pursuits in March
                        </h2>
                        <div className="p-2 bg-teal-100 text-teal-800 rounded-lg">
                          <Info className="h-5 w-5" />
                        </div>
                      </div>
                      <div className="flex items-end space-x-3 mb-4">
                        <div className="text-4xl font-bold text-gray-900">2</div>
                        <div className="pb-1 flex items-center text-sm font-medium text-teal-600 bg-teal-50 px-2 py-1 rounded-lg">
                          <ArrowUpRight className="h-4 w-4 mr-1" />
                          <span>200%</span>
                        </div>
                      </div>
                      <div className="text-sm text-gray-600">
                        200% more than this time last month
                      </div>
                      
                      {/* Minimal chart visualization */}
                      <div className="mt-4 h-8 flex items-end space-x-1">
                        <div className="w-1/12 bg-gray-200 h-2 rounded-sm"></div>
                        <div className="w-1/12 bg-gray-200 h-2 rounded-sm"></div>
                        <div className="w-1/12 bg-gray-200 h-6 rounded-sm"></div>
                        <div className="w-1/12 bg-gray-200 h-4 rounded-sm"></div>
                        <div className="w-1/12 bg-gray-200 h-2 rounded-sm"></div>
                        <div className="w-1/12 bg-gray-200 h-3 rounded-sm"></div>
                        <div className="w-1/12 bg-gray-200 h-2 rounded-sm"></div>
                        <div className="w-1/12 bg-gray-200 h-5 rounded-sm"></div>
                        <div className="w-1/12 bg-gray-200 h-3 rounded-sm"></div>
                        <div className="w-1/12 bg-gray-200 h-2 rounded-sm"></div>
                        <div className="w-1/12 bg-gray-200 h-2 rounded-sm"></div>
                        <div className="w-1/12 bg-blue-500 h-8 rounded-sm"></div>
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 transition-all hover:shadow-md">
                      <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-semibold text-gray-700 flex items-center">
                          <Clock className="h-5 w-5 mr-2 text-blue-500" />
                          Action Items
                        </h2>
                        <div className="p-2 bg-red-100 text-red-800 rounded-lg">
                          <AlertTriangle className="h-5 w-5" />
                        </div>
                      </div>
                      <div className="flex items-end space-x-3 mb-4">
                        <div className="text-4xl font-bold text-gray-900">2</div>
                        <div className="pb-1 flex items-center text-sm font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">
                          <Clock className="h-4 w-4 mr-1" />
                          <span>Upcoming</span>
                        </div>
                      </div>
                      <div className="text-sm text-gray-600">None due today</div>
                      
                      {/* Progress visualization */}
                      <div className="mt-4 space-y-2">
                        <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full" style={{ width: '75%' }}></div>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>0 Completed</span>
                          <span>2 Remaining</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* AI-Matched Opportunities */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 overflow-hidden">
                    <div className="flex justify-between items-center mb-5">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                          <Search className="h-5 w-5" />
                        </div>
                        <h2 className="text-lg font-semibold text-gray-700">
                          New AI-Matched Opportunities
                        </h2>
                      </div>
                      <button className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors shadow-sm">
                        <Settings className="mr-2 h-4 w-4" />
                        Edit settings
                      </button>
                    </div>

                    {/* Alert */}
                    <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800 flex items-start">
                      <AlertTriangle className="h-5 w-5 mr-3 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium mb-1">No highly relevant matches found</p>
                        <p className="text-sm text-yellow-700">
                          We couldn't find any highly relevant new opportunities for your
                          organization. Please check back tomorrow!
                        </p>
                      </div>
                    </div>

                    {/* Opportunity cards */}
                    <div className="space-y-5">
                      {/* Card 1 */}
                      <div className="rounded-lg border border-gray-200 overflow-hidden transition-all hover:shadow-md group">
                        <div className="p-5">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="text-lg font-medium text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                                Joint Service General Protective Masks M50, M51, and M53A1
                              </h3>
                              <p className="text-sm text-gray-600 mb-3">
                                Sources Sought • The Department of Defense, specifically
                                the Army, is seeking industry capabilities to produce
                                and...
                              </p>
                              <div className="flex flex-wrap items-center gap-4 text-xs">
                                <div className="flex items-center text-gray-500">
                                  <Shield className="h-3 w-3 mr-1 text-blue-500" />
                                  DEPT OF DEFENSE
                                </div>
                                <div className="flex items-center text-gray-500">
                                  <Clock className="h-3 w-3 mr-1" />
                                  Released: Mar 5, 2025
                                </div>
                                <div className="flex items-center px-2 py-1 bg-amber-50 text-amber-700 rounded-full">
                                  <Clock className="h-3 w-3 mr-1" />
                                  Due: Mar 28, 2025
                                </div>
                              </div>
                            </div>
                            <div className="ml-4 flex flex-col items-end">
                              <div className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium mb-2">
                                85% Match
                              </div>
                              <div className="text-gray-400 group-hover:text-blue-500 transition-colors">
                                <ExternalLink className="h-4 w-4" />
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="border-t border-gray-200 px-5 py-3 bg-gray-50 flex justify-between items-center">
                          <div className="text-xs text-gray-500">
                            Estimated value: <span className="font-medium">$750K-$1.5M</span>
                          </div>
                          <button className="inline-flex items-center px-4 py-1.5 border border-gray-300 text-xs font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 hover:text-blue-600 transition-colors shadow-sm">
                            Add to Pursuits
                          </button>
                        </div>
                      </div>

                      {/* Card 2 */}
                      <div className="rounded-lg border border-gray-200 overflow-hidden transition-all hover:shadow-md group">
                        <div className="p-5">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="text-lg font-medium text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                                Context-Aware Decision Support
                              </h3>
                              <p className="text-sm text-gray-600 mb-3">
                                SBIR/STTR • Description &lt;p&gt;In today&rsquo;s training
                                and operational environments, commanders are confronted
                                with...
                              </p>
                              <div className="flex flex-wrap items-center gap-4 text-xs">
                                <div className="flex items-center text-gray-500">
                                  <Shield className="h-3 w-3 mr-1 text-blue-500" />
                                  DOD
                                </div>
                                <div className="flex items-center text-gray-500">
                                  <Clock className="h-3 w-3 mr-1" />
                                  Released: Mar 5, 2025
                                </div>
                                <div className="flex items-center px-2 py-1 bg-green-50 text-green-700 rounded-full">
                                  <Clock className="h-3 w-3 mr-1" />
                                  Due: Apr 23, 2025
                                </div>
                              </div>
                            </div>
                            <div className="ml-4 flex flex-col items-end">
                              <div className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium mb-2">
                                72% Match
                              </div>
                              <div className="text-gray-400 group-hover:text-blue-500 transition-colors">
                                <ExternalLink className="h-4 w-4" />
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="border-t border-gray-200 px-5 py-3 bg-gray-50 flex justify-between items-center">
                          <div className="text-xs text-gray-500">
                            Estimated value: <span className="font-medium">$100K-$250K</span>
                          </div>
                          <button className="inline-flex items-center px-4 py-1.5 border border-gray-300 text-xs font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 hover:text-blue-600 transition-colors shadow-sm">
                            Add to Pursuits
                          </button>
                        </div>
                      </div>

                      {/* Card 3 */}
                      <div className="rounded-lg border border-gray-200 overflow-hidden transition-all hover:shadow-md group">
                        <div className="p-5">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="text-lg font-medium text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                                Context-Aware Decision Support
                              </h3>
                              <p className="text-sm text-gray-600 mb-3">
                                SBIR/STTR • Description &lt;p&gt;In today&rsquo;s training
                                and operational environments, commanders are confronted
                                with...
                              </p>
                              <div className="flex flex-wrap items-center gap-4 text-xs">
                                <div className="flex items-center text-gray-500">
                                  <Shield className="h-3 w-3 mr-1 text-blue-500" />
                                  DOD
                                </div>
                                <div className="flex items-center text-gray-500">
                                  <Clock className="h-3 w-3 mr-1" />
                                  Released: Mar 5, 2025
                                </div>
                                <div className="flex items-center px-2 py-1 bg-green-50 text-green-700 rounded-full">
                                  <Clock className="h-3 w-3 mr-1" />
                                  Due: Apr 23, 2025
                                </div>
                              </div>
                            </div>
                            <div className="ml-4 flex flex-col items-end">
                              <div className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium mb-2">
                                72% Match
                              </div>
                              <div className="text-gray-400 group-hover:text-blue-500 transition-colors">
                                <ExternalLink className="h-4 w-4" />
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="border-t border-gray-200 px-5 py-3 bg-gray-50 flex justify-between items-center">
                          <div className="text-xs text-gray-500">
                            Estimated value: <span className="font-medium">$100K-$250K</span>
                          </div>
                          <button className="inline-flex items-center px-4 py-1.5 border border-gray-300 text-xs font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 hover:text-blue-600 transition-colors shadow-sm">
                            Add to Pursuits
                          </button>
                        </div>
                      </div>

                      {/* Card 4 */}
                      <div className="rounded-lg border border-gray-200 overflow-hidden transition-all hover:shadow-md group">
                        <div className="p-5">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="text-lg font-medium text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                                Design & Installation of Playgrounds
                              </h3>
                              <p className="text-sm text-gray-600 mb-3">
                                Construction • The City of North Myrtle Beach is
                                soliciting proposals for the design and installation of
                                playground...
                              </p>
                              <div className="flex flex-wrap items-center gap-4 text-xs">
                                <div className="flex items-center text-gray-500">
                                  <Shield className="h-3 w-3 mr-1 text-blue-500" />
                                  City of North Myrtle Beach
                                </div>
                                <div className="flex items-center text-gray-500">
                                  <Clock className="h-3 w-3 mr-1" />
                                  Released: Mar 4, 2025
                                </div>
                                <div className="flex items-center px-2 py-1 bg-amber-50 text-amber-700 rounded-full">
                                  <Clock className="h-3 w-3 mr-1" />
                                  Due: Mar 25, 2025
                                </div>
                              </div>
                            </div>
                            <div className="ml-4 flex flex-col items-end">
                              <div className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium mb-2">
                                65% Match
                              </div>
                              <div className="text-gray-400 group-hover:text-blue-500 transition-colors">
                                <ExternalLink className="h-4 w-4" />
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="border-t border-gray-200 px-5 py-3 bg-gray-50 flex justify-between items-center">
                          <div className="text-xs text-gray-500">
                            Estimated value: <span className="font-medium">$250K-$500K</span>
                          </div>
                          <button className="inline-flex items-center px-4 py-1.5 border border-gray-300 text-xs font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 hover:text-blue-600 transition-colors shadow-sm">
                            Add to Pursuits
                          </button>
                        </div>
                      </div>
                      
                      <div className="flex justify-center pt-2">
                        <button className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center">
                          View more opportunities
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right sidebar - 1/3 width */}
                <div className="space-y-6">
                  {/* Recently Viewed Pursuits */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                          <FileText className="h-5 w-5" />
                        </div>
                        <h2 className="text-lg font-semibold text-gray-700">Recently Viewed</h2>
                      </div>
                      <a
                        href="#"
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center"
                      >
                        View All
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </a>
                    </div>

                    <div>
                      <div className="p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors group">
                        <h3 className="text-md font-medium text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                          ROC Programmers
                        </h3>
                        <div className="flex items-center space-x-4 text-xs">
                          <div className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full font-medium">Assessment</div>
                          <div className="flex items-center text-gray-500">
                            <Clock className="h-3 w-3 mr-1" />
                            Due in 14 days
                          </div>
                        </div>
                      </div>

                      <div className="p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors group">
                        <h3 className="text-md font-medium text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                          Light Poles, Fixtures and Globes
                        </h3>
                        <div className="flex items-center space-x-4 text-xs">
                          <div className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full font-medium">Assessment</div>
                          <div className="flex items-center text-gray-500">
                            <Clock className="h-3 w-3 mr-1" />
                            Due in 21 days
                          </div>
                        </div>
                      </div>

                      <div className="p-4 hover:bg-gray-50 transition-colors group">
                        <h3 className="text-md font-medium text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                          DHS-FEMA Risk Mapping, Assessment, and Planni...
                        </h3>
                        <div className="flex items-center space-x-4 text-xs">
                          <div className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full font-medium">Assessment</div>
                          <div className="flex items-center text-gray-500">
                            <Clock className="h-3 w-3 mr-1" />
                            Due about 1 year ago
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Items */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                          <Clock className="h-5 w-5" />
                        </div>
                        <h2 className="text-lg font-semibold text-gray-700">Action Items</h2>
                        <div className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                          2
                        </div>
                      </div>
                    </div>

                    <div className="p-4 space-y-3">
                      <div className="rounded-lg border border-gray-200 p-4 hover:shadow-sm transition-all group">
                        <div className="flex items-start">
                          <div className="flex-shrink-0 p-2 bg-green-100 text-green-600 rounded-lg mr-3">
                            <TrendingUp className="h-4 w-4" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-md font-medium text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                              Light Poles, Fixtures and Globes
                            </h3>
                            <div className="mb-2 flex items-center text-xs font-medium text-gray-600 bg-gray-100 px-3 py-1 rounded-full w-fit">
                              <Clock className="h-3 w-3 mr-1 text-blue-500" />
                              <span>Due in 21 days</span>
                            </div>
                            <div className="flex items-center space-x-2 text-xs text-gray-500">
                              <span className="flex items-center">
                                <FileText className="h-3 w-3 mr-1" />
                                Pursuit
                              </span>
                              <span>•</span>
                              <span>Assessment</span>
                            </div>
                          </div>
                          <button className="ml-2 p-1 text-gray-400 hover:text-blue-500 transition-colors">
                            <CheckCircle2 className="h-5 w-5" />
                          </button>
                        </div>
                      </div>

                      <div className="rounded-lg border border-gray-200 p-4 hover:shadow-sm transition-all group">
                        <div className="flex items-start">
                          <div className="flex-shrink-0 p-2 bg-green-100 text-green-600 rounded-lg mr-3">
                            <TrendingUp className="h-4 w-4" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-md font-medium text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                              ROC Programmers
                            </h3>
                            <div className="mb-2 flex items-center text-xs font-medium text-gray-600 bg-gray-100 px-3 py-1 rounded-full w-fit">
                              <Clock className="h-3 w-3 mr-1 text-blue-500" />
                              <span>Due in 14 days</span>
                            </div>
                            <div className="flex items-center space-x-2 text-xs text-gray-500">
                              <span className="flex items-center">
                                <FileText className="h-3 w-3 mr-1" />
                                Pursuit
                              </span>
                              <span>•</span>
                              <span>Assessment</span>
                            </div>
                          </div>
                          <button className="ml-2 p-1 text-gray-400 hover:text-blue-500 transition-colors">
                            <CheckCircle2 className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="p-3 text-center">
                        <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                          View all action items
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Quick Stats */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                          <TrendingUp className="h-5 w-5" />
                        </div>
                        <h2 className="text-lg font-semibold text-gray-700">Quick Stats</h2>
                      </div>
                    </div>

                    <div className="p-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 rounded-lg p-4 text-center">
                          <div className="text-sm text-gray-500 mb-1">Active Pursuits</div>
                          <div className="text-2xl font-bold text-gray-900">12</div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4 text-center">
                          <div className="text-sm text-gray-500 mb-1">Win Rate</div>
                          <div className="text-2xl font-bold text-gray-900">32%</div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4 text-center">
                          <div className="text-sm text-gray-500 mb-1">Pending</div>
                          <div className="text-2xl font-bold text-gray-900">4</div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4 text-center">
                          <div className="text-sm text-gray-500 mb-1">Won Q1</div>
                          <div className="text-2xl font-bold text-gray-900">2</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BizRadarDashboard;







// import React from "react";
// import {
//   Bell,
//   Settings,
//   Search,
//   Upload,
//   Plus,
//   ArrowUpRight,
//   Clock,
//   AlertTriangle,
//   FileText,
// } from "lucide-react";
// import { Link } from "react-router-dom";
// import SideBar from "../components/layout/SideBar";
// import { useAuth } from "../components/Auth/useAuth";

// const BizRadarDashboard = () => {
//   const { user } = useAuth();
//   const firstName = user?.user_metadata?.first_name || '';
//   const currentDate = new Date().toLocaleDateString('en-US', { 
//     weekday: 'long', 
//     month: 'long', 
//     day: 'numeric' 
//   });

//   return (
//     <div className="flex flex-col h-screen bg-gray-50">
      
//       <div className="flex flex-1 overflow-hidden">
//         {/* Sidebar - Now imported as a component */}
//         <SideBar />
//         {/* Main content */}
//         <div className="flex-1 flex flex-col overflow-auto">
//           {/* Top navigation */}
//           <div className="bg-white border-b border-gray-200 p-2 flex justify-between items-center">
//             <div className="flex items-center space-x-4">
//               <span className="text-sm text-gray-600">Portfolio</span>
//               <span className="text-sm text-gray-600">Home</span>
//             </div>
//             <div className="flex items-center space-x-2">
//               <button className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700">
//                 Upgrade
//               </button>
//               <button className="p-1.5 text-gray-500 hover:text-gray-600">
//                 <Bell className="h-5 w-5" />
//               </button>
//               <button className="p-1.5 text-gray-500 hover:text-gray-600">
//                 <svg
//                   className="h-5 w-5"
//                   fill="none"
//                   viewBox="0 0 24 24"
//                   stroke="currentColor"
//                 >
//                   <path
//                     strokeLinecap="round"
//                     strokeLinejoin="round"
//                     strokeWidth={2}
//                     d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"
//                   />
//                 </svg>
//               </button>
//             </div>
//           </div>

//           {/* Page content */}
//           <div className="flex-1 p-6 overflow-auto">
//             {/* User greeting */}
//             <div className="flex items-center mb-6">
//               <div className="mr-4 w-12 h-12 bg-gray-200 rounded-full"></div>
//               <div>
//                 <h1 className="text-2xl font-semibold text-gray-900">
//                   Welcome, {firstName}!
//                 </h1>
//                 <div className="text-sm text-gray-500">
//                   Portfolio • {currentDate}
//                 </div>
//               </div>
//               <div className="ml-auto flex space-x-2">
//                 {/* <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700">
//                   <Search className="mr-2 h-4 w-4" />
//                   Find New Opportunities
//                 </button> */}
//                 <Link
//                   to="/opportunites"
//                   className="bg-blue-600  hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-medium transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
//                 >
//                   Find New Opportunities
//                 </Link>
//                 <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-emerald-500 hover:bg-emerald-700">
//                   <Plus className="mr-2 h-4 w-4" />
//                   Import Pursuit
//                 </button>
//                 <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700">
//                   <Upload className="mr-2 h-4 w-4" />
//                   Upload to Library
//                 </button>
//               </div>
//             </div>

//             {/* Metrics */}
//             <div className="grid grid-cols-2 gap-6 mb-6">
//               <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
//                 <div className="flex justify-between items-center mb-4">
//                   <h2 className="text-lg font-medium text-gray-700">
//                     New Pursuits in March
//                   </h2>
//                   <span className="p-1.5 bg-teal-100 text-teal-800 rounded-full">
//                     <svg
//                       className="h-5 w-5"
//                       fill="none"
//                       viewBox="0 0 24 24"
//                       stroke="currentColor"
//                     >
//                       <path
//                         strokeLinecap="round"
//                         strokeLinejoin="round"
//                         strokeWidth={2}
//                         d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
//                       />
//                     </svg>
//                   </span>
//                 </div>
//                 <div className="text-3xl font-bold text-gray-900 mb-2">2</div>
//                 <div className="flex items-center text-sm text-teal-600">
//                   <ArrowUpRight className="h-4 w-4 mr-1" />
//                   <span>200% more than this time last month</span>
//                 </div>
//               </div>

//               <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
//                 <div className="flex justify-between items-center mb-4">
//                   <h2 className="text-lg font-medium text-gray-700">
//                     Action Items
//                   </h2>
//                   <span className="p-1.5 bg-red-100 text-red-800 rounded-full">
//                     <AlertTriangle className="h-5 w-5" />
//                   </span>
//                 </div>
//                 <div className="text-3xl font-bold text-gray-900 mb-2">2</div>
//                 <div className="text-sm text-gray-600">None due today</div>
//               </div>
//             </div>

//             {/* AI-Matched Opportunities */}
//             <div className="mb-8">
//               <div className="flex justify-between items-center mb-4">
//                 <div className="flex items-center space-x-2">
//                   <Search className="h-5 w-5 text-gray-500" />
//                   <h2 className="text-lg font-medium text-gray-700">
//                     New AI-Matched Opportunities
//                   </h2>
//                 </div>
//                 <button className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
//                   <Settings className="mr-2 h-4 w-4" />
//                   Edit settings
//                 </button>
//               </div>

//               {/* Alert */}
//               <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-md p-4 text-yellow-800">
//                 We couldn't find any highly relevant new opportunities for your
//                 organization. Please check back tomorrow!
//               </div>

//               {/* Opportunity cards */}
//               <div className="space-y-4">
//                 {/* Card 1 */}
//                 <div className="bg-white rounded-md border border-gray-200 overflow-hidden">
//                   <div className="p-4">
//                     <h3 className="text-lg font-medium text-gray-900 mb-1">
//                       Joint Service General Protective Masks M50, M51, and M53A1
//                     </h3>
//                     <p className="text-sm text-gray-600 mb-2">
//                       Sources Sought • The Department of Defense, specifically
//                       the Army, is seeking industry capabilities to produce
//                       and...
//                     </p>
//                     <div className="flex items-center space-x-4 text-xs">
//                       <div className="flex items-center text-gray-500">
//                         <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-1"></span>
//                         DEPT OF DEFENSE
//                       </div>
//                       <div className="flex items-center text-gray-500">
//                         <Clock className="h-3 w-3 mr-1" />
//                         Released: Mar 5, 2025
//                       </div>
//                       <div className="flex items-center text-gray-500">
//                         <Clock className="h-3 w-3 mr-1" />
//                         Due: Mar 28, 2025
//                       </div>
//                     </div>
//                   </div>
//                   <div className="border-t border-gray-200 px-4 py-2 bg-gray-50 text-right">
//                     <button className="inline-flex items-center px-3 py-1 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
//                       Add to Pursuits
//                     </button>
//                   </div>
//                 </div>

//                 {/* Card 2 */}
//                 <div className="bg-white rounded-md border border-gray-200 overflow-hidden">
//                   <div className="p-4">
//                     <h3 className="text-lg font-medium text-gray-900 mb-1">
//                       Context-Aware Decision Support
//                     </h3>
//                     <p className="text-sm text-gray-600 mb-2">
//                       SBIR/STTR • Description &lt;p&gt;In today&rsquo;s training
//                       and operational environments, commanders are confronted
//                       with...
//                     </p>
//                     <div className="flex items-center space-x-4 text-xs">
//                       <div className="flex items-center text-gray-500">
//                         <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-1"></span>
//                         DOD
//                       </div>
//                       <div className="flex items-center text-gray-500">
//                         <Clock className="h-3 w-3 mr-1" />
//                         Released: Mar 5, 2025
//                       </div>
//                       <div className="flex items-center text-gray-500">
//                         <Clock className="h-3 w-3 mr-1" />
//                         Due: Apr 23, 2025
//                       </div>
//                     </div>
//                   </div>
//                   <div className="border-t border-gray-200 px-4 py-2 bg-gray-50 text-right">
//                     <button className="inline-flex items-center px-3 py-1 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
//                       Add to Pursuits
//                     </button>
//                   </div>
//                 </div>

//                 {/* Card 3 - Duplicate of Card 2 as shown in the image */}
//                 <div className="bg-white rounded-md border border-gray-200 overflow-hidden">
//                   <div className="p-4">
//                     <h3 className="text-lg font-medium text-gray-900 mb-1">
//                       Context-Aware Decision Support
//                     </h3>
//                     <p className="text-sm text-gray-600 mb-2">
//                       SBIR/STTR • Description &lt;p&gt;In today&rsquo;s training
//                       and operational environments, commanders are confronted
//                       with...
//                     </p>
//                     <div className="flex items-center space-x-4 text-xs">
//                       <div className="flex items-center text-gray-500">
//                         <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-1"></span>
//                         DOD
//                       </div>
//                       <div className="flex items-center text-gray-500">
//                         <Clock className="h-3 w-3 mr-1" />
//                         Released: Mar 5, 2025
//                       </div>
//                       <div className="flex items-center text-gray-500">
//                         <Clock className="h-3 w-3 mr-1" />
//                         Due: Apr 23, 2025
//                       </div>
//                     </div>
//                   </div>
//                   <div className="border-t border-gray-200 px-4 py-2 bg-gray-50 text-right">
//                     <button className="inline-flex items-center px-3 py-1 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
//                       Add to Pursuits
//                     </button>
//                   </div>
//                 </div>

//                 {/* Card 4 */}
//                 <div className="bg-white rounded-md border border-gray-200 overflow-hidden">
//                   <div className="p-4">
//                     <h3 className="text-lg font-medium text-gray-900 mb-1">
//                       Design & Installation of Playgrounds
//                     </h3>
//                     <p className="text-sm text-gray-600 mb-2">
//                       Construction • The City of North Myrtle Beach is
//                       soliciting proposals for the design and installation of
//                       playground...
//                     </p>
//                     <div className="flex items-center space-x-4 text-xs">
//                       <div className="flex items-center text-gray-500">
//                         <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-1"></span>
//                         City of North Myrtle Beach
//                       </div>
//                       <div className="flex items-center text-gray-500">
//                         <Clock className="h-3 w-3 mr-1" />
//                         Released: Mar 4, 2025
//                       </div>
//                       <div className="flex items-center text-gray-500">
//                         <Clock className="h-3 w-3 mr-1" />
//                         Due: Mar 25, 2025
//                       </div>
//                     </div>
//                   </div>
//                   <div className="border-t border-gray-200 px-4 py-2 bg-gray-50 text-right">
//                     <button className="inline-flex items-center px-3 py-1 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
//                       Add to Pursuits
//                     </button>
//                   </div>
//                 </div>
//               </div>
//             </div>

//             {/* Right sidebar info - Would go in a separate column in a larger layout */}
//             <div className="mt-8">
//               <div className="flex justify-between items-center mb-4">
//                 <h2 className="text-lg font-medium text-gray-700">
//                   Recently Viewed Pursuits
//                 </h2>
//                 <a
//                   href="#"
//                   className="text-sm text-blue-600 hover:text-blue-800"
//                 >
//                   View All
//                 </a>
//               </div>

//               <div className="bg-white rounded-md border border-gray-200 overflow-hidden mb-4">
//                 <div className="divide-y divide-gray-200">
//                   <div className="p-4">
//                     <h3 className="text-md font-medium text-gray-900 mb-1">
//                       ROC Programmers
//                     </h3>
//                     <div className="flex items-center space-x-4 text-xs">
//                       <div className="text-yellow-600">⊙ Assessment</div>
//                       <div className="flex items-center text-gray-500">
//                         <Clock className="h-3 w-3 mr-1" />
//                         Due in 14 days
//                       </div>
//                     </div>
//                   </div>

//                   <div className="p-4">
//                     <h3 className="text-md font-medium text-gray-900 mb-1">
//                       Light Poles, Fixtures and Globes
//                     </h3>
//                     <div className="flex items-center space-x-4 text-xs">
//                       <div className="text-yellow-600">⊙ Assessment</div>
//                       <div className="flex items-center text-gray-500">
//                         <Clock className="h-3 w-3 mr-1" />
//                         Due in 21 days
//                       </div>
//                     </div>
//                   </div>

//                   <div className="p-4">
//                     <h3 className="text-md font-medium text-gray-900 mb-1">
//                       DHS-FEMA Risk Mapping, Assessment, and Planni...
//                     </h3>
//                     <div className="flex items-center space-x-4 text-xs">
//                       <div className="text-yellow-600">⊙ Assessment</div>
//                       <div className="flex items-center text-gray-500">
//                         <Clock className="h-3 w-3 mr-1" />
//                         Due about 1 year ago
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               </div>

//               <div className="mt-6">
//                 <div className="flex items-center mb-4">
//                   <Clock className="h-5 w-5 text-gray-500 mr-2" />
//                   <h2 className="text-lg font-medium text-gray-700">
//                     Action Items
//                   </h2>
//                 </div>

//                 <div className="space-y-3">
//                   <div className="bg-white rounded-md border border-gray-200 p-4">
//                     <div className="flex items-start">
//                       <div className="flex-shrink-0 text-teal-500 mr-3">
//                         <svg
//                           className="h-5 w-5"
//                           viewBox="0 0 20 20"
//                           fill="currentColor"
//                         >
//                           <path
//                             fillRule="evenodd"
//                             d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z"
//                             clipRule="evenodd"
//                           />
//                         </svg>
//                       </div>
//                       <div className="flex-1">
//                         <h3 className="text-md font-medium text-gray-900 mb-1">
//                           Light Poles, Fixtures and Globes
//                         </h3>
//                         <div className="flex items-center space-x-2 text-xs text-gray-500">
//                           <Clock className="h-3 w-3" />
//                           <span>Due in 21 days</span>
//                           <span>•</span>
//                           <span>Pursuit</span>
//                           <span>•</span>
//                           <span>Assessment</span>
//                         </div>
//                       </div>
//                     </div>
//                   </div>

//                   <div className="bg-white rounded-md border border-gray-200 p-4">
//                     <div className="flex items-start">
//                       <div className="flex-shrink-0 text-teal-500 mr-3">
//                         <svg
//                           className="h-5 w-5"
//                           viewBox="0 0 20 20"
//                           fill="currentColor"
//                         >
//                           <path
//                             fillRule="evenodd"
//                             d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z"
//                             clipRule="evenodd"
//                           />
//                         </svg>
//                       </div>
//                       <div className="flex-1">
//                         <h3 className="text-md font-medium text-gray-900 mb-1">
//                           ROC Programmers
//                         </h3>
//                         <div className="flex items-center space-x-2 text-xs text-gray-500">
//                           <Clock className="h-3 w-3" />
//                           <span>Due in 14 days</span>
//                           <span>•</span>
//                           <span>Pursuit</span>
//                           <span>•</span>
//                           <span>Assessment</span>
//                         </div>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default BizRadarDashboard;
