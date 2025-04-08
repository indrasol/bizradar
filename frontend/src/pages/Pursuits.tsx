import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Search, FileText, Trash2 } from "lucide-react";
import SideBar from "../components/layout/SideBar";
import { supabase } from "../utils/supabase";
import { toast } from "sonner";

export default function Pursuits() {
  // Initialize with empty array and add loading/error states
  const [pursuits, setPursuits] = useState([]);
  const [selectedPursuit, setSelectedPursuit] = useState(null);
  const [view, setView] = useState("list");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showNotification, setShowNotification] = useState(false);
  
  // Add handleAddToPursuit function
  const handleAddToPursuit = async (opportunity) => {
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
      
      // Create new pursuit with ONLY these fields - explicitly exclude due_date
      const { data, error } = await supabase
        .from('pursuits')
        .insert({
          title: opportunity.title || "Untitled",
          description: opportunity.description || "",
          stage: "Assessment",
          user_id: user.id,
          due_date: opportunity.due_date // Add this line to include the due date

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
        const formattedPursuit = {
          id: data[0].id,
          title: data[0].title || "Untitled",
          description: data[0].description || "",
          stage: data[0].stage || "Assessment",
          created: new Date(data[0].created_at).toLocaleDateString(),
          dueDate: "TBD",
          assignee: "Unassigned",
          assigneeInitials: "UA"
        };
        
        setPursuits(prevPursuits => [formattedPursuit, ...prevPursuits]);
      }
    } catch (error) {
      console.error("Error adding to pursuits:", error);
      setError("Failed to add pursuit. Please try again.");
    }
  };
  
  // Replace the useEffect for fetching pursuits
  useEffect(() => {
    const fetchPursuits = async () => {
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
          .select('id, title, description, stage, created_at, user_id, due_date')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
          
        if (error) {
          console.error("Fetch error:", error);
          setError(`Failed to fetch pursuits: ${error.message}`);
          setIsLoading(false);
          return;
        }
        
        // Transform to a simpler format with safe defaults
        const formattedPursuits = data.map(pursuit => ({
          id: pursuit.id,
          title: pursuit.title || "Untitled",
          description: pursuit.description || "",
          stage: pursuit.stage || "Assessment",
          created: new Date(pursuit.created_at).toLocaleDateString(),
          dueDate: pursuit.due_date ? new Date(pursuit.due_date).toLocaleDateString() : "TBD",
          assignee: "Unassigned",
          assigneeInitials: "UA"
        }));
        
        setPursuits(formattedPursuits);
      } catch (error) {
        console.error("Error fetching pursuits:", error);
        setError(`Error fetching pursuits: ${error.message}`);
        setPursuits([]);
      } finally {
        setIsLoading(false);
      }
    };
    
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
  
  const handlePursuitSelect = (pursuit) => {
    setSelectedPursuit(pursuit);
  };
  
  // Replace the handleRemovePursuit function
  const handleRemovePursuit = async (id) => {
    try {
      // First delete any associated assignees
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
    } catch (error) {
      console.error("Error removing pursuit:", error);
      toast?.error("Failed to remove pursuit. Please try again.");
    }
  };
  
  const getStageColor = (stage) => {
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
  
  const changeView = (newView) => {
    setView(newView);
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
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                <div className="flex items-center">
                                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-medium shadow-sm">
                                    {pursuit.assigneeInitials}
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <button
                              className="p-1.5 rounded-full text-gray-400 opacity-0 group-hover:opacity-100 hover:bg-white hover:text-red-600 transition-all"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                handleRemovePursuit(pursuit.id);
                                  }}
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