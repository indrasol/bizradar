import React, { useState, useEffect } from 'react';
import { RfpOverview } from './RfpOverview';
import RfpResponse from './rfpResponse';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Eye, Download, AlertCircle, Info, X, ArrowLeft } from 'lucide-react';
import { supabase } from '../../utils/supabase';
import { toast } from 'sonner';
import { reportsApi } from '../../api/reports';
import { trackersApi } from '../../api/trackers';

interface RfpResponseData {
  id: string;
  response_id: string;
  user_id: string;
  content: {
    logo?: string;
    companyName?: string;
    companyWebsite?: string;
    letterhead?: string;
    phone?: string;
    rfpTitle?: string;
    naicsCode?: string;
    solicitationNumber?: string;
    issuedDate?: string;
    submittedBy?: string;
    theme?: string;
    sections?: any[];
    isSubmitted?: boolean;
    stage?: string;
  };
  completion_percentage: number;
  is_submitted: boolean;
  created_at: string;
  updated_at: string;
  stage?: string;
}

interface TrackerData {
  title: string;
  description?: string;
  stage?: string;
  due_date?: string;
  naicscode?: string;
  opportunity_id?: number;
}

/**
 * Container component for RFP (Request for Proposal) workflow
 * Handles the display of RFP overview and response generation
 */
export function RfpContainer({ initialContent = '', contract, pursuitId, onViewChange, onBackToOverview, currentView: parentCurrentView }) {
  const [showEditor, setShowEditor] = useState(false);
  const [generatingRfp, setGeneratingRfp] = useState(false);
  const [viewDescription, setViewDescription] = useState(false);
  const [viewHtml, setViewHtml] = useState(false); // New state for HTML modal
  const [descriptionContent, setDescriptionContent] = useState('');
  const [existingRfpData, setExistingRfpData] = useState<RfpResponseData | null>(null);
  const [isCheckingExisting, setIsCheckingExisting] = useState<boolean>(true);
  const [internalPursuitId, setInternalPursuitId] = useState<string | null>(null);
  // Use parent's currentView, fallback to 'overview' if not provided
  const currentView = parentCurrentView || 'overview';
  
  // Add debugging to check the contract data
  useEffect(() => {
    console.log("RfpContainer received contract:", contract);
  }, [contract]);

  // Check if there's already an RFP response for this contract
  useEffect(() => {
    const checkExistingRfp = async (): Promise<void> => {
      // Use pursuit_id if available, otherwise fall back to contract.id
      const responseId = contract?.pursuit_id || contract?.id;
      if (!responseId) return;
      
      try {
        setIsCheckingExisting(true);
        
        // Get the current user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          console.log("No user logged in");
          setIsCheckingExisting(false);
          return;
        }
        
        // Check if there's an existing RFP response using the API
        try {
          const report = await reportsApi.getReportByResponseId(responseId, user.id);
          console.log("Found existing RFP data:", report);
          setExistingRfpData(report as RfpResponseData);
          
          // If there's existing data and it's not submitted, prepare to show the editor
          if (report.is_submitted !== true) {
            // Don't automatically switch to editor view, let user choose
            setShowEditor(true);
          }
        } catch (error: any) {
          // If error is 404 (not found), that's expected for new RFPs
          if (error.message && error.message.includes('404')) {
            console.log("No existing RFP response found - this is normal for new RFPs");
          } else {
            console.error("Error checking existing RFP:", error);
            toast?.error("Failed to check for existing RFP data.");
          }
        }
      } catch (error) {
        console.error("Error in checkExistingRfp:", error);
        toast?.error("Failed to check for existing RFP data.");
      } finally {
        setIsCheckingExisting(false);
      }
    };
    
    checkExistingRfp();
  }, [contract?.id, contract?.pursuit_id]);

  // Function to handle generating a new RFP response
  const handleGenerateRfp = async (): Promise<void> => {
    onViewChange?.('editor');
    setShowEditor(true);
    setGeneratingRfp(true);

    try {
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log("No user logged in");
        toast?.error("You must be logged in to generate an RFP response.");
        setGeneratingRfp(false);
        return;
      }
      
      // Initialize pursuitId with the pursuit_id if available, otherwise use contract ID
      let pursuitId = contract.pursuit_id || contract.id;
      let trackerExists = false;
      
      // Check if the tracker already exists using API
      try {
        const existingTracker = await trackersApi.getTrackerById(pursuitId, user.id);
        console.log("Tracker exists with ID:", pursuitId);
        trackerExists = true;
      } catch (error: any) {
        if (!error.message?.includes('404')) {
          console.error("Error checking tracker:", error);
        }
        
        // Check if a tracker with this title exists
        try {
          const trackers = await trackersApi.getTrackers(user.id);
          const titleTracker = trackers.trackers.find(t => t.title === contract.title);
          
          if (titleTracker) {
            // Use the existing tracker ID
            pursuitId = titleTracker.id;
            trackerExists = true;
            console.log("Found tracker by title, ID:", pursuitId);
          }
        } catch (listError) {
          console.error("Error listing trackers:", listError);
        }
      }
      
      // If no tracker exists, create one
      if (!trackerExists) {
        console.log("Creating new tracker");
        
        // Format due_date properly - don't use 'TBD' strings
        let formattedDueDate = undefined;
        if (contract.dueDate && contract.dueDate !== "TBD" && contract.dueDate !== "Not specified") {
          formattedDueDate = new Date(contract.dueDate).toISOString();
        } else if (contract.response_date && contract.response_date !== "TBD" && contract.response_date !== "Not specified") {
          formattedDueDate = new Date(contract.response_date).toISOString();
        }
        
        const trackerData: TrackerData = {
          title: contract.title || "Untitled Opportunity",
          description: contract.description || '',
          stage: 'RFP Response Initiated',
          due_date: formattedDueDate,
          naicscode: contract.naicsCode || contract.naics_code,
          opportunity_id: contract.opportunity_id
        };
        
        try {
          const newTracker = await trackersApi.createTracker(trackerData, user.id);
          const newTrackerId = newTracker.id;
          setInternalPursuitId(newTrackerId);
          pursuitId = newTrackerId;
          console.log("Created new tracker with ID:", newTrackerId);
          trackerExists = true;
        } catch (createError) {
          console.error("Error creating tracker:", createError);
          toast?.error("Failed to create tracker. Please try again.");
          setGeneratingRfp(false);
          return;
        }
      }
      
      // Update contract with the correct pursuit ID
      if (contract) {
        console.log("Updating contract with correct pursuit ID:", pursuitId);
        contract.pursuitId = pursuitId; // Update the contract with the new pursuit ID
        contract.id = pursuitId; // Directly replace the original ID
      }
      
      if (!trackerExists) {
        toast?.error("Failed to create or find tracker.");
        setGeneratingRfp(false);
        return;
      }
      
      // Now check if an RFP response already exists for this pursuit using API
      try {
        const existingReport = await reportsApi.getReportByResponseId(pursuitId, user.id);
        console.log("Found existing RFP response:", existingReport);
        setExistingRfpData(existingReport as RfpResponseData);
      } catch (error: any) {
        if (error.message?.includes('404')) {
          // Create a new RFP response using API
          console.log("Creating new RFP response for pursuit ID:", pursuitId);
          try {
            const newReport = await reportsApi.upsertReport(
              pursuitId,
              {
                companyName: 'BizRadar Solutions',
                rfpTitle: contract?.title || 'RFP Response',
                rfpNumber: contract?.solicitation_number || '',
                issuedDate: contract?.published_date || new Date().toLocaleDateString(),
                sections: []
              },
              0,
              false,
              user.id
            );
            setExistingRfpData(newReport as RfpResponseData);
          } catch (createError) {
            console.error("Error creating RFP response:", createError);
            toast?.error("Failed to create RFP response. Please try again.");
          }
        } else {
          console.error("Error checking existing RFP response:", error);
        }
      }
      
      // Update the tracker's stage using API
      try {
        await trackersApi.updateTracker(pursuitId, { stage: 'RFP Response Initiated' }, user.id);
      } catch (updateError) {
        console.error("Error updating tracker stage:", updateError);
      }
        
      // Dispatch the custom event
      const customEvent = new CustomEvent('rfp_saved', { 
        detail: { 
          pursuitId: pursuitId, 
          stage: 'RFP Response Initiated',
          percentage: 0
        } 
      });
      
      window.dispatchEvent(customEvent);
        
    } catch (error) {
      console.error("Error in handleGenerateRfp:", error);
      toast?.error("An error occurred. Please try again.");
    } finally {
      // Simulate loading for a better UX
      setTimeout(() => {
        setGeneratingRfp(false);
      }, 1200);
    }
  };

  // Handle opening the full description in a modal
  const handleViewDescription = () => {
    console.log("View description clicked, contract:", contract);
    
    if (contract?.external_url) {
      // If there's an external URL, open it in a new tab
      console.log("Opening external URL:", contract.external_url);
      window.open(contract.external_url, '_blank');
    } else if (contract?.description) {
      // Otherwise show the description in a modal
      console.log("Setting description content:", contract.description);
      setDescriptionContent(contract.description);
      setViewDescription(true);
    } else {
      console.log("No description available");
      toast?.error("No description available for this opportunity.");
    }
  };

  // Handle going back to overview
  const handleBackToOverview = () => {
    onViewChange?.('overview');
    onBackToOverview?.();
    setShowEditor(false);
  };

  // Handle viewing existing RFP response
  const handleViewExistingRfp = () => {
    onViewChange?.('editor');
    setShowEditor(true);
  };

  // Handle downloading the current RFP state
  const handleDownloadRfp = () => {
    if (!existingRfpData) {
      // toast?.info("Generate an RFP response first.");
      // return;
      setViewHtml(true);
    }
    
    // This would be implemented to generate and download the RFP document
    toast?.info("Download functionality will be implemented in a future update.");
  };

  const handleDownloadHtml = () => {
    const htmlFile = "/proposal-template.html"; // Replace with your HTML file's URL or path
    const link = document.createElement("a");
    link.href = htmlFile;
    link.download = "proposal-template.html"; // Set the downloaded file name
    link.click();
  };

  return (
    <div className="h-full bg-background relative overflow-hidden">
      {/* Description Modal */}
      {viewDescription && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-start overflow-y-auto p-4">
          <div className="bg-card rounded-lg shadow-xl max-w-4xl w-full mx-4 my-8 relative border border-border">
            <div className="sticky top-0 bg-card z-10 p-4 border-b border-border flex justify-between items-center">
              <h2 className="text-xl font-bold text-foreground">RFP Description</h2>
              <button
                onClick={() => setViewDescription(false)}
                className="text-muted-foreground hover:text-foreground p-2 rounded-full hover:bg-muted"
              >
                <Eye className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[70vh]">
              <div className="prose max-w-none">
                {descriptionContent || 'No detailed description available.'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HTML View Modal */}
      {viewHtml && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-start overflow-y-auto overflow-x-hidden p-2">
          <div className="bg-card rounded-lg shadow-xl max-w-5xl w-full mx-1 my-4 relative box-border border border-border">
            <div className="sticky top-0 bg-card z-10 p-3 border-b border-border flex justify-between items-center">
              <h2 className="text-xl font-bold text-foreground">Sample RFP Response</h2>
              <button
                onClick={() => setViewHtml(false)}
                className="text-muted-foreground hover:text-foreground p-2 rounded-full hover:bg-muted"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-3 overflow-y-auto overflow-x-hidden max-h-[85vh]">
              <iframe
                src="/proposal-template.html"
                className="w-full h-[75vh] border-none box-border"
                style={{ maxWidth: "100%", overflowX: "hidden" }}
                title="Sample RFP Response"
                onError={() => {
                  toast?.error("Failed to load HTML file.");
                }}
              />
              {/* <button
                onClick={handleDownloadHtml}
                className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Download HTML
              </button> */}
            </div>
          </div>
        </div>
      )}

      <div className="w-full h-full overflow-auto">
          {isCheckingExisting ? (
            <div className="p-6 flex justify-center items-center h-40">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : (
            <>
              {currentView === 'overview' ? (
                // Overview View
                <div className="p-6 h-full overflow-auto">
                  {existingRfpData?.is_submitted ? (
                    <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
                      <div className="p-1 bg-green-100 rounded-full">
                        <Info className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-green-800">RFP Response Submitted</h3>
                        <p className="text-sm text-green-700">
                          This RFP response has been marked as submitted. You can view it or download it below.
                        </p>
                      </div>
                    </div>
                  ) : null}
                  
                  <RfpOverview
                    title={contract?.title}
                    department={contract?.department}
                    dueDate={contract?.dueDate || contract?.response_date}
                    status={contract?.status}
                    naicsCode={contract?.naicsCode}
                    description={contract?.description}
                    solicitation_number={contract?.solicitation_number}
                    published_date={contract?.published_date}
                    budget={contract?.budget}
                    onViewDescription={handleViewDescription}
                    onGenerateResponse={handleDownloadRfp}
                    onGenerateRfp={handleGenerateRfp}
                  />
                  
                  {existingRfpData && !existingRfpData.is_submitted && (
                    <div className="mt-6">
                      <button
                        onClick={handleViewExistingRfp}
                        className="w-full p-4 border border-blue-300 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center gap-2 hover:bg-blue-100 transition-colors"
                      >
                        <Eye className="w-5 h-5" />
                        <span>Continue Working on RFP Response</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                // Editor View
                <div className="w-full h-full flex flex-col">
                  {/* RFP Response Editor */}
                  <div className="p-6 flex-1 min-h-0">
                    <div className="bg-card rounded-2xl shadow-lg overflow-hidden border border-border h-full">
                      {generatingRfp ? (
                        <div className="flex flex-col items-center justify-center h-64 p-6">
                          <Loader2 size={32} className="animate-spin text-blue-500 mb-4" />
                          <p className="text-muted-foreground font-medium">
                            Generating RFP response...
                          </p>
                          <p className="text-sm text-muted-foreground mt-2">This may take a few moments</p>
                        </div>
                      ) : (
                        <div className="h-full">
                          <RfpResponse 
                            contract={contract} 
                            pursuitId={pursuitId}
                            aiOpportunityId={contract?.id}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
      </div>
    </div>
  );
}