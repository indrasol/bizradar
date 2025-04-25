import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  Plus, 
  X, 
  MinusCircle, 
  Sparkles, 
  ThumbsUp, 
  ThumbsDown, 
  Copy, 
  MoreHorizontal,
  RefreshCw,
  Download,
  Zap,
  ArrowLeft,
  FileUp,
  FileText,
  ExternalLink,
  File
} from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

const isDevelopment =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";
const API_BASE_URL = isDevelopment
  ? "http://localhost:5000"
  : "https://bizradar-backend.onrender.com";

// Define types
interface Message {
  id: string;
  type: 'user' | 'ai' | 'system';
  content: string;
  timestamp: string;
  samGovUrl?: string; // Added this property for sam.gov links
}

interface Conversation {
  id: number;
  title: string;
  lastActive: string;
  messages: Message[];
}

interface PursuitContext {
  id: string;
  title: string;
  description: string;
  stage: string;
  dueDate: string;
  naicsCode: string;
  noticeId: string | null;
  userId?: string;
}

interface LocationState {
  pursuitContext?: PursuitContext;
}

// Sample conversation history
const initialConversations: Conversation[] = [
  { 
    id: 1, 
    title: "Market Research for Federal Contracts", 
    lastActive: "1 hour ago",
    messages: []
  },
  { 
    id: 2, 
    title: "Competitor Analysis for Cybersecurity RFP", 
    lastActive: "Yesterday",
    messages: []
  }
];

// Sample suggestions
const suggestions: string[] = [
  "Analyze this RFP for key requirements",
  "Find similar opportunities to this solicitation",
  "Summarize the evaluation criteria",
  "Generate a capability statement for this opportunity"
];

const BizradarAI: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as LocationState | null;
  
  const [activeConversation, setActiveConversation] = useState<number | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [showSidebar, setShowSidebar] = useState<boolean>(true);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]); 
  const [pursuitContext, setPursuitContext] = useState<PursuitContext | null>(null);
  const [documentsContext, setDocumentsContext] = useState<{ file_name: string; text: string }[]>([]);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropAreaRef = useRef<HTMLDivElement>(null);

  // Initialize with system message
  useEffect(() => {
    const contextFromNav = locationState?.pursuitContext;
    
    if (contextFromNav) {
      setPursuitContext(contextFromNav);
      
      // Create sam.gov URL if notice ID is available
      const samGovUrl = contextFromNav.noticeId ? 
        `https://sam.gov/opp/${contextFromNav.noticeId}/view` : null;
      
      const systemMessage: Message = {
        id: 'system-1',
        type: 'system',
        content: `I'm BizradarAI, your procurement assistant. I notice you're asking about the pursuit "${contextFromNav.title}". I can help you analyze this opportunity, understand requirements, and prepare better proposals. What specific information do you need about this pursuit?`,
        timestamp: new Date().toISOString(),
        samGovUrl: samGovUrl // Add the SAM.gov URL
      };
      
      setMessages([systemMessage]);
    } else {
      const systemMessage: Message = {
        id: 'system-1',
        type: 'system',
        content: 'I\'m BizradarAI, your procurement assistant. I can help you analyze solicitations, find new opportunities, and prepare better proposals. What would you like help with today?',
        timestamp: new Date().toISOString()
      };
      
      setMessages([systemMessage]);
    }
  }, [locationState]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Setup drag and drop event listeners
  useEffect(() => {
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(true);
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      
      if (e.dataTransfer?.files.length) {
        const files = Array.from(e.dataTransfer.files);
        handleFiles(files);
      }
    };

    const dropArea = dropAreaRef.current;
    
    if (dropArea) {
      dropArea.addEventListener('dragover', handleDragOver);
      dropArea.addEventListener('dragleave', handleDragLeave);
      dropArea.addEventListener('drop', handleDrop);
      
      return () => {
        dropArea.removeEventListener('dragover', handleDragOver);
        dropArea.removeEventListener('dragleave', handleDragLeave);
        dropArea.removeEventListener('drop', handleDrop);
      };
    }
  }, []);

  const handleGoBack = (): void => {
    navigate(-1);
  };

  const scrollToBottom = (): void => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Get icon based on file type
  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();

    switch (extension) {
      case 'pdf':
        return <FileText size={16} className="text-red-500" />;
      case 'doc':
      case 'docx':
        return <FileText size={16} className="text-blue-500" />;
      case 'xls':
      case 'xlsx':
        return <FileText size={16} className="text-green-500" />;
      case 'ppt':
      case 'pptx':
        return <FileText size={16} className="text-orange-500" />;
      case 'txt':
        return <FileText size={16} className="text-gray-500" />;
      default:
        return <File size={16} className="text-gray-500" />;
    }
  };

  // Function to handle file upload
  const handleFiles = async (files: File[]) => {
    const newFiles = files;
    setUploadedFiles(prev => [...prev, ...newFiles]);

    // Build a simple payload: [{ name, type, content: base64 }]
    const filePayloads = await Promise.all(
      newFiles.map(async file => ({
        name: file.name,
        type: file.type,
        content: await new Promise<string>(res => {
          const reader = new FileReader();
          reader.onload = () => res(reader.result as string);
          reader.readAsDataURL(file);
        })
      }))
    );

    // Send to your FastAPI /process-documents
    const resp = await fetch(`${API_BASE_URL}/process-documents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pursuitId: pursuitContext?.id,
        noticeId: pursuitContext?.noticeId,
        userId: pursuitContext?.userId,
        files: filePayloads
      })
    });
    const json = await resp.json();

    // processed is [{ file_name, file_type, file_extension, text }]
    setDocumentsContext(prev => [
      ...prev,
      ...json.files.map((f: any) => ({
        file_name: f.file_name,
        text: f.text || ""  // Ensure text is set to an empty string if undefined
      }))
    ]);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    if (!e.target.files?.length) return;
    const files = Array.from(e.target.files);
    handleFiles(files);
  };

  const handleSendMessage = async (): Promise<void> => {
    if (newMessage.trim() === '') return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: newMessage,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    const userQuery = newMessage;
    setNewMessage('');
    setIsTyping(true);

    try {
      const requestData = {
        pursuitId: pursuitContext?.id,
        noticeId: pursuitContext?.noticeId,
        userId: pursuitContext?.userId,
        userQuery: userQuery,
        pursuitContext: pursuitContext,
        documents: documentsContext, // Include documents context here
      };
      
      const response = await fetch(`${API_BASE_URL}/ask-bizradar-ai`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API error (${response.status}):`, errorText);
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data && data.ai_response) {
        const aiResponse: Message = {
          id: `ai-${Date.now()}`,
          type: 'ai',
          content: data.ai_response,
          timestamp: new Date().toISOString(),
          samGovUrl: data.sam_gov_url // Store the SAM.gov URL from the backend response
        };
        
        setMessages(prev => [...prev, aiResponse]);
      } else {
        throw new Error("Invalid response format from backend");
      }
    } catch (error) {
      console.error("Error in handleSendMessage:", error);
      
      const fallbackResponse: Message = {
        id: `ai-${Date.now()}`,
        type: 'ai',
        content: "I'm sorry, I encountered an error while processing your request. Please try again later.",
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, fallbackResponse]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const createNewConversation = (): void => {
    const newConversation: Conversation = {
      id: Date.now(),
      title: 'New conversation',
      lastActive: 'Just now',
      messages: []
    };
    setConversations([newConversation, ...conversations]);
    setActiveConversation(newConversation.id);
    
    const systemMessage: Message = {
      id: 'system-1',
      type: 'system',
      content: 'I\'m BizradarAI, your procurement assistant. I can help you analyze solicitations, find new opportunities, and prepare better proposals. What would you like help with today?',
      timestamp: new Date().toISOString()
    };
    
    setMessages([systemMessage]);
    setPursuitContext(null);
    setUploadedFiles([]);
  };

  const handleSuggestionClick = (suggestion: string): void => {
    setNewMessage(suggestion);
    inputRef.current?.focus();
  };

  const copyToClipboard = (text: string): void => {
    navigator.clipboard.writeText(text)
      .then(() => {
        // Could add a toast/notification here
        console.log('Text copied to clipboard');
      })
      .catch(err => {
        console.error('Error copying text: ', err);
      });
  };

  const removeFile = (index: number): void => {
    const newFiles = [...uploadedFiles];
    newFiles.splice(index, 1);
    setUploadedFiles(newFiles);
    
    const newDocContext = [...documentsContext];
    newDocContext.splice(index, 1);
    setDocumentsContext(newDocContext);
  };

  // Add this function in your component
  const processMessageContent = (content: string): string => {
    // Remove specific phrases we don't want to show
    const phrasesToRemove = [
      "If you need more specific details or have further questions, feel free to ask!",
      /\[View Details\]\(https:\/\/api\.sam\.gov\/prod\/opportunities.*\)/g
    ];
    
    let processedContent = content;
    
    // Remove each phrase
    phrasesToRemove.forEach(phrase => {
      if (typeof phrase === 'string') {
        processedContent = processedContent.replace(phrase, '');
      } else {
        processedContent = processedContent.replace(phrase, '');
      }
    });
    
    // Clean up any trailing whitespace or newlines
    processedContent = processedContent.trim();
    
    return processedContent;
  };

  return (
    <div className="h-screen flex bg-gray-50 text-gray-800 overflow-hidden font-sans">
      {/* Conversations Sidebar */}
      {showSidebar && (
        <div className="w-80 border-r border-gray-200 bg-white flex flex-col shadow-sm">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-white">
            <h2 className="font-semibold text-gray-800">Conversations</h2>
            <button 
              onClick={createNewConversation}
              className="p-1.5 rounded-md text-gray-500 hover:text-emerald-500 hover:bg-emerald-50 transition-colors"
            >
              <Plus size={18} />
            </button>
          </div>
          
          {/* Attachments Section - Removed from sidebar since we're now displaying them in chat area */}
          
          <div className="flex-1 overflow-y-auto">
            {conversations.map(conversation => (
              <div 
                key={conversation.id}
                onClick={() => setActiveConversation(conversation.id)}
                className={`p-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                  activeConversation === conversation.id ? 'bg-emerald-50 border-l-4 border-l-emerald-500' : ''
                }`}
              >
                <div className="flex items-start">
                  <div className="p-1.5 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-sm mr-3">
                    <Bot className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-gray-800 truncate">{conversation.title}</h3>
                    <p className="text-xs text-gray-500">{conversation.lastActive}</p>
                  </div>
                  <button className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
                    <MoreHorizontal size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          <div className="p-3 border-t border-gray-200 bg-gray-50">
            <Link to="/billing" className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="p-1 bg-emerald-100 rounded-md">
                <Zap size={14} className="text-emerald-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium text-gray-800">Pro Plan</p>
                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                  <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: '65%' }}></div>
                </div>
              </div>
              <span className="text-xs text-gray-500">65%</span>
            </Link>
          </div>
        </div>
      )}
      
      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Chat Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-white shadow-sm">
          <div className="flex items-center gap-3">
            {/* Back Button */}
            <button 
              onClick={handleGoBack}
              className="p-1.5 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft size={18} />
            </button>
            
            <button 
              onClick={() => setShowSidebar(!showSidebar)}
              className="p-1.5 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            >
              {showSidebar ? <MinusCircle size={18} /> : <Plus size={18} />}
            </button>
            <h1 className="font-medium text-gray-800 flex items-center gap-2">
              <span className="p-1.5 rounded-md bg-gradient-to-br from-emerald-500 to-emerald-600">
                <Bot size={18} className="text-white" />
              </span>
              <span className="text-lg">BizradarAI</span>
            </h1>
            <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-600 rounded-full text-xs font-medium">Beta</span>
            
            {/* Show pursuit context if available */}
            {pursuitContext && (
              <div className="ml-2 px-2 py-1 bg-emerald-50 border border-emerald-100 rounded-md">
                <span className="text-xs text-emerald-700">
                  Context: {pursuitContext.title}
                </span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <button className="p-1.5 rounded-md text-gray-500 hover:text-emerald-500 hover:bg-emerald-50 transition-colors">
              <RefreshCw size={18} />
            </button>
            <button className="p-1.5 rounded-md text-gray-500 hover:text-emerald-500 hover:bg-emerald-50 transition-colors">
              <Download size={18} />
            </button>
          </div>
        </div>
        
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          <div className="max-w-4xl mx-auto space-y-6">
            {messages.map(message => (
              <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-3xl shadow-sm ${
                  message.type === 'user' 
                    ? 'bg-emerald-500 text-white rounded-t-2xl rounded-bl-2xl' 
                    : message.type === 'system'
                      ? 'bg-white text-gray-700 border border-gray-200 rounded-2xl' 
                      : 'bg-white border border-gray-200 text-gray-800 rounded-t-2xl rounded-br-2xl'
                } p-4`}>
                  {/* Display BizradarAI branding for both system and AI messages */}
                  {(message.type === 'ai' || (message.type === 'system' && messages.indexOf(message) === 0)) && (
                    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
                      <div className="p-1.5 rounded-md bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-sm">
                        <Bot size={18} className="text-white" />
                      </div>
                      <span className="text-base font-semibold text-gray-700">BizradarAI</span>
                    </div>
                  )}
                  <div className="prose prose-sm max-w-none">
                    {processMessageContent(message.content).split('\n').map((line, i) => {
                      // Clean the line by removing asterisks
                      const cleanedLine = line.replace(/\*\*/g, '');
                      
                      // Check if the line is a numbered list item (like "1. ")
                      const isNumberedItem = /^\d+\.\s/.test(cleanedLine);
                      
                      // Check if the line starts with a dash
                      const isDashItem = /^-\s/.test(cleanedLine);
                      
                      if (isNumberedItem) {
                        // For numbered items, add proper styling
                        return (
                          <p key={i} className={`${message.type === 'user' ? 'text-white' : 'text-gray-700'} font-medium mb-2`}>
                            {cleanedLine}
                          </p>
                        );
                      } else if (isDashItem) {
                        // For dash items, improve the presentation
                        return (
                          <p key={i} className={`${message.type === 'user' ? 'text-white' : 'text-gray-700'} ml-4 mb-1`}>
                            {cleanedLine}
                          </p>
                        );
                      } else {
                        // For regular text
                        return (
                          <p key={i} className={`${message.type === 'user' ? 'text-white' : 'text-gray-700'} mb-2`}>
                            {cleanedLine}
                          </p>
                        );
                      }
                    })}
                    
                    {/* Add SAM.gov button for AI and system messages */}
                    {(message.type === 'ai' || message.type === 'system') && 
                     (message.samGovUrl || (pursuitContext?.noticeId && message.type === 'ai')) && (
                      <div className="mt-3">
                        <a 
                          href={message.samGovUrl || `https://sam.gov/opp/${pursuitContext?.noticeId}/view`}
                          target="_blank"
                          rel="noopener noreferrer" 
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-md transition-colors"
                        >
                          View on sam.gov
                          <ExternalLink size={12} />
                        </a>
                      </div>
                    )}
                  </div>
                  
                  {message.type === 'ai' && (
                    <div className="mt-3 pt-2 border-t border-gray-100 flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <button className="p-1 rounded-md hover:bg-gray-100 text-gray-500 hover:text-emerald-600">
                          <ThumbsUp size={14} />
                        </button>
                        <button className="p-1 rounded-md hover:bg-gray-100 text-gray-500 hover:text-red-500">
                          <ThumbsDown size={14} />
                        </button>
                        <button 
                          className="p-1 rounded-md hover:bg-gray-100 text-gray-500 hover:text-emerald-600"
                          onClick={() => copyToClipboard(message.content)}
                        >
                          <Copy size={14} />
                        </button>
                      </div>
                      <span className="text-xs text-gray-400">
                        {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex items-center gap-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                  <span className="text-sm text-gray-500">BizradarAI is thinking...</span>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </div>
        
        {/* Suggestions */}
        {messages.length === 1 && (
          <div className="px-6 py-4 border-t border-gray-200 bg-white">
            <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <Sparkles size={14} className="text-emerald-500" />
              Try asking
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {suggestions.map((suggestion, index) => (
                <button 
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="text-left text-sm bg-emerald-50 hover:bg-emerald-100 text-emerald-700 p-3 rounded-lg transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* Input Area with Drag & Drop */}
        <div className="p-4 border-t border-gray-200 bg-white shadow-lg">
          <div className="max-w-4xl mx-auto">
            {/* File List Display */}
            {uploadedFiles.length > 0 && (
              <div className="mb-3 pb-3 border-b border-gray-200">
                <p className="text-xs font-medium text-gray-600 mb-2">Uploaded files for context:</p>
                <div className="flex flex-wrap gap-2">
                  {uploadedFiles.map((file, index) => (
                    <div 
                      key={index} 
                      className="flex items-center bg-emerald-50 border border-emerald-100 rounded-md px-3 py-1.5 text-xs text-emerald-700"
                    >
                      {getFileIcon(file.name)}
                      <span className="ml-1.5 truncate max-w-xs">{file.name}</span>
                      <button
                        onClick={() => removeFile(index)}
                        className="ml-2 text-emerald-500 hover:text-emerald-700"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Drag & Drop Area */}
            <div 
              ref={dropAreaRef} 
              className={`relative ${isDragging ? 'bg-emerald-50 border-emerald-300' : ''}`}
            >
              {isDragging && (
                <div className="absolute inset-0 bg-emerald-50 border-2 border-dashed border-emerald-300 rounded-xl flex items-center justify-center z-10">
                  <div className="text-emerald-500 font-medium">Drop files here</div>
                </div>
              )}
              
              {/* File upload button */}
              <input 
                type="file"
                multiple
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileUpload}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute left-3 bottom-3 p-2 rounded-lg text-gray-500 hover:text-emerald-500 hover:bg-emerald-50 transition-colors"
                title="Upload files for context"
              >
                <FileUp size={16} />
              </button>
              
              <textarea
                ref={inputRef}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Message BizradarAI or drag files here..."
                className="w-full px-4 py-3 pl-12 pr-14 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none h-12 min-h-12 max-h-32 shadow-sm"
                rows={1}
              />
              <button 
                onClick={handleSendMessage}
                disabled={newMessage.trim() === ''}
                className={`absolute right-3 bottom-3 p-2 rounded-lg ${
                  newMessage.trim() === '' 
                    ? 'text-gray-400 bg-gray-100' 
                    : 'text-white bg-emerald-500 hover:bg-emerald-600'
                } transition-colors`}
              >
                <Send size={16} />
              </button>
            </div>
            
            <p className="text-xs text-gray-500 mt-2">
              BizradarAI may produce inaccurate information. Verify important information.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BizradarAI;