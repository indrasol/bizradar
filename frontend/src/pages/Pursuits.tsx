import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { FileText, X, PenLine, CheckCircle } from "lucide-react";
import SideBar from "../components/layout/SideBar";
import { supabase } from "../utils/supabase";
import { toast } from "sonner";
import RfpResponse from "../components/rfp/rfpResponse";
import { useAuth } from "@/components/Auth/useAuth";
import { PursuitHeader } from "@/components/pursuits/PursuitHeader";
import { SearchAndActions } from "@/components/pursuits/SearchAndActions";
import { ViewSelector, ViewType } from "@/components/pursuits/ViewSelector";
import { KanbanView } from "@/components/pursuits/KanbanView";
import { CalendarView } from "@/components/pursuits/CalendarView";
import { ListView } from "@/components/pursuits/ListView";
import { CreatePursuitDialog } from "@/components/pursuits/CreatePursuitDialog";
import { Pursuit, Opportunity, RfpSaveEventDetail } from "@/components/pursuits/types";

const isDevelopment = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
const API_BASE_URL = isDevelopment
  ? "http://localhost:5000"
  : import.meta.env.VITE_API_BASE_URL;

export default function Pursuits(): JSX.Element {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [pursuits, setPursuits] = useState<Pursuit[]>([]);
  const [selectedPursuit, setSelectedPursuit] = useState<Pursuit | null>(null);
  const [view, setView] = useState<ViewType>("list");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showNotification, setShowNotification] = useState<boolean>(false);
  const [showRfpBuilder, setShowRfpBuilder] = useState<boolean>(false);
  const [currentRfpPursuitId, setCurrentRfpPursuitId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // File input ref
  const fileInputRef = useRef(null);
  const [selectedFiles, setSelectedFiles] = useState([]);

  // Function to handle navigation to BizRadar AI with pursuit context
  const navigateToBizRadarAI = async (pursuit: Pursuit, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row click event from firing
    console.log("Ask BizRadar AI button clicked for pursuit:", pursuit);
    
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
      console.log("Found notice ID:", noticeId);
      
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
            pursuitContext: {
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
        // Continue with navigation even if the API call fails
      }
      
      // Navigate to BizRadarAI with pursuit context
      navigate('/bizradar-ai', { 
        state: { 
          pursuitContext: {
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
      console.error("Error navigating to BizRadarAI:", error);
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
  
  // Function to open the RFP builder for a pursuit
  const openRfpBuilder = (pursuit: Pursuit): void => {
    setSelectedPursuit(pursuit);
    setCurrentRfpPursuitId(pursuit.id);
    setShowRfpBuilder(true);
  };
  
  // Function to close the RFP builder
  const closeRfpBuilder = (): void => {
    setShowRfpBuilder(false);
    setCurrentRfpPursuitId(null);
    
    // Refresh the pursuits list to get the updated stage
    fetchPursuits();
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
  
  // Add handleAddToPursuit function
  const handleAddToPursuit = async (opportunity: Opportunity): Promise<void> => {
    try {
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log("No user logged in");
        return;
      }
      
      console.log("Adding to pursuits:", {
        title: opportunity.title || "Untitled",
        description: opportunity.description || "",
        stage: "Assessment",
        user_id: user.id
      });
      
      // Create new pursuit
      const { data, error } = await supabase
        .from('pursuits')
        .insert({
          title: opportunity.title || "Untitled",
          description: opportunity.description || "",
          stage: "Assessment",
          user_id: user.id,
          due_date: opportunity.due_date,
          is_submitted: false
        })
        .select();
        
      if (error) {
        console.error("Insert error details:", error);
        throw error;
      }
      
      console.log("Added successfully:", data);
      
      if (data && data.length > 0) {
        // Show notification
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 3000);
        
        // Update pursuits list with the new pursuit
        const formattedPursuit: Pursuit = {
          id: data[0].id,
          title: data[0].title || "Untitled",
          description: data[0].description || "",
          stage: data[0].stage || "Assessment",
          created: new Date(data[0].created_at).toLocaleDateString(),
          dueDate: data[0].due_date ? new Date(data[0].due_date).toLocaleDateString() : "TBD",
          assignee: "Unassigned",
          assigneeInitials: "UA",
          is_submitted: data[0].is_submitted || false,
          naicscode: data[0].naicscode || ""
        };
        
        setPursuits(prevPursuits => [formattedPursuit, ...prevPursuits]);
      }
    } catch (error) {
      console.error("Error adding to pursuits:", error);
      setError("Failed to add pursuit. Please try again.");
    }
  };
  
  // Function to handle create pursuit
  const handleCreatePursuit = async (pursuitData: {
    title: string;
    description: string;
    stage: string;
    due_date: string | null;
    tags: string[];
  }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log("No user logged in");
        return;
      }

      let formattedDueDate = null;
      if (pursuitData.due_date) {
        formattedDueDate = new Date(pursuitData.due_date).toISOString();
      }

      const { data, error } = await supabase
        .from("pursuits")
        .insert({
          title: pursuitData.title || "Untitled",
          description: pursuitData.description || "",
          stage: pursuitData.stage || "Assessment",
          user_id: user.id,
          due_date: formattedDueDate,
        })
        .select();

      if (error) {
        console.error("Insert error details:", error);
        throw error;
      }

      if (data && data.length > 0) {
        toast?.success("Pursuit created successfully");

        const formattedPursuit: Pursuit = {
          id: data[0].id,
          title: data[0].title || "Untitled",
          description: data[0].description || "",
          stage: data[0].stage || "Assessment",
          created: new Date(data[0].created_at).toLocaleDateString(),
          dueDate: data[0].due_date ? new Date(data[0].due_date).toLocaleDateString() : "TBD",
          assignee: "Unassigned",
          assigneeInitials: "UA",
          is_submitted: data[0].is_submitted || false,
          naicscode: data[0].naicscode || ""
        };
        
        setPursuits(prevPursuits => [formattedPursuit, ...prevPursuits]);
      }
    } catch (error) {
      console.error("Error creating pursuit:", error);
      toast?.error("Failed to create pursuit. Please try again.");
    }
  };
  
  // Function to fetch pursuits
  const fetchPursuits = async (): Promise<void> => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log("No user logged in");
        setIsLoading(false);
        setPursuits([]);
        return;
      }
      
      const searchParams = new URLSearchParams(location.search);
      const filter = searchParams.get('filter');
      
      let query = supabase
        .from('pursuits')
        .select('id, title, description, stage, created_at, user_id, due_date, is_submitted, naicscode')
        .eq('user_id', user.id);
      
      if (filter === 'submitted') {
        query = query.eq('is_submitted', true);
      }
      
      query = query.order('created_at', { ascending: false });
      
      const { data, error } = await query;
        
      if (error) {
        console.error("Fetch error:", error);
        setError(`Failed to fetch pursuits: ${error.message}`);
        setIsLoading(false);
        return;
      }
      
      const formattedPursuits: Pursuit[] = data.map(pursuit => ({
        id: pursuit.id,
        title: pursuit.title || "Untitled",
        description: pursuit.description || "",
        stage: pursuit.stage || "Assessment",
        created: new Date(pursuit.created_at).toLocaleDateString(),
        dueDate: pursuit.due_date ? new Date(pursuit.due_date).toLocaleDateString() : "TBD",
        assignee: "Unassigned",
        assigneeInitials: "UA",
        is_submitted: pursuit.is_submitted || false,
        naicscode: pursuit.naicscode || ""
      }));
      
      setPursuits(formattedPursuits);
    } catch (error: any) {
      console.error("Error fetching pursuits:", error);
      setError(`Error fetching pursuits: ${error.message}`);
      setPursuits([]);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Replace the useEffect for fetching pursuits
  useEffect(() => {
    fetchPursuits();
    
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
          console.log('Change received!', payload);
          fetchPursuits(); // Refresh the list when changes occur
        }
      )
      .subscribe();
      
    // Clean up subscription when component unmounts
    return () => {
      subscription.unsubscribe();
    };
  }, [location.search]); // Add location.search as a dependency to refetch when query params change
  
  // Modify the handlePursuitSelect function
  const handlePursuitSelect = async (pursuit: Pursuit): Promise<void> => {
    try {
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

      if (data) {
        const noticeId = data.notice_id;
        window.location.href = `https://sam.gov/opp/${noticeId}/view`;
      } else {
        toast?.error("No notice ID found for the selected pursuit.");
      }
    } catch (error) {
      console.error("Error in handlePursuitSelect:", error);
      toast?.error("An unexpected error occurred. Please try again.");
    }
  };
  
  // Replace the handleRemovePursuit function
  const handleRemovePursuit = async (id: string): Promise<void> => {
    try {
      // First delete any associated RFP responses
      const { error: rfpError } = await supabase
        .from('rfp_responses')
        .delete()
        .eq('pursuit_id', id);
        
      if (rfpError) {
        console.error("Error removing RFP responses:", rfpError);
        toast?.error(`Error removing RFP responses: ${rfpError.message}`);
        throw rfpError;
      }
      
      // Then delete any associated assignees
      const { error: assigneeError } = await supabase
        .from('pursuit_assignees')
        .delete()
        .eq('pursuit_id', id);
        
      if (assigneeError) {
        console.error("Error removing assignees:", assigneeError);
        toast?.error(`Error removing assignees: ${assigneeError.message}`);
        throw assigneeError;
      }
      
      // Then delete the pursuit
      const { error } = await supabase
        .from('pursuits')
        .delete()
        .eq('id', id);
        
      if (error) {
        console.error("Error removing pursuit:", error);
        toast?.error(`Error removing pursuit: ${error.message}`);
        throw error;
      }
      
      // Update the local state
      setPursuits(pursuits.filter(pursuit => pursuit.id !== id));
      
      // If the removed pursuit was selected, clear selection
      if (selectedPursuit && selectedPursuit.id === id) {
        setSelectedPursuit(null);
      }
      
      toast?.success("Pursuit removed successfully");
    } catch (error: any) {
      console.error("Error removing pursuit:", error);
      toast?.error("Failed to remove pursuit. Please try again.");
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
          openRfpBuilder(pursuit);
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
      // Update the pursuit to mark it as submitted
      const { error } = await supabase
        .from('pursuits')
        .update({ is_submitted: true })
        .eq('id', pursuitId);
      
      if (error) {
        console.error("Error updating submission status:", error);
        toast?.error(`Failed to mark as submitted: ${error.message}`);
        return;
      }
      
      // Update the local state
      setPursuits(pursuits.map(pursuit => 
        pursuit.id === pursuitId 
          ? { ...pursuit, is_submitted: true } 
          : pursuit
      ));
      
      toast?.success("Proposal marked as submitted!");
    } catch (error: any) {
      console.error("Error toggling submission:", error);
      toast?.error("Failed to update submission status. Please try again.");
    }
  };

  useEffect(() => {
    const handleRfpSaved = (event: Event): void => {
      const customEvent = event as CustomEvent<RfpSaveEventDetail>;
      const { pursuitId, stage, percentage } = customEvent.detail;

      console.log("RFP saved event received:", { pursuitId, stage, percentage });

      // Update the pursuit in your list
      setPursuits(prevPursuits => 
        prevPursuits.map(pursuit => 
          pursuit.id === pursuitId 
            ? { ...pursuit, stage: stage } 
            : pursuit
        )
      );
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

  const filteredPursuits = pursuits.filter(pursuit =>
    pursuit.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pursuit.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleViewAnalytics = () => {
    // Implement analytics view
    toast.info("Analytics view coming soon!");
  };

  const handleNewPursuit = () => {
    setIsDialogOpen(true);
  };

  const handleRfpAction = (pursuit: Pursuit) => {
    setSelectedPursuit(pursuit);
    setCurrentRfpPursuitId(pursuit.id);
    setShowRfpBuilder(true);
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
            pursuitContext: {
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
          pursuitContext: {
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

  // Show loading state
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-red-500 text-center">
          <p className="text-lg font-medium">Error loading pursuits</p>
          <p className="text-sm mt-2">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 text-gray-800">
      {showNotification && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-fade-in">
          <span>Pursuit added successfully!</span>
        </div>
      )}
      
      <CreatePursuitDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onCreatePursuit={handleCreatePursuit}
      />
      
      {showRfpBuilder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-start overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl w-full mx-auto relative">
            <div className="sticky top-0 bg-white z-10 p-4 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold">RFP Response Builder</h2>
              <button
                onClick={closeRfpBuilder}
                className="text-gray-500 hover:text-gray-700 p-1 bg-gray-100 rounded-full"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="overflow-y-auto">
              {currentRfpPursuitId && (
                <RfpResponse 
                  contract={selectedPursuit} 
                  pursuitId={currentRfpPursuitId} 
                />
              )}
            </div>
          </div>
        </div>
      )}
      
      <div className="flex flex-1 overflow-hidden">
        <SideBar />

        <div className="flex-1 flex flex-col overflow-hidden">
          <PursuitHeader onViewAnalytics={handleViewAnalytics} />
          
          <SearchAndActions
            onSearch={handleSearch}
            onNewPursuit={handleNewPursuit}
          />

          <ViewSelector
            currentView={view}
            onViewChange={(newView: ViewType) => {
              setView(newView);
            }}
          />

          <div className="flex-1 overflow-auto p-5">
            {pursuits.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[60vh]">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-5">
                  <FileText className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-medium text-gray-500 mb-2">No pursuits added</h3>
                <p className="text-gray-400 max-w-md mb-6 text-center">
                  Explore opportunities and add them to your pursuits list to track them here.
                </p>
                <Link
                  to="/opportunities"
                  className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-2 mx-auto w-fit"
                >
                  <span>Find Opportunities</span>
                </Link>
              </div>
            ) : (
              <>
                {view === 'list' && (
                  <ListView
                    pursuits={filteredPursuits}
                    onPursuitSelect={handlePursuitSelect}
                    onRfpAction={handleRfpAction}
                    onDelete={handleRemovePursuit}
                    onAskAI={handleAskAI}
                    onToggleSubmission={handleToggleSubmission}
                  />
                )}
                
                {view === 'kanban' && (
                  <KanbanView
                    pursuits={filteredPursuits}
                    onPursuitSelect={handlePursuitSelect}
                    onRfpAction={handleRfpAction}
                    onDelete={handleRemovePursuit}
                    onAskAI={handleAskAI}
                  />
                )}
                
                {view === 'calendar' && (
                  <CalendarView
                    pursuits={filteredPursuits}
                    onPursuitSelect={handlePursuitSelect}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}