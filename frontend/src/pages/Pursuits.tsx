import React, { useState, useEffect, useRef, useCallback, useMemo, Suspense, lazy } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { FileText, X, PenLine, CheckCircle, Target, Calendar } from "lucide-react";
import SideBar from "../components/layout/SideBar";
import { supabase } from "../utils/supabase";
import { toast } from "sonner";
import { trackersApi } from '@/api/trackers';
import RfpResponse from "../components/rfp/rfpResponse";
import { useAuth } from "@/components/Auth/useAuth";
import { SearchAndActions } from "@/components/pursuits/SearchAndActions";
import { ViewSelector, ViewType } from "@/components/pursuits/ViewSelector";
import { Pursuit, Opportunity, RfpSaveEventDetail } from "@/components/pursuits/types";
import ScrollToTopButton from "../components/opportunities/ScrollToTopButton";
import PageLoadingSkeleton from "@/components/ui/PageLoadingSkeleton";
import { DashboardTemplate } from "../utils/responsivePatterns";

// Lazy load heavier components
const KanbanView = lazy(() => import("@/components/pursuits/KanbanView").then(m => ({ default: m.KanbanView })));
const CalendarView = lazy(() => import("@/components/pursuits/CalendarView").then(m => ({ default: m.CalendarView })));
const ListView = lazy(() => import("@/components/pursuits/ListView").then(m => ({ default: m.ListView })));
const CreateTrackerDialog = lazy(() => import("@/components/pursuits/CreatePursuitDialog"));

const isDevelopment = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
const API_BASE_URL = isDevelopment
  ? "http://localhost:5000"
  : import.meta.env.VITE_API_BASE_URL;

// Global cache for pursuits data
const pursuitsCache = {
  data: null,
  timestamp: 0,
  filter: null
};

  // Function to clear the cache
  const clearPursuitsCache = () => {
    pursuitsCache.data = null;
    pursuitsCache.timestamp = 0;
    pursuitsCache.filter = null;
  // console.log('Cleared pursuits cache');
  };

export default function Pursuits(): JSX.Element {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get current date for header
  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  
  const [pursuits, setPursuits] = useState<Pursuit[]>([]);
  const [selectedPursuit, setSelectedPursuit] = useState<Pursuit | null>(null);
  // Use state persistence for view type
  const [view, setView] = useState<ViewType>(() => {
    // Try to restore from sessionStorage
    const savedView = sessionStorage.getItem("pursuitsViewType");
    return (savedView as ViewType) || "list";
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showNotification, setShowNotification] = useState<boolean>(false);
  const [showRfpBuilder, setShowRfpBuilder] = useState<boolean>(false);
  const [currentRfpPursuitId, setCurrentRfpPursuitId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const [mainContentNode, setMainContentNode] = useState<HTMLDivElement | null>(null);
  const [initialLoadComplete, setInitialLoadComplete] = useState<boolean>(false);
  const [progressiveLoading, setProgressiveLoading] = useState<boolean>(true);
  const [dueDateFilter, setDueDateFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('due_date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [highlightedPursuitId, setHighlightedPursuitId] = useState<string | null>(() => {
    // Initialize highlighted pursuit ID from URL parameter
    const searchParams = new URLSearchParams(location.search);
    return searchParams.get('highlight');
  });
  const [fadingOutPursuitId, setFadingOutPursuitId] = useState<string | null>(null);
  
  const mainContentRef = useCallback((node: HTMLDivElement | null) => {
    setMainContentNode(node);
  }, []);

  // File input ref
  const fileInputRef = useRef(null);
  const [selectedFiles, setSelectedFiles] = useState([]);

  // Function to handle navigation to BizRadar AI with tracker context
  const navigateToBizRadarAI = async (pursuit: Pursuit, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row click event from firing
    // console.log("Ask BizRadar AI button clicked for tracker:", pursuit);
    
    try {
      // Fetch the noticeId from the sam_gov table using the title
      // const { data, error } = await supabase
      //   .from('sam_gov')
      //   .select('notice_id')
      //   .eq('title', pursuit.title)
      //   .single();
      const { data, error } = await supabase
        .from('sam_gov')
        .select('notice_id')
        .eq('title', pursuit.title)
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("Error fetching noticeId:", error);
        toast?.error("Failed to fetch notice ID. Please try again.");
        return;
      }

      const noticeId = data ? data.notice_id : null;
      // console.log("Found notice ID:", noticeId);
      
      // Get the current user ID
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id;
      
      // Call the backend endpoint directly with the correct port
      try {
        
        const backendResponse = await fetch(`${API_BASE_URL}/ask-bizradar-ai`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            pursuitId: pursuit.id,
            noticeId: noticeId,
            userId: userId, // Include the user ID
            trackerContext: {
              id: pursuit.id,
              title: pursuit.title,
              description: pursuit.description,
              stage: pursuit.stage,
              dueDate: pursuit.dueDate,
              naicsCode: pursuit.naicscode,
              noticeId: noticeId
            }
          }),
        });
        
        if (!backendResponse.ok) {
          throw new Error(`API error: ${backendResponse.status}`);
        }
        
        const responseData = await backendResponse.json();
        // console.log("Successfully hit backend endpoint:", responseData);
      } catch (apiError) {
        // console.error("Error hitting backend endpoint:", apiError);
        // Continue with navigation even if the API call fails
      }
      
      // Navigate to BizRadarAI with tracker context
      navigate('/bizradar-ai', { 
        state: { 
          trackerContext: {
            id: pursuit.id,
            title: pursuit.title,
            description: pursuit.description,
            stage: pursuit.stage,
            dueDate: pursuit.dueDate,
            naicsCode: pursuit.naicscode,
            noticeId: noticeId,
            userId: userId // Include user ID in the context
          }
        }
      });
    } catch (error) {
      // console.error("Error navigating to BizRadarAI:", error);
      toast?.error("An error occurred. Please try again.");
    }
  };

  // Toggle dialog function...
  // const toggleDialog = () => {
  //   setIsDialogOpen(!isDialogOpen);
  //   if (!isDialogOpen) {
  //     // Reset form when opening
  //     setNewPursuit({
  //       title: "",
  //       description: "",
  //       stage: "Assessment",
  //       due_date: null,
  //       tags: [],
  //     });
  //     setSelectedFiles([]);
  //   }
  // };

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
  
  
  // Function to close the RFP builder
  const closeRfpBuilder = (): void => {
    setShowRfpBuilder(false);
    setCurrentRfpPursuitId(null);
    
    // Refresh the tracker list to get the updated stage
    fetchTrackers();
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logging out...");
      navigate("/logout");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("There was a problem logging out");
    }
  };
  
  // Add handleAddToTracker function
  const handleAddToTracker = async (opportunity: Opportunity): Promise<void> => {
    try {
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
    // console.log("No user logged in");
        return;
      }
      
    // console.log("Adding to trackers:", {
    //     title: opportunity.title || "Untitled",
    //     description: opportunity.description || "",
    //     stage: "Assessment",
    //     user_id: user.id
    //   });
      
      // Create new tracker using API
      const trackerData = {
        title: opportunity.title || "Untitled",
        description: opportunity.description || "",
        stage: "Review",
        due_date: opportunity.due_date
      };
      
      const newTracker = await trackersApi.createTracker(trackerData, user.id);
      
      // console.log("Added successfully:", newTracker);
      
      if (newTracker) {
        // Show notification
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 3000);
        
        // Update tracker list with the new tracker
        const formattedPursuit: Pursuit = {
          id: newTracker.id,
          title: newTracker.title || "Untitled",
          description: newTracker.description || "",
          stage: newTracker.stage || "Assessment",
          created: newTracker.created_at,
          dueDate: newTracker.due_date ? newTracker.due_date : "TBD",
          assignee: "Unassigned",
          assigneeInitials: "UA",
          is_submitted: newTracker.is_submitted || false,
          naicscode: newTracker.naicscode || ""
        };
        
        setPursuits(prevPursuits => [formattedPursuit, ...prevPursuits]);
      }
    } catch (error) {
      console.error("Error adding to trackers:", error);
      setError("Failed to add tracker. Please try again.");
    }
  };
  
  // Function to handle create tracker
  const handleCreateTracker = async (trackerData: {
    title: string;
    description: string;
    stage: string;
    due_date: string | null;
    tags: string[];
  }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
    // console.log("No user logged in");
        return;
      }

      let formattedDueDate = null;
      if (trackerData.due_date) {
        formattedDueDate = new Date(trackerData.due_date).toISOString();
      }

      const tracker = await trackersApi.createTracker({
        title: trackerData.title || "Untitled",
        description: trackerData.description || "",
        stage: trackerData.stage || "Assessment",
        due_date: formattedDueDate,
      }, user.id);

      toast?.success("Tracker created successfully");

      const formattedPursuit: Pursuit = {
        id: tracker.id,
        title: tracker.title || "Untitled",
        description: tracker.description || "",
        stage: tracker.stage || "Assessment",
        created: tracker.created_at,
        dueDate: tracker.due_date ? tracker.due_date : "TBD",
        assignee: "Unassigned",
        assigneeInitials: "UA",
        is_submitted: tracker.is_submitted || false,
        naicscode: tracker.naicscode || ""
      };
      
      setPursuits(prevPursuits => [formattedPursuit, ...prevPursuits]);
    } catch (error) {
      // console.error("Error creating pursuit:", error);
      toast?.error("Failed to create tracker. Please try again.");
    }
  };
  
  // Function to fetch trackers with caching and progressive loading
  const fetchTrackers = async (forceRefresh = false): Promise<void> => {
    // Start progressive loading
    setProgressiveLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log("No user logged in");
        setProgressiveLoading(false);
        setIsLoading(false);
        setPursuits([]);
        return;
      }
      
      const searchParams = new URLSearchParams(location.search);
      const filter = searchParams.get('filter');
      
      // Check if we have cached data and it's still valid (less than 5 minutes old)
      const now = Date.now();
      const cacheValid = 
        !forceRefresh && 
        pursuitsCache.data && 
        now - pursuitsCache.timestamp < 5 * 60 * 1000 && 
        pursuitsCache.filter === filter;
      
      // If we have valid cached data, use it immediately
    if (cacheValid) {
      // console.log("Using cached pursuits data");
        setPursuits(pursuitsCache.data);
        
        // Still mark as loading to show we're checking for updates
        setIsLoading(true);
        
        // End progressive loading since we have data to show
        setProgressiveLoading(false);
        
        // If this is the first load, mark it as complete
        if (!initialLoadComplete) {
          setInitialLoadComplete(true);
        }
      } else {
        // No valid cache, show loading state
        setIsLoading(true);
      }
      
      // Always fetch fresh data from the server using API
      const isSubmitted = filter === 'submitted' ? true : undefined;
      const response = await trackersApi.getTrackers(user.id, isSubmitted);
        
      if (!response.success) {
        console.error("Fetch error:", response.message);
        setError(`Failed to fetch pursuits: ${response.message}`);
        setIsLoading(false);
        setProgressiveLoading(false);
        // Clear cache on error to force fresh data on next load
        clearPursuitsCache();
        
        // Show retry option
        setTimeout(() => {
          // console.log('Retrying fetch after error...');
          fetchTrackers();
        }, 3000);
        return;
      }
      
      const formattedPursuits: Pursuit[] = response.trackers.map(tracker => ({
        id: tracker.id,
        title: tracker.title || "Untitled",
        description: tracker.description || "",
        stage: tracker.stage || "Assessment",
        created: tracker.created_at,
        dueDate: tracker.due_date ? tracker.due_date : "TBD",
        assignee: "Unassigned",
        assigneeInitials: "UA",
        is_submitted: tracker.is_submitted || false,
        naicscode: tracker.naicscode || "",
        opportunity_id: tracker.opportunity_id
      }));
      
      // Update cache
      pursuitsCache.data = formattedPursuits;
      pursuitsCache.timestamp = now;
      pursuitsCache.filter = filter;
      
      // Update state
      setPursuits(formattedPursuits);
      
      // Mark initial load as complete
      if (!initialLoadComplete) {
        setInitialLoadComplete(true);
      }
      
    } catch (error: any) {
      console.error("Error fetching pursuits:", error);
      setError(`Error fetching pursuits: ${error.message}`);
      setPursuits([]);
    } finally {
      setIsLoading(false);
      setProgressiveLoading(false);
    }
  };
  
  // Update state when URL changes (for navigation between different highlight IDs)
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const highlightId = searchParams.get('highlight');
    
    if (highlightId !== highlightedPursuitId) {
      setHighlightedPursuitId(highlightId);
    }
  }, [location.search]);

  // Replace the useEffect for fetching trackers
  useEffect(() => {
    // Clear cache on mount to ensure fresh data
    clearPursuitsCache();
    fetchTrackers();
    
    // Set up real-time subscription for changes
    const subscription = supabase
      .channel('pursuits_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'pursuits',
          filter: `user_id=eq.${supabase.auth.getUser().then(res => res.data.user?.id)}` 
        }, 
        (payload) => {
        // console.log('Change received!', payload);
          fetchTrackers(); // Refresh the list when changes occur
        }
      )
      .subscribe();
      
    // Clean up subscription when component unmounts
    return () => {
      subscription.unsubscribe();
    };
  }, [location.search]); // Add location.search as a dependency to refetch when query params change
  
  // Clear highlight parameter from URL after a delay to avoid permanent highlighting
  useEffect(() => {
    if (highlightedPursuitId) {
      const timer = setTimeout(() => {
        // Start fade out animation
        setFadingOutPursuitId(highlightedPursuitId);
        
        // After fade out animation completes, clear everything
        setTimeout(() => {
          const searchParams = new URLSearchParams(location.search);
          if (searchParams.get('highlight')) {
            searchParams.delete('highlight');
            const newUrl = searchParams.toString() 
              ? `${location.pathname}?${searchParams.toString()}`
              : location.pathname;
            navigate(newUrl, { replace: true });
          }
          setHighlightedPursuitId(null);
          setFadingOutPursuitId(null);
        }, 500); // Wait for fade animation to complete
      }, 5000); // Start fade after 5 seconds (longer to ensure user sees it)
      
      return () => clearTimeout(timer);
    }
  }, [highlightedPursuitId, location.search, location.pathname, navigate]);
  
  // Modify the handlePursuitSelect function to open internal detail page
  const handlePursuitSelect = async (pursuit: Pursuit): Promise<void> => {
    try {
      // Try to fetch the full opportunity from ai_enhanced_opportunities
      const { data, error } = await supabase
        .from('ai_enhanced_opportunities')
        .select(`
          id,
          title,
          department,
          description,
          url,
          naics_code,
          published_date,
          response_date,
          funding,
          solicitation_number,
          active,
          additional_description,
          objective,
          expected_outcome,
          eligibility,
          key_facts,
          notice_id
        `)
        .eq('title', pursuit.title)
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("Error fetching opportunity:", error);
        toast?.error("Failed to fetch opportunity details.");
        return;
      }

      if (data) {
        // Map DB row to Opportunity shape expected by details page
        const mapped = {
          id: String(data.id),
          title: data.title,
          agency: data.department || "",
          description: data.description || "",
          platform: "sam_gov",
          external_url: data.url || "",
          naics_code: data.naics_code != null ? String(data.naics_code) : "",
          published_date: data.published_date || "",
          response_date: data.response_date || null,
          budget: data.funding || undefined,
          solicitation_number: data.solicitation_number || undefined,
          active: data.active ?? true,
          type: undefined,
          additional_description: data.additional_description || undefined,
          summary: undefined,
          summary_ai: undefined,
          objective: data.objective || undefined,
          expected_outcome: data.expected_outcome || undefined,
          eligibility: data.eligibility || undefined,
          key_facts: data.key_facts || undefined,
        } as any;

        sessionStorage.setItem("selectedOpportunity", JSON.stringify(mapped));
        window.open(`/opportunities/${mapped.id}/details`, '_blank');
      } else {
        // Fallback: open SAM.gov if we have a notice_id from previous logic
        const { data: noticeRow } = await supabase
          .from('ai_enhanced_opportunities')
          .select('notice_id')
          .eq('title', pursuit.title)
          .limit(1)
          .maybeSingle();

        if (noticeRow?.notice_id) {
          window.open(`https://sam.gov/opp/${noticeRow.notice_id}/view`);
        } else {
          toast?.error("No details found for the selected pursuit.");
        }
      }
    } catch (error) {
      console.error("Error in handlePursuitSelect:", error);
      toast?.error("An unexpected error occurred. Please try again.");
    }
  };
  
  // Replace the handleRemovePursuit function
  const handleRemovePursuit = async (id: string): Promise<void> => {
    try {
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
    // console.log("No user logged in");
        return;
      }
      
      // Delete the tracker using API (this should handle associated data)
      await trackersApi.deleteTracker(id, user.id);
      
      // Update the local state
      setPursuits(pursuits.filter(pursuit => pursuit.id !== id));
      
      // If the removed pursuit was selected, clear selection
      if (selectedPursuit && selectedPursuit.id === id) {
        setSelectedPursuit(null);
      }
      
      // Dispatch custom event to update SideBar count
      window.dispatchEvent(new CustomEvent('trackerUpdated'));
      
      toast?.success("Tracker removed successfully");
    } catch (error: any) {
      console.error("Error removing tracker:", error);
      toast?.error("Failed to remove tracker. Please try again.");
    }
  };
  
  const getStageColor = (stage: string): string => {
    // Check if the stage contains "RFP Response Initiated"
    if (stage.includes("RFP Response Initiated")) {
      return "bg-yellow-100 text-yellow-800";
    }
    
    // Handle other stages
    switch(stage) {
      case "Assessment":
        return "bg-orange-100 text-orange-800"; // Changed to orange
      case "Planning":
        return "bg-blue-100 text-blue-800";
      case "Implementation":
        return "bg-purple-100 text-purple-800";
      case "Review":
        return "bg-indigo-100 text-indigo-800";
      case "RFP Response Completed":
        return "bg-green-100 text-green-800"; // Changed to green
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  
  // Add a button in the pursuit list view to create/edit RFP responses
  const renderRfpActionButton = (pursuit: Pursuit): JSX.Element => {
    // Determine button text based on the stage
    let buttonText = "Create Response";
    let icon = <PenLine className="w-3 h-3" />;
    
    if (pursuit.is_submitted) {
      buttonText = "View Submitted";
      icon = <CheckCircle className="w-3 h-3" />;
    } else if (pursuit.stage === "RFP Response Completed") {
      buttonText = "Edit Response";
      icon = <PenLine className="w-3 h-3" />;
    } else if (pursuit.stage.includes("RFP Response Initiated")) {
      buttonText = "Continue Response";
      icon = <PenLine className="w-3 h-3" />;
    }
    
    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          navigate(`/trackers/${pursuit.id}`);
        }}
        className="ml-2 px-3 py-1 text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-full transition-colors flex items-center gap-1"
      >
        {icon} {buttonText}
      </button>
    );
  };
  
  // const changeView = (newView: string): void => {
  //   setView(newView);
  // };

  // Function to toggle submission status
  const handleToggleSubmission = async (pursuitId: string): Promise<void> => {
    try {
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log("No user logged in");
        return;
      }
      
      // First, make sure a report exists for this tracker
      try {
        const { reportsApi } = await import('../api/reports');
        
        // Check if report exists
        let report;
        try {
          report = await reportsApi.getReportByResponseId(pursuitId, user.id);
        } catch (error) {
          // Report doesn't exist, create one
          // console.log("No report found for this tracker. Creating one before marking as submitted...");
          
          // Get tracker details
          const tracker = await trackersApi.getTrackerById(pursuitId, user.id);
          
          // Create a minimal report
          report = await reportsApi.upsertReport(
            pursuitId,
            {
              rfpTitle: tracker.title,
              dueDate: tracker.due_date,
              sections: [],
              isSubmitted: true, // Mark as submitted immediately
            },
            100, // 100% completion since we're marking as submitted
            true, // isSubmitted = true
            user.id,
            tracker.opportunity_id
          );
          
          // console.log("Created report and marked as submitted:", report);
        }
        
        if (report && !report.is_submitted) {
          // Update report submission status
          await reportsApi.toggleSubmittedStatus(pursuitId, user.id);
          // console.log("Updated report submission status to submitted");
        }
      } catch (reportError) {
        console.error("Error managing report for submission:", reportError);
        toast?.error("Could not update report submission status. Please try again.");
        return; // Don't proceed if report update fails
      }
      
      // Toggle tracker submission status using API
      await trackersApi.toggleSubmittedStatus(pursuitId, user.id);
      // console.log("Updated tracker submission status to submitted");
      
      // Update the local state
      setPursuits(pursuits.map(pursuit => 
        pursuit.id === pursuitId 
          ? { ...pursuit, is_submitted: true } 
          : pursuit
      ));
      
      toast?.success("Proposal marked as submitted!");
      
      // Refresh the tracker list to ensure consistency
      setTimeout(() => {
        fetchTrackers(true);
      }, 500);
      
      // Dispatch event to notify other components about the submission change
      window.dispatchEvent(new CustomEvent('report-submitted', { 
        detail: { responseId: pursuitId } 
      }));
      
    } catch (error: any) {
      console.error("Error toggling submission:", error);
      toast?.error("Failed to update submission status. Please try again.");
    }
  };

  useEffect(() => {
    const handleRfpSaved = async (event: Event): Promise<void> => {
      const customEvent = event as CustomEvent<RfpSaveEventDetail>;
      const { pursuitId, stage, percentage } = customEvent.detail;

    // console.log("RFP saved event received:", { pursuitId, stage, percentage });

      // Update the pursuit in your list immediately for better UX
      setPursuits(prevPursuits => 
        prevPursuits.map(pursuit => 
          pursuit.id === pursuitId 
            ? { ...pursuit, stage: stage } 
            : pursuit
        )
      );

      // Also refresh data from server to ensure consistency
      try {
        await fetchTrackers(true); // Force refresh
        // console.log("Refreshed trackers data after RFP save");
      } catch (error) {
        console.error("Error refreshing trackers after RFP save:", error);
      }
    };

    // Add event listener
    window.addEventListener('rfp_saved', handleRfpSaved);

    // Cleanup the event listener on component unmount
    return () => {
      window.removeEventListener('rfp_saved', handleRfpSaved);
    };
  }, []);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleDueDateFilterChange = (filter: string) => {
    setDueDateFilter(filter);
  };

  const handleStatusFilterChange = (filter: string) => {
    setStatusFilter(filter);
  };

  const handleSortChange = (sort: string) => {
    if (sortBy === sort) {
      // If clicking the same sort option, toggle direction
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      // If clicking a different sort option, set it and default to ascending
      setSortBy(sort);
      setSortDirection('asc');
    }
  };

  const handleViewAnalytics = () => {
    // Implement analytics view
    toast.info("Analytics view coming soon!");
  };

  const handleNewTracker = () => {
    setIsDialogOpen(true);
  };

  const handleRfpAction = (pursuit: Pursuit) => {
    // Validate that the pursuit ID exists before navigating
    if (!pursuit.id) {
      console.error('Invalid pursuit ID');
      setError('Invalid pursuit ID. Please refresh the page.');
      return;
    }
    
    // Clear cache to ensure fresh data
    clearPursuitsCache();
    
    // Redirect to /trackers/{id} instead of opening modal
    navigate(`/trackers/${pursuit.id}`);
  };

  const handleAskAI = async (pursuit: Pursuit) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id;

      const { data, error } = await supabase
        .from('sam_gov')
        .select('notice_id')
        .eq('title', pursuit.title)
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("Error fetching noticeId:", error);
        toast?.error("Failed to fetch notice ID. Please try again.");
        return;
      }

      const noticeId = data ? data.notice_id : null;

      try {
        const backendResponse = await fetch(`${API_BASE_URL}/ask-bizradar-ai`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            pursuitId: pursuit.id,
            noticeId: noticeId,
            userId: userId,
            trackerContext: {
              id: pursuit.id,
              title: pursuit.title,
              description: pursuit.description,
              stage: pursuit.stage,
              dueDate: pursuit.dueDate,
              naicsCode: pursuit.naicscode,
              noticeId: noticeId
            }
          }),
        });

        if (!backendResponse.ok) {
          throw new Error(`API error: ${backendResponse.status}`);
        }

        const responseData = await backendResponse.json();
        console.log("Successfully hit backend endpoint:", responseData);
      } catch (apiError) {
        console.error("Error hitting backend endpoint:", apiError);
      }

      navigate('/bizradar-ai', {
        state: {
          trackerContext: {
            id: pursuit.id,
            title: pursuit.title,
            description: pursuit.description,
            stage: pursuit.stage,
            dueDate: pursuit.dueDate,
            naicsCode: pursuit.naicscode,
            noticeId: noticeId,
            userId: userId
          }
        }
      });
    } catch (error) {
      console.error("Error navigating to BizRadarAI:", error);
      toast?.error("An error occurred. Please try again.");
    }
  };

  useEffect(() => {
    const node = mainContentNode;
    if (!node) return;
    node.scrollTop = 0;
    const handleScroll = () => {
      if (node.scrollTop > 100) {
        setShowScrollToTop(true);
      } else {
        setShowScrollToTop(false);
      }
    };
    node.addEventListener("scroll", handleScroll);
    setTimeout(handleScroll, 0);
    return () => {
      node.removeEventListener("scroll", handleScroll);
    };
  }, [mainContentNode, view, pursuits.length, searchQuery]);

  const handleScrollToTop = () => {
    if (mainContentNode) {
      mainContentNode.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Memoize filtered and sorted pursuits to prevent unnecessary re-renders
  const filteredPursuits = useMemo(() => {
    let filtered = pursuits.filter(pursuit => {
      // Search filter
      const matchesSearch = pursuit.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pursuit.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      if (!matchesSearch) return false;

      // Status filter
      if (statusFilter !== 'all') {
        if (statusFilter === 'active' && pursuit.is_submitted) return false;
        if (statusFilter === 'submitted' && !pursuit.is_submitted) return false;
        if (statusFilter === 'draft' && pursuit.stage !== 'Assessment') return false;
      }

      // Due date filter
      if (dueDateFilter !== 'all' && pursuit.dueDate !== 'TBD') {
        const dueDate = new Date(pursuit.dueDate);
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const nextWeek = new Date(today);
        nextWeek.setDate(nextWeek.getDate() + 7);
        const nextMonth = new Date(today);
        nextMonth.setMonth(nextMonth.getMonth() + 1);

        switch (dueDateFilter) {
          case 'overdue':
            if (dueDate >= today) return false;
            break;
          case 'this_week':
            if (dueDate < today || dueDate > nextWeek) return false;
            break;
          case 'next_week':
            if (dueDate < nextWeek || dueDate > new Date(nextWeek.getTime() + 7 * 24 * 60 * 60 * 1000)) return false;
            break;
          case 'this_month':
            if (dueDate < today || dueDate > nextMonth) return false;
            break;
        }
      }

      return true;
    });

    // Sort the filtered results
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'due_date':
          if (a.dueDate === 'TBD' && b.dueDate === 'TBD') comparison = 0;
          else if (a.dueDate === 'TBD') comparison = 1;
          else if (b.dueDate === 'TBD') comparison = -1;
          else comparison = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
          break;
        case 'created_at':
          comparison = new Date(a.created).getTime() - new Date(b.created).getTime();
          break;
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'stage':
          comparison = a.stage.localeCompare(b.stage);
          break;
        default:
          comparison = 0;
      }
      
      // Apply sort direction
      return sortDirection === 'desc' ? -comparison : comparison;
    });

    return filtered;
  }, [pursuits, searchQuery, statusFilter, dueDateFilter, sortBy, sortDirection]);

  // Show error state
  if (error) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-red-500 text-center">
          <p className="text-lg font-medium">Error loading trackers</p>
          <p className="text-sm mt-2">{error}</p>
          <button 
            onClick={() => fetchTrackers(true)} 
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={DashboardTemplate.wrapper}>
      
      {showNotification && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg shadow-lg flex items-center gap-2 animate-fade-in text-sm sm:text-base">
          <span>Tracker added successfully!</span>
        </div>
      )}
      
      {/* Use Suspense for CreateTrackerDialog */}
      <Suspense fallback={null}>
        {isDialogOpen && (
          <CreateTrackerDialog
            isOpen={isDialogOpen}
            onClose={() => setIsDialogOpen(false)}
            onCreateTracker={handleCreateTracker}
          />
        )}
      </Suspense>
      
      {showRfpBuilder && (
        <div className="fixed inset-0 bg-gray-50 z-40 flex flex-col">
          <div className="flex flex-1 overflow-hidden">
            <SideBar />
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="sticky top-0 z-10 p-4 border-b flex justify-between items-center bg-white flex-shrink-0">
                <h2 className="text-lg sm:text-xl font-bold">RFP Response Builder</h2>
                <button
                  onClick={closeRfpBuilder}
                  className="text-gray-500 hover:text-gray-700 p-1 bg-gray-100 rounded-full"
                >
                  <X className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto">
                {currentRfpPursuitId && (
                  <RfpResponse 
                    contract={selectedPursuit} 
                    pursuitId={currentRfpPursuitId}
                  />
                )}
              </div>        
            </div>
          </div>
        </div>
      )}
      
      <div className="flex flex-1 overflow-hidden">
        {!showRfpBuilder && <SideBar />}

        <div className={DashboardTemplate.main}>
          {/* Page content */}
          <div className={`${DashboardTemplate.content} relative`}>
            
            <div className="w-full">
              {/* Page header - moved to top for seamless UI */}
              <div className="flex items-center mb-6 bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="mr-6 w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-md">
                  <Target className="h-8 w-8" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    My Tracker
                  </h1>
                  <div className="flex items-center mt-1 text-sm text-gray-500">
                    <Calendar className="h-4 w-4 mr-1" />
                    <span>{currentDate}</span>
                    <span className="mx-2">•</span>
                    <span className="flex items-center">
                      <Target className="h-4 w-4 mr-2 text-blue-500" />
                      Manage Trackers
                    </span>
                  </div>
                </div>
                <div className="ml-auto flex space-x-3">
                  {/* View Analytics button removed - accessible via sidebar */}
                </div>
              </div>
              
              <SearchAndActions
            onSearch={handleSearch}
            onDueDateFilterChange={handleDueDateFilterChange}
            onStatusFilterChange={handleStatusFilterChange}
            onSortChange={handleSortChange}
            dueDateFilter={dueDateFilter}
            statusFilter={statusFilter}
            sortBy={sortBy}
            sortDirection={sortDirection}
          />

          <ViewSelector
            currentView={view}
            onViewChange={(newView: ViewType) => {
              setView(newView);
              // Save to session storage for persistence
              sessionStorage.setItem("pursuitsViewType", newView);
            }}
          />

           <div className={`flex-1 p-3 sm:p-4 lg:p-5 ${view === 'kanban' ? '' : 'overflow-y-auto'}`} ref={mainContentRef}>
             {/* Show skeleton loading during initial/progressive loading */}
             {(progressiveLoading && !initialLoadComplete) ? (
              <PageLoadingSkeleton type="pursuits" />
            ) : pursuits.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[60vh] px-4">
                <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full mb-4 sm:mb-5">
                  <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
                </div>
                <h3 className="text-lg sm:text-xl font-medium text-gray-500 mb-2 text-center">No trackers added</h3>
                <p className="text-sm sm:text-base text-gray-400 max-w-sm sm:max-w-md mb-4 sm:mb-6 text-center">
                  Explore opportunities and add them to your tracker list to track them here.
                </p>
                <Link
                  to="/opportunities"
                  className="px-3 sm:px-4 py-2 sm:py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-2 mx-auto w-fit text-sm sm:text-base"
                >
                  <span>Find Opportunities</span>
                </Link>
              </div>
            ) : (
              <>
                {/* Use Suspense for content views */}
                <Suspense fallback={<PageLoadingSkeleton type="pursuits" />}>
                  {view === 'list' && (
                    <ListView
                      pursuits={filteredPursuits}
                      onPursuitSelect={handlePursuitSelect}
                      onRfpAction={handleRfpAction}
                      onDelete={handleRemovePursuit}
                      onAskAI={handleAskAI}
                      onToggleSubmission={handleToggleSubmission}
                      onPursuitUpdate={(id, updates) => {
                        setPursuits(prevPursuits =>
                          prevPursuits.map(pursuit =>
                            pursuit.id === id
                              ? { ...pursuit, ...updates }
                              : pursuit
                          )
                        );
                      }}
                      highlightedPursuitId={highlightedPursuitId}
                      fadingOutPursuitId={fadingOutPursuitId}
                    />
                  )}
                  
                  {view === 'kanban' && (
                    <KanbanView
                      pursuits={filteredPursuits}
                      onPursuitSelect={handlePursuitSelect}
                      onRfpAction={handleRfpAction}
                      onDelete={handleRemovePursuit}
                      onAskAI={handleAskAI}
                      highlightedPursuitId={highlightedPursuitId}
                      fadingOutPursuitId={fadingOutPursuitId}
                    />
                  )}
                  
                  {view === 'calendar' && (
                    <CalendarView
                      pursuits={filteredPursuits}
                      onPursuitSelect={handlePursuitSelect}
                      highlightedPursuitId={highlightedPursuitId}
                      fadingOutPursuitId={fadingOutPursuitId}
                    />
                  )}
                </Suspense>
              </>
            )}
            
            {/* Show loading overlay for background refreshes */}
            {isLoading && initialLoadComplete && !progressiveLoading && (
              <div className="fixed top-0 right-0 mt-2 mr-2 bg-white/80 backdrop-blur-sm rounded-full px-3 py-1 text-xs text-gray-600 flex items-center gap-1 shadow-sm">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                Refreshing...
              </div>
            )}
            
            <ScrollToTopButton isVisible={showScrollToTop} scrollToTop={handleScrollToTop} />
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}