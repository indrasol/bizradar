import { useState, useEffect } from 'react';
import { RfpChat } from './RfpChat';
import { RfpOverview } from './RfpOverview';
import RfpEditor from './RfpEditor';

import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface RfpContainerProps {
  initialContent?: string;
  contract?: any; // Replace with proper contract type
}

export function RfpContainer({ initialContent = '', contract }: RfpContainerProps) {
  const [documentContent, setDocumentContent] = useState(initialContent);
  const [showDescription, setShowDescription] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  
  // New state to track the current context for the AI
  const [aiContext, setAiContext] = useState<string>('');
  
  // Set initial AI context based on contract details when component mounts
  useEffect(() => {
    if (contract) {
      const overviewContext = generateOverviewContext(contract);
      setAiContext(overviewContext);
    }
  }, [contract]);

  // Function to generate a text representation of the RFP overview for AI context
  const generateOverviewContext = (contract: any): string => {
    return `
      RFP OVERVIEW INFORMATION:
      Title: ${contract?.title || 'Not specified'}
      Agency: ${contract?.agency || 'Not specified'}
      Due Date: ${contract?.dueDate || 'Not specified'}
      Value: ${contract?.value ? `$${contract.value.toLocaleString()}` : 'Not specified'}
      Status: ${contract?.status || 'Draft'}
      NAICS Code: ${contract?.naicsCode || 'Not specified'}
      Description: ${contract?.description || 'Not provided'}
    `;
  };

  const handleViewDescription = () => {
    setShowDescription(true);
  };

  const handleGenerateResponse = () => {
    setShowEditor(true);
  };

  // This handles content updates from the chat assistant
  const handleUpdateContent = (content: string) => {
    // Only append content if we're in editor mode
    if (showEditor) {
      setDocumentContent(prev => prev + '\n' + content);
    }
  };
  
  // Handler for when document content is changed in the editor
  const handleEditorContentChange = (content: string) => {
    setDocumentContent(content);
    
    // When editor content changes, we want the AI to be aware of both
    // the RFP details and the current document
    updateAiContext(content);
  };
  
  // Update AI context when editor content changes
  const updateAiContext = (editorContent: string) => {
    // Combine overview information with document content
    const overviewContext = contract ? generateOverviewContext(contract) : '';
    const combinedContext = `
      ${overviewContext}
      
      CURRENT DOCUMENT CONTENT:
      ${editorContent}
    `;
    
    setAiContext(combinedContext);
  };
  
  // Handler for when "Process with AI" is clicked in the editor
  const handleProcessWithAI = (processedContent: string) => {
    // Update the document content
    setDocumentContent(processedContent);
    
    // Also update the AI context to include the processed document
    updateAiContext(processedContent);
    
    // Display a notification or message to the user
    console.log("Document processed and context updated for chat assistant");
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] bg-gray-50 relative">
      {/* Main Layout */}
      <div className="flex h-full">
        {/* Always visible chat panel */}
        <div className="w-[300px] bg-white shadow-lg h-[calc(100vh-8rem)] fixed left-0 top-[8rem] z-30">
          <RfpChat
            documentContent={aiContext} // Use the combined context for AI
            onUpdateContent={handleUpdateContent}
            placeholder="Ask about RFP details or content..."
          />
        </div>

        {/* Main content area with left margin */}
        <div className="ml-[300px] w-[calc(100%-300px)]">
          {/* Overview Section */}
          <div className="p-6">
            <RfpOverview
              title={contract?.title}
              agency={contract?.agency}
              dueDate={contract?.dueDate}
              value={contract?.value}
              status={contract?.status}
              naicsCode={contract?.naicsCode}
              description={contract?.description}
              onViewDescription={handleViewDescription}
              onGenerateResponse={handleGenerateResponse}
            />
          </div>

          {/* Editor Section */}
          <AnimatePresence>
            {showEditor && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8 w-full p-6"
              >
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                  <RfpEditor
                    content={documentContent}
                    onChange={handleEditorContentChange}
                    onProcessWithAI={handleProcessWithAI}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Description Modal */}
      <AnimatePresence>
        {showDescription && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-40"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-xl shadow-lg w-[800px] max-h-[80vh] overflow-hidden"
            >
              <div className="p-6 border-b flex justify-between items-center">
                <h3 className="text-xl font-semibold">Complete Job Description</h3>
                <button
                  onClick={() => setShowDescription(false)}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto">
                <div className="prose max-w-none">
                  {contract?.description || documentContent}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}