import React, { useState, useEffect } from "react";
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
  ChevronRight,
  ChevronLeft,
  MoreHorizontal,
  Calendar,
  List,
  Columns,
  CheckCircle,
  Circle,
  Edit,
  Trash2
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

interface Pursuit {
  id: string;
  title: string;
  stage: string;
  created: string;
  dueDate: string;
  assignee: string;
  assigneeInitials: string;
}

export default function Pursuits() {
  const navigate = useNavigate();
  
  // State variables
  const [pursuits, setPursuits] = useState<Pursuit[]>([
    {
      id: "1",
      title: "Cybersecurity Incident Response Solution",
      stage: "Assessment",
      created: "Mar 18, 2025",
      dueDate: "Jun 5, 2023",
      assignee: "User 1",
      assigneeInitials: "U1"
    },
    {
      id: "2",
      title: "Cloud Migration Strategy",
      stage: "Planning",
      created: "Mar 15, 2025",
      dueDate: "Apr 30, 2025",
      assignee: "User 2",
      assigneeInitials: "U2"
    },
    {
      id: "3",
      title: "Data Analytics Platform Implementation",
      stage: "Implementation",
      created: "Mar 10, 2025",
      dueDate: "May 15, 2025",
      assignee: "User 1",
      assigneeInitials: "U1"
    },
    {
      id: "4",
      title: "IT Infrastructure Upgrade",
      stage: "Review",
      created: "Mar 5, 2025",
      dueDate: "Mar 25, 2025",
      assignee: "User 3",
      assigneeInitials: "U3"
    }
  ]);
  
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [view, setView] = useState("list"); // list, kanban, calendar
  const [selectedPursuit, setSelectedPursuit] = useState<Pursuit | null>(null);
  const [activeTab, setActiveTab] = useState("Assignees");
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [draggedPursuit, setDraggedPursuit] = useState<string | null>(null);

  // All possible stages for kanban view
  const stages = ["Assessment", "Planning", "Implementation", "Review"];

  // Toggle filters sidebar
  const toggleFiltersBar = () => {
    setFiltersOpen(!filtersOpen);
  };

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Clear search
  const clearSearch = () => {
    setSearchQuery("");
  };

  // Handle pursuit selection
  const handlePursuitSelect = (pursuit: Pursuit) => {
    setSelectedPursuit(pursuit);
  };

  // Handle checkbox selection
  const handleRowSelect = (id: string) => {
    if (selectedRows.includes(id)) {
      setSelectedRows(selectedRows.filter(rowId => rowId !== id));
    } else {
      setSelectedRows([...selectedRows, id]);
    }
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectedRows.length === pursuits.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(pursuits.map(pursuit => pursuit.id));
    }
  };

  // Handle view change
  const changeView = (newView: string) => {
    setView(newView);
  };

  // Handle tab change in details panel
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  // Calendar navigation functions
  const goToPreviousMonth = () => {
    setCurrentMonth(prevMonth => {
      const newMonth = new Date(prevMonth);
      newMonth.setMonth(newMonth.getMonth() - 1);
      return newMonth;
    });
  };

  const goToNextMonth = () => {
    setCurrentMonth(prevMonth => {
      const newMonth = new Date(prevMonth);
      newMonth.setMonth(newMonth.getMonth() + 1);
      return newMonth;
    });
  };

  // Kanban drag and drop handlers
  const handleDragStart = (id: string) => {
    setDraggedPursuit(id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (stage: string) => {
    if (draggedPursuit) {
      // Update the stage of the dragged pursuit
      setPursuits(prevPursuits => prevPursuits.map(pursuit => 
        pursuit.id === draggedPursuit ? { ...pursuit, stage } : pursuit
      ));
      setDraggedPursuit(null);
    }
  };

  // Function to generate calendar days
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    // First day of the month
    const firstDay = new Date(year, month, 1);
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);
    
    // Day of the week for the first day (0 = Sunday, 1 = Monday, etc.)
    const firstDayOfWeek = firstDay.getDay();
    
    // Total days in the month
    const daysInMonth = lastDay.getDate();
    
    // Array to hold all calendar days
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add cells for all days in the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    
    return days;
  };

  // Function to get pursuits for a specific calendar day
  const getPursuitsForDay = (day: number) => {
    if (!day) return [];
    
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const dateString = new Date(year, month, day).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    
    // Filter pursuits by due date
    return pursuits.filter(pursuit => {
      const dueDate = new Date(pursuit.dueDate);
      return dueDate.getDate() === day && 
             dueDate.getMonth() === month && 
             dueDate.getFullYear() === year;
    });
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50 text-gray-800">
      {/* Trial Notification */}
      <div className="w-full bg-blue-600 text-white text-center py-2 px-4">
        <div className="flex items-center justify-center">
          <span>Your organization's free trial.</span>
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
                <span className="text-gray-500 text-sm">Shoumya</span>
                <ChevronRight size={16} className="text-gray-400" />
                <span className="font-medium">Pursuits</span>
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

          {/* Search and Actions */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
            <div className="relative flex-1 max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={16} className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full pl-10 pr-10 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            
            <div className="flex items-center gap-2 ml-4">
              <div className="flex bg-white border border-gray-200 rounded-md">
                <button 
                  className={`px-4 py-2 text-sm ${view === "active" ? "bg-blue-50 text-blue-600" : "text-gray-500"}`}
                  onClick={() => changeView("active")}
                >
                  Active
                </button>
                <button 
                  className={`px-4 py-2 text-sm ${view === "archived" ? "bg-blue-50 text-blue-600" : "text-gray-500"}`}
                  onClick={() => changeView("archived")}
                >
                  Archived
                </button>
              </div>
              
              <div className="flex ml-auto">
                <button className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md shadow-sm hover:bg-blue-700">
                  <Plus size={16} />
                  New Pursuit
                </button>
                <button className="flex items-center gap-1 px-4 py-2 ml-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-md shadow-sm hover:bg-gray-50">
                  <Filter size={16} />
                  Filter
                </button>
              </div>
            </div>
          </div>

          {/* View Selector */}
          <div className="flex border-b border-gray-200">
            <button 
              className={`flex-1 flex items-center justify-center p-3 ${view === 'list' ? 'bg-blue-50 text-blue-600 font-medium' : 'bg-white text-gray-600'}`}
              onClick={() => changeView('list')}
            >
              <List size={16} className="mr-2" />
              List
            </button>
            <button 
              className={`flex-1 flex items-center justify-center p-3 ${view === 'kanban' ? 'bg-blue-50 text-blue-600 font-medium' : 'bg-white text-gray-600'}`}
              onClick={() => changeView('kanban')}
            >
              <Columns size={16} className="mr-2" />
              Kanban
            </button>
            <button 
              className={`flex-1 flex items-center justify-center p-3 ${view === 'calendar' ? 'bg-blue-50 text-blue-600 font-medium' : 'bg-white text-gray-600'}`}
              onClick={() => changeView('calendar')}
            >
              <Calendar size={16} className="mr-2" />
              Calendar
            </button>
          </div>

          {/* Main Body */}
          <div className="flex-1 flex overflow-hidden">
            {/* Filters Column */}
            <div
              className={`${filtersOpen ? 'w-72' : 'w-12'} border-r border-gray-200 bg-white transition-all duration-300 overflow-hidden`}
            >
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                {filtersOpen && (
                  <h2 className="font-medium text-gray-800">Filters</h2>
                )}
                
                <button
                  className="p-1 rounded-md hover:bg-gray-100"
                  onClick={toggleFiltersBar}
                >
                  {filtersOpen ? (
                    <ChevronLeft size={18} className="text-gray-500" />
                  ) : (
                    <ChevronRight size={18} className="text-gray-500" />
                  )}
                </button>
              </div>
              
              {filtersOpen && (
                <div className="p-4">
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Stage</h3>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input type="checkbox" className="rounded text-blue-600 mr-2" />
                        <span className="text-sm text-gray-600">Assessment</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" className="rounded text-blue-600 mr-2" />
                        <span className="text-sm text-gray-600">Planning</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" className="rounded text-blue-600 mr-2" />
                        <span className="text-sm text-gray-600">Implementation</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" className="rounded text-blue-600 mr-2" />
                        <span className="text-sm text-gray-600">Review</span>
                      </label>
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Due Date</h3>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input type="radio" name="dueDate" className="text-blue-600 mr-2" />
                        <span className="text-sm text-gray-600">This week</span>
                      </label>
                      <label className="flex items-center">
                        <input type="radio" name="dueDate" className="text-blue-600 mr-2" />
                        <span className="text-sm text-gray-600">Next week</span>
                      </label>
                      <label className="flex items-center">
                        <input type="radio" name="dueDate" className="text-blue-600 mr-2" />
                        <span className="text-sm text-gray-600">This month</span>
                      </label>
                      <label className="flex items-center">
                        <input type="radio" name="dueDate" className="text-blue-600 mr-2" />
                        <span className="text-sm text-gray-600">Custom range</span>
                      </label>
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Assignee</h3>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input type="checkbox" className="rounded text-blue-600 mr-2" />
                        <span className="text-sm text-gray-600">Shoumya Singh</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" className="rounded text-blue-600 mr-2" />
                        <span className="text-sm text-gray-600">Unassigned</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Main Content Based on Selected View */}
            <div className="flex-1 overflow-auto bg-white">
              {/* List View */}
              {view === 'list' && (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="w-12 px-3 py-3">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            checked={selectedRows.length === pursuits.length && pursuits.length > 0}
                            onChange={handleSelectAll}
                          />
                        </div>
                      </th>
                      <th scope="col" className="w-12 px-3 py-3"></th>
                      <th
                        scope="col"
                        className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Pursuit
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Stage
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Created
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Due
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Assignees
                      </th>
                      <th scope="col" className="relative px-3 py-3 w-10">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {pursuits.map((pursuit) => (
                      <tr 
                        key={pursuit.id} 
                        className="hover:bg-gray-50"
                        onClick={() => handlePursuitSelect(pursuit)}
                      >
                        <td className="px-3 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              checked={selectedRows.includes(pursuit.id)}
                              onChange={() => handleRowSelect(pursuit.id)}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap">
                          <Circle size={18} className="text-gray-400" />
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{pursuit.title}</div>
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                            {pursuit.stage}
                          </span>
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                          {pursuit.created}
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap">
                          <div className="text-sm text-red-600">{pursuit.dueDate}</div>
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-700">
                            {pursuit.assigneeInitials}
                          </div>
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            className="text-gray-400 hover:text-gray-500"
                            onClick={(e) => {
                              e.stopPropagation();
                              // Handle actions
                            }}
                          >
                            <MoreHorizontal size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* Kanban View */}
              {view === 'kanban' && (
                <div className="h-full p-4">
                  <div className="h-full flex space-x-4 overflow-x-auto">
                    {stages.map((stage) => (
                      <div 
                        key={stage}
                        className="flex-1 min-w-64 bg-gray-50 rounded-md flex flex-col overflow-hidden"
                        onDragOver={handleDragOver}
                        onDrop={() => handleDrop(stage)}
                      >
                        <div className="p-3 bg-white border-b border-gray-200">
                          <h3 className="font-medium text-gray-800">{stage}</h3>
                          <div className="text-xs text-gray-500 mt-1">
                            {pursuits.filter(p => p.stage === stage).length} pursuits
                          </div>
                        </div>
                        <div className="flex-1 p-2 overflow-y-auto">
                          {pursuits
                            .filter(pursuit => pursuit.stage === stage)
                            .map(pursuit => (
                              <div 
                                key={pursuit.id}
                                className="bg-white border border-gray-200 rounded-md p-3 mb-2 cursor-pointer hover:shadow-sm"
                                onClick={() => handlePursuitSelect(pursuit)}
                                draggable
                                onDragStart={() => handleDragStart(pursuit.id)}
                              >
                                <div className="text-sm font-medium text-gray-800 mb-2">{pursuit.title}</div>
                                <div className="flex items-center justify-between text-xs">
                                  <div className="text-red-600">{pursuit.dueDate}</div>
                                  <div className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center text-gray-700">
                                    {pursuit.assigneeInitials}
                                  </div>
                                </div>
                              </div>
                            ))}
                        </div>
                        <div className="p-2 bg-white border-t border-gray-200">
                          <button className="w-full text-sm text-blue-600 hover:text-blue-800 flex items-center justify-center p-1 rounded-md hover:bg-blue-50">
                            <Plus size={16} className="mr-1" />
                            Add pursuit
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Calendar View */}
              {view === 'calendar' && (
                <div className="p-4 h-full flex flex-col">
                  {/* Calendar Header */}
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-medium text-gray-800">
                      {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </h2>
                    <div className="flex items-center space-x-2">
                      <button 
                        className="p-2 rounded-md text-gray-600 hover:bg-gray-100" 
                        onClick={goToPreviousMonth}
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <button 
                        className="p-2 rounded-md text-gray-600 hover:bg-gray-100"
                        onClick={goToNextMonth}
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                  
                  {/* Calendar Grid */}
                  <div className="flex-1 border border-gray-200 rounded-md overflow-hidden">
                    {/* Days of Week Header */}
                    <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                        <div key={day} className="py-2 text-center text-sm font-medium text-gray-700">
                          {day}
                        </div>
                      ))}
                    </div>
                    
                    {/* Calendar Days */}
                    <div className="grid grid-cols-7 h-full">
                      {generateCalendarDays().map((day, index) => {
                        // Get pursuits for this day
                        const dayPursuits = day ? getPursuitsForDay(day) : [];
                        
                        return (
                          <div 
                            key={index} 
                            className={`border-b border-r border-gray-200 min-h-24 relative ${!day ? 'bg-gray-50' : ''}`}
                          >
                            {day && (
                              <>
                                {/* Date number */}
                                <div className="p-2 text-sm text-gray-700">
                                  {day}
                                </div>
                                
                                {/* Pursuits for this day */}
                                <div className="px-1 pb-1">
                                  {dayPursuits.slice(0, 2).map(pursuit => (
                                    <div 
                                      key={pursuit.id}
                                      className="mb-1 p-1 text-xs bg-blue-50 border border-blue-100 rounded overflow-hidden cursor-pointer"
                                      onClick={() => handlePursuitSelect(pursuit)}
                                    >
                                      <div className="truncate text-blue-700">{pursuit.title}</div>
                                    </div>
                                  ))}
                                  
                                  {dayPursuits.length > 2 && (
                                    <div className="text-xs text-center text-gray-500">
                                      +{dayPursuits.length - 2} more
                                    </div>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Details Panel - Only visible when a pursuit is selected */}
            {selectedPursuit && (
              <div className="w-80 border-l border-gray-200 bg-white overflow-y-auto">
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                  <h2 className="font-medium text-gray-800">Details</h2>
                  <button 
                    className="text-gray-400 hover:text-gray-500"
                    onClick={() => setSelectedPursuit(null)}
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-200">
                  {["Assignees", "Due Date", "Stages", "Type"].map((tab) => (
                    <button
                      key={tab}
                      className={`flex-1 py-2 px-4 text-sm font-medium ${
                        activeTab === tab
                          ? "text-blue-600 border-b-2 border-blue-600"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                      onClick={() => handleTabChange(tab)}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                {/* Tab Content */}
                <div className="p-4">
                  {activeTab === "Assignees" && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between py-2">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 mr-3">
                            {selectedPursuit.assigneeInitials}
                          </div>
                          <span className="text-sm text-gray-700">{selectedPursuit.assignee}</span>
                        </div>
                        <span className="text-sm text-gray-500">1</span>
                      </div>
                    </div>
                  )}
                  {activeTab === "Due Date" && (
                    <div className="py-2">
                      <div className="text-sm text-gray-600">Due date:</div>
                      <div className="text-sm font-medium text-red-600 mt-1">{selectedPursuit.dueDate}</div>
                    </div>
                  )}

                  {activeTab === "Stages" && (
                    <div className="space-y-2 py-2">
                      <div className="flex items-center">
                        <input 
                          type="radio" 
                          id="stage-assessment" 
                          name="stage" 
                          checked={selectedPursuit.stage === "Assessment"}
                          className="text-blue-600 mr-2"
                        />
                        <label htmlFor="stage-assessment" className="text-sm text-gray-700">Assessment</label>
                      </div>
                      <div className="flex items-center">
                        <input type="radio" id="stage-planning" name="stage" checked={selectedPursuit.stage === "Planning"} className="text-blue-600 mr-2" />
                        <label htmlFor="stage-planning" className="text-sm text-gray-700">Planning</label>
                      </div>
                      <div className="flex items-center">
                        <input type="radio" id="stage-implementation" name="stage" checked={selectedPursuit.stage === "Implementation"} className="text-blue-600 mr-2" />
                        <label htmlFor="stage-implementation" className="text-sm text-gray-700">Implementation</label>
                      </div>
                      <div className="flex items-center">
                        <input type="radio" id="stage-review" name="stage" checked={selectedPursuit.stage === "Review"} className="text-blue-600 mr-2" />
                        <label htmlFor="stage-review" className="text-sm text-gray-700">Review</label>
                      </div>
                    </div>
                  )}

                  {activeTab === "Type" && (
                    <div className="space-y-2 py-2">
                      <div className="flex items-center">
                        <input type="radio" id="type-rfp" name="type" className="text-blue-600 mr-2" checked />
                        <label htmlFor="type-rfp" className="text-sm text-gray-700">RFP</label>
                      </div>
                      <div className="flex items-center">
                        <input type="radio" id="type-project" name="type" className="text-blue-600 mr-2" />
                        <label htmlFor="type-project" className="text-sm text-gray-700">Project</label>
                      </div>
                      <div className="flex items-center">
                        <input type="radio" id="type-proposal" name="type" className="text-blue-600 mr-2" />
                        <label htmlFor="type-proposal" className="text-sm text-gray-700">Proposal</label>
                      </div>
                    </div>
                  )}
                </div>

                {/* Tags */}
                <div className="p-4 border-t border-gray-200">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Tags</h3>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search tags..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="mt-4 text-sm text-gray-500 text-center py-2">
                    No tags found. Click <a href="#" className="text-blue-500 hover:underline">here</a> to create one.
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}