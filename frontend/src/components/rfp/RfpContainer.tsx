import React, { useState, useEffect } from 'react';
import { RfpOverview } from './RfpOverview';
import RfpResponse from './rfpResponse';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Eye, Download, AlertCircle, Info, X } from 'lucide-react';
import { supabase } from '../../utils/supabase';
import { toast } from 'sonner';

interface RfpResponseData {
  id: string;
  pursuit_id: string;
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
  pursuits?: {
    stage?: string;
  }
}

interface PursuitData {
  title: string;
  description: string;
  stage: string;
  user_id: string;
  due_date?: string;
}

/**
 * Container component for RFP (Request for Proposal) workflow
 * Handles the display of RFP overview and response generation
 */
export function RfpContainer({ initialContent = '', contract }) {
  const [showEditor, setShowEditor] = useState(false);
  const [generatingRfp, setGeneratingRfp] = useState(false);
  const [viewDescription, setViewDescription] = useState(false);
  const [viewHtml, setViewHtml] = useState(false); // New state for HTML modal
  const [descriptionContent, setDescriptionContent] = useState('');
  const [existingRfpData, setExistingRfpData] = useState<RfpResponseData | null>(null);
  const [isCheckingExisting, setIsCheckingExisting] = useState<boolean>(true);
  const [pursuitId, setPursuitId] = useState<string | null>(null);
  
  // Add debugging to check the contract data
  useEffect(() => {
    console.log("RfpContainer received contract:", contract);
  }, [contract]);

  // Check if there's already an RFP response for this contract
  useEffect(() => {
    const checkExistingRfp = async (): Promise<void> => {
      if (!contract?.id) return;
      
      try {
        setIsCheckingExisting(true);
        
        // Get the current user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          console.log("No user logged in");
          setIsCheckingExisting(false);
          return;
        }
        
        // Check if there's an existing RFP response
        const { data, error } = await supabase
          .from('rfp_responses')
          .select('*, pursuits(stage)')
          .eq('pursuit_id', contract.id)
          .eq('user_id', user.id)
          .maybeSingle();
          
        if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned" error
          console.error("Error checking existing RFP:", error);
          toast?.error("Failed to check for existing RFP data.");
        }
        
        if (data) {
          console.log("Found existing RFP data:", data);
          setExistingRfpData(data as RfpResponseData);
          
          // If there's existing data and it's not submitted, show the editor
          if (data.is_submitted !== true) {
            setShowEditor(true);
          }
          
          // Update the contract's stage if needed
          if ((data as any).pursuits?.stage) {
            // This updates the local contract object to match the saved stage
            contract.stage = (data as any).pursuits.stage;
          }
        }
      } catch (error) {
        console.error("Error in checkExistingRfp:", error);
      } finally {
        setIsCheckingExisting(false);
      }
    };
    
    checkExistingRfp();
  }, [contract?.id]);

  // Function to handle generating a new RFP response
  const handleGenerateRfp = async (): Promise<void> => {
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
      
      // Initialize pursuitId with the contract ID
      let pursuitId = contract.id;
      let pursuitExists = false;
      
      // Check if the pursuit already exists
      const { data: existingPursuit, error: checkError } = await supabase
        .from('pursuits')
        .select('id')
        .eq('id', pursuitId)
        .single();
        
      if (!checkError && existingPursuit) {
        console.log("Pursuit exists with ID:", pursuitId);
        pursuitExists = true;
      } else {
        console.log("Pursuit does not exist, checking by title");
        
        // Check if a pursuit with this title exists
        const { data: titlePursuit, error: titleError } = await supabase
          .from('pursuits')
          .select('id')
          .eq('title', contract.title)
          .maybeSingle();
          
        if (!titleError && titlePursuit) {
          // Use the existing pursuit ID
          pursuitId = titlePursuit.id;
          pursuitExists = true;
          console.log("Found pursuit by title, ID:", pursuitId);
        }
      }
      
      // If no pursuit exists, create one
      if (!pursuitExists) {
        console.log("Creating new pursuit");
        
        // Format due_date properly - don't use 'TBD' strings
        let formattedDueDate = null;
        if (contract.dueDate && contract.dueDate !== "TBD" && contract.dueDate !== "Not specified") {
          formattedDueDate = new Date(contract.dueDate).toISOString();
        } else if (contract.response_date && contract.response_date !== "TBD" && contract.response_date !== "Not specified") {
          formattedDueDate = new Date(contract.response_date).toISOString();
        }
        
        const pursuitData: PursuitData = {
          title: contract.title || "Untitled Opportunity",
          description: contract.description || '',
          stage: 'RFP Response Initiated',
          user_id: user.id
        };
        
        // Only add due_date if it's a valid date
        if (formattedDueDate) {
          pursuitData.due_date = formattedDueDate;
        }
        
        const { data: newPursuit, error: createError } = await supabase
          .from('pursuits')
          .insert(pursuitData)
          .select();
          
        if (createError) {
          console.error("Error creating pursuit:", createError);
          toast?.error("Failed to create pursuit. Please try again.");
          setGeneratingRfp(false);
          return;
        }
        
        if (newPursuit && newPursuit.length > 0) {
          const newPursuitId = newPursuit[0].id;
          setPursuitId(newPursuitId);
          pursuitId = newPursuitId;
          console.log("Created new pursuit with ID:", newPursuitId);
        }
      }
      
      // Update contract with the correct pursuit ID
      if (contract) {
        console.log("Updating contract with correct pursuit ID:", pursuitId);
        contract.pursuitId = pursuitId; // Update the contract with the new pursuit ID
        contract.id = pursuitId; // Directly replace the original ID
      }
      
      if (!pursuitExists) {
        toast?.error("Failed to create or find pursuit.");
        setGeneratingRfp(false);
        return;
      }
      
      // Now check if an RFP response already exists for this pursuit
      const { data: existingResponse, error: responseError } = await supabase
        .from('rfp_responses')
        .select('*')
        .eq('pursuit_id', pursuitId)
        .maybeSingle();
        
      if (!responseError && existingResponse) {
        console.log("Found existing RFP response:", existingResponse);
        setExistingRfpData(existingResponse as RfpResponseData);
      } else {
        // Create a new RFP response
        console.log("Creating new RFP response for pursuit ID:", pursuitId);
        const { data, error } = await supabase
          .from('rfp_responses')
          .insert({
            pursuit_id: pursuitId,
            user_id: user.id,
            content: {
              companyName: 'BizRadar Solutions',
              rfpTitle: contract?.title || 'RFP Response',
              rfpNumber: contract?.solicitation_number || '',
              issuedDate: contract?.published_date || new Date().toLocaleDateString(),
              sections: []
            },
            completion_percentage: 0,
            is_submitted: false
          })
          .select();
          
        if (error) {
          console.error("Error creating RFP response:", error);
          toast?.error("Failed to create RFP response. Please try again.");
        } else if (data) {
          setExistingRfpData(data[0] as RfpResponseData);
        }
      }
      
      // Update the pursuit's stage
      await supabase
        .from('pursuits')
        .update({ stage: 'RFP Response Initiated' })
        .eq('id', pursuitId);
        
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
    <div className="min-h-[calc(100vh-8rem)] bg-[#f9fafb] relative">
      {/* Description Modal */}
      {viewDescription && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-start overflow-y-auto p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 my-8 relative">
            <div className="sticky top-0 bg-white z-10 p-4 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold">RFP Description</h2>
              <button
                onClick={() => setViewDescription(false)}
                className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100"
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
          <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full mx-1 my-4 relative box-border">
            <div className="sticky top-0 bg-white z-10 p-3 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold">Sample RFP Response</h2>
              <button
                onClick={() => setViewHtml(false)}
                className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100"
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

      <div className="flex h-full">
        <div className="w-full">
          {isCheckingExisting ? (
            <div className="p-6 flex justify-center items-center h-40">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : (
            <>
              <div className="p-6">
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
              </div>

              <AnimatePresence>
                {showEditor && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 w-full p-6"
                  >
                    <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
                      {generatingRfp ? (
                        <div className="flex flex-col items-center justify-center h-64 p-6">
                          <Loader2 size={32} className="animate-spin text-blue-500 mb-4" />
                          <p className="text-gray-600 font-medium">
                            Generating RFP response...
                          </p>
                          <p className="text-sm text-gray-500 mt-2">This may take a few moments</p>
                        </div>
                      ) : (
                        <>
                          <RfpResponse 
                            contract={contract} 
                            pursuitId={pursuitId || contract?.pursuitId || contract?.id}
                          />
                        </>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              
              {!showEditor && existingRfpData && (
                <div className="px-6 mt-4">
                  <button
                    onClick={() => setShowEditor(true)}
                    className="w-full p-4 border border-blue-300 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center gap-2 hover:bg-blue-100 transition-colors"
                  >
                    <Eye className="w-5 h-5" />
                    <span>View Existing RFP Response</span>
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}