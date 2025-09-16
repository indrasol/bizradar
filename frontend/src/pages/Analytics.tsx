import React, { useEffect, useState, useRef } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { supabase } from "../utils/supabase";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Papa from "papaparse";
import { toPng } from "html-to-image";
import { useNavigate, Link } from "react-router-dom";
import SideBar from "../components/layout/SideBar";
import { useAuth } from "../components/Auth/useAuth";
import { UpgradeModal } from "@/components/subscription/UpgradeModal";
import { subscriptionApi } from "@/api/subscription";
import { Star, BarChart3, Calendar, Target, ChevronDown, Check } from "lucide-react";
import { DashboardTemplate } from "../utils/responsivePatterns";
import DeadlineRiskWidget from "../components/analytics/DeadlineRiskWidget";
import PerformanceMetricsWidget from "../components/analytics/PerformanceMetricsWidget";

const STAGE_OPTIONS = [
  { value: '', label: 'All Stages' },
  { value: 'Assessment', label: 'Assessment' },
  { value: 'RFP Response Initiated', label: 'RFP Response Initiated' },
  { value: 'RFP Response Completed', label: 'RFP Response Completed' },
  // Add any other real stages here
];
const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'not_submitted', label: 'Not Submitted' },
];
const PIE_COLORS = ["#2563eb", "#10b981", "#f59e42", "#f43f5e", "#6366f1", "#fbbf24", "#14b8a6", "#a21caf"];

const Analytics = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [monthlyStats, setMonthlyStats] = useState([]);
  const [pursuits, setPursuits] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Subscription state
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);

  // Dropdown states
  const [stageDropdownOpen, setStageDropdownOpen] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const stageDropdownRef = useRef(null);
  const statusDropdownRef = useRef(null);

  // Filter state
  const [dateRange, setDateRange] = useState([null, null]);
  const [startDate, endDate] = dateRange;
  const [stage, setStage] = useState('');
  const [status, setStatus] = useState('');

  // Filtered data
  const [filteredPursuits, setFilteredPursuits] = useState([]);
  const [filteredMonthlyStats, setFilteredMonthlyStats] = useState([]);

  // Table search and pagination state
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  // Filtered, searched, and paginated pursuits
  const searchedPursuits = React.useMemo(() => {
    if (!search.trim()) return filteredPursuits;
    const lower = search.toLowerCase();
    return filteredPursuits.filter(
      p =>
        (p.title && p.title.toLowerCase().includes(lower)) ||
        (p.stage && p.stage.toLowerCase().includes(lower))
    );
  }, [filteredPursuits, search]);

  const totalPages = Math.ceil(searchedPursuits.length / rowsPerPage) || 1;
  const paginatedPursuits = React.useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return searchedPursuits.slice(start, start + rowsPerPage);
  }, [searchedPursuits, currentPage]);

  // Reset to page 1 if search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, filteredPursuits]);

  // Fetch monthly stats and all pursuits
  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);

      // Determine last 6 months buckets
      const today = new Date();
      const startMonth = new Date(today.getFullYear(), today.getMonth() - 5, 1);

      // Fetch trackers for current user (including created_at)
      const { data: trackersData } = await supabase
        .from('trackers')
        .select('id, title, stage, due_date, is_submitted, updated_at, created_at')
        .eq('user_id', user.id)
        .gte('created_at', startMonth.toISOString().split('T')[0])
        .order('created_at', { ascending: true });

      // Build month buckets for last 6 months
      const monthBuckets = [] as any[];
      for (let i = 5; i >= 0; i--) {
        const bucketDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const monthName = bucketDate.toLocaleString('default', { month: 'short' });
        const year = bucketDate.getFullYear();
        const bucketStart = new Date(year, bucketDate.getMonth(), 1);
        const bucketEnd = new Date(year, bucketDate.getMonth() + 1, 0);
        monthBuckets.push({
          month: monthName,
          year,
          count: 0,
          startDate: bucketStart,
          endDate: bucketEnd,
        });
      }

      // Aggregate trackers by created_at month
      (trackersData || []).forEach((t: any) => {
        if (!t.created_at) return;
        const d = new Date(t.created_at);
        
        // Find the correct month bucket
        const bucket = monthBuckets.find(b => {
          const bucketYear = b.year;
          const bucketMonth = new Date(bucketYear, b.startDate.getMonth()).getMonth();
          const trackerYear = d.getFullYear();
          const trackerMonth = d.getMonth();
          
          return bucketYear === trackerYear && bucketMonth === trackerMonth;
        });
        
        if (bucket) {
          bucket.count += 1;
        }
      });

      setMonthlyStats(monthBuckets);

      // Set pursuits for table (unfiltered; filters apply later)
      setPursuits(trackersData || []);
      setLoading(false);
    };
    fetchData();
  }, [user]);

  // Filtering logic
  useEffect(() => {
    let filtered = [...pursuits];
    // Date filter
    if (startDate && endDate) {
      filtered = filtered.filter(p => {
        if (!p.due_date) return false;
        const due = new Date(p.due_date);
        return due >= startDate && due <= endDate;
      });
    }
    // Stage filter
    if (stage) {
      filtered = filtered.filter(p => p.stage === stage);
    }
    // Status filter (maps to stage)
    if (status === 'submitted') {
      filtered = filtered.filter(p => p.is_submitted === true);
    } else if (status === 'not_submitted') {
      filtered = filtered.filter(p => p.is_submitted === false);
    }
    setFilteredPursuits(filtered);

    // Filter monthly stats for chart
    let filteredStats = [...monthlyStats];
    if (startDate && endDate) {
      filteredStats = filteredStats.filter(m => {
        // Only include months that overlap with the selected range
        return (
          m.endDate >= startDate && m.startDate <= endDate
        );
      });
    }
    setFilteredMonthlyStats(filteredStats);
  }, [pursuits, monthlyStats, startDate, endDate, stage, status]);

  // Load subscription data
  useEffect(() => {
    const loadSubscription = async () => {
      if (!user) {
        setSubscriptionLoading(false);
        return;
      }

      try {
        const subscription = await subscriptionApi.getCurrentSubscription();
        setCurrentSubscription(subscription);
      } catch (error) {
        console.error('Error loading subscription:', error);
      } finally {
        setSubscriptionLoading(false);
      }
    };

    loadSubscription();
  }, [user]);

  // Click outside handlers for dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (stageDropdownRef.current && !stageDropdownRef.current.contains(event.target)) {
        setStageDropdownOpen(false);
      }
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target)) {
        setStatusDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Helper functions for dropdown labels
  const getSelectedStageLabel = () => {
    const selected = STAGE_OPTIONS.find(opt => opt.value === stage);
    return selected ? selected.label : 'All Stages';
  };

  const getSelectedStatusLabel = () => {
    const selected = STATUS_OPTIONS.find(opt => opt.value === status);
    return selected ? selected.label : 'All Statuses';
  };


  // Pie chart data for stage breakdown
  const stageBreakdown = React.useMemo(() => {
    const counts = {};
    filteredPursuits.forEach(p => {
      counts[p.stage] = (counts[p.stage] || 0) + 1;
    });
    return Object.entries(counts).map(([stage, value]) => ({ name: stage, value }));
  }, [filteredPursuits]);

  // Line chart data for pursuit trends (by month)
  const lineChartData = React.useMemo(() => {
    // Group by month/year
    type LineChartDatum = { month: string; year: number; count: number };
    const map: Record<string, LineChartDatum> = {};
    filteredPursuits.forEach(p => {
      if (!p.due_date) return;
      const d = new Date(p.due_date);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      if (!map[key]) {
        map[key] = { month: d.toLocaleString('default', { month: 'short' }), year: d.getFullYear(), count: 0 };
      }
      map[key].count += 1;
    });
    // Sort by year/month
    return Object.values(map).sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      // Compare months as numbers (Jan=0, Feb=1, ...)
      const monthA = new Date(`${a.month} 1, ${a.year}`).getMonth();
      const monthB = new Date(`${b.month} 1, ${b.year}`).getMonth();
      return monthA - monthB;
    });
  }, [filteredPursuits]);

  // Export refs
  const barChartRef = React.useRef(null);

  // Export table as CSV
  const handleExportCSV = () => {
    const csv = Papa.unparse(
      searchedPursuits.map(p => ({
        Title: p.title,
        Stage: p.stage,
        "Due Date": p.due_date ? new Date(p.due_date).toLocaleDateString() : "N/A",
        Submitted: p.is_submitted ? "Yes" : "No",
        "Last Updated": p.updated_at ? new Date(p.updated_at).toLocaleString() : "N/A"
      }))
    );
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "pursuits_analytics.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export bar chart as PNG
  const handleExportChart = async () => {
    if (!barChartRef.current) return;
    try {
      const dataUrl = await toPng(barChartRef.current, { cacheBust: true });
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = "pursuits_bar_chart.png";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      alert("Failed to export chart as image.");
    }
  };

  return (
    <div className={DashboardTemplate.wrapper}>
      {/* Upgrade Modal */}
      <UpgradeModal 
        isOpen={upgradeOpen} 
        onClose={() => setUpgradeOpen(false)} 
        onSuccess={() => setUpgradeOpen(false)}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <SideBar />

        {/* Main content */}
        <div className={DashboardTemplate.main}>
          {/* Page content */}
          <div className={DashboardTemplate.content}>
            <div className="w-full">
              {/* Page header - moved to top for seamless UI */}
              <div className="flex items-center mb-6 bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="mr-6 w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-md">
                  <BarChart3 className="h-8 w-8" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Analytics Dashboard
                  </h1>
                  <div className="flex items-center mt-1 text-sm text-gray-500">
                    <Calendar className="h-4 w-4 mr-1" />
                    <span>{new Date().toLocaleDateString()}</span>
                    <span className="mx-2">•</span>
                    <span className="flex items-center">
                      <Target className="h-4 w-4 mr-2 text-blue-500" />
                      Tracker Analytics
                    </span>
                  </div>
                </div>
              </div>

              {/* Analytics content */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      {/* Filter Bar */}
      <div className="flex flex-wrap gap-4 items-center bg-white p-4 rounded-lg shadow border mb-8">
        {/* Date Range Picker */}
        <div className="flex flex-col">
          <label className="text-xs font-semibold text-gray-600 mb-1">Due Date Range</label>
          <DatePicker
            selectsRange
            startDate={startDate}
            endDate={endDate}
            onChange={(update) => setDateRange(update)}
            isClearable={true}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors min-w-[160px]"
            placeholderText="Select date range"
          />
        </div>
        {/* Stage Dropdown */}
        <div className="flex flex-col relative" ref={stageDropdownRef}>
          <label className="text-xs font-semibold text-gray-600 mb-1">Stage</label>
          <button
            onClick={() => setStageDropdownOpen(!stageDropdownOpen)}
            className="flex items-center justify-between bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors min-w-[160px]"
          >
            <span className="text-gray-700">{getSelectedStageLabel()}</span>
            <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${stageDropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          
          {stageDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
              {STAGE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => {
                    setStage(opt.value);
                    setStageDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-50 transition-colors flex items-center justify-between ${
                    stage === opt.value ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700'
                  }`}
                >
                  <span>{opt.label}</span>
                  {stage === opt.value && <Check className="h-4 w-4 text-blue-600" />}
                </button>
              ))}
            </div>
          )}
        </div>
        {/* Status Dropdown */}
        <div className="flex flex-col relative" ref={statusDropdownRef}>
          <label className="text-xs font-semibold text-gray-600 mb-1">Submission Status</label>
          <button
            onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
            className="flex items-center justify-between bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors min-w-[160px]"
          >
            <span className="text-gray-700">{getSelectedStatusLabel()}</span>
            <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${statusDropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          
          {statusDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
              {STATUS_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => {
                    setStatus(opt.value);
                    setStatusDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-50 transition-colors flex items-center justify-between ${
                    status === opt.value ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700'
                  }`}
                >
                  <span>{opt.label}</span>
                  {status === opt.value && <Check className="h-4 w-4 text-blue-600" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      {loading ? (
        <div>Loading analytics...</div>
      ) : (
        <>
          {/* Export buttons for charts */}
          {/* <div className="flex flex-wrap gap-4 mb-4">
            <button
              onClick={handleExportChart}
              className="px-4 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700 transition"
            >
              Export Bar Chart as PNG
            </button>
          </div> */}
          {/* Deadline Risk Assessment - Full Width */}
          {/* <div className="mb-8">
            <DeadlineRiskWidget />
          </div> */}

          {/* Performance Metrics - Full Width */}
          {/* <div className="mb-8">
            <PerformanceMetricsWidget />
          </div> */}

          {/* Charts Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {/* Pie Chart: Stage Breakdown */}
            <div className="bg-white p-6 rounded-lg shadow border flex flex-col items-center">
              <h2 className="text-lg font-semibold mb-4">Stage Breakdown</h2>
              {stageBreakdown.length === 0 ? (
                <div className="text-gray-400">No data for selected filters.</div>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={stageBreakdown}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {stageBreakdown.map((entry, idx) => (
                        <Cell key={`cell-${idx}`} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
            {/* Line Chart: Tracker Trends */}
            <div className="bg-white p-6 rounded-lg shadow border flex flex-col items-center">
              <h2 className="text-lg font-semibold mb-4">Tracker Trends</h2>
              {lineChartData.length === 0 ? (
                <div className="text-gray-400">No data for selected filters.</div>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={lineChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="count" stroke="#2563eb" name="Opportunities Tracked" strokeWidth={3} dot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
          {/* Bar Chart: Monthly Stats */}
          <div className="mb-8 bg-white p-6 rounded-lg shadow border">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Opportunities added to Tracker (Last 6 Months)</h2>
              <button
                onClick={handleExportChart}
                className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-xs font-medium"
              >
                Export as PNG
              </button>
            </div>
            <div ref={barChartRef} className="w-full h-[300px]">
              {filteredMonthlyStats && filteredMonthlyStats.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={filteredMonthlyStats} margin={{ top: 16, right: 24, bottom: 8, left: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#2563eb" name="Opportunities Added" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                  No data for selected filters.
                </div>
              )}
            </div>
          </div>

          {/* All Pursuits table removed for cleaner analytics focus */}
              </>
            )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics; 