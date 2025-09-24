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
  
  const [generatingRfp, setGeneratingRfp] = useState(false);
  const [viewDescription, setViewDescription] = useState(false);
  const [viewHtml, setViewHtml] = useState(false);
  const [descriptionContent, setDescriptionContent] = useState('');
  const [existingRfpData, setExistingRfpData] = useState<RfpResponseData | null>(null);
  const [isCheckingExisting, setIsCheckingExisting] = useState<boolean>(false);
  const [internalPursuitId, setInternalPursuitId] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  
  // Use parent's currentView, fallback to 'overview' if not provided
  const currentView = parentCurrentView || 'overview';

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
      
      // Use a unique identifier for this opportunity
      const opportunityId = contract.pursuit_id || contract.id;
      
      // Check if response already exists
      let existingReport = null;
      try {
        existingReport = await reportsApi.getReportByResponseId(opportunityId, user.id);
      } catch (error: any) {
        if (!error.message?.includes('404')) {
          console.error("Error checking for existing response:", error);
          throw error;
        }
      }
      
      if (existingReport) {
        // Use existing response
        setInternalPursuitId(existingReport.response_id);
        setExistingRfpData(existingReport as RfpResponseData);
        
        const completionPercentage = existingReport.completion_percentage || 0;
        if (completionPercentage > 0) {
          toast?.info(`Found existing response (${completionPercentage}% complete). Continuing from where you left off.`);
        } else {
          toast?.info("Found existing response. You can continue working on it.");
        }
      } else {
        // Create new response
        
        // First ensure tracker exists
        let trackerExists = false;
        try {
          await trackersApi.getTrackerById(opportunityId, user.id);
          trackerExists = true;
        } catch (error: any) {
          if (error.message?.includes('404')) {
            // Create new tracker
            try {
              const newTracker = await trackersApi.createTracker({
                title: contract.title || "Untitled",
                description: contract.description || "",
                stage: "Assessment",
                due_date: contract.dueDate || contract.response_date
              }, user.id);
              
              trackerExists = true;
            } catch (createError) {
              console.error("Error creating tracker:", createError);
              toast?.error("Failed to create tracker. Please try again.");
              setGeneratingRfp(false);
              return;
            }
          } else {
            console.error("Error checking tracker:", error);
            throw error;
          }
        }
        
        // Create new RFP response
        try {
          const newReport = await reportsApi.upsertReport(
            opportunityId,
            {
              companyName: 'BizRadar Solutions',
              rfpTitle: contract?.title || 'RFP Response',
              rfpNumber: contract?.solicitation_number || '',
              issuedDate: contract?.published_date || new Date().toLocaleDateString(),
              sections: []
            },
            0,
            false,
            user.id,
            opportunityId // opportunity_id is the same as the response_id in this case
          );
          
          setInternalPursuitId(opportunityId);
          setExistingRfpData(newReport as RfpResponseData);
          toast?.success("New RFP response created successfully!");
        } catch (createError) {
          console.error("Error creating RFP response:", createError);
          toast?.error("Failed to create RFP response. Please try again.");
          setGeneratingRfp(false);
          return;
        }
      }
      
    } catch (error) {
      console.error("Error in handleGenerateRfp:", error);
      toast?.error("Failed to generate RFP response. Please try again.");
    } finally {
      setGeneratingRfp(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header */}
      {/* <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBackToOverview}
            className="flex items-center text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Overview
          </button>
        </div>
      </div> */}

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {currentView === 'overview' && (
          <RfpOverview
            title={contract?.title || "Not specified"}
            department={contract?.department || "Not specified"}
            dueDate={contract?.dueDate || contract?.response_date || "Not specified"}
            status={contract?.status || "Active"}
            naicsCode={contract?.naicsCode || contract?.naics_code || "Not specified"}
            description={contract?.description || "No description available"}
            solicitation_number={contract?.solicitation_number || "Not specified"}
            published_date={contract?.published_date || "Not specified"}
            budget={contract?.budget || contract?.value || "Not specified"}
            onViewDescription={() => setViewDescription(true)}
            onGenerateResponse={handleGenerateRfp}
            onGenerateRfp={handleGenerateRfp}
          />
        )}

        {currentView === 'editor' && (
          <div className="h-full flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              {/* <h2 className="text-lg font-semibold">RFP Response Builder</h2> */}
              <div className="flex items-center space-x-2">
                {/* <button
                  onClick={() => setViewHtml(true)}
                  className="flex items-center px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
                >
                  <Eye className="w-4 h-4 mr-1" />
                  Kartik
                </button> */}
                {/* <button
                  onClick={() => setViewHtml(true)}
                  className="flex items-center px-3 py-1 text-sm bg-blue-100 hover:bg-blue-200 rounded"
                >
                  <Download className="w-4 h-4 mr-1" />
                  Download
                </button> */}
              </div>
            </div>

            <div className="flex-1 overflow-hidden">
              {generatingRfp ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
                    <p className="text-lg font-medium">Generating RFP response...</p>
                    <p className="text-sm text-muted-foreground mt-2">This may take a few moments</p>
                  </div>
                </div>
              ) : (
                <div className="h-full">
                  <RfpResponse 
                    contract={contract} 
                    pursuitId={internalPursuitId || existingRfpData?.response_id || pursuitId}
                    aiOpportunityId={contract?.id}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* HTML Preview Modal */}
      {viewHtml && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-11/12 h-5/6 flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">HTML Preview</h3>
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
