import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { RfpContainer } from '../components/rfp/RfpContainer';
import { ArrowLeft, Loader2 } from 'lucide-react';
import SideBar from '../components/layout/SideBar';

export default function RfpWriter() {
  const { contractId, id } = useParams<{ contractId?: string; id?: string }>();
  const navigate = useNavigate();
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentView, setCurrentView] = useState<'overview' | 'editor'>('editor'); // Start with editor since users come here to generate RFP
  
  // Determine if this is a tracker route or contract route
  // For /trackers/:id route, id will be set
  // For /contracts/rfp/:contractId route, contractId will be set
  const isTrackerRoute = !!id;
  const effectiveId = isTrackerRoute ? id : contractId;
  
  // console.log('RfpWriter Debug:', { id, contractId, isTrackerRoute, effectiveId });

  useEffect(() => {
    if (isTrackerRoute) {
      // For tracker routes, validate the tracker exists first
      if (!effectiveId) {
        setError('Invalid tracker ID');
        setLoading(false);
        return;
      }
      loadTrackerData();
    } else {
      // For contract routes, try to load from sessionStorage first
      const loadContractData = () => {
        try {
          // console.log("Attempting to load from sessionStorage");
          const storedContract = sessionStorage.getItem('currentContract');
          // console.log("Raw data from sessionStorage:", storedContract);
          
          if (storedContract) {
            // console.log("Contract data found in sessionStorage");
            setContract(JSON.parse(storedContract));
            setLoading(false);
            return true;
          }
          return false;
        } catch (error) {
          // console.error('Error loading contract data:', error);
          return false;
        }
      };

      // First try to load from sessionStorage
      const contractLoaded = loadContractData();
      
      // If not found in sessionStorage, fetch from API
      if (!contractLoaded) {
        // console.log("Contract not loaded from sessionStorage, fetching from API");
        fetchContractData();
      }
    }
  }, [effectiveId, isTrackerRoute]);

  const loadTrackerData = async () => {
    setLoading(true);
    try {
      // console.log("Loading tracker data for ID:", effectiveId);
      
      // Import APIs
      const { trackersApi } = await import('../api/trackers');
      const { reportsApi } = await import('../api/reports');
      const { supabase } = await import('../utils/supabase');
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      // Fetch tracker data
      let tracker;
      try {
        tracker = await trackersApi.getTrackerById(effectiveId!, user.id);
      } catch (error: any) {
        if (error.message?.includes('500') || error.message?.includes('not found') || error.message?.includes('0 rows')) {
          // console.error('Tracker not found in database:', effectiveId);
          // throw new Error(`Tracker with ID ${effectiveId} not found in database. It may have been deleted.`);
        }
        throw error;
      }
      
      if (!tracker) {
        // throw new Error(`Tracker with ID ${effectiveId} not found`);
      }
      
      // Ensure report exists for this tracker
      try {
        // console.log('Checking for report with response_id:', effectiveId);
        await reportsApi.getReportByResponseId(effectiveId!, user.id);
        // console.log('Report exists for tracker:', effectiveId);
      } catch (reportError) {
        // Report doesn't exist, create it
        // console.log('Creating report for tracker:', effectiveId);
        await reportsApi.upsertReport(
          effectiveId!,
          {
            rfpTitle: tracker.title,
            dueDate: tracker.due_date,
            sections: [],
            isSubmitted: false,
          },
          0,
          false,
          user.id,
          tracker.opportunity_id // opportunity_id from tracker
        );
      }
      
      // Create contract object from tracker data
      const contractData = {
        id: tracker.opportunity_id || tracker.id, // Use opportunity_id if available, fallback to tracker.id
        title: tracker.title,
        description: tracker.description,
        dueDate: tracker.due_date,
        response_date: tracker.due_date,
        pursuit_id: tracker.id, // Use tracker ID as pursuit_id for reports
        stage: tracker.stage,
        is_submitted: tracker.is_submitted,
        opportunity_id: tracker.opportunity_id // Include opportunity_id in the contract object
      };
      
      setContract(contractData);
      setLoading(false);
    } catch (error) {
      // console.error('Error loading tracker data:', error);
      setError(`Failed to load tracker data: ${error.message}`);
      setLoading(false);
      
      // If tracker doesn't exist, redirect back to trackers list after a delay
      if (error.message.includes('not found')) {
        setTimeout(() => {
          navigate('/trackers');
        }, 2000);
      }
    }
  };

  const fetchContractData = async () => {
    setLoading(true);
    try {
      // console.log("Fetching contract data for ID:", effectiveId);
      
      // You would replace this with your actual API call
      // For demonstration, using a timeout to simulate API call
      setTimeout(() => {
        // Example fallback data if API call isn't implemented
        const fallbackData = {
          id: contractId,
          title: `Contract ${contractId}`,
          department: "Unknown Agency",
          dueDate: "2025-03-31",
          value: 100000,
          status: "Open",
          naicsCode: "000000", 
          description: "This is a placeholder description for the contract. In a real implementation, this would be fetched from your API."
        };
        
        // console.log("Setting fallback contract data:", fallbackData);
        setContract(fallbackData);
        setLoading(false);
      }, 1000);
      
      // In a real implementation, you would do something like:
      /*
      const response = await fetch(`/api/contracts/${contractId}`);
      if (!response.ok) {
        throw new Error(`Error fetching contract: ${response.statusText}`);
      }
      const data = await response.json();
      setContract(data);
      */
    } catch (error) {
      // console.error('Error fetching contract data:', error);
      setError('Failed to load contract details. Please try again later.');
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleViewChange = (view: 'overview' | 'editor') => {
    setCurrentView(view);
  };

  const handleBackToOverview = () => {
    setCurrentView('overview');
  };

  if (loading) {
    return (
      <div className="h-screen flex flex-col overflow-hidden">
        
        <div className="flex flex-1 min-h-0">
          <div className="flex-shrink-0">
            <SideBar />
          </div>
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <div className="p-3 sm:p-4 border-b border-gray-200 bg-white shadow-sm flex-shrink-0">
              <div className="flex items-center gap-4">
                <button 
                  onClick={handleGoBack}
                  className="flex items-center text-blue-600 hover:underline text-sm sm:text-base"
                >
                  <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1" /> 
                  <span className="hidden sm:inline">Back to Opportunities</span>
                  <span className="sm:hidden">Back</span>
                </button>
              </div>
            </div>
            <div className="flex-1 flex items-center justify-center p-4">
              <div className="text-center">
                <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-blue-600 mx-auto mb-3 sm:mb-4" />
                <p className="text-sm sm:text-base text-gray-600">Loading contract details...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex flex-col overflow-hidden">
        
        <div className="flex flex-1 min-h-0">
          <div className="flex-shrink-0">
            <SideBar />
          </div>
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <div className="p-3 sm:p-4 border-b border-gray-200 bg-white shadow-sm flex-shrink-0">
              <div className="flex items-center gap-4">
                <button 
                  onClick={handleGoBack}
                  className="flex items-center text-blue-600 hover:underline text-sm sm:text-base"
                >
                  <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1" /> 
                  <span className="hidden sm:inline">Back to Opportunities</span>
                  <span className="sm:hidden">Back</span>
                </button>
              </div>
            </div>
            <div className="flex-1 p-4 sm:p-6 overflow-auto">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 sm:p-6 text-center">
                <p className="text-red-600 mb-3 sm:mb-4 text-sm sm:text-base">{error}</p>
                <button 
                  onClick={() => {
                    if (error.includes('not found')) {
                      // Clear cache and redirect to trackers list
                      sessionStorage.clear();
                      navigate('/trackers');
                    } else {
                      // Try to reload the data
                      if (isTrackerRoute) {
                        loadTrackerData();
                      } else {
                        fetchContractData();
                      }
                    }
                  }}
                  className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-md text-sm sm:text-base"
                >
                  {error.includes('not found') ? 'Go to Trackers' : 'Try Again'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // console.log("Rendering RfpContainer with contract:", contract);

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      
      <div className="flex flex-1 min-h-0">
        <div className="flex-shrink-0">
          <SideBar />
        </div>
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="p-3 sm:p-4 border-b border-gray-200 bg-white shadow-sm flex-shrink-0">
            <div className="flex items-center gap-4">
              <button 
                onClick={handleGoBack}
                className="flex items-center text-blue-600 hover:underline text-sm sm:text-base"
              >
                <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1" /> 
                <span className="hidden sm:inline">Back to Opportunities</span>
                <span className="sm:hidden">Back</span>
              </button>
              
              {currentView === 'editor' && (
                <button 
                  onClick={handleBackToOverview}
                  className="flex items-center text-gray-600 hover:text-gray-800 hover:bg-gray-100 px-3 py-1.5 rounded-lg transition-colors text-sm sm:text-base"
                >
                  <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1" /> 
                  <span className="hidden sm:inline">Back to Overview</span>
                  <span className="sm:hidden">Overview</span>
                </button>
              )}
            </div>
          </div>
          <div className="flex-1 min-h-0 overflow-hidden">
            <RfpContainer 
              contract={contract}
              pursuitId={effectiveId}           // <-- use the effective ID (tracker ID or contract ID)
              onViewChange={handleViewChange}
              onBackToOverview={handleBackToOverview}
              currentView={currentView}
            />
          </div>
        </div>
      </div>
    </div>
  );
}