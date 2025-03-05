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
} from "lucide-react";
import { Link } from "react-router-dom";
import SideBar from "../components/layout/SideBar";
import { useContext } from "react";
import AuthContext from "../components/Auth/AuthContext";

const BizRadarDashboard = () => {
  const { user } = useContext(AuthContext);

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Top banner */}
      <div className="w-full bg-blue-600 text-white p-3 text-center text-sm">
        Your organization's free trial.{" "}
        <a href="#" className="underline font-medium">
          Book a demo here
        </a>
        .
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Now imported as a component */}
        <SideBar />
        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-auto">
          {/* Top navigation */}
          <div className="bg-white border-b border-gray-200 p-2 flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Portfolio</span>
              <span className="text-sm text-gray-600">Home</span>
            </div>
            <div className="flex items-center space-x-2">
              <button className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700">
                Upgrade
              </button>
              <button className="p-1.5 text-gray-500 hover:text-gray-600">
                <Bell className="h-5 w-5" />
              </button>
              <button className="p-1.5 text-gray-500 hover:text-gray-600">
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Page content */}
          <div className="flex-1 p-6 overflow-auto">
            {/* User greeting */}
            <div className="flex items-center mb-6">
              <div className="mr-4 w-12 h-12 bg-gray-200 rounded-full"></div>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">
                  Welcome,{user?.firstName}!
                </h1>
                <div className="text-sm text-gray-500">
                  Portfolio • Friday, March 7th
                </div>
              </div>
              <div className="ml-auto flex space-x-2">
                {/* <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700">
                  <Search className="mr-2 h-4 w-4" />
                  Find New Opportunities
                </button> */}
                <Link
                  to="/opportunites"
                  className="bg-blue-600  hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-medium transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                >
                  Find New Opportunities
                </Link>
                <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-emerald-500 hover:bg-emerald-700">
                  <Plus className="mr-2 h-4 w-4" />
                  Import Pursuit
                </button>
                <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700">
                  <Upload className="mr-2 h-4 w-4" />
                  Upload to Library
                </button>
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-medium text-gray-700">
                    New Pursuits in March
                  </h2>
                  <span className="p-1.5 bg-teal-100 text-teal-800 rounded-full">
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </span>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">2</div>
                <div className="flex items-center text-sm text-teal-600">
                  <ArrowUpRight className="h-4 w-4 mr-1" />
                  <span>200% more than this time last month</span>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-medium text-gray-700">
                    Action Items
                  </h2>
                  <span className="p-1.5 bg-red-100 text-red-800 rounded-full">
                    <AlertTriangle className="h-5 w-5" />
                  </span>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">2</div>
                <div className="text-sm text-gray-600">None due today</div>
              </div>
            </div>

            {/* AI-Matched Opportunities */}
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

                {/* Card 3 - Duplicate of Card 2 as shown in the image */}
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

            {/* Right sidebar info - Would go in a separate column in a larger layout */}
            <div className="mt-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium text-gray-700">
                  Recently Viewed Pursuits
                </h2>
                <a
                  href="#"
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  View All
                </a>
              </div>

              <div className="bg-white rounded-md border border-gray-200 overflow-hidden mb-4">
                <div className="divide-y divide-gray-200">
                  <div className="p-4">
                    <h3 className="text-md font-medium text-gray-900 mb-1">
                      ROC Programmers
                    </h3>
                    <div className="flex items-center space-x-4 text-xs">
                      <div className="text-yellow-600">⊙ Assessment</div>
                      <div className="flex items-center text-gray-500">
                        <Clock className="h-3 w-3 mr-1" />
                        Due in 14 days
                      </div>
                    </div>
                  </div>

                  <div className="p-4">
                    <h3 className="text-md font-medium text-gray-900 mb-1">
                      Light Poles, Fixtures and Globes
                    </h3>
                    <div className="flex items-center space-x-4 text-xs">
                      <div className="text-yellow-600">⊙ Assessment</div>
                      <div className="flex items-center text-gray-500">
                        <Clock className="h-3 w-3 mr-1" />
                        Due in 21 days
                      </div>
                    </div>
                  </div>

                  <div className="p-4">
                    <h3 className="text-md font-medium text-gray-900 mb-1">
                      DHS-FEMA Risk Mapping, Assessment, and Planni...
                    </h3>
                    <div className="flex items-center space-x-4 text-xs">
                      <div className="text-yellow-600">⊙ Assessment</div>
                      <div className="flex items-center text-gray-500">
                        <Clock className="h-3 w-3 mr-1" />
                        Due about 1 year ago
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <div className="flex items-center mb-4">
                  <Clock className="h-5 w-5 text-gray-500 mr-2" />
                  <h2 className="text-lg font-medium text-gray-700">
                    Action Items
                  </h2>
                </div>

                <div className="space-y-3">
                  <div className="bg-white rounded-md border border-gray-200 p-4">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 text-teal-500 mr-3">
                        <svg
                          className="h-5 w-5"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-md font-medium text-gray-900 mb-1">
                          Light Poles, Fixtures and Globes
                        </h3>
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <Clock className="h-3 w-3" />
                          <span>Due in 21 days</span>
                          <span>•</span>
                          <span>Pursuit</span>
                          <span>•</span>
                          <span>Assessment</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-md border border-gray-200 p-4">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 text-teal-500 mr-3">
                        <svg
                          className="h-5 w-5"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-md font-medium text-gray-900 mb-1">
                          ROC Programmers
                        </h3>
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <Clock className="h-3 w-3" />
                          <span>Due in 14 days</span>
                          <span>•</span>
                          <span>Pursuit</span>
                          <span>•</span>
                          <span>Assessment</span>
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
