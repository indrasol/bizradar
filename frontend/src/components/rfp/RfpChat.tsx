import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, Send, User, HelpCircle, Sparkles, RefreshCw } from "lucide-react";
import { TypewriterText } from "@/components/ui/TypewriterText";
import { getAIResponse } from '@/lib/api';

interface RfpChatProps {
  onUpdateContent: (content: string) => void;
  documentContent?: string;
  placeholder?: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export function RfpChat({ onUpdateContent, documentContent, placeholder = "Not Sure? Ask Bizradar AI" }: RfpChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [contextAvailable, setContextAvailable] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
      const aiResponse = await getAIResponse(
        messages.concat(userMessage).map(m => ({ role: m.role, content: m.content })),
        documentContent
      );

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: aiResponse || "I couldn't process that request.",
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      // Detect if the message is asking for a modification to the document
      const isDocumentModification = detectDocumentModificationRequest(userMessage.content);
      
      if (isDocumentModification && aiResponse) {
        // Pass the AI response back to update the document content
        onUpdateContent(aiResponse);
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I'm sorry, I encountered an error. Please try again.",
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to detect if the user is requesting document modifications
  const detectDocumentModificationRequest = (userMessage: string): boolean => {
    const modificationKeywords = [
      'update', 'change', 'modify', 'edit', 'revise', 'rewrite', 
      'add', 'insert', 'include', 'append', 'create', 'generate',
      'remove', 'delete', 'replace', 'fix', 'correct'
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
      lowercaseMessage.includes('content');
    
    return hasModificationKeyword && hasDocumentReference;
  };

  const focusInput = () => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Add a function to clear the chat history
  const clearChat = () => {
    setMessages([]);
  };

  // Dynamic suggestions based on context
  const getSuggestions = () => {
    if (contextAvailable) {
      // Document-specific suggestions when document content is available
      return [
        "Help me improve the executive summary",
        "What areas of this response need strengthening?",
        "Add a section on our experience with similar projects"
      ];
    } else {
      // General RFP suggestions when no document is loaded
      return [
        "Help me craft an executive summary",
        "What should I include in my past performance section?",
        "Suggest a pricing strategy for this RFP"
      ];
    }
  };

  const suggestions = getSuggestions();

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-300" />
            <h3 className="font-semibold text-lg">Bizradar AI Assistant</h3>
          </div>
          {messages.length > 0 && (
            <button 
              onClick={clearChat}
              className="p-1 hover:bg-blue-700 rounded-full text-blue-100 hover:text-white transition-colors"
              title="Clear chat"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
        </div>
        <p className="text-xs text-blue-100 mt-1">
          {contextAvailable 
            ? "AI is aware of your RFP content and can help modify it" 
            : "Your intelligent RFP companion"}
        </p>
      </div>

      {/* Chat area */}
      <ScrollArea className="flex-1 px-4">
        <div className="space-y-4 py-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 px-4">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-4 shadow-md">
                <Bot className="w-8 h-8 text-blue-600" />
              </div>
              <h4 className="text-lg font-medium text-gray-800 mb-2">
                {contextAvailable 
                  ? "I'm ready to help with your RFP response" 
                  : "How can I help with your RFP?"}
              </h4>
              <p className="text-sm text-gray-500 text-center mb-6">
                {contextAvailable
                  ? "I can analyze your current document, suggest improvements, or make specific changes to your response."
                  : "I can help with writing, provide guidance on format, or share best practices."}
              </p>
              
              {/* Suggestion chips */}
              <div className="space-y-2 w-full">
                {suggestions.map((suggestion, index) => (
                  <div 
                    key={index}
                    className="p-3 bg-blue-50 rounded-lg text-sm text-blue-700 cursor-pointer hover:bg-blue-100 transition-colors shadow-sm flex items-center"
                    onClick={() => {
                      setInput(suggestion);
                      focusInput();
                    }}
                  >
                    <HelpCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span>{suggestion}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${
                message.role === "assistant" ? "items-start" : "items-start flex-row-reverse"
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-md
                ${message.role === "assistant" ? "bg-gradient-to-br from-blue-500 to-blue-600" : "bg-gradient-to-br from-gray-100 to-gray-200"}`}
              >
                {message.role === "assistant" ? (
                  <Bot className="w-4 h-4 text-white" />
                ) : (
                  <User className="w-4 h-4 text-gray-600" />
                )}
              </div>
              <div className={`rounded-lg p-4 max-w-[85%] shadow-md ${
                message.role === "assistant" 
                  ? "bg-white border border-blue-100 text-gray-800" 
                  : "bg-blue-600 text-white"
              }`}>
                {message.role === "assistant" ? (
                  <TypewriterText 
                    text={message.content}
                    speed={20}
                  />
                ) : (
                  message.content
                )}
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex gap-3 items-start">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-white border border-blue-100 rounded-lg p-4 shadow-md">
                <div className="flex gap-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
          
          {/* Invisible element for scrolling to bottom */}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input area */}
      <div className="p-4 bg-gray-50 border-t rounded-b-lg">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex gap-2"
        >
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={contextAvailable 
              ? "Ask about or modify the document..." 
              : placeholder
            }
            className="bg-white shadow-sm border-blue-100 focus-visible:ring-blue-500"
            disabled={isLoading}
          />
          <Button 
            type="submit" 
            disabled={isLoading || !input.trim()}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-sm transition-all"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
        <div className="mt-2 text-xs text-center text-gray-400">
          {contextAvailable 
            ? "AI can understand and modify your document" 
            : "Press Enter to send your message"
          }
        </div>
      </div>
    </div>
  );
}