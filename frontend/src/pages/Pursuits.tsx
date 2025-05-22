import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom"; // Added useLocation
import { 
  Search, 
  FileText, 
  Trash2, 
  X, 
  PenLine, 
  CheckCircle, 
  CheckSquare,
  Upload,
  Plus,
  Calendar,
  ChevronRight,
  Bot, // Added Bot icon for AI button
  Power
} from "lucide-react";
import SideBar from "../components/layout/SideBar";
import { supabase } from "../utils/supabase";
import { toast } from "sonner";
import RfpResponse from "../components/rfp/rfpResponse";
import { useAuth } from "@/components/Auth/useAuth";

interface Pursuit {
  id: string;
  title: string;
  description: string;
  stage: string;
  created: string;
  dueDate: string;
  assignee: string;
  assigneeInitials: string;
  is_submitted?: boolean;
  naicscode: string;
}

interface Opportunity {
  title?: string;
  description?: string;
  due_date?: string;
}

interface RfpSaveEventDetail {
  pursuitId: string;
  stage: string;
  percentage: number;
}

export default function Pursuits(): JSX.Element {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation(); // Add useLocation hook
  // Initialize with empty array and add loading/error states
  const [pursuits, setPursuits] = useState<Pursuit[]>([]);
  const [selectedPursuit, setSelectedPursuit] = useState<Pursuit | null>(null);
  const [view, setView] = useState<string>("list");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showNotification, setShowNotification] = useState<boolean>(false);
  
  // Add new state for the RFP response builder
  const [showRfpBuilder, setShowRfpBuilder] = useState<boolean>(false);
  const [currentRfpPursuitId, setCurrentRfpPursuitId] = useState<string | null>(null);
  
  // Add dialog state for Import Pursuit
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newPursuit, setNewPursuit] = useState({
    title: "",
    description: "",
    stage: "Assessment",
    due_date: null,
    tags: [],
  });

  // File input ref
  const fileInputRef = useRef(null);
  const [selectedFiles, setSelectedFiles] = useState([]);

  // Function to handle navigation to BizRadar AI with pursuit context
  const navigateToBizRadarAI = async (pursuit: Pursuit, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row click event from firing
    console.log("Ask BizRadar AI button clicked for pursuit:", pursuit);
    
    try {
      // Fetch the noticeId from the sam_gov table using the title
      const { data, error } = await supabase
        .from('sam_gov')
        .select('notice_id')
        .eq('title', pursuit.title)
        .single();

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
        const backendResponse = await fetch('http://localhost:5000/ask-bizradar-ai', {
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
        toast?.success("Pursuit created successfully");

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

        // Close dialog
        toggleDialog();
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
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log("No user logged in");
        setIsLoading(false);
        setPursuits([]);
        return;
      }
      
      // Get query parameters
      const searchParams = new URLSearchParams(location.search);
      const filter = searchParams.get('filter');
      
      // Build the query
      let query = supabase
        .from('pursuits')
        .select('id, title, description, stage, created_at, user_id, due_date, is_submitted, naicscode')
        .eq('user_id', user.id);
      
      // Add filter for submitted pursuits if specified
      if (filter === 'submitted') {
        query = query.eq('is_submitted', true);
      }
      
      // Add ordering
      query = query.order('created_at', { ascending: false });
      
      const { data, error } = await query;
        
      if (error) {
        console.error("Fetch error:", error);
        setError(`Failed to fetch pursuits: ${error.message}`);
        setIsLoading(false);
        return;
      }
      
      // Transform to a simpler format with safe defaults
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
      // Fetch the noticeId from the sam_gov table using the naics_code
      const { data, error } = await supabase
        .from('sam_gov')
        .select('notice_id')
        .eq('title', pursuit.title)
        .single();

      if (error) {
        console.error("Error fetching noticeId:", error);
        toast?.error("Failed to fetch notice ID. Please try again.");
        return;
      }

      if (data) {
        const noticeId = data.notice_id;
        // Redirect to the specified URL
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
  
  const changeView = (newView: string): void => {
    setView(newView);
  };

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
      
      {/* RFP Builder Modal */}
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
        {/* Sidebar */}
        <SideBar />

        {/* Main Dashboard Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="border-b border-gray-200 bg-white shadow-sm">
            <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-2">
                <span className="text-gray-500 text-sm font-medium">Portfolio</span>
                <ChevronRight size={16} className="text-gray-500" />
                <span className="font-medium text-gray-500">Pursuits</span>
              </div>
              <div className="flex items-center gap-4">
                <button className="bg-blue-50 text-blue-600 hover:bg-blue-100 px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-blue-100">
                  <span>View Analytics</span>
                </button>
              <button
                  onClick={handleLogout}
                  className="bg-blue-50 text-blue-600 hover:bg-blue-100 px-4 py-2 rounded-lg text-sm flex items-center gap-2 border border-blue-100 transition-colors"
                >
                  <Power  size={16} />
                  {/* <span className="font-medium">Logout</span> */}
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
                className="w-full pl-12 pr-12 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-transparent transition-all shadow-sm bg-gray-50"
              />
            </div>
            
            <div className="flex items-center gap-3 ml-4">
              <button 
                onClick={toggleDialog}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg shadow-sm transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>New Pursuit</span>
              </button>
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
              List
            </button>
            <button 
              className={`flex items-center justify-center py-3 px-6 font-medium rounded-t-lg transition-colors ${
                view === 'kanban' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
              onClick={() => changeView('kanban')}
            >
              Kanban
            </button>
            <button 
              className={`flex items-center justify-center py-3 px-6 font-medium rounded-t-lg transition-colors ${
                view === 'calendar' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
              onClick={() => changeView('calendar')}
            >
              Calendar
            </button>
          </div>

          {/* Main Content */}
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
                  <Search className="w-4 h-4" />
                  <span>Find Opportunities</span>
                </Link>
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
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
                        <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Submitted
                        </th>
                        <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
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
                            <div className="text-sm text-red-600 font-medium">
                              {pursuit.dueDate !== "TBD" ? pursuit.dueDate : "No Due Date Set"}
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-center">
                            {pursuit.is_submitted ? (
                              <CheckSquare className="w-5 h-5 text-green-600 mx-auto" />
                            ) : pursuit.stage === "RFP Response Completed" ? (
                              <div className="flex justify-center">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleSubmission(pursuit.id);
                                  }}
                                  className="w-5 h-5 border border-gray-300 rounded flex items-center justify-center hover:bg-gray-100 transition-colors"
                                  title="Mark as submitted"
                                >
                                  <div className="w-3 h-3 rounded"></div>
                                </button>
                              </div>
                            ) : (
                              <div className="flex justify-center tooltip relative">
                                <div className="w-5 h-5 border border-gray-200 rounded bg-gray-100 opacity-60 cursor-not-allowed"></div>
                                <div className="tooltip-text opacity-0 group-hover:opacity-100 absolute mt-8 -translate-x-1/2 left-1/2 p-2 bg-gray-800 text-white text-xs rounded w-48 transition-all pointer-events-none">
                                  Please complete the RFP before submitting
                                </div>
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end space-x-2">
                              {/* New Ask BizRadar AI Button */}
                              <button
                                onClick={(e) => navigateToBizRadarAI(pursuit, e)}
                                className="p-1.5 rounded-full text-emerald-600 hover:bg-emerald-100 transition-all"
                                title="Ask BizRadar AI"
                              >
                                <Bot size={18} />
                              </button>
                              
                              {/* RFP Action Button */}
                              {renderRfpActionButton(pursuit)}
                              
                              {/* Delete Button */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemovePursuit(pursuit.id);
                                }}
                                className="p-1.5 rounded-full text-gray-400 hover:bg-red-100 hover:text-red-600 transition-all"
                                title="Delete Pursuit"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}