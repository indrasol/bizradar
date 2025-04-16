import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  Plus, 
  X, 
  MinusCircle, 
  Sparkles, 
  ArrowUp, 
  ThumbsUp, 
  ThumbsDown, 
  Copy, 
  MoreHorizontal,
  ChevronDown,
  RefreshCw,
  Download,
  Zap,
  ArrowLeft // Added ArrowLeft icon for back button
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom'; // Added useNavigate

// Sample conversation history
const initialConversations = [
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
const suggestions = [
  "Analyze this RFP for key requirements",
  "Find similar opportunities to this solicitation",
  "Summarize the evaluation criteria",
  "Generate a capability statement for this opportunity"
];

// Sample system message
const systemMessage = {
  id: 'system-1',
  type: 'system',
  content: 'I\'m BizradarAI, your procurement assistant. I can help you analyze solicitations, find new opportunities, and prepare better proposals. What would you like help with today?',
  timestamp: new Date().toISOString()
};

const BizradarAI = () => {
  const navigate = useNavigate(); // Initialize useNavigate hook
  const [activeConversation, setActiveConversation] = useState(null);
  const [conversations, setConversations] = useState(initialConversations);
  const [messages, setMessages] = useState([systemMessage]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Function to handle going back
  const handleGoBack = () => {
    navigate(-1); // Navigate back to the previous page
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = () => {
    if (newMessage.trim() === '') return;

    // Add user message
    const userMessage = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: newMessage,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setNewMessage('');
    setIsTyping(true);

    // Simulate AI response after a delay
    setTimeout(() => {
      const aiResponse = {
        id: `ai-${Date.now()}`,
        type: 'ai',
        content: generateAIResponse(newMessage),
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const createNewConversation = () => {
    const newConversation = {
      id: Date.now(),
      title: 'New conversation',
      lastActive: 'Just now',
      messages: []
    };
    setConversations([newConversation, ...conversations]);
    setActiveConversation(newConversation.id);
    setMessages([systemMessage]);
  };

  const handleSuggestionClick = (suggestion) => {
    setNewMessage(suggestion);
    inputRef.current.focus();
  };

  // Simple AI response generator based on user input
  const generateAIResponse = (userInput) => {
    const input = userInput.toLowerCase();
    
    if (input.includes('rfp') || input.includes('solicitation') || input.includes('requirements')) {
      return `I've analyzed this solicitation and found the following key requirements:

1. CMMC Level 2 compliance required
2. Past performance with federal agencies (minimum 3 references)
3. Staff certifications needed: PMP, CISSP, Security+
4. 24/7 support capability
5. US-based team members only

The proposal is due in 30 days. Would you like me to help prepare a response strategy?`;
    }
    
    if (input.includes('opportunity') || input.includes('find') || input.includes('similar')) {
      return `Based on your search criteria, I found 5 similar opportunities:

1. **DHS Cybersecurity Solutions** - Due May 15, 2025 - Est. value $2.2M
2. **DoD Network Infrastructure** - Due June 2, 2025 - Est. value $4.5M
3. **GSA IT Modernization** - Due April 28, 2025 - Est. value $1.8M
4. **VA Telehealth Platform** - Due May 8, 2025 - Est. value $3.2M
5. **EPA Data Management** - Due June 12, 2025 - Est. value $1.5M

Would you like more details on any of these opportunities?`;
    }
    
    if (input.includes('evaluation') || input.includes('criteria')) {
      return `The evaluation criteria for this solicitation breaks down as follows:

**Technical (50%)**
- Solution approach (20%)
- Key personnel qualifications (15%)
- Similar experience (15%)

**Price (30%)**
- Overall cost
- Price realism

**Past Performance (20%)**
- Customer satisfaction
- Project outcomes
- On-time delivery

This is a best value tradeoff procurement. Would you like suggestions to maximize your technical score?`;
    }
    
    if (input.includes('capability') || input.includes('statement')) {
      return `I've generated a capability statement draft for this opportunity:

**[Company Name] Capability Statement**

**Core Competencies:**
- Cybersecurity solutions for federal agencies
- FedRAMP-authorized cloud services
- Network infrastructure modernization
- 24/7 managed security services
- CMMC compliance consulting

**Past Performance:**
- DHS: Implemented zero-trust architecture ($2.4M)
- DoD: Cloud migration for 3 systems ($5.1M)
- GSA: Security operations center support ($3.2M)

**Differentiators:**
- 95% employee retention rate
- 100% on-time delivery record
- Proprietary threat intelligence platform
- Military veteran workforce (60%)

Would you like me to customize this further?`;
    }
    
    return `I understand you're asking about "${userInput}". How specifically can I help you with this? I can analyze solicitations, find opportunities, compare competitors, or help with proposal strategies.`;
  };

  return (
    <div className="h-screen flex bg-gray-50 text-gray-800 overflow-hidden">
      {/* Conversations Sidebar */}
      {showSidebar && (
        <div className="w-80 border-r border-gray-200 bg-white flex flex-col">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="font-semibold text-gray-800">Conversations</h2>
            <button 
              onClick={createNewConversation}
              className="p-1.5 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <Plus size={18} />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {conversations.map(conversation => (
              <div 
                key={conversation.id}
                onClick={() => setActiveConversation(conversation.id)}
                className={`p-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                  activeConversation === conversation.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                }`}
              >
                <div className="flex items-start">
                  <div className="p-1.5 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 shadow-sm mr-3">
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
              <div className="p-1 bg-blue-100 rounded-md">
                <Zap size={14} className="text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium text-gray-800">Pro Plan</p>
                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                  <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: '65%' }}></div>
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
        <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            {/* Back Button - Added here */}
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
              <span className="p-1 rounded-md bg-gradient-to-br from-emerald-500 to-teal-600">
                <Bot size={14} className="text-white" />
              </span>
              BizradarAI
            </h1>
            <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-600 rounded-full text-xs font-medium">Beta</span>
          </div>
          
          <div className="flex items-center gap-2">
            <button className="p-1.5 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors">
              <RefreshCw size={18} />
            </button>
            <button className="p-1.5 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors">
              <Download size={18} />
            </button>
          </div>
        </div>
        
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          <div className="max-w-4xl mx-auto space-y-6">
            {messages.map(message => (
              <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-3xl ${
                  message.type === 'user' 
                    ? 'bg-blue-600 text-white rounded-t-2xl rounded-bl-2xl' 
                    : message.type === 'system'
                      ? 'bg-gray-100 text-gray-700 rounded-2xl' 
                      : 'bg-white border border-gray-200 text-gray-800 rounded-t-2xl rounded-br-2xl shadow-sm'
                } p-4`}>
                  {message.type === 'ai' && (
                    <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-100">
                      <div className="p-1 rounded-md bg-gradient-to-br from-emerald-500 to-teal-600">
                        <Bot size={12} className="text-white" />
                      </div>
                      <span className="text-xs font-medium text-gray-600">BizradarAI</span>
                    </div>
                  )}
                  <div className="prose prose-sm max-w-none">
                    {message.content.split('\n').map((line, i) => (
                      <p key={i} className={message.type === 'user' ? 'text-white' : 'text-gray-700'}>
                        {line}
                      </p>
                    ))}
                  </div>
                  
                  {message.type === 'ai' && (
                    <div className="mt-3 pt-2 border-t border-gray-100 flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <button className="p-1 rounded-md hover:bg-gray-100 text-gray-500">
                          <ThumbsUp size={14} />
                        </button>
                        <button className="p-1 rounded-md hover:bg-gray-100 text-gray-500">
                          <ThumbsDown size={14} />
                        </button>
                        <button className="p-1 rounded-md hover:bg-gray-100 text-gray-500">
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
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                  <span className="text-sm text-gray-500">BizradarAI is typing...</span>
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
              <Sparkles size={14} className="text-blue-500" />
              Try asking
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {suggestions.map((suggestion, index) => (
                <button 
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="text-left text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 p-3 rounded-lg transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* Input Area */}
        <div className="p-4 border-t border-gray-200 bg-white">
          <div className="max-w-4xl mx-auto">
            <div className="relative">
              <textarea
                ref={inputRef}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Message BizradarAI..."
                className="w-full px-4 py-3 pr-14 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none h-12 min-h-12 max-h-32"
                rows={1}
              />
              <button 
                onClick={handleSendMessage}
                disabled={newMessage.trim() === ''}
                className={`absolute right-2 bottom-2 p-2 rounded-lg ${
                  newMessage.trim() === '' 
                    ? 'text-gray-400 bg-gray-100' 
                    : 'text-white bg-blue-600 hover:bg-blue-700'
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








