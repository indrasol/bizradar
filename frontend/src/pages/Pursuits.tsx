import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Search, FileText, Trash2, X, PenLine, CheckCircle, CheckSquare } from "lucide-react";
import SideBar from "../components/layout/SideBar";
import { supabase } from "../utils/supabase";
import { toast } from "sonner";
import RfpResponse from "../components/rfp/rfpResponse";

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
      
      // Simple query to just get the basic data
      const { data, error } = await supabase
        .from('pursuits')
        .select('id, title, description, stage, created_at, user_id, due_date, is_submitted, naicscode')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
        
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
  }, []);
  
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
              <div className="text-xl font-semibold text-gray-800">Pursuits</div>
              <div className="flex items-center gap-4">
                <button className="bg-blue-50 text-blue-600 hover:bg-blue-100 px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-blue-100">
                  <span>View Analytics</span>
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
              
              <button className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg shadow-sm transition-colors">
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