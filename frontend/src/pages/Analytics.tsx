import React, { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { supabase } from "../utils/supabase";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Papa from "papaparse";
import { toPng } from "html-to-image";
import { useNavigate } from "react-router-dom";

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
  const [monthlyStats, setMonthlyStats] = useState([]);
  const [pursuits, setPursuits] = useState([]);
  const [loading, setLoading] = useState(true);

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
      setLoading(true);
      // --- Monthly stats (last 6 months) ---
      const today = new Date();
      const currentYear = today.getFullYear();
      const currentMonth = today.getMonth();
      const stats = [];
      for (let i = 0; i < 6; i++) {
        const targetDate = new Date(currentYear, currentMonth - i, 1);
        const monthName = targetDate.toLocaleString('default', { month: 'short' });
        const year = targetDate.getFullYear();
        const startDate = new Date(year, targetDate.getMonth(), 1);
        const endDate = new Date(year, targetDate.getMonth() + 1, 0);
        const startDateStr = startDate.toISOString().split('T')[0];
        const endDateStr = endDate.toISOString().split('T')[0];
        const { data, error } = await supabase
          .from('sam_gov')
          .select('id')
          .gte('published_date', startDateStr)
          .lte('published_date', endDateStr);
        stats.unshift({
          month: monthName,
          year: year,
          count: data?.length || 0,
          startDate: startDate,
          endDate: endDate
        });
      }
      setMonthlyStats(stats);

      // --- All pursuits (for table) ---
      const { data: pursuitsData } = await supabase
        .from('pursuits')
        .select('id, title, stage, due_date, is_submitted, updated_at')
        .order('updated_at', { ascending: false });
      setPursuits(pursuitsData || []);
      setLoading(false);
    };
    fetchData();
  }, []);

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

  const navigate = useNavigate();

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Detailed Analytics</h1>
        <button
          onClick={() => navigate("/dashboard")}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition font-semibold"
        >
          Close
        </button>
      </div>
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
            className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholderText="Select date range"
          />
        </div>
        {/* Stage Dropdown */}
        <div className="flex flex-col">
          <label className="text-xs font-semibold text-gray-600 mb-1">Stage</label>
          <select
            value={stage}
            onChange={e => setStage(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {STAGE_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        {/* Status Dropdown */}
        <div className="flex flex-col">
          <label className="text-xs font-semibold text-gray-600 mb-1">Submission Status</label>
          <select
            value={status}
            onChange={e => setStatus(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {STATUS_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>
      {loading ? (
        <div>Loading analytics...</div>
      ) : (
        <>
          {/* Export buttons for charts */}
          <div className="flex flex-wrap gap-4 mb-4">
            <button
              onClick={handleExportChart}
              className="px-4 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700 transition"
            >
              Export Bar Chart as PNG
            </button>
          </div>
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
            {/* Line Chart: Pursuit Trends */}
            <div className="bg-white p-6 rounded-lg shadow border flex flex-col items-center">
              <h2 className="text-lg font-semibold mb-4">Pursuit Trends</h2>
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
                    <Line type="monotone" dataKey="count" stroke="#2563eb" name="Pursuits" strokeWidth={3} dot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
          {/* Bar Chart: Monthly Stats */}
          <div className="mb-8 bg-white p-6 rounded-lg shadow border">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Pursuits Added (Last 6 Months)</h2>
              <button
                onClick={handleExportChart}
                className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-xs font-medium"
              >
                Export as PNG
              </button>
            </div>
            <div ref={barChartRef} className="w-full h-[300px]">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={filteredMonthlyStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#2563eb" name="Pursuits" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">All Pursuits</h2>
              <button
                onClick={handleExportCSV}
                className="px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 text-xs font-medium"
              >
                Export as CSV
              </button>
            </div>
            {/* Search box */}
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center gap-2">
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by title or stage..."
                className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-64"
              />
              <div className="text-xs text-gray-500 ml-auto">
                Showing {paginatedPursuits.length} of {searchedPursuits.length} results
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left">Title</th>
                    <th className="px-4 py-2 text-left">Stage</th>
                    <th className="px-4 py-2 text-left">Due Date</th>
                    <th className="px-4 py-2 text-left">Submitted</th>
                    <th className="px-4 py-2 text-left">Last Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedPursuits.map((p) => (
                    <tr key={p.id} className="border-t">
                      <td className="px-4 py-2">{p.title}</td>
                      <td className="px-4 py-2">{p.stage}</td>
                      <td className="px-4 py-2">{p.due_date ? new Date(p.due_date).toLocaleDateString() : "N/A"}</td>
                      <td className="px-4 py-2">{p.is_submitted ? "Yes" : "No"}</td>
                      <td className="px-4 py-2">{p.updated_at ? new Date(p.updated_at).toLocaleString() : "N/A"}</td>
                    </tr>
                  ))}
                  {paginatedPursuits.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-4 text-gray-400">No pursuits found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {/* Pagination controls */}
            <div className="flex justify-between items-center mt-4">
              <div className="text-xs text-gray-500">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex gap-2">
                <button
                  className="px-3 py-1 rounded border border-gray-300 text-sm bg-white hover:bg-blue-50 disabled:opacity-50"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </button>
                <button
                  className="px-3 py-1 rounded border border-gray-300 text-sm bg-white hover:bg-blue-50 disabled:opacity-50"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Analytics; 