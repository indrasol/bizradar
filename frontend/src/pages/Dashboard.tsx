import React, { useState, useRef, useEffect, useCallback } from "react";
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
  ExternalLink,
  X,
  Sparkle,
  Sparkles,
  ChevronLeft,
  Star,
  LogOut,
  Power,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import SideBar from "../components/layout/SideBar";
import { useAuth } from "../components/Auth/useAuth";
import { supabase } from "../utils/supabase";
import { toast } from "sonner";
import { UpgradeModal } from "@/components/subscription/UpgradeModal";
import { NotificationDropdown } from '@/components/notifications/NotificationDropdown';
import StripePaymentVerifier from '@/components/ui/StripePaymentVerifier';
import { useUpgradeModal } from "@/components/subscription/UpgradeModalContext";
import { API_ENDPOINTS } from "@/config/apiEndpoints";


// const [showUpgradeModal, setShowUpgradeModal] = useState(false);
const BizRadarDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const firstName = user?.user_metadata?.first_name || "";
  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  const [isDisabled, setIsDisabled] = useState(false);

  // State for monthly pursuit data
  const [monthlyPursuits, setMonthlyPursuits] = useState({
    count: 0,
    month: "Apr",
    year: 2025,
  });

  const [isLoading, setIsLoading] = useState(true);

  // Add dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newPursuit, setNewPursuit] = useState({
    title: "",
    description: "",
    stage: "Assessment",
    due_date: null,
    tags: [],
  });

  // Handle logout
  const handleLogout = async () => {
    try {
      setIsDisabled(true);
      await logout();
      toast.success("Logging out...");
      navigate("/logout");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("There was a problem logging out");
    }
  };

  // File input ref
  const fileInputRef = useRef(null);
  const [selectedFiles, setSelectedFiles] = useState([]);

  // Add these new state variables
  const [monthlyStats, setMonthlyStats] = useState([]);
  const [isChartVisible, setIsChartVisible] = useState(false);

  // Update the action items state definition
  const [actionItems, setActionItems] = useState({
    count: 0,
    dueToday: 0,
    items: [],
    completed: 0,
  });

  // First, add this state for submitted pursuits
  const [submittedPursuits, setSubmittedPursuits] = useState([]);

  // --- AI Recommendations State ---
  const [aiRecommendations, setAiRecommendations] = useState([]);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);

  // Add state for tracking which pursuit is being added
  const [addingPursuitId, setAddingPursuitId] = useState(null);

  // Add state to store fetched opportunities for use in rendering
  const [dashboardOpportunities, setDashboardOpportunities] = useState([]);

  // --- Add state for follow-up modal and notes ---
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [followUpPursuit, setFollowUpPursuit] = useState(null);
  const [followUpNotes, setFollowUpNotes] = useState([]);
  const [newFollowUpNote, setNewFollowUpNote] = useState("");

  // Add these new state variables for the modal and opportunities
  const [showMonthOpportunitiesModal, setShowMonthOpportunitiesModal] = useState(false);
  const [monthOpportunities, setMonthOpportunities] = useState([]);
  const [oppsLoading, setOppsLoading] = useState(false);
  const [oppsFilter, setOppsFilter] = useState("");
  const [oppsSort, setOppsSort] = useState({ key: "published_date", direction: "desc" });

  // Add state for pagination
  const [oppsPerPage, setOppsPerPage] = useState(10);
  const [oppsPage, setOppsPage] = useState(1);

  // Function to navigate to previous month
  const navigateToPreviousMonth = () => {
    // Get previous month data using proper Date object handling
    const fullMonthName = getFullMonthName(monthlyPursuits.month);
    const currentMonthNum = parseInt(getMonthNumber(fullMonthName)) - 1; // Convert to 0-based index
    const previousMonthDate = new Date(monthlyPursuits.year, currentMonthNum - 1, 1);

    const monthName = previousMonthDate.toLocaleString('default', { month: 'long' });
    const year = previousMonthDate.getFullYear();

    fetchMonthData(monthName, year);
  };

  // Function to navigate to next month
  const navigateToNextMonth = () => {
    // Get current date for comparison
    const today = new Date();
    const currentRealMonth = today.getMonth();
    const currentRealYear = today.getFullYear();

    // Get next month data
    const fullMonthName = getFullMonthName(monthlyPursuits.month);
    const currentMonthNum = parseInt(getMonthNumber(fullMonthName)) - 1; // Convert to 0-based index
    const nextMonthDate = new Date(monthlyPursuits.year, currentMonthNum + 1, 1);

    // Don't allow navigation past current real month/year
    if (nextMonthDate.getMonth() > currentRealMonth &&
      nextMonthDate.getFullYear() >= currentRealYear) {
      return; // Don't navigate past current month
    }

    const monthName = nextMonthDate.toLocaleString('default', { month: 'long' });
    const year = nextMonthDate.getFullYear();

    fetchMonthData(monthName, year);
  };

  // Function to fetch data for a specific month with proper date handling
  const fetchMonthData = async (monthName: string, year: number) => {
    try {
      setIsLoading(true);

      // Calculate start and end dates for the month (using proper Date object handling)
      const monthNum = getMonthNumber(monthName);
      const startDate = new Date(year, parseInt(monthNum) - 1, 1); // Convert to 0-based month index

      // Calculate end date as last day of month
      const endDate = new Date(year, parseInt(monthNum), 0);

      // For current month, limit end date to today
      const today = new Date();
      const isCurrentMonth = startDate.getMonth() === today.getMonth() &&
        startDate.getFullYear() === today.getFullYear();

      const queryEndDate = isCurrentMonth ? today : endDate;

      // Format dates for database query
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = queryEndDate.toISOString().split('T')[0];

      console.log(`Fetching data for ${monthName} ${year}: ${startDateStr} to ${endDateStr}`);

      // Query sam_gov table for this month's pursuits
      const { data: monthPursuits, error } = await supabase
        .from('sam_gov')
        .select('id')
        .gte('published_date', startDateStr)
        .lte('published_date', endDateStr)
        .eq('active', true);

      if (error) throw error;

      // Update state with the calculated data
      setMonthlyPursuits({
        count: monthPursuits?.length || 0,
        month: getShortMonthName(monthName),
        year: year
      });

    } catch (error) {
      console.error(`Error fetching data for ${monthName} ${year}:`, error);
      toast.error("Failed to load pursuits data");
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to get month number from name
  const getMonthNumber = (monthName) => {
    const months = {
      'January': '01', 'February': '02', 'March': '03', 'April': '04',
      'May': '05', 'June': '06', 'July': '07', 'August': '08',
      'September': '09', 'October': '10', 'November': '11', 'December': '12'
    };
    return months[monthName] || '01';
  };

  // Helper function to convert full month name to short form
  const getShortMonthName = (fullMonthName) => {
    const shortMonths = {
      'January': 'Jan', 'February': 'Feb', 'March': 'Mar', 'April': 'Apr',
      'May': 'May', 'June': 'Jun', 'July': 'Jul', 'August': 'Aug',
      'September': 'Sep', 'October': 'Oct', 'November': 'Nov', 'December': 'Dec'
    };
    return shortMonths[fullMonthName] || fullMonthName;
  };

  // Helper function to convert short month name back to full name
  const getFullMonthName = (shortMonthName) => {
    const fullMonths = {
      'Jan': 'January', 'Feb': 'February', 'Mar': 'March', 'Apr': 'April',
      'May': 'May', 'Jun': 'June', 'Jul': 'July', 'Aug': 'August',
      'Sep': 'September', 'Oct': 'October', 'Nov': 'November', 'Dec': 'December'
    };
    return fullMonths[shortMonthName] || shortMonthName;
  };

  // Fetch current month's pursuit data on component mount
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const today = new Date();
        const currentMonth = today.toLocaleString('default', { month: 'long' });
        const currentYear = today.getFullYear();

        await Promise.all([
          fetchMonthData(currentMonth, currentYear),
          fetchHistoricalData(),
          fetchActionItems()
        ]);
      } catch (error) {
        console.error("Error loading dashboard data:", error);
        toast.error("Failed to load some dashboard data");
      }
    };

    loadDashboardData();
  }, []);

  // Add function to toggle dialog
  const toggleDialog = () => {
    setIsDialogOpen(!isDialogOpen);
    if (!isDialogOpen) {
      // Reset form when opening
      setNewPursuit({
        title: "",
        description: "",
        stage: "Assessment",
        due_date: null,
        tags: [],
      });
      setSelectedFiles([]);
    }
  };

  // Function to handle file selection
  const handleFileSelect = (e) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setSelectedFiles([...selectedFiles, ...filesArray]);
    }
  };

  // Function to remove a selected file
  const removeFile = (index) => {
    const newFiles = [...selectedFiles];
    newFiles.splice(index, 1);
    setSelectedFiles(newFiles);
  };

  // Function to handle drag and drop
  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      const filesArray = Array.from(e.dataTransfer.files);
      setSelectedFiles([...selectedFiles, ...filesArray]);
    }
  };

  // Prevent default for drag events
  const handleDragOver = (e) => {
    e.preventDefault();
  };

  // Function to handle create pursuit
  const handleCreatePursuit = async () => {
    try {
      // Get the current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        console.log("No user logged in");
        return;
      }

      // Format due date if provided
      let formattedDueDate = null;
      if (newPursuit.due_date) {
        formattedDueDate = new Date(newPursuit.due_date).toISOString();
      }

      // Create new pursuit
      const { data, error } = await supabase
        .from("pursuits")
        .insert({
          title: newPursuit.title || "Untitled",
          description: newPursuit.description || "",
          stage: newPursuit.stage || "Assessment",
          user_id: user.id,
          due_date: formattedDueDate,
        })
        .select();

      if (error) {
        console.error("Insert error details:", error);
        throw error;
      }

      console.log("Added successfully:", data);

      if (data && data.length > 0) {
        // Show success message
        toast.success("Pursuit created successfully");

        // Refresh monthly data
        fetchMonthData(monthlyPursuits.month, monthlyPursuits.year);

        // Close dialog
        toggleDialog();
      }
    } catch (error) {
      console.error("Error creating pursuit:", error);
      toast.error("Failed to create pursuit. Please try again.");
    }
  };

  // Add this after your existing fetchMonthData function

  const fetchHistoricalData = async () => {
    try {
      const today = new Date();
      const currentYear = today.getFullYear();
      const currentMonth = today.getMonth();

      const historicalData = [];

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

        if (error) throw error;

        historicalData.unshift({
          month: monthName,
          year: year,
          count: data?.length || 0
        });
      }

      setMonthlyStats(historicalData);
    } catch (error) {
      console.error("Error fetching historical data:", error);
    }
  };

  // Update the fetchActionItems function with better error handling and sorting
  const fetchActionItems = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        console.error("No user logged in");
        return;
      }

      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];

      // Fixed OR query syntax
      const { data, error } = await supabase
        .from('pursuits')
        .select('id, title, stage, due_date, is_submitted')
        .eq('user_id', user.id)
        .eq('is_submitted', false)
        .or('stage.eq.Assessment,stage.ilike.%RFP Response Initiated%');

      if (error) {
        console.error("Error fetching action items:", error);
        throw error;
      }

      // Rest of the function remains the same
      const { data: completedData, error: completedError } = await supabase
        .from('pursuits')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_submitted', true);

      if (completedError) {
        console.error("Error fetching completed items:", completedError);
        throw completedError;
      }

      const dueTodayCount = data?.filter(item => {
        if (!item.due_date) return false;
        const dueDate = item.due_date.split('T')[0];
        return dueDate === todayStr;
      }).length || 0;

      const sortedItems = [...(data || [])].sort((a, b) => {
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      });

      setActionItems({
        count: data?.length || 0,
        dueToday: dueTodayCount,
        items: sortedItems.slice(0, 2),
        completed: completedData?.length || 0,
      });

    } catch (error) {
      console.error("Error in fetchActionItems:", error);
      toast.error("Failed to load action items");
    }
  };

  // Add this function to fetch submitted pursuits
  const fetchSubmittedPursuits = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return;

      const { data, error } = await supabase
        .from('pursuits')
        .select('id, title, stage, updated_at, is_submitted')
        .eq('user_id', user.id)
        .eq('is_submitted', true)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      setSubmittedPursuits(data || []);
    } catch (error) {
      console.error("Error fetching submitted pursuits:", error);
      toast.error("Failed to load submitted pursuits");
    }
  };

  // Add this to your useEffect
  useEffect(() => {
    fetchSubmittedPursuits();
  }, []);

  // Add this helper function for formatting time ago
  const formatTimeAgo = (timestamp: string): string => {
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }

      const now = new Date();
      const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);
      const months = Math.floor(days / 30);
      const years = Math.floor(days / 365);

      if (years > 0) return `${years} ${years === 1 ? 'year' : 'years'} ago`;
      if (months > 0) return `${months} ${months === 1 ? 'month' : 'months'} ago`;
      if (days > 0) return `${days} ${days === 1 ? 'day' : 'days'} ago`;
      if (hours > 0) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
      if (minutes > 0) return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
      return 'just now';
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Date unavailable';
    }
  };

  // --- Update handleFollowUp to open the follow-up modal ---
  const handleFollowUp = async (pursuit) => {
    setFollowUpPursuit(pursuit);
    setShowFollowUpModal(true);
    setNewFollowUpNote("");
    if (!user) {
      setFollowUpNotes([]);
      return;
    }
    const { data, error } = await supabase
      .from("pursuit_followup_notes")
      .select("note, created_at")
      .eq("pursuit_id", pursuit.id)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (error) {
      setFollowUpNotes([]);
    } else {
      setFollowUpNotes(data || []);
    }
  };

  // --- Save new note to Supabase ---
  const handleSaveFollowUpNote = async () => {
    if (!newFollowUpNote.trim() || !user || !followUpPursuit) return;
    const noteText = newFollowUpNote.trim();
    const { data, error } = await supabase
      .from("pursuit_followup_notes")
      .insert({
        pursuit_id: followUpPursuit.id,
        user_id: user.id,
        note: noteText,
      });
    if (!error) {
      setFollowUpNotes([{ note: noteText, created_at: new Date().toISOString() }, ...followUpNotes]);
      setNewFollowUpNote("");
    }
  };

  const { isOpen: upgradeOpen, openModal: setUpgradeOpen, closeModal } = useUpgradeModal();

  const handleUpgradeSuccess = () => {
    closeModal();
    toast.success('Your subscription has been upgraded successfully!');
  };

  // --- Fetch Opportunities and Recommendations on Load ---
  useEffect(() => {
    const fetchRecommendations = async () => {
      setIsLoadingRecommendations(true);

      // 1. Get user profile and userId for searchQuery
      let companyUrl = "";
      let companyDescription = "";
      try {
        const userProfileStr = sessionStorage.getItem("userProfile");
        if (userProfileStr) {
          const userProfile = JSON.parse(userProfileStr);
          companyUrl = userProfile.companyUrl || "";
          companyDescription = userProfile.companyDescription || "";
        }
      } catch (e) {}
      let userId = null;
      try {
        const tokenService = (await import("../utils/tokenService")).default;
        userId = tokenService.getUserIdFromToken();
      } catch (e) {}

      // 2. Generate searchQuery
      // const searchQuery = `${companyUrl || ""}|${companyDescription || ""}|${userId || ""}`;
      const searchQuery = "";

      // 3. Check cache first
      const cache = sessionStorage.getItem('dashboardAiRecommendations');
      if (cache) {
        const parsed = JSON.parse(cache);
        if (
          parsed.searchQuery === searchQuery &&
          parsed.recommendations &&
          parsed.dashboardOpportunities &&
          Date.now() - parsed.timestamp < 60 * 60 * 1000 // 1 hour
        ) {
          setAiRecommendations(parsed.recommendations.slice(0, 3));
          setDashboardOpportunities(parsed.dashboardOpportunities);
          setIsLoadingRecommendations(false);
          return;
        }
      }

      // 4. If not cached, fetch opportunities and proceed as before
      const response = await fetch(API_ENDPOINTS.SEARCH_OPPORTUNITIES, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          page: 1,
          page_size: 10,
          user_id: userId,
          query: "",
          is_new_search: true,
        }),
      });
      const data = await response.json();
      if (!data.success || !Array.isArray(data.results) || data.results.length === 0) {
        setAiRecommendations([]);
        setIsLoadingRecommendations(false);
        return;
      }
      const opportunities = data.results;

      // Filter for future response_date
      const now = new Date();
      const futureOpportunities = opportunities.filter(opp => {
        if (!opp.response_date) return false;
        const respDate = new Date(opp.response_date);
        return respDate > now;
      });
      setDashboardOpportunities(futureOpportunities);

      // 5. Call AI recommendations API
      const recResponse = await fetch(API_ENDPOINTS.AI_RECOMMENDATIONS, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyUrl,
          companyDescription,
          opportunities: futureOpportunities.slice(0, 10),
          responseFormat: "json",
          includeMatchReason: true,
          userId,
          searchQuery,
        }),
      });
      const recData = await recResponse.json();
      if (recData && Array.isArray(recData.recommendations)) {
        const sortedRecs = [...recData.recommendations].sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
        setAiRecommendations(sortedRecs.slice(0, 3));
        sessionStorage.setItem(
          'dashboardAiRecommendations',
          JSON.stringify({
            recommendations: sortedRecs,
            dashboardOpportunities: futureOpportunities,
            timestamp: Date.now(),
            searchQuery,
          })
        );
      } else {
        setAiRecommendations([]);
      }
      setIsLoadingRecommendations(false);
    };
    fetchRecommendations();
  }, []);

  // Add to Pursuits handler
  const handleAddToPursuit = async (opportunity) => {
    if (!user) {
      toast.error("You must be logged in to add pursuits.");
      return;
    }
    setAddingPursuitId(opportunity.id);
    try {
      // Always use the original opportunity title if available
      let originalTitle = opportunity.title;
      if (typeof opportunity.opportunityIndex === 'number' && dashboardOpportunities[opportunity.opportunityIndex]) {
        originalTitle = dashboardOpportunities[opportunity.opportunityIndex].title;
      }
      // Check if already added
      const { data: existingPursuits } = await supabase
        .from("pursuits")
        .select("id")
        .eq("user_id", user.id)
        .eq("title", originalTitle);
      if (existingPursuits && existingPursuits.length > 0) {
        toast.info("Already added to pursuits.");
        setAddingPursuitId(null);
        return;
      }
      // Insert new pursuit
      const { data, error } = await supabase
        .from("pursuits")
        .insert([
          {
            title: originalTitle,
            description: opportunity.description || opportunity.matchReason || "",
            stage: "Assessment",
            user_id: user.id,
            due_date: opportunity.response_date || null,
          },
        ])
        .select();
      if (error) throw error;
      toast.success("Added to pursuits!");
    } catch (error) {
      toast.error("Failed to add to pursuits.");
    } finally {
      setAddingPursuitId(null);
    }
  };

  // Fetch all active opportunities for the selected month
  const fetchMonthOpportunities = async (monthName, year) => {
    setOppsLoading(true);
    try {
      const monthNum = getMonthNumber(monthName);
      // Always use the 1st as the start date
      const startDate = new Date(year, parseInt(monthNum) - 1, 1);
      // End date is the last day of the month
      const endDate = new Date(year, parseInt(monthNum), 0);
      const today = new Date();
      const isCurrentMonth = startDate.getMonth() === today.getMonth() && startDate.getFullYear() === today.getFullYear();
      const queryEndDate = isCurrentMonth ? today : endDate;
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = queryEndDate.toISOString().split('T')[0];
      // Fetch all fields needed for the table
      const { data: opps, error } = await supabase
        .from('sam_gov')
        .select('id, title, published_date, response_date, active')
        .gte('published_date', startDateStr)
        .lte('published_date', endDateStr)
        .eq('active', true);
      if (error) throw error;
      setMonthOpportunities(opps || []);
    } catch (error) {
      toast.error("Failed to load opportunities for this month");
      setMonthOpportunities([]);
    } finally {
      setOppsLoading(false);
    }
  };

  // Handler for clicking the monthly count
  const handleMonthlyCountClick = () => {
    fetchMonthOpportunities(getFullMonthName(monthlyPursuits.month), monthlyPursuits.year);
    setShowMonthOpportunitiesModal(true);
  };

  // Sorting and filtering logic for the table
  const filteredAndSortedOpportunities = monthOpportunities
    .filter(opp =>
      opp.title.toLowerCase().includes(oppsFilter.toLowerCase()) ||
      (opp.status && opp.status.toLowerCase().includes(oppsFilter.toLowerCase()))
    )
    .sort((a, b) => {
      const { key, direction } = oppsSort;
      let valA = a[key] || '';
      let valB = b[key] || '';
      if (key.includes('date')) {
        valA = new Date(valA);
        valB = new Date(valB);
      }
      if (valA < valB) return direction === 'asc' ? -1 : 1;
      if (valA > valB) return direction === 'asc' ? 1 : -1;
      return 0;
    });

  // Update filteredAndSortedOpportunities to be paginated
  const paginatedOpportunities = filteredAndSortedOpportunities.slice((oppsPage - 1) * oppsPerPage, oppsPage * oppsPerPage);
  const totalPages = Math.ceil(filteredAndSortedOpportunities.length / oppsPerPage) || 1;

  // Reset to page 1 when filter, sort, or perPage changes
  useEffect(() => {
    setOppsPage(1);
  }, [oppsFilter, oppsSort, oppsPerPage, showMonthOpportunitiesModal]);

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <StripePaymentVerifier />
      {/* Create Pursuit Dialog */}
      {isDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg relative">
            {/* Dialog Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">
                Import Pursuit
              </h3>
              <button
                onClick={toggleDialog}
                className="text-gray-400 hover:text-gray-500"
              >
                <X size={20} />
              </button>
            </div>

            {/* Dialog Body */}
            <div className="p-6">
              {/* Title Input */}
              <input
                type="text"
                placeholder="Pursuit title"
                className="w-full p-2 border-b border-gray-200 text-lg font-medium mb-4 focus:outline-none focus:border-blue-500"
                value={newPursuit.title}
                onChange={(e) =>
                  setNewPursuit({ ...newPursuit, title: e.target.value })
                }
              />

              {/* Description Input */}
              <textarea
                placeholder="Add description..."
                className="w-full p-2 border-b border-gray-200 text-sm mb-6 focus:outline-none focus:border-blue-500 min-h-24"
                value={newPursuit.description}
                onChange={(e) =>
                  setNewPursuit({ ...newPursuit, description: e.target.value })
                }
              ></textarea>

              {/* Tags and Options */}
              <div className="flex flex-wrap gap-2 mb-6">
                {/* Federal Contract Button */}
                <button className="px-3 py-1.5 border border-gray-300 rounded-full text-sm text-gray-700 hover:bg-gray-50">
                  Federal Contract
                </button>

                {/* Assessment Tag */}
                <div className="px-3 py-1.5 bg-amber-100 text-amber-800 rounded-full text-sm flex items-center gap-1 font-medium">
                  <span className="h-2 w-2 bg-amber-500 rounded-full"></span>
                  Assessment
                </div>

                {/* No Assignee Tag */}
                <button className="px-3 py-1.5 border border-gray-300 rounded-full text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-1">
                  <span className="text-gray-500">👤</span>
                  No assignee
                </button>

                {/* Date Picker */}
                <button className="px-3 py-1.5 border border-gray-300 rounded-full text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-1">
                  <span className="text-gray-500">📅</span>
                  Apr 5, 2025 11:41 AM
                </button>

                {/* Select Tags */}
                <button className="px-3 py-1.5 border border-gray-300 rounded-full text-sm text-gray-700 hover:bg-gray-50">
                  + Select tags
                </button>
              </div>

              {/* File Upload Section */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-700 mb-2">
                  Add Solicitation Files
                </h4>
                <div
                  className="border border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                >
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                  />
                  {selectedFiles.length === 0 ? (
                    <>
                      <FileText className="h-8 w-8 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500 text-center">
                        Drag and drop files here
                        <br />
                        <span className="text-blue-500">
                          or browse for files
                        </span>
                      </p>
                    </>
                  ) : (
                    <div className="w-full">
                      {selectedFiles.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 bg-gray-50 rounded mb-2"
                        >
                          <div className="flex items-center">
                            <FileText className="h-4 w-4 text-gray-400 mr-2" />
                            <span className="text-sm text-gray-700 truncate max-w-xs">
                              {file.name}
                            </span>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeFile(index);
                            }}
                            className="text-gray-400 hover:text-red-500"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Dialog Footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex justify-between">
              <button
                onClick={toggleDialog}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreatePursuit}
                className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-700"
              >
                Import Pursuit
              </button>
            </div>
          </div>
        </div>
      )}

      {showFollowUpModal && followUpPursuit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md relative">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">
                Follow Up on: {followUpPursuit.title}
              </h3>
              <button
                onClick={() => setShowFollowUpModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <textarea
                placeholder="Add your follow-up note here..."
                className="w-full p-2 border-b border-gray-200 text-sm mb-4 focus:outline-none focus:border-blue-500 min-h-24"
                value={newFollowUpNote}
                onChange={e => setNewFollowUpNote(e.target.value)}
              ></textarea>
              <button
                onClick={handleSaveFollowUpNote}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 w-full mb-4"
              >
                Save Note
              </button>
              <div className="mt-4">
                <h4 className="font-medium text-gray-700 mb-2">Previous Follow-ups</h4>
                <div className="max-h-48 overflow-y-auto space-y-2">
                  {followUpNotes.length === 0 ? (
                    <div className="text-gray-400 text-sm">No follow-up notes yet.</div>
                  ) : (
                    <ul>
                      {followUpNotes.map((note, idx) => (
                        <li key={idx} className="bg-gray-50 p-3 rounded border border-gray-200">
                          <div className="text-xs text-gray-500 mb-1">{new Date(note.created_at).toLocaleString()}</div>
                          <div className="text-gray-800 text-sm">{note.note}</div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showMonthOpportunitiesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl relative">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 flex-1 min-w-0">
                <span className="block truncate">
                  Opportunities in {monthlyPursuits.month} {monthlyPursuits.year}
                </span>
              </h3>
              <button
                onClick={() => setShowMonthOpportunitiesModal(false)}
                className="text-gray-400 hover:text-gray-500 flex-shrink-0 ml-3"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <input
                  type="text"
                  className="border border-gray-300 rounded px-3 py-2 w-1/2 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  placeholder="Filter by title or status..."
                  value={oppsFilter}
                  onChange={e => setOppsFilter(e.target.value)}
                />
                <div className="flex gap-4 items-center min-w-[320px]">
                  <label htmlFor="oppsPerPage" className="text-xs text-gray-600">Show</label>
                  <select
                    id="oppsPerPage"
                    className="border border-gray-300 rounded px-6 py-1 text-xs focus:outline-none min-w-[80px]"
                    value={oppsPerPage}
                    onChange={e => setOppsPerPage(Number(e.target.value))}
                  >
                    {[5, 10, 20, 50, 100].map(n => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                  <span className="text-xs text-gray-600">per page</span>
                  <button
                    className={`text-xs px-2 py-1 rounded border ${oppsSort.key === 'published_date' ? 'bg-blue-100 border-blue-400' : 'bg-gray-100 border-gray-300'}`}
                    onClick={() => setOppsSort({ key: 'published_date', direction: oppsSort.direction === 'asc' ? 'desc' : 'asc' })}
                  >
                    Published {oppsSort.key === 'published_date' ? (oppsSort.direction === 'asc' ? '↑' : '↓') : ''}
                  </button>
                  <button
                    className={`text-xs px-2 py-1 rounded border ${oppsSort.key === 'response_date' ? 'bg-blue-100 border-blue-400' : 'bg-gray-100 border-gray-300'}`}
                    onClick={() => setOppsSort({ key: 'response_date', direction: oppsSort.direction === 'asc' ? 'desc' : 'asc' })}
                  >
                    Deadline {oppsSort.key === 'response_date' ? (oppsSort.direction === 'asc' ? '↑' : '↓') : ''}
                  </button>
                  <button
                    className={`text-xs px-2 py-1 rounded border ${oppsSort.key === 'title' ? 'bg-blue-100 border-blue-400' : 'bg-gray-100 border-gray-300'}`}
                    onClick={() => setOppsSort({ key: 'title', direction: oppsSort.direction === 'asc' ? 'desc' : 'asc' })}
                  >
                    Title {oppsSort.key === 'title' ? (oppsSort.direction === 'asc' ? '↑' : '↓') : ''}
                  </button>
                </div>
              </div>
              {oppsLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : (
                <>
                  <div className="mb-2 text-sm text-gray-600">
                    Showing {paginatedOpportunities.length} of {filteredAndSortedOpportunities.length} opportunity{filteredAndSortedOpportunities.length === 1 ? '' : 'ies'}
                  </div>
                  <div className="overflow-x-auto max-h-[400px]">
                    <table className="min-w-full text-sm text-left border">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-4 py-2 border-b cursor-pointer" onClick={() => setOppsSort({ key: 'title', direction: oppsSort.direction === 'asc' ? 'desc' : 'asc' })}>Title</th>
                          <th className="px-4 py-2 border-b cursor-pointer" onClick={() => setOppsSort({ key: 'published_date', direction: oppsSort.direction === 'asc' ? 'desc' : 'asc' })}>Published</th>
                          <th className="px-4 py-2 border-b cursor-pointer" onClick={() => setOppsSort({ key: 'response_date', direction: oppsSort.direction === 'asc' ? 'desc' : 'asc' })}>Deadline</th>
                          <th className="px-4 py-2 border-b cursor-pointer" onClick={() => setOppsSort({ key: 'active', direction: oppsSort.direction === 'asc' ? 'desc' : 'asc' })}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedOpportunities.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="text-center py-6 text-gray-400">No opportunities found.</td>
                          </tr>
                        ) : (
                          paginatedOpportunities.map(opp => (
                            <tr key={opp.id} className="hover:bg-blue-50 transition-colors">
                              <td className="px-4 py-2 border-b font-medium">{opp.title}</td>
                              <td className="px-4 py-2 border-b">{opp.published_date ? new Date(opp.published_date).toLocaleDateString() : '-'}</td>
                              <td className="px-4 py-2 border-b">{opp.response_date ? new Date(opp.response_date).toLocaleDateString() : '-'}</td>
                              <td className="px-4 py-2 border-b capitalize">{opp.active ? 'Active' : 'Inactive'}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
              <div className="flex justify-between items-center mt-4">
                <button
                  className="px-3 py-1 rounded border border-gray-300 text-xs bg-white hover:bg-gray-100 disabled:opacity-50"
                  onClick={() => setOppsPage(p => Math.max(1, p - 1))}
                  disabled={oppsPage === 1}
                >
                  Prev
                </button>
                <span className="text-xs text-gray-600">
                  Page {oppsPage} of {totalPages}
                </span>
                <button
                  className="px-3 py-1 rounded border border-gray-300 text-xs bg-white hover:bg-gray-100 disabled:opacity-50"
                  onClick={() => setOppsPage(p => Math.min(totalPages, p + 1))}
                  disabled={oppsPage === totalPages}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Now imported as a component */}
        <SideBar />

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-auto">
          {/* Top navigation */}
          <div className="bg-white border-b border-gray-200 py-3 px-6 flex justify-between items-center shadow-sm">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <Link to="/dashboard" className="text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors">Home</Link>
                {/* <ChevronRight className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-500">Home</span> */}
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setUpgradeOpen()}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 transition-all">
                <span>Upgrade</span>
                <Star size={14} className="ml-1" />
              </button>
              {/* <NotificationDropdown /> */}
              {/* <div className="relative">
                <button className="p-2 text-gray-500 hover:text-gray-600 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
                  <MessageSquare className="h-5 w-5" />
                </button>
                <div className="absolute top-0 right-0 w-2 h-2 bg-blue-500 rounded-full"></div>
              </div> */}
              <button
                onClick={handleLogout}
                className="bg-blue-50 text-blue-600 hover:bg-blue-100 px-4 py-2 rounded-lg text-sm flex items-center gap-2 border border-blue-100 transition-colors"
                disabled={isDisabled}
              >
                <Power size={16} />
                {/* <span className="font-medium">Logout</span> */}
              </button>
            </div>
          </div>

          {/* Page content */}
          <div className="flex-1 p-6 overflow-auto">
            <div className="max-w-9xl mx-auto">
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
                      Home
                    </span>
                  </div>
                </div>
                <div className="ml-auto flex space-x-3">
                  <Link
                    to="/opportunities"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 flex items-center"
                  >
                    <Search className="mr-2 h-4 w-4" />
                    Find New Opportunities
                  </Link>
                  {/* <button
                    className="inline-flex items-center px-5 py-2.5 border border-transparent text-sm font-medium rounded-lg shadow-md text-white bg-emerald-500 hover:bg-emerald-600 transition-all duration-300 hover:shadow-lg transform hover:-translate-y-0.5"
                    onClick={toggleDialog}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Import Pursuit
                  </button>
                  <button className="inline-flex items-center px-5 py-2.5 border border-transparent text-sm font-medium rounded-lg shadow-md text-white bg-blue-600 hover:bg-blue-700 transition-all duration-300 hover:shadow-lg transform hover:-translate-y-0.5">
                    <Upload className="mr-2 h-4 w-4" />
                    Upload
                  </button> */}
                </div>
              </div>

              {/* Dashboard layout - 2 columns */}
              <div className="grid grid-cols-4 gap-6">
                {/* Main column - 3/4 width */}
                <div className="col-span-3 space-y-6">
                  {/* Metrics */}
                  <div className="grid grid-cols-2 gap-6">
                    <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md border border-gray-200 transition-all hover:shadow-lg relative overflow-hidden">
                      {/* Header with navigation */}
                      <div className="flex flex-wrap gap-2 justify-between items-center mb-4 sm:mb-6">
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            onClick={navigateToPreviousMonth}
                            className="p-1.5 sm:p-2 rounded-full hover:bg-gray-100 text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-300 flex-shrink-0"
                          >
                            <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                          </button>
                          <h2 className="text-base sm:text-lg font-semibold text-gray-700 flex flex-wrap items-center">
                            <FileText className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-blue-500 flex-shrink-0" />
                            <div>
                              <span className="mr-1">Opportunities in </span>
                              <span className="text-blue-600">{monthlyPursuits.month} {monthlyPursuits.year}</span>
                            </div>
                          </h2>
                          <button
                            onClick={navigateToNextMonth}
                            className="p-1.5 sm:p-2 rounded-full hover:bg-gray-100 text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-300 flex-shrink-0"
                          >
                            <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
                          </button>
                        </div>

                        {/* Removed the top-right icon container */}
                      </div>

                      {/* Count display */}
                      {isLoading ? (
                        <div className="flex items-center justify-center h-32">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                        </div>
                      ) : (
                                            <div className="flex flex-col items-center my-3 sm:my-4">
                      <div className="flex items-center">
                        <div>
                          <div 
                            className="text-5xl sm:text-6xl font-bold text-gray-800 transition-all cursor-pointer hover:text-blue-600" 
                            onClick={handleMonthlyCountClick} 
                            title="View opportunities"
                          >
                            {monthlyPursuits.count}
                          </div>
                        </div>
                        <div className="group relative ml-3 cursor-pointer">
                          <button
                            className="p-1.5 sm:p-2 rounded-full hover:bg-gray-100 text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-300"
                            onClick={() => setIsChartVisible(!isChartVisible)}
                            aria-label="Toggle chart view"
                          >
                            <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
                          </button>
                          <div className="absolute bottom-full right-0 mb-2 bg-gray-800 text-white text-xs rounded px-2 py-1 min-w-[120px] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                            <div className="font-medium">View Analytics</div>
                            <div className="text-gray-300">Click to toggle chart</div>
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 text-sm sm:text-base text-gray-500 font-medium text-center">
                        New Opportunities Added
                      </div>
                    </div>
                      )}

                      {/* Historical data chart */}
                      {isChartVisible && (
                        <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-gray-100">
                          <div className="flex justify-between items-end h-24 sm:h-32 px-1 sm:px-2">
                            {monthlyStats.map((month, index) => (
                              <div
                                key={index}
                                className="flex flex-col items-center group cursor-pointer"
                              >
                                <div
                                  className="w-6 sm:w-8 bg-blue-400 hover:bg-blue-600 rounded-t-sm transition-all"
                                  style={{
                                    height: `${Math.max(8, (month.count / (Math.max(...monthlyStats.map(m => m.count)) || 1)) * 70)}px`
                                  }}
                                ></div>
                                <div className="text-xs font-medium text-gray-500 mt-1 whitespace-nowrap">
                                  {month.month}
                                </div>
                                <div className="absolute bottom-full mb-2 bg-gray-800 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                  <div className="font-bold">{month.month} {month.year}</div>
                                  <div>{month.count} {month.count === 1 ? 'Opportunity' : 'Opportunities'}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                          <Link
                            to="/analytics"
                            className="text-center text-xs text-blue-600 mt-2 hover:underline cursor-pointer block font-medium"
                          >
                            View detailed analytics
                          </Link>
                        </div>
                      )}
                    </div>

                    {/* Action Items Card */}
                    <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200 transition-all hover:shadow-lg">
                      <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-semibold text-gray-700 flex items-center">
                          <Clock className="h-5 w-5 mr-2 text-blue-500" />
                          Pursuits Summary
                        </h2>
                        {actionItems.dueToday > 0 ? (
                          <div className="p-2 bg-red-100 text-red-800 rounded-lg">
                            <AlertTriangle className="h-5 w-5" />
                          </div>
                        ) : (
                          <div className="p-2 bg-gray-100 text-gray-500 rounded-lg">
                            <Clock className="h-5 w-5" />
                          </div>
                        )}
                      </div>

                      {isLoading ? (
                        <div className="flex items-center justify-center h-32">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-end space-x-3 mb-4">
                            <div className="text-4xl font-bold text-gray-900">
                              {actionItems.count}
                            </div>
                            <div className="pb-1 flex items-center text-sm font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">
                              <Clock className="h-4 w-4 mr-1" />
                              <span>Pending</span>
                            </div>

                            {actionItems.dueToday > 0 && (
                              <div className="pb-1 flex items-center text-sm font-medium text-red-600 bg-red-50 px-2 py-1 rounded-lg">
                                <AlertTriangle className="h-4 w-4 mr-1" />
                                <span>{actionItems.dueToday} Due Today</span>
                              </div>
                            )}
                          </div>

                          {/* Action items list */}
                          {actionItems.items.length > 0 && (
                            <div className="mt-4 space-y-2">
                              {actionItems.items.map((item, index) => (
                                <div key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-sm flex items-start">
                                  <div className="mr-3 mt-0.5">
                                    <div className={`h-2 w-2 rounded-full ${item.stage === "Assessment" ? "bg-orange-500" : "bg-yellow-500"
                                      }`}></div>
                                  </div>
                                  <div className="flex-1 truncate">
                                    <div className="font-medium text-gray-800 truncate">{item.title}</div>
                                    <div className="text-xs text-gray-500 mt-0.5">{item.stage}</div>
                                  </div>
                                  <div className="ml-2 text-xs text-gray-500 whitespace-nowrap">
                                    {item.due_date ? new Date(item.due_date).toLocaleDateString() : "No due date"}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Progress bar */}
                          <div className="mt-4 space-y-2">
                            <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-blue-500 rounded-full"
                                style={{
                                  width: `${actionItems.count + actionItems.completed > 0
                                    ? Math.round((actionItems.completed / (actionItems.count + actionItems.completed)) * 100)
                                    : 0}%`
                                }}
                              ></div>
                            </div>
                            <div className="flex justify-between text-xs text-gray-500">
                              <span>{actionItems.completed} Completed</span>
                              <span>{actionItems.count} Remaining</span>
                            </div>
                          </div>

                          {/* Added Link to Pursuits page */}
                          <div className="mt-4 text-center">
                            <Link
                              to="/pursuits"
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium inline-flex items-center"
                            >
                              View all action items
                              <ChevronRight className="h-4 w-4 ml-1" />
                            </Link>
                          </div>
                        </>
                      )}
                    </div>

                  </div>

                  {/* AI-Matched Opportunities */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 overflow-hidden">
                    <div className="flex justify-between items-center mb-5">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-emerald-50 text-emerald-500 rounded-lg">
                          <Sparkles className="h-5 w-5" />
                        </div>
                        <h2 className="text-lg font-semibold text-gray-700">
                          New AI-Matched Opportunities
                        </h2>
                      </div>
                      <Link to="/settings" className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors shadow-sm">
                        <Settings className="mr-2 h-4 w-4" />
                        Edit settings
                      </Link>
                    </div>

                    {/* Recommendations Loading/Empty/Results */}
                    {isLoadingRecommendations ? (
                      <div className="flex items-center justify-center h-40">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
                        <span className="ml-4 text-gray-600 font-medium">Generating recommendations...</span>
                      </div>
                    ) : aiRecommendations.length === 0 ? (
                      <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800 flex items-start">
                        <AlertTriangle className="h-5 w-5 mr-3 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium mb-1">
                            No highly relevant matches found
                          </p>
                          <p className="text-sm text-yellow-700">
                            We couldn't find any highly relevant new opportunities for your organization. Please check back tomorrow!
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-5">
                        {aiRecommendations.map((rec, idx) => {
                          // Always use the opportunityIndex to look up the correct opportunity in dashboardOpportunities
                          let externalUrl = rec.external_url;
                          if (!externalUrl && typeof rec.opportunityIndex === 'number' && Array.isArray(dashboardOpportunities)) {
                            const opp = dashboardOpportunities[rec.opportunityIndex];
                            if (opp && opp.external_url) {
                              externalUrl = opp.external_url;
                            }
                          }
                          // If the index is out of bounds or missing, do not make the card clickable
                          const isClickable = externalUrl && externalUrl !== '#' && typeof rec.opportunityIndex === 'number' && dashboardOpportunities[rec.opportunityIndex];
                          externalUrl = isClickable ? externalUrl : null;
                          return (
                            <div
                              key={rec.id || idx}
                              className={`rounded-lg border border-gray-200 overflow-hidden transition-all hover:shadow-md group ${isClickable ? 'cursor-pointer hover:bg-blue-50' : 'cursor-default'}`}
                              onClick={() => {
                                if (isClickable) {
                                  window.open(externalUrl, '_blank', 'noopener,noreferrer');
                                }
                              }}
                              tabIndex={isClickable ? 0 : -1}
                              role="button"
                              onKeyDown={e => {
                                if (isClickable && e.key === 'Enter') {
                                  window.open(externalUrl, '_blank', 'noopener,noreferrer');
                                }
                              }}
                            >
                              <div className="p-5">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <h3 className="text-lg font-medium text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                                      {typeof rec.opportunityIndex === 'number' && dashboardOpportunities[rec.opportunityIndex]
                                        ? dashboardOpportunities[rec.opportunityIndex].title
                                        : rec.title}
                                    </h3>
                                    <p className="text-sm text-gray-600 mb-3">
                                      {rec.description || rec.matchReason || "No description available."}
                                    </p>
                                    <div className="flex flex-wrap items-center gap-4 text-xs">
                                      {rec.agency && (
                                        <div className="flex items-center text-gray-500">
                                          <Shield className="h-3 w-3 mr-1 text-blue-500" />
                                          {rec.agency}
                                        </div>
                                      )}
                                      {rec.published_date && (
                                        <div className="flex items-center text-gray-500">
                                          <Clock className="h-3 w-3 mr-1" />
                                          Released: {new Date(rec.published_date).toLocaleDateString()}
                                        </div>
                                      )}
                                      {rec.response_date && (
                                        <div className="flex items-center px-2 py-1 bg-amber-50 text-amber-700 rounded-full">
                                          <Clock className="h-3 w-3 mr-1" />
                                          Due: {new Date(rec.response_date).toLocaleDateString()}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <div className="ml-4 flex flex-col items-end">
                                    {rec.matchScore && (
                                      <div className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium mb-2">
                                        {rec.matchScore}% Match
                                      </div>
                                    )}
                                    {isClickable && (
                                      <a
                                        href={externalUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-gray-400 group-hover:text-blue-500 transition-colors"
                                        onClick={e => e.stopPropagation()}
                                      >
                                        <ExternalLink className="h-4 w-4" />
                                      </a>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="border-t border-gray-200 px-5 py-3 bg-gray-50 flex justify-between items-center">
                                <div className="text-xs text-gray-500">
                                  Estimated value: {rec.budget ? <span className="font-medium">{rec.budget}</span> : <span>N/A</span>}
                                </div>
                                <button
                                  className={`inline-flex items-center px-4 py-1.5 border border-gray-300 text-xs font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 hover:text-blue-600 transition-colors shadow-sm ${addingPursuitId === rec.id ? 'opacity-60 cursor-not-allowed' : ''}`}
                                  onClick={e => {
                                    e.stopPropagation();
                                    handleAddToPursuit(rec);
                                  }}
                                  disabled={addingPursuitId === rec.id}
                                >
                                  {addingPursuitId === rec.id ? (
                                    <span className="flex items-center"><span className="animate-spin h-4 w-4 mr-2 border-b-2 border-blue-500 rounded-full"></span>Adding...</span>
                                  ) : (
                                    <>Add to Pursuits</>
                                  )}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                        <div className="flex justify-center pt-2">
                          <Link to="/opportunities" className="text-blue-600 hover:text-blue-800 text-sm font-medium inline-flex items-center">
                            View more opportunities
                            <ChevronRight className="h-4 w-4 ml-1" />
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right sidebar - 1/4 width */}
                <div className="space-y-4">
                  {/* Submission Status */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <div className="flex items-center space-x-2">
                        <div className="p-1.5 bg-blue-100 text-blue-600 rounded-lg">
                          <CheckCircle2 className="h-4 w-4" />
                        </div>
                        <h2 className="text-base font-semibold text-gray-700">
                          Submission Status
                        </h2>
                        <div className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                          {submittedPursuits.length}
                        </div>
                      </div>
                    </div>

                    <div className="h-[300px] overflow-y-auto">
                      <div className="p-4 space-y-3">
                        {submittedPursuits.map((pursuit) => (
                          <div key={pursuit.id} className="rounded-lg border border-gray-200 p-4 hover:shadow-sm transition-all group">
                            <div className="flex items-start">
                              <div className="flex-shrink-0 p-2 bg-green-100 text-green-600 rounded-lg mr-3">
                                <CheckCircle2 className="h-4 w-4" />
                              </div>
                              <div className="flex-1">
                                <h3 className="text-md font-medium text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                                  {pursuit.title}
                                </h3>
                                <div className="mb-2 flex items-center text-xs font-medium text-gray-600 bg-gray-100 px-3 py-1 rounded-full w-fit">
                                  <Clock className="h-3 w-3 mr-1 text-green-500" />
                                  <span>
                                    {`Submitted ${formatTimeAgo(pursuit.updated_at)}`}
                                  </span>
                                </div>
                                <div className="flex items-center space-x-2 text-xs text-gray-500">
                                  <span className="flex items-center">
                                    <FileText className="h-3 w-3 mr-1" />
                                    Pursuit
                                  </span>
                                  <span>•</span>
                                  <span>{pursuit.stage}</span>
                                </div>
                              </div>
                              <button
                                className="ml-2 p-2 text-gray-400 hover:text-blue-500 transition-colors rounded-lg hover:bg-blue-50"
                                title="Follow up"
                                onClick={() => handleFollowUp(pursuit)}
                              >
                                <MessageSquare className="h-5 w-5" />
                              </button>
                            </div>
                          </div>
                        ))}

                        {submittedPursuits.length === 0 && (
                          <div className="text-center py-6 text-gray-500">
                            No submitted pursuits yet
                          </div>
                        )}
                      </div>

                      {submittedPursuits.length > 0 && (
                        <div className="p-3 text-center border-t border-gray-100 sticky bottom-0 bg-white">
                          <Link
                            to="/pursuits?filter=submitted"
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium inline-flex items-center"
                          >
                            View all submitted pursuits
                            <ChevronRight className="h-4 w-4 ml-1" />
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <UpgradeModal
        isOpen={upgradeOpen}
        onClose={closeModal}
        onSuccess={handleUpgradeSuccess}
      />
    </div>
  );
};

export default BizRadarDashboard;