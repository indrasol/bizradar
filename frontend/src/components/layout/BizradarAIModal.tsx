import React from 'react';
import { X, Upload, ExternalLink } from 'lucide-react';

interface BizradarAIModalProps {
  onClose: () => void;
}

const BizradarAIModal: React.FC<BizradarAIModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50">
      <div className="bg-white rounded-lg shadow-xl w-[750px] relative">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-blue-700">How to Use BizradarAI</h2>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Content area */}
        <div className="p-4">
          {/* Instructions */}
          <div className="mb-5">
            <div className="space-y-2.5">
              <div className="flex items-start gap-2">
                <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-sm">
                  1
                </div>
                <p className="text-sm text-gray-700">Go to the Preview section in the sidebar.</p>
              </div>
              
              <div className="flex items-start gap-2">
                <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-sm">
                  2
                </div>
                <p className="text-sm text-gray-700">Click on the BizradarAI logo to open the chat window.</p>
              </div>
              
              <div className="flex items-start gap-2">
                <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-sm">
                  3
                </div>
                <p className="text-sm text-gray-700">Upload attachments (PDF only) by clicking the paper-clip icon below the message box.</p>
              </div>
              
              <div className="flex items-start gap-2">
                <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-sm">
                  4
                </div>
                <p className="text-sm text-gray-700">Type your question into the input field and press Enter or click Send.</p>
              </div>
              
              <div className="flex items-start gap-2">
                <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-sm">
                  5
                </div>
                <p className="text-sm text-gray-700">If the AI response includes a "View Details" link, click it to see the full SAM.gov JSON.</p>
              </div>
              
              <div className="flex items-start gap-2">
                <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-sm">
                  6
                </div>
                <p className="text-sm text-gray-700">Use the 👍/👎 buttons to rate each answer and help the assistant improve.</p>
              </div>
              
              <div className="flex items-start gap-2">
                <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-sm">
                  7
                </div>
                <p className="text-sm text-gray-700">When you're finished, click the X in the top-right of the modal (or logo) to close BizradarAI.</p>
              </div>
            </div>
          </div>

          {/* Features Section */}
          <div className="mb-5">
            <h3 className="text-base font-semibold text-blue-700 mb-3">Key Features</h3>
            
            <div className="space-y-3">
              <div>
                <div className="flex items-start gap-2">
                  <span className="text-blue-600 text-lg">•</span>
                  <div>
                    <p className="text-sm font-medium text-blue-600">Multi-source Context</p>
                    <p className="text-sm text-gray-700">Leverages your uploaded RFP docs, pursuit metadata, opportunity records, and company profile all at once.</p>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-start gap-2">
                  <span className="text-blue-600 text-lg">•</span>
                  <div>
                    <p className="text-sm font-medium text-blue-600">Document-Aware AI</p>
                    <p className="text-sm text-gray-700">Extracts and incorporates PDF content you upload—no manual copy-paste required.</p>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-start gap-2">
                  <span className="text-blue-600 text-lg">•</span>
                  <div>
                    <p className="text-sm font-medium text-blue-600">Direct SAM.gov Links</p>
                    <p className="text-sm text-gray-700">Every answer can include a "View Details" link back to the raw API JSON for full specs.</p>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-start gap-2">
                  <span className="text-blue-600 text-lg">•</span>
                  <div>
                    <p className="text-sm font-medium text-blue-600">Interactive Feedback</p>
                    <p className="text-sm text-gray-700">Built-in thumbs-up/down and copy controls let you refine responses instantly.</p>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-start gap-2">
                  <span className="text-blue-600 text-lg">•</span>
                  <div>
                    <p className="text-sm font-medium text-blue-600">No-install Web UI</p>
                    <p className="text-sm text-gray-700">Works entirely in your browser—just log in and start asking.</p>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-start gap-2">
                  <span className="text-blue-600 text-lg">•</span>
                  <div>
                    <p className="text-sm font-medium text-blue-600">Focused on Procurement</p>
                    <p className="text-sm text-gray-700">Trained specifically for government bidding, RFP analysis, and proposal prep.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex justify-between items-center gap-4 mt-6">
            <div className="flex-1">
              <div className="w-full flex flex-col items-center justify-center p-3 bg-gray-50 rounded-md border border-gray-200 hover:bg-gray-100 transition-colors">
                <Upload className="w-5 h-5 text-green-600 mb-1" />
                <span className="text-xs text-gray-600">Upload PDFs</span>
              </div>
            </div>
            <div className="flex-1">
              <div className="w-full flex flex-col items-center justify-center p-3 bg-gray-50 rounded-md border border-gray-200 hover:bg-gray-100 transition-colors">
                <ExternalLink className="w-5 h-5 text-blue-600 mb-1" />
                <span className="text-xs text-gray-600">Access SAM.gov</span>
              </div>
            </div>
            <div className="flex-1">
              <div className="w-full flex flex-col items-center justify-center p-3 bg-gray-50 rounded-md border border-gray-200 hover:bg-gray-100 transition-colors">
                <div className="flex mb-1">
                  <span className="text-lg">👍</span>
                  <span className="text-lg">👎</span>
                </div>
                <span className="text-xs text-gray-600">Rate Responses</span>
              </div>
            </div>
          </div>
          
          {/* Get Started Button */}
          <div className="mt-6">
            <button 
              onClick={onClose} 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-md py-2 font-medium transition-colors"
            >
              Get Started
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BizradarAIModal;