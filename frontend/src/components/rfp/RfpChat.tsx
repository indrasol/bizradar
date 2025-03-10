import { useState, useRef, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Bot, 
  Send, 
  User, 
  MessageSquare, 
  Sparkles, 
  RefreshCw, 
  ChevronLeft,
  PlusCircle
} from "lucide-react";
import { TypewriterText } from "@/components/ui/TypewriterText";
import { getAIResponse } from '@/lib/api';

interface RfpChatProps {
  onUpdateContent: (content: string, context?: { text: string, term: string }) => void;
  documentContent?: string;
  placeholder?: string;
  contractDetails?: any;
  onClose?: () => void;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  source?: {
    type: "document" | "external";
    highlight?: string;
    citation?: string;
  };
}

// Match the expected API type
interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export function RfpChat({ 
  onUpdateContent, 
  documentContent, 
  placeholder = "Not Sure? Let me help you", 
  contractDetails,
  onClose
}: RfpChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [contextAvailable, setContextAvailable] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Add welcome message on first load
  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMessage: Message = {
        id: "welcome",
        role: "assistant",
        content: contractDetails?.title 
          ? `Welcome! I'm here to help with your response to the "${contractDetails.title}" RFP. How can I assist you today?`
          : "Welcome! I'm here to help you craft a winning RFP response. How can I assist you today?"
      };
      setMessages([welcomeMessage]);
    }
  }, []);

  // Update the contextAvailable state when documentContent changes
  useEffect(() => {
    setContextAvailable(!!documentContent && documentContent.trim() !== '');
  }, [documentContent]);

  useEffect(() => {
    // Scroll to bottom when messages change
    scrollToBottom();
  }, [messages]);
  
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Get AI response
      const aiResponse = await getAIResponse(
        messages.concat(userMessage).map(m => ({ 
          role: m.role, 
          content: m.content 
        }) as ChatMessage),
        documentContent
      );

      // Process the response to identify sources and highlights
      const processedResponse = processResponseForSources(aiResponse, userMessage.content);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: processedResponse.content || "I couldn't process that request. Please try again.",
        source: processedResponse.source
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      // IMPORTANT - Always check if we have document content to highlight
      if (documentContent && processedResponse.source && processedResponse.source.type === "document") {
        // Always attempt to highlight context in the document
        const highlightContext = {
          text: processedResponse.source.highlight || "",
          term: extractKeyTerms(userMessage.content).find(term => 
            documentContent.toLowerCase().includes(term.toLowerCase())
          ) || ""
        };
        
        console.log("Sending highlight context to editor:", highlightContext);
        
        // Pass the highlight context to the parent component
        onUpdateContent("", highlightContext); // Empty string as we're not updating content, just highlighting
      }
      
      // Check if document modification was requested
      const isDocumentModification = detectDocumentModificationRequest(userMessage.content);
      if (isDocumentModification && aiResponse) {
        onUpdateContent(aiResponse);
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I'm sorry, I encountered an error processing your request. Please try again.",
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Process the AI response to identify sources and content to highlight
  const processResponseForSources = (response: string, query: string): { 
    content: string; 
    source?: { type: "document" | "external"; highlight?: string; citation?: string; } 
  } => {
    // Default return object
    const result = { content: response };

    if (!response) return result;
    
    // Check if we have document content to search for matches
    if (documentContent) {
      // Search for key phrases or terms from the query in the document content
      const queryTerms = extractKeyTerms(query.toLowerCase());
      
      for (const term of queryTerms) {
        if (term.length < 4) continue; // Skip short terms
        
        // Search for this term in document content
        const documentLower = documentContent.toLowerCase();
        if (documentLower.includes(term)) {
          // Find the context around this term (up to 100 chars before and after)
          const termIndex = documentLower.indexOf(term);
          const startIndex = Math.max(0, termIndex - 100);
          const endIndex = Math.min(documentLower.length, termIndex + term.length + 100);
          
          // Get the actual case-preserved highlight
          const highlight = documentContent.substring(startIndex, endIndex);
          
          // If the AI response also includes this term or similar context, it's likely source-based
          if (response.toLowerCase().includes(term)) {
            return {
              content: response,
              source: {
                type: "document",
                highlight: highlight.trim()
              }
            };
          }
        }
      }
    }
    
    // Check for external knowledge or citations pattern
    const citationPatterns = [
      /according to ([^,.]+)/i,
      /based on ([^,.]+)/i,
      /source: ([^,.]+)/i,
      /reference: ([^,.]+)/i,
      /from ([^,.]+) website/i
    ];
    
    for (const pattern of citationPatterns) {
      const match = response.match(pattern);
      if (match && match[1]) {
        return {
          content: response,
          source: {
            type: "external",
            citation: match[1].trim()
          }
        };
      }
    }
    
    return result;
  };

  // Function to detect if the user is requesting document modifications
  const detectDocumentModificationRequest = (userMessage: string): boolean => {
    const modificationKeywords = [
      'update', 'change', 'modify', 'edit', 'revise', 'rewrite', 
      'add', 'insert', 'include', 'append', 'create', 'generate',
      'remove', 'delete', 'replace', 'fix', 'correct', 'draft'
    ];
    
    const lowercaseMessage = userMessage.toLowerCase();
    
    // Check for modification keywords
    const hasModificationKeyword = modificationKeywords.some(keyword => 
      lowercaseMessage.includes(keyword)
    );
    
    // Check for document references
    const hasDocumentReference = 
      lowercaseMessage.includes('document') || 
      lowercaseMessage.includes('rfp') || 
      lowercaseMessage.includes('proposal') ||
      lowercaseMessage.includes('response') ||
      lowercaseMessage.includes('content') ||
      lowercaseMessage.includes('section');
    
    return hasModificationKeyword && hasDocumentReference;
  };
  
  // Extract important terms from the query for matching
  const extractKeyTerms = (query: string): string[] => {
    // Remove common words, split by spaces, and keep terms of reasonable length
    const stopWords = ['the', 'and', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'with', 'about', 'is', 'are'];
    return query
      .toLowerCase()
      .split(/\s+/)
      .filter(word => 
        word.length > 3 && 
        !stopWords.includes(word) &&
        !word.match(/^[0-9]+$/) // Exclude numbers
      );
  };

  const focusInput = () => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Add a function to clear the chat history
  const clearChat = () => {
    const welcomeMessage: Message = {
      id: "welcome-new",
      role: "assistant",
      content: "Chat history cleared. How else can I help you with your RFP response?"
    };
    setMessages([welcomeMessage]);
  };

  // Prevent default on suggestion click to avoid navigation issues
  const handleSuggestionClick = useCallback((suggestion: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setInput(suggestion);
    focusInput();
    
    // Optional: Auto-submit the suggestion
    // setTimeout(() => handleSend(), 100);
  }, []);

  // Dynamic suggestions based on context
  const getSuggestions = () => {
    if (contextAvailable) {
      // Document-specific suggestions when document content is available
      return [
        "Strengthen my executive summary",
        "Identify weak areas in this response",
        "Add a section on our past performance"
      ];
    } else {
      // General RFP suggestions when no document is loaded
      return [
        "Help me craft an executive summary",
        "What should I include in my response?",
        "Suggest competitive pricing strategies"
      ];
    }
  };

  const suggestions = getSuggestions();

  return (
    <div className="flex flex-col h-full rounded overflow-hidden relative" onClick={(e) => e.stopPropagation()}>
      {/* Header */}
      <div className="py-3 px-4 bg-blue-600 text-white flex justify-between items-center shadow-md">
        <div className="flex items-center gap-2">
          <div className="bg-blue-500 p-1.5 rounded-full flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-yellow-300" />
          </div>
          <h3 className="font-semibold text-lg">Bizradar AI</h3>
        </div>
        <div className="flex items-center">
          {messages.length > 1 && (
            <button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                clearChat();
              }}
              className="p-1.5 hover:bg-blue-500 rounded-full transition-colors"
              title="Clear chat"
            >
              <RefreshCw className="w-4 h-4 text-white" />
            </button>
          )}
          {onClose && (
            <button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClose();
              }}
              className="p-1.5 hover:bg-blue-500 rounded-full transition-colors ml-1"
              title="Close chat"
            >
              <ChevronLeft className="w-4 h-4 text-white" />
            </button>
          )}
        </div>
      </div>

      {/* AI is aware message */}
      <div className="px-4 py-2 bg-blue-50 text-blue-700 text-xs font-medium flex items-center border-b border-blue-100">
        <Bot className="w-3 h-3 mr-1.5" />
        AI is aware of your RFP content
      </div>

      {/* Chat area */}
      <ScrollArea className="flex-1 bg-white">
        <div className="py-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className="px-4 mb-4 last:mb-0"
            >
              <div className={`flex items-start ${
                message.role === "assistant" ? "justify-start" : "justify-end"
              }`}>
                {message.role === "assistant" && (
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mr-2">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                )}
                
                <div className={`px-4 py-3 rounded-lg max-w-[85%] ${
                  message.role === "assistant" 
                    ? "bg-white border border-gray-200 text-gray-800 shadow-sm" 
                    : "bg-blue-600 text-white"
                }`}>
                  {message.role === "assistant" ? (
                    message.content
                  ) : (
                    message.content
                  )}
                </div>
                
                {message.role === "user" && (
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 ml-2">
                    <User className="w-4 h-4 text-gray-600" />
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="px-4">
              <div className="flex items-start">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center mr-2">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-white border border-gray-200 px-4 py-3 rounded-lg shadow-sm">
                  <div className="flex space-x-2">
                    <div className="h-2 w-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                    <div className="h-2 w-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                    <div className="h-2 w-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Invisible element for scrolling to bottom */}
          <div ref={messagesEndRef} className="h-4"></div>
        </div>
      </ScrollArea>

      {/* Suggestions section */}
      {messages.length <= 1 && (
        <div className="p-4 bg-white border-t border-gray-200">
          <h4 className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-3">SUGGESTIONS</h4>
          <div className="space-y-2">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                className="flex items-center w-full text-left p-3 border border-gray-100 rounded-lg hover:bg-blue-50 hover:border-blue-200 transition-colors group"
                onClick={handleSuggestionClick(suggestion)}
              >
                <div className="mr-3 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-200 transition-colors">
                  {index + 1}
                </div>
                <span className="text-blue-600 text-sm">{suggestion}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="p-3 bg-white border-t border-gray-200">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={placeholder}
            className="bg-gray-100 hover:bg-white focus:bg-white border-transparent py-6 rounded-full transition-colors shadow-none"
            disabled={isLoading}
          />
          <Button 
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleSend();
            }}
            disabled={isLoading || !input.trim()}
            className="bg-green-500 hover:bg-green-600 rounded-full h-10 w-10 p-0 flex items-center justify-center"
          >
            <Send className="w-4 h-4 text-white" />
          </Button>
        </form>
        <p className="text-xs text-center text-gray-400 mt-2">
          AI can understand and modify your document
        </p>
      </div>
    </div>
  );
}