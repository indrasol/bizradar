import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2 } from "lucide-react";
import { useEffect, useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import html2pdf from 'html2pdf.js';

interface RfpEditorProps {
  content: string;
  onChange: (content: string) => void;
  isGenerating?: boolean;
}

export const RfpEditor: React.FC<RfpEditorProps> = ({ 
  content, 
  onChange,
  isGenerating = false 
}) => {
  const [displayContent, setDisplayContent] = useState<string[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isEditable, setIsEditable] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout>();

  // Define wrapDynamicValues function
  const wrapDynamicValues = useCallback((text: string) => {
    // Handle HTML content as-is if it contains HTML tags
    if (text.includes('<strong>')) {
      return text;
    }
    return text;
  }, []);

  // Enhanced typewriting effect with better performance
  useEffect(() => {
    if (content && !isGenerating) {
      setIsTyping(true);
      setIsEditable(false);
      const lines = content.split('\n').filter(line => line.trim()); // Remove empty lines
      let currentLines: string[] = [];
      let currentIndex = 0;
      let charIndex = 0;

      intervalRef.current = setInterval(() => {
        if (!lines[currentIndex]) {
          setIsTyping(false);
          setIsEditable(true);
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }
          return;
        }

        if (charIndex < lines[currentIndex].length) {
          // Handle HTML elements and strong tags
          if (lines[currentIndex].includes('<div') || 
              lines[currentIndex].includes('<strong>') || 
              lines[currentIndex].startsWith('#')) {
            currentLines[currentIndex] = lines[currentIndex];
            charIndex = lines[currentIndex].length;
          } else {
            // Type character by character
            currentLines[currentIndex] = lines[currentIndex].substring(0, charIndex + 1);
            charIndex++;
          }
        } else {
          currentIndex++;
          charIndex = 0;
        }

        setDisplayContent([...currentLines]);
      }, 50); // Slightly slower for better readability

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [content, isGenerating]);

  const renderLine = useCallback((line: string, index: number) => {
    if (!line) return null;

    // Only render logo if it's the first line with logo div
    if (line.includes('<div class="text-center mb-8">') && index === 0) {
      return (
        <div key={index} className="text-center">
          <img 
            src="/logo.jpg" 
            alt="Company Logo" 
            className="mx-auto h-80 w-auto" // Increased height to 20rem (320px)
            style={{
              maxWidth: '100%', // Full width
              objectFit: 'contain',
              marginTop: '-3rem', // Increased negative margin
              marginBottom: '-2.5rem' // Increased negative margin
            }}
            onError={(e) => {
              console.error('Logo failed to load');
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
      );
    } else if (line.includes('<div class="text-center mb-8">')) {
      // Skip additional logo divs
      return null;
    } else if (line.startsWith('# ')) {
      return (
        <h1 
          key={index} 
          className="text-base font-bold mb-6 text-center border-b pb-2"
        >
          {line.substring(2)}
        </h1>
      );
    } else if (line.startsWith('## ')) {
      return <h2 key={index} className="text-base font-semibold mt-6 mb-4 text-black">{line.substring(3)}</h2>;
    } else if (line.startsWith('- ')) {
      return <p key={index} className="my-2 pl-4" dangerouslySetInnerHTML={{ __html: wrapDynamicValues(line) }} />;
    } else if (line.match(/^\d\./)) {
      return <p key={index} className="my-2 pl-4">{line}</p>;
    } else {
      return <p key={index} className="my-2" dangerouslySetInnerHTML={{ __html: wrapDynamicValues(line) }} />;
    }
  }, [wrapDynamicValues]);

  // Download PDF function
  const handleDownload = useCallback(async () => {
    if (!editorRef.current) return;

    const element = editorRef.current;
    const opt = {
      margin: [20, 20],
      filename: 'rfp_document.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    try {
      await html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error('Failed to generate PDF:', error);
    }
  }, []);

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="p-2 border-b bg-white flex justify-between items-center">
        <h2 className="font-semibold">Document Editor</h2>
        <Button
          onClick={handleDownload}
          disabled={isTyping || isGenerating}
          className={`transition-opacity duration-300 ${
            isTyping || isGenerating ? 'opacity-50 cursor-not-allowed' : 'opacity-100'
          }`}
        >
          <Download className="w-4 h-4 mr-2" />
          Download RFP
        </Button>
      </div>
      <ScrollArea className="flex-1">
        {isGenerating ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-black" />
              <div className="space-y-2">
                <p className="text-lg font-medium">Generating Your RFP Document</p>
                <p className="text-sm text-muted-foreground">Please wait while we craft your proposal...</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-[850px] min-h-[1100px] mx-auto my-8 p-16 bg-white shadow-lg rounded border">
            <div 
              ref={editorRef}
              className="prose prose-sm max-w-none"
              contentEditable={isEditable}
              onInput={(e) => {
                if (isEditable) {
                  onChange(e.currentTarget.innerHTML);
                }
              }}
              suppressContentEditableWarning={true}
            >
              {displayContent.map((line, index) => renderLine(line, index))}
              {isTyping && (
                <span className="inline-block w-2 h-4 bg-black animate-pulse ml-1" />
              )}
            </div>
          </div>
        )}
      </ScrollArea>
    </div>
  );
};
