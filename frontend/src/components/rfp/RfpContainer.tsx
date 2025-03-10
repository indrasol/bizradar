import { useState, useEffect, useRef } from 'react';
import { RfpChat } from './RfpChat';
import { RfpOverview } from './RfpOverview';
import RfpEditor from './RfpEditor';

import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageSquare, ChevronLeft } from 'lucide-react';

interface RfpContainerProps {
  initialContent?: string;
  contract?: any; // Replace with proper contract type
}

export function RfpContainer({ initialContent = '', contract }: RfpContainerProps) {
  const [documentContent, setDocumentContent] = useState(initialContent);
  const [showDescription, setShowDescription] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [contextHighlight, setContextHighlight] = useState<{text: string, term: string} | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  
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

  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
  };

  // This handles content updates from the chat assistant
  const handleUpdateContent = (content: string, context?: { text: string, term: string }) => {
    // If a context is provided for highlighting, set it regardless of other conditions
    if (context && context.text) {
      console.log("Setting highlight context:", context);
      setContextHighlight(context);
      
      // Set a timeout to clear the highlight after 5 seconds
      setTimeout(() => {
        setContextHighlight(null);
      }, 5000);
    }
    
    // Only append content if we're in editor mode and content is provided
    if (showEditor && content && content.trim()) {
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
        {/* Main content area - width adjusts based on chat visibility */}
        <div 
          className={`transition-all duration-300 ease-in-out ${
            isChatOpen ? 'w-[60%]' : 'w-full'
          }`}
        >
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
              onToggleChat={toggleChat}
              isChatOpen={isChatOpen}
            />
          </div>

          {/* Editor Section */}
          <AnimatePresence>
            {showEditor && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 w-full p-6"
              >
                <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
                  <RfpEditor
                    content={documentContent}
                    onChange={handleEditorContentChange}
                    onProcessWithAI={handleProcessWithAI}
                    highlightContext={contextHighlight}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Chat panel - slides in/out */}
        <AnimatePresence>
          {isChatOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: '40%', opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ ease: "easeInOut", duration: 0.3 }}
              className="fixed right-0 top-[8rem] h-[calc(100vh-8rem)] bg-white shadow-lg border-l border-gray-200 z-30 overflow-hidden"
            >
              <div className="h-full flex flex-col">
                <div className="flex items-center justify-between p-2 bg-blue-600 text-white">
                  <span className="text-sm font-medium">Bizradar AI</span>
                  <button 
                    onClick={toggleChat}
                    className="p-1 rounded-full hover:bg-blue-500 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex-1 overflow-hidden">
                  <RfpChat
                    documentContent={aiContext}
                    onUpdateContent={handleUpdateContent}
                    placeholder="Ask about RFP details or content..."
                    contractDetails={contract}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Description Modal */}
      <AnimatePresence>
        {showDescription && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
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