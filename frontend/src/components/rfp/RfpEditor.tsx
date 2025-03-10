import React, { useState, useEffect, useRef } from 'react';
import html2pdf from 'html2pdf.js';
import { ChevronDown, AlertCircle } from 'lucide-react';

interface RfpEditorProps {
  content?: string;
  onChange?: (content: string) => void;
  onProcessWithAI?: (content: string) => void;
  highlightContext?: {
    text: string;
    term: string;
  } | null;
}

const RfpEditor: React.FC<RfpEditorProps> = ({ 
  content: initialContent = '', 
  onChange, 
  onProcessWithAI,
  highlightContext = null
}) => {
  const [content, setContent] = useState(initialContent);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showPreview, setShowPreview] = useState(true);
  const [showDownloadOptions, setShowDownloadOptions] = useState(false);
  const [hasHighlight, setHasHighlight] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const downloadOptionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // If no content is provided, fetch from template
    if (!initialContent) {
      generateResponse();
    } else {
      setContent(initialContent);
      setIsLoading(false);
    }

    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (
        downloadOptionsRef.current && 
        !downloadOptionsRef.current.contains(event.target as Node)
      ) {
        setShowDownloadOptions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [initialContent]);

  // Update parent component when content changes
  useEffect(() => {
    if (onChange && content) {
      onChange(content);
    }
  }, [content, onChange]);

  // Add CSS styles for the highlighting
  useEffect(() => {
    // Add a style tag for our custom highlights if it doesn't exist
    if (!document.getElementById('highlight-styles')) {
      const styleTag = document.createElement('style');
      styleTag.id = 'highlight-styles';
      styleTag.innerHTML = `
        .rfp-highlight {
          background-color: #FFECB3;
          border-left: 3px solid #FFC107;
          padding: 4px 8px;
          margin: 4px 0;
          display: inline-block;
          box-shadow: 0 1px 2px rgba(0,0,0,0.1);
          animation: highlight-pulse 2s infinite;
        }
        
        @keyframes highlight-pulse {
          0% { background-color: #FFECB3; }
          50% { background-color: #FFE082; }
          100% { background-color: #FFECB3; }
        }
        
        .rfp-term-highlight {
          background-color: #FFC107;
          padding: 0 2px;
          border-radius: 2px;
          font-weight: 500;
        }
      `;
      document.head.appendChild(styleTag);
    }
  }, []);

  // Improved highlighting effect 
  useEffect(() => {
    if (!highlightContext || !contentRef.current) return;
    
    console.log("⭐ Trying to highlight context:", highlightContext);
    
    const { text, term } = highlightContext;
    
    // Save original content to restore later
    const originalHTML = contentRef.current.innerHTML;
    let foundMatch = false;
    
    try {
      // First try to find the exact text match
      if (text && text.length > 5) {
        // Safely escape the text for use in a regular expression
        const escapedText = text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        
        // Create a regex to find the text
        const regex = new RegExp(escapedText, 'gi');
        
        // Test if we can find the text in the content
        if (regex.test(contentRef.current.innerHTML)) {
          console.log("✅ Found exact text match to highlight!");
          
          // Apply highlight to the text
          contentRef.current.innerHTML = contentRef.current.innerHTML.replace(
            regex,
            '<div class="rfp-highlight">$&</div>'
          );
          foundMatch = true;
          
          // Scroll to the first highlight
          setTimeout(() => {
            const highlight = contentRef.current?.querySelector('.rfp-highlight');
            if (highlight) {
              highlight.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }, 100);
        }
      }
      
      // If we couldn't find the exact text, try highlighting just the term
      if (!foundMatch && term && term.length > 3) {
        const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const termRegex = new RegExp(`\\b${escapedTerm}\\b`, 'gi');
        
        if (termRegex.test(contentRef.current.innerHTML)) {
          console.log("✅ Found term to highlight:", term);
          
          contentRef.current.innerHTML = contentRef.current.innerHTML.replace(
            termRegex,
            '<span class="rfp-term-highlight">$&</span>'
          );
          foundMatch = true;
          
          // Scroll to the first highlight
          setTimeout(() => {
            const highlight = contentRef.current?.querySelector('.rfp-term-highlight');
            if (highlight) {
              highlight.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }, 100);
        }
      }
      
      // If we found a match, set a timeout to remove the highlight
      if (foundMatch) {
        setHasHighlight(true);
        
        // Restore original content after 5 seconds
        const timer = setTimeout(() => {
          if (contentRef.current) {
            contentRef.current.innerHTML = originalHTML;
            setHasHighlight(false);
          }
        }, 5000);
        
        return () => clearTimeout(timer);
      } else {
        console.log("❌ No matching text found to highlight");
      }
    } catch (error) {
      console.error("Error applying highlight:", error);
      // Restore original content if there was an error
      if (contentRef.current) {
        contentRef.current.innerHTML = originalHTML;
      }
    }
  }, [highlightContext]);

  const generateResponse = async () => {
    setIsLoading(true);
    setError('');
    try {
      // Try to fetch the proposal template
      console.log('Attempting to fetch template...');
      const response = await fetch('/proposal-template.html');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch template: ${response.statusText}`);
      }
      
      let htmlTemplate = await response.text();
      console.log('Template fetched successfully, fixing asset paths...');
      
      // Fix asset paths in the HTML - specifically for proposal-template_files folder
      htmlTemplate = htmlTemplate.replace(
        /(src|href)="(?!http|https|\/\/|\/)(proposal-template_files\/.*?)"/g, 
        (match, attr, path) => `${attr}="/${path}"`
      );
      
      // Also handle any other relative paths
      htmlTemplate = htmlTemplate.replace(
        /(src|href)="(?!http|https|\/\/|\/|proposal-template_files)(.*?)"/g, 
        (match, attr, path) => `${attr}="/${path}"`
      );
      
      console.log('Asset paths fixed, setting content...');
      setContent(htmlTemplate);
      setSuccessMessage('Proposal template generated successfully');
    } catch (error) {
      console.error('Error generating response:', error);
      setError(`Failed to generate response: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      // Create fallback template in case of failure
      const fallbackTemplate = `
        <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
          <h1 style="text-align: center; color: #333;">REQUEST FOR PROPOSAL</h1>
          <h2 style="text-align: center; color: #555;">Project Title</h2>
          
          <div style="margin-top: 40px;">
            <p><strong>Contract ID:</strong> [Contract ID]</p>
            <p><strong>Agency:</strong> [Agency Name]</p>
            <p><strong>Platform:</strong> [Platform]</p>
            <p><strong>Value:</strong> [Value]</p>
            <p><strong>Due Date:</strong> [Due Date]</p>
            <p><strong>Status:</strong> [Status]</p>
            <p><strong>NAICS Code:</strong> [NAICS Code]</p>
          </div>
          
          <div style="margin-top: 40px;">
            <h3>Project Description</h3>
            <p>This is a placeholder for the project description. Please provide details about the project requirements, goals, and expectations.</p>
          </div>
        </div>
      `;
      console.log('Using fallback template');
      setContent(fallbackTemplate);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    if (contentRef.current) {
      const opt = {
        margin: 1,
        filename: 'rfp_document.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
      };
      
      html2pdf().set(opt).from(contentRef.current).save();
      setSuccessMessage('PDF downloaded successfully');
      
      // Auto-clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } else {
      setError('No content to download');
    }
  };

  const handleDownloadDocx = () => {
    // Since we don't have html-docx-js, we'll use a different approach
    if (contentRef.current) {
      try {
        // Create the HTML content
        const htmlContent = contentRef.current.innerHTML;
        
        // Wrap HTML in a full document structure with basic Word-friendly styling
        const fullHtml = `
          <html xmlns:o="urn:schemas-microsoft-com:office:office" 
                xmlns:w="urn:schemas-microsoft-com:office:word" 
                xmlns="http://www.w3.org/TR/REC-html40">
          <head>
            <meta charset="utf-8">
            <title>RFP Document</title>
            <!--[if gte mso 9]>
            <xml>
              <w:WordDocument>
                <w:View>Print</w:View>
                <w:Zoom>100</w:Zoom>
                <w:DoNotOptimizeForBrowser/>
              </w:WordDocument>
            </xml>
            <![endif]-->
            <style>
              /* Add Word-friendly styles */
              body { font-family: 'Calibri', sans-serif; }
              table { border-collapse: collapse; }
              td, th { border: 1px solid #ddd; padding: 8px; }
            </style>
          </head>
          <body>
            ${htmlContent}
          </body>
          </html>
        `;
        
        // Create a blob with the Word HTML content
        const blob = new Blob([fullHtml], {
          type: 'application/msword;charset=utf-8'
        });
        
        // Create a download link
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'rfp_document.doc'; // Use .doc instead of .docx for better compatibility
        document.body.appendChild(a);
        a.click();
        
        // Clean up
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, 0);
        
        setSuccessMessage('Word document downloaded successfully');
        
        // Auto-clear success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage('');
        }, 3000);
      } catch (error) {
        console.error('Error creating Word document:', error);
        setError('Failed to create Word document');
      }
    } else {
      setError('No content to download');
    }
  };

  const handleProcessWithAI = async () => {
    setIsLoading(true);
    setError('');
    setSuccessMessage('');
    try {
      // Use the ask-ai endpoint
      const response = await fetch('/api/search/ask-ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              "role": "user",
              "content": "Please review this RFP document and improve the formatting and structure while keeping all content."
            }
          ],
          documentContent: content
        }),
      });
      
      if (!response.ok) {
        throw new Error(`AI processing failed: ${response.statusText}`);
      }
      
      const data = await response.json();
      if (data.response) {
        // Check if response is HTML content (simple heuristic)
        const processedContent = data.response.includes('<') && data.response.includes('>') 
          ? data.response 
          : `<div>${data.response}</div>`;
        
        // Update local content
        setContent(processedContent);
        
        // Pass the processed content to the parent component's AI handler if provided
        if (onProcessWithAI) {
          onProcessWithAI(processedContent);
        }
        
        setSuccessMessage('Document processed successfully');
      }
    } catch (error) {
      setError(`Processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePreview = () => {
    setShowPreview(!showPreview);
  };

  const toggleDownloadOptions = () => {
    setShowDownloadOptions(!showDownloadOptions);
  };

  return (
    <div className="p-4">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 relative">
          <span className="block sm:inline">{error}</span>
          <span 
            className="absolute top-0 bottom-0 right-0 px-4 py-3 cursor-pointer"
            onClick={() => setError('')}
          >
            <svg className="fill-current h-6 w-6 text-red-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
              <title>Close</title>
              <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/>
            </svg>
          </span>
        </div>
      )}
      
      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 relative">
          <span className="block sm:inline">{successMessage}</span>
          <span 
            className="absolute top-0 bottom-0 right-0 px-4 py-3 cursor-pointer"
            onClick={() => setSuccessMessage('')}
          >
            <svg className="fill-current h-6 w-6 text-green-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
              <title>Close</title>
              <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/>
            </svg>
          </span>
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-4">
        {/* Download dropdown */}
        <div className="relative" ref={downloadOptionsRef}>
          <button 
            onClick={toggleDownloadOptions}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded flex items-center gap-1 shadow-sm"
            disabled={isLoading || !content}
          >
            Download
            <ChevronDown className="w-4 h-4" />
          </button>
          
          {showDownloadOptions && (
            <div className="absolute left-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10 border border-gray-200">
              <div className="py-1" role="menu" aria-orientation="vertical">
                <button
                  onClick={() => {
                    handleDownloadPDF();
                    setShowDownloadOptions(false);
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  role="menuitem"
                >
                  Download as PDF
                </button>
                <button
                  onClick={() => {
                    handleDownloadDocx();
                    setShowDownloadOptions(false);
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  role="menuitem"
                >
                  Download as Word
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* <button 
          onClick={handleProcessWithAI}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded shadow-sm"
          disabled={isLoading || !content}
        >
          Process with AI
        </button> */}
        <button 
          onClick={togglePreview}
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded shadow-sm border border-gray-300"
          disabled={isLoading || !content}
        >
          {showPreview ? 'Hide Preview' : 'Show Preview'}
        </button>
        {isLoading && (
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-2"></div>
            <span>Processing...</span>
          </div>
        )}
      </div>

      {showPreview && content && (
        <div className="relative">
          {hasHighlight && (
            <div className="absolute top-2 right-2 bg-yellow-100 border border-yellow-400 text-yellow-800 px-3 py-1 rounded-md shadow-sm flex items-center z-10">
              <AlertCircle className="w-4 h-4 mr-1" />
              <span className="text-xs font-medium">Reference context highlighted</span>
            </div>
          )}
          <div 
            ref={contentRef}
            className="border border-gray-200 p-4 mt-4 max-h-[500px] overflow-auto bg-white rounded"
          >
            <div dangerouslySetInnerHTML={{ __html: content }} />
          </div>
        </div>
      )}
    </div>
  );
};

export default RfpEditor;