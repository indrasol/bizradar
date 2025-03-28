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
  Trash2,
  Tag,
  Clock,
  Users,
  FileText,
  Star,
  ArrowUpRight,
  Bookmark,
  BarChart,
  AlertCircle,
  CheckSquare,
  Sliders,
  Check,
  Clipboard,
  PlusCircle,
  Sparkles,
  Activity
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
  
  // Function to get stage color
  const getStageColor = (stage: string) => {
    switch(stage) {
      case "Assessment":
        return "bg-amber-100 text-amber-800";
      case "Planning":
        return "bg-blue-100 text-blue-800";
      case "Implementation":
        return "bg-purple-100 text-purple-800";
      case "Review":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
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
                <span className="font-medium text-gray-800">Pursuits</span>
              </div>
              <div className="flex items-center gap-4">
                <button className="flex items-center gap-2 text-gray-600 hover:text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                  <BarChart size={18} />
                  <span className="font-medium">Analytics</span>
                </button>
                <button className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm hover:shadow transition-all flex items-center gap-1">
                  <span>Upgrade</span>
                  <Star size={14} className="ml-1" />
                </button>
                <div className="relative">
                  <Bell size={20} className="text-gray-500 hover:text-gray-700 cursor-pointer" />
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full"></div>
                </div>
                <button className="bg-blue-50 text-blue-600 hover:bg-blue-100 px-4 py-2 rounded-lg text-sm flex items-center gap-1 border border-blue-100 transition-colors">
                  <MessageCircle size={16} />
                  <span className="font-medium">Live Support</span>
                </button>
              </div>
            </div>
          </div>

          {/* Search and Actions */}
          <div className="flex items-center justify-between p-5 border-b border-gray-200 bg-white">
            <div className="relative flex-1 max-w-md">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search size={18} className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search pursuits..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full pl-12 pr-12 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-transparent transition-all shadow-sm bg-gray-50"
              />
              {searchQuery && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-3 ml-4">
              <div className="flex bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                <button 
                  className={`px-4 py-2 text-sm font-medium ${view === "active" ? "bg-blue-50 text-blue-600" : "text-gray-600 hover:bg-gray-50"} transition-colors`}
                  onClick={() => changeView("active")}
                >
                  Active
                </button>
                <button 
                  className={`px-4 py-2 text-sm font-medium ${view === "archived" ? "bg-blue-50 text-blue-600" : "text-gray-600 hover:bg-gray-50"} transition-colors`}
                  onClick={() => changeView("archived")}
                >
                  Archived
                </button>
              </div>
              
              <div className="flex ml-auto">
                <button className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg shadow-sm transition-colors">
                  <Plus size={18} />
                  <span>New Pursuit</span>
                </button>
                <button className="flex items-center gap-1.5 px-4 py-2 ml-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg shadow-sm transition-colors">
                  <Sliders size={18} className="text-gray-500" />
                  <span>Filter</span>
                </button>
              </div>
            </div>
          </div>

          {/* View Selector */}
          <div className="flex border-b border-gray-200 bg-white px-4">
            <button 
              className={`flex items-center justify-center py-3 px-6 font-medium rounded-t-lg transition-colors ${
                view === 'list' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
              onClick={() => changeView('list')}
            >
              <List size={18} className="mr-2" />
              List
            </button>
            <button 
              className={`flex items-center justify-center py-3 px-6 font-medium rounded-t-lg transition-colors ${
                view === 'kanban' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
              onClick={() => changeView('kanban')}
            >
              <Columns size={18} className="mr-2" />
              Kanban
            </button>
            <button 
              className={`flex items-center justify-center py-3 px-6 font-medium rounded-t-lg transition-colors ${
                view === 'calendar' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
              onClick={() => changeView('calendar')}
            >
              <Calendar size={18} className="mr-2" />
              Calendar
            </button>
          </div>

          {/* Main Body */}
          <div className="flex-1 flex overflow-hidden">
            {/* Filters Column */}
            <div
              className={`border-r border-gray-200 bg-white transition-all duration-300 overflow-hidden ${
                filtersOpen ? 'w-80' : 'w-16'
              }`}
            >
              <div className="sticky top-0 p-4 border-b border-gray-200 bg-white flex items-center justify-between">
                {filtersOpen ? (
                  <h2 className="font-medium text-gray-800">Filters</h2>
                ) : (
                  <div className="w-full flex justify-center">
                    <Filter size={20} className="text-gray-500" />
                  </div>
                )}
                
                {filtersOpen && (
                  <button
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
                    onClick={toggleFiltersBar}
                  >
                    <ChevronLeft size={20} />
                  </button>
                )}
                
                {!filtersOpen && (
                  <button
                    className="w-full p-2 flex justify-center hover:bg-gray-50 text-gray-500"
                    onClick={toggleFiltersBar}
                  >
                    <ChevronRight size={20} />
                  </button>
                )}
              </div>
              
              {filtersOpen ? (
                <div className="p-4 space-y-6">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <Activity size={16} className="text-blue-500" />
                      Stage
                    </h3>
                    <div className="space-y-2 ml-6">
                      {stages.map(stage => (
                        <label key={stage} className="flex items-center gap-2 cursor-pointer group">
                          <div className="relative flex items-center">
                            <input type="checkbox" className="peer sr-only" />
                            <div className="w-4 h-4 border border-gray-300 rounded peer-checked:bg-blue-500 peer-checked:border-blue-500 peer-hover:border-blue-400 transition-colors"></div>
                            <Check size={12} className="absolute text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                          </div>
                          <span className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors">{stage}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <Clock size={16} className="text-blue-500" />
                      Due Date
                    </h3>
                    <div className="space-y-2 ml-6">
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <input type="radio" name="dueDate" className="text-blue-600 rounded-full" checked />
                        <span className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors">This week</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <input type="radio" name="dueDate" className="text-blue-600 rounded-full" />
                        <span className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors">Next week</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <input type="radio" name="dueDate" className="text-blue-600 rounded-full" />
                        <span className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors">This month</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <input type="radio" name="dueDate" className="text-blue-600 rounded-full" />
                        <span className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors">Custom range</span>
                      </label>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <Users size={16} className="text-blue-500" />
                      Assignee
                    </h3>
                    <div className="space-y-2 ml-6">
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <div className="relative flex items-center">
                          <input type="checkbox" className="peer sr-only" checked />
                          <div className="w-4 h-4 border border-gray-300 rounded peer-checked:bg-blue-500 peer-checked:border-blue-500 peer-hover:border-blue-400 transition-colors"></div>
                          <Check size={12} className="absolute text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                        </div>
                        <span className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors">Shoumya Singh</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <div className="relative flex items-center">
                          <input type="checkbox" className="peer sr-only" />
                          <div className="w-4 h-4 border border-gray-300 rounded peer-checked:bg-blue-500 peer-checked:border-blue-500 peer-hover:border-blue-400 transition-colors"></div>
                          <Check size={12} className="absolute text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                        </div>
                        <span className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors">Unassigned</span>
                      </label>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-gray-100">
                    <button className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
                      <Check size={16} />
                      <span>Apply Filters</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center py-4 gap-6">
                  <button className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
                    <Activity size={20} />
                  </button>
                  <button className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
                    <Clock size={20} />
                  </button>
                  <button className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
                    <Users size={20} />
                  </button>
                </div>
              )}
            </div>

            {/* Main Content Based on Selected View */}
            <div className="flex-1 overflow-auto bg-gray-50">
              {/* List View */}
              {view === 'list' && (
                <div className="p-5">
                  <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="w-12 px-4 py-3">
                              <div className="flex items-center">
                                <div className="relative flex items-center">
                                  <input
                                    type="checkbox"
                                    className="peer sr-only"
                                    checked={selectedRows.length === pursuits.length && pursuits.length > 0}
                                    onChange={handleSelectAll}
                                  />
                                  <div className="w-5 h-5 border border-gray-300 rounded peer-checked:bg-blue-500 peer-checked:border-blue-500 peer-hover:border-blue-400 transition-colors"></div>
                                  <Check size={12} className="absolute text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                                </div>
                              </div>
                            </th>
                            <th scope="col" className="w-12 px-4 py-3"></th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Pursuit
                            </th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Stage
                            </th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Created
                            </th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Due Date
                            </th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Assignees
                            </th>
                            <th scope="col" className="relative px-4 py-3 w-10">
                              <span className="sr-only">Actions</span>
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {pursuits.map((pursuit, index) => (
                            <tr 
                              key={pursuit.id} 
                              className={`group ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors cursor-pointer`}
                              onClick={() => handlePursuitSelect(pursuit)}
                            >
                              <td className="px-4 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center">
                                  <div className="relative flex items-center">
                                    <input
                                      type="checkbox"
                                      className="peer sr-only"
                                      checked={selectedRows.includes(pursuit.id)}
                                      onChange={() => handleRowSelect(pursuit.id)}
                                    />
                                    <div className="w-5 h-5 border border-gray-300 rounded peer-checked:bg-blue-500 peer-checked:border-blue-500 peer-hover:border-blue-400 transition-colors"></div>
                                    <Check size={12} className="absolute text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <div className="w-5 h-5 rounded-full border-2 border-gray-300 group-hover:border-blue-500 transition-colors"></div>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">{pursuit.title}</div>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStageColor(pursuit.stage)}`}>
                                  {pursuit.stage}
                                </span>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                {pursuit.created}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <div className="text-sm text-red-600 font-medium">{pursuit.dueDate}</div>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                <div className="flex items-center">
                                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-medium shadow-sm">
                                    {pursuit.assigneeInitials}
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <button
                                  className="p-1.5 rounded-full text-gray-400 opacity-0 group-hover:opacity-100 hover:bg-white hover:text-gray-700 transition-all"
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
                    </div>
                  </div>
                </div>
              )}

              {/* Kanban View */}
              {view === 'kanban' && (
                <div className="p-5 h-full">
                  <div className="h-full flex gap-5 overflow-x-auto pb-4">
                    {stages.map((stage) => (
                      <div 
                        key={stage}
                        className="flex-1 min-w-[280px] bg-gray-50 rounded-xl flex flex-col shadow-sm border border-gray-200 overflow-hidden"
                        onDragOver={handleDragOver}
                        onDrop={() => handleDrop(stage)}
                      >
                        <div className="p-4 bg-white border-b border-gray-200 sticky top-0 z-10">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className={`w-3 h-3 rounded-full ${stage === 'Assessment' ? 'bg-amber-400' : stage === 'Planning' ? 'bg-blue-400' : stage === 'Implementation' ? 'bg-purple-400' : 'bg-green-400'}`}></span>
                              <h3 className="font-medium text-gray-800">{stage}</h3>
                            </div>
                            <div className="bg-gray-100 text-gray-600 text-xs font-medium px-2 py-0.5 rounded-full">
                              {pursuits.filter(p => p.stage === stage).length}
                            </div>
                          </div>
                        </div>
                        <div className="flex-1 p-3 overflow-y-auto space-y-3">
                          {pursuits
                            .filter(pursuit => pursuit.stage === stage)
                            .map(pursuit => (
                              <div 
                                key={pursuit.id}
                                className="bg-white border border-gray-200 rounded-lg p-4 cursor-pointer hover:shadow-md transition-all group"
                                onClick={() => handlePursuitSelect(pursuit)}
                                draggable
                                onDragStart={() => handleDragStart(pursuit.id)}
                              >
                                <div className="text-sm font-medium text-gray-800 mb-3 group-hover:text-blue-600 transition-colors">{pursuit.title}</div>
                                <div className="flex items-center justify-between">
                                  <div className="text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded-full flex items-center">
                                    <Clock size={12} className="mr-1" />
                                    {pursuit.dueDate}
                                  </div>
                                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-medium shadow-sm">
                                    {pursuit.assigneeInitials}
                                  </div>
                                </div>
                                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                                  <div className="flex items-center gap-1">
                                    <FileText size={12} />
                                    <span>3 tasks</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <MessageCircle size={12} />
                                    <span>2 comments</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                        </div>
                        <div className="p-3 bg-white border-t border-gray-200 sticky bottom-0">
                          <button className="w-full text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 flex items-center justify-center p-2 rounded-lg transition-colors">
                            <PlusCircle size={16} className="mr-1.5" />
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
                <div className="p-5 h-full flex flex-col">
                  {/* Calendar Header */}
                  <div className="flex items-center justify-between mb-4 bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-800">
                      {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </h2>
                    <div className="flex items-center bg-gray-100 rounded-lg p-1">
                      <button 
                        className="p-2 rounded-md text-gray-600 hover:bg-white hover:text-blue-600 transition-colors" 
                        onClick={goToPreviousMonth}
                      >
                        <ChevronLeft size={20} />
                      </button>
                      <button 
                        className="p-2 rounded-md text-gray-600 hover:bg-white hover:text-blue-600 transition-colors"
                        onClick={goToNextMonth}
                      >
                        <ChevronRight size={20} />
                      </button>
                    </div>
                  </div>
                  
                  {/* Calendar Grid */}
                  <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    {/* Days of Week Header */}
                    <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                        <div key={day} className="py-3 text-center text-sm font-medium text-gray-700">
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
                            className={`border-b border-r border-gray-200 min-h-28 relative ${
                              !day ? 'bg-gray-50' : 'hover:bg-blue-50 transition-colors'
                            }`}
                          >
                            {day && (
                              <>
                                {/* Date number */}
                                <div className="p-2 text-sm font-medium text-gray-700">
                                  {day}
                                </div>
                                
                                {/* Pursuits for this day */}
                                <div className="px-1.5 pb-1.5">
                                  {dayPursuits.slice(0, 2).map(pursuit => (
                                    <div 
                                      key={pursuit.id}
                                      className="mb-1.5 p-2 text-xs bg-white border border-blue-100 rounded-lg shadow-sm overflow-hidden cursor-pointer hover:border-blue-400 transition-colors"
                                      onClick={() => handlePursuitSelect(pursuit)}
                                    >
                                      <div className="truncate font-medium text-gray-800">{pursuit.title}</div>
                                      <div className="flex items-center justify-between mt-1">
                                        <span className={`px-1.5 py-0.5 rounded-full text-xs ${getStageColor(pursuit.stage)}`}>
                                          {pursuit.stage}
                                        </span>
                                        <div className="h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs">
                                          {pursuit.assigneeInitials}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                  
                                  {dayPursuits.length > 2 && (
                                    <div className="text-xs font-medium text-center text-blue-600 py-1 rounded-md hover:bg-blue-50 cursor-pointer">
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
              <div className="w-96 border-l border-gray-200 bg-white overflow-y-auto shadow-md">
                <div className="sticky top-0 z-10 p-4 border-b border-gray-200 bg-white flex items-center justify-between">
                  <h2 className="font-medium text-gray-800">Pursuit Details</h2>
                  <button 
                    className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    onClick={() => setSelectedPursuit(null)}
                  >
                    <X size={20} />
                  </button>
                </div>
                
                <div className="p-4 border-b border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">{selectedPursuit.title}</h3>
                  <div className="flex items-center gap-3 mb-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getStageColor(selectedPursuit.stage)}`}>
                      {selectedPursuit.stage}
                    </span>
                    <span className="text-xs text-gray-500 flex items-center">
                      <Clock size={12} className="mr-1" />
                      Created {selectedPursuit.created}
                    </span>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-sm font-medium transition-colors">
                      <Edit size={16} />
                      <span>Edit</span>
                    </button>
                    <button className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg text-sm font-medium transition-colors">
                      <Clipboard size={16} className="text-gray-500" />
                      <span>Copy Link</span>
                    </button>
                  </div>
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-200 bg-gray-50">
                  <div className="flex overflow-x-auto">
                    {["Assignees", "Due Date", "Stages", "Type"].map((tab) => (
                      <button
                        key={tab}
                        className={`py-3 px-4 text-sm font-medium whitespace-nowrap ${
                          activeTab === tab
                            ? "text-blue-600 border-b-2 border-blue-600 bg-white"
                            : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                        } transition-colors`}
                        onClick={() => handleTabChange(tab)}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tab Content */}
                <div className="p-4">
                  {activeTab === "Assignees" && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-medium shadow-sm">
                            {selectedPursuit.assigneeInitials}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-800">{selectedPursuit.assignee}</div>
                            <div className="text-xs text-gray-500">Primary Assignee</div>
                          </div>
                        </div>
                        <button className="p-1.5 text-gray-400 hover:text-gray-600 rounded-md hover:bg-white transition-colors">
                          <X size={16} />
                        </button>
                      </div>
                      
                      <button className="w-full flex items-center justify-center gap-1.5 p-2.5 border border-dashed border-gray-300 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors text-sm">
                        <Plus size={16} />
                        <span>Add Assignee</span>
                      </button>
                    </div>
                  )}
                  
                  {activeTab === "Due Date" && (
                    <div className="space-y-4">
                      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="text-sm text-gray-600 mb-1">Current due date:</div>
                        <div className="text-base font-medium text-red-600 flex items-center gap-2">
                          <Calendar size={16} />
                          {selectedPursuit.dueDate}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Change due date:</label>
                        <input 
                          type="date" 
                          className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        
                        <div className="pt-3 flex gap-2">
                          <button className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
                            Update
                          </button>
                          <button className="flex-1 py-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg text-sm font-medium transition-colors">
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === "Stages" && (
                    <div className="space-y-2">
                      {stages.map(stage => (
                        <label key={stage} className="flex items-center p-3 rounded-lg hover:bg-gray-50 cursor-pointer group">
                          <input 
                            type="radio" 
                            name="stage" 
                            checked={selectedPursuit.stage === stage}
                            className="text-blue-600 mr-3"
                          />
                          <div className="flex items-center gap-2">
                            <span className={`w-3 h-3 rounded-full ${
                              stage === 'Assessment' ? 'bg-amber-400' : 
                              stage === 'Planning' ? 'bg-blue-400' : 
                              stage === 'Implementation' ? 'bg-purple-400' : 'bg-green-400'
                            }`}></span>
                            <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">{stage}</span>
                          </div>
                        </label>
                      ))}
                      
                      <div className="pt-3 mt-2 border-t border-gray-100">
                        <button className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
                          Update Stage
                        </button>
                      </div>
                    </div>
                  )}

                  {activeTab === "Type" && (
                    <div className="space-y-2">
                      <label className="flex items-center p-3 rounded-lg hover:bg-gray-50 cursor-pointer group">
                        <input type="radio" name="type" className="text-blue-600 mr-3" checked />
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-blue-400"></span>
                          <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">RFP</span>
                        </div>
                      </label>
                      <label className="flex items-center p-3 rounded-lg hover:bg-gray-50 cursor-pointer group">
                        <input type="radio" name="type" className="text-blue-600 mr-3" />
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-green-400"></span>
                          <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">Project</span>
                        </div>
                      </label>
                      <label className="flex items-center p-3 rounded-lg hover:bg-gray-50 cursor-pointer group">
                        <input type="radio" name="type" className="text-blue-600 mr-3" />
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-purple-400"></span>
                          <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">Proposal</span>
                        </div>
                      </label>
                      
                      <div className="pt-3 mt-2 border-t border-gray-100">
                        <button className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
                          Update Type
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Tags */}
                <div className="p-4 border-t border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Tag size={16} className="text-blue-500" />
                      Tags
                    </h3>
                    <button className="text-xs text-blue-600 hover:text-blue-700 hover:underline">
                      Manage
                    </button>
                  </div>
                  <div className="relative mb-4">
                    <input
                      type="text"
                      placeholder="Search tags..."
                      className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-transparent bg-white shadow-sm"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search size={16} className="text-gray-400" />
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <div className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium flex items-center gap-1">
                      <span>Government</span>
                      <button className="p-0.5 hover:bg-blue-200 rounded-full">
                        <X size={12} />
                      </button>
                    </div>
                    <div className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium flex items-center gap-1">
                      <span>Technology</span>
                      <button className="p-0.5 hover:bg-blue-200 rounded-full">
                        <X size={12} />
                      </button>
                    </div>
                    <button className="px-3 py-1.5 border border-dashed border-gray-300 text-blue-600 hover:bg-blue-50 rounded-full text-xs font-medium flex items-center gap-1 transition-colors">
                      <Plus size={12} />
                      <span>Add Tag</span>
                    </button>
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












