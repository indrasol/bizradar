import React, { useState } from 'react';
import { Bot, PenLine, CheckCircle, Trash2, CheckSquare, Loader2 } from 'lucide-react';
import { Pursuit } from './types';
import { format, parseISO, isValid } from 'date-fns';

interface ListViewProps {
  pursuits: Pursuit[];
  onPursuitSelect: (pursuit: Pursuit) => void;
  onRfpAction: (pursuit: Pursuit) => void;
  onDelete: (id: string) => void;
  onAskAI: (pursuit: Pursuit) => void;
  onToggleSubmission: (id: string) => void;
}

const formatDate = (dateString: string) => {
  if (!dateString || dateString === "TBD") return "No Due Date Set";
  // Try to parse as ISO, fallback to Date constructor
  const date = parseISO(dateString);
  if (isValid(date)) {
    return format(date, 'MM/dd/yyyy');
  }
  // fallback for non-ISO strings
  const fallbackDate = new Date(dateString);
  return isValid(fallbackDate) ? format(fallbackDate, 'MM/dd/yyyy') : dateString;
};

export const ListView: React.FC<ListViewProps> = ({
  pursuits,
  onPursuitSelect,
  onRfpAction,
  onDelete,
  onAskAI,
  onToggleSubmission,
}) => {
  const internalRef = React.useRef<HTMLDivElement>(null);
  const [loadingPursuit, setLoadingPursuit] = useState<Pursuit | null>(null);

  const getStageColor = (stage: string): string => {
    if (stage.includes("RFP Response Initiated")) {
      return "bg-yellow-100 text-yellow-800";
    }
    
    switch(stage) {
      case "Assessment":
        return "bg-orange-100 text-orange-800";
      case "Planning":
        return "bg-blue-100 text-blue-800";
      case "Implementation":
        return "bg-purple-100 text-purple-800";
      case "Review":
        return "bg-indigo-100 text-indigo-800";
      case "RFP Response Completed":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const renderRfpActionButton = (pursuit: Pursuit) => {
    let buttonText = "Create Response";
    let icon = <PenLine className="w-3 h-3" />;
    
    if (pursuit.is_submitted) {
      buttonText = "View Submitted";
      icon = <CheckCircle className="w-3 h-3" />;
    } else if (pursuit.stage === "RFP Response Completed") {
      buttonText = "Edit Response";
      icon = <PenLine className="w-3 h-3" />;
    } else if (pursuit.stage.includes("RFP Response Initiated")) {
      buttonText = "Continue Response";
      icon = <PenLine className="w-3 h-3" />;
    }
    
    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRfpAction(pursuit);
        }}
        className="px-3 py-1 text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-full transition-colors flex items-center gap-1 whitespace-nowrap"
      >
        {icon} {buttonText}
      </button>
    );
  };

  const handleAskAI = async (pursuit: Pursuit) => {
    setLoadingPursuit(pursuit);
    try {
      await onAskAI(pursuit);
    } finally {
      setLoadingPursuit(null);
    }
  };

  // Show loading overlay when Ask AI is clicked
  if (loadingPursuit) {
    return (
      <div className="fixed inset-0 bg-white/95 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="p-8 mx-auto bg-gradient-to-br from-white via-emerald-50/30 to-white border border-gray-200 rounded-2xl shadow-lg max-w-2xl relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-emerald-100/50 to-transparent rounded-full -mr-16 -mt-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-blue-100/40 to-transparent rounded-full -ml-12 -mb-12"></div>
          
          <div className="relative z-10">
            <div className="flex flex-col items-center justify-center text-center">
              {/* Animated AI Icon */}
              <div className="relative mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Loader2 size={28} className="text-white animate-spin" />
                </div>
                {/* Pulse rings */}
                <div className="absolute inset-0 w-16 h-16 bg-emerald-400 rounded-2xl animate-ping opacity-20"></div>
                <div className="absolute inset-0 w-16 h-16 bg-emerald-300 rounded-2xl animate-ping opacity-10" style={{ animationDelay: '0.5s' }}></div>
              </div>

              {/* Title with animated dots */}
              <div className="mb-4">
                <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-900 bg-clip-text text-transparent flex items-center gap-2">
                  Loading BizRadar AI
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </h3>
              </div>

              {/* Pursuit title display */}
              <div className="mb-6 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200 shadow-sm">
                <p className="text-gray-600 text-sm font-medium">
                  <span className="text-emerald-600">"</span>
                  <span className="text-gray-800">{loadingPursuit.title}</span>
                  <span className="text-emerald-600">"</span>
                </p>
              </div>

              {/* Enhanced Progress bar with moving animation */}
              <div className="w-full max-w-md">
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden relative">
                  {/* Base emerald gradient background */}
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-400 rounded-full"></div>
                  {/* Moving shine effect */}
                  <div 
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent rounded-full"
                    style={{
                      animation: 'shimmer 2.5s infinite',
                      backgroundSize: '200% 100%'
                    }}
                  ></div>
                  {/* Pulsing overlay */}
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-300/40 via-emerald-200/40 to-emerald-300/40 rounded-full animate-pulse"></div>
                </div>
                <p className="text-xs text-gray-500 text-center mt-2">Preparing AI assistance...</p>
              </div>
              
              {/* Add shimmer keyframe animation */}
              <style dangerouslySetInnerHTML={{
                __html: `
                  @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                  }
                `
              }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Pursuit
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stage
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Due Date
              </th>
              <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-28">
                Submitted
              </th>
              <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-64">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {pursuits.map((pursuit, index) => (
              <tr 
                key={pursuit.id} 
                className={`group ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors cursor-pointer`}
                onClick={() => onPursuitSelect(pursuit)}
              >
                <td className="px-4 py-4">
                  <div className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                    {pursuit.title}
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStageColor(pursuit.stage)}`}>
                    {pursuit.stage}
                  </span>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(pursuit.created)}
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="text-sm text-red-600 font-medium">
                    {formatDate(pursuit.dueDate)}
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-center w-28">
                  {pursuit.is_submitted ? (
                    <CheckSquare className="w-5 h-5 text-green-600 mx-auto" />
                  ) : pursuit.stage === "RFP Response Completed" ? (
                    <div className="flex justify-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleSubmission(pursuit.id);
                        }}
                        className="w-5 h-5 border border-gray-300 rounded flex items-center justify-center hover:bg-gray-100 transition-colors"
                        title="Mark as submitted"
                      >
                        <div className="w-3 h-3 rounded"></div>
                      </button>
                    </div>
                  ) : (
                    <div className="flex justify-center tooltip relative">
                      <div className="w-5 h-5 border border-gray-200 rounded bg-gray-100 opacity-60 cursor-not-allowed"></div>
                      <div className="tooltip-text opacity-0 group-hover:opacity-100 absolute mt-8 -translate-x-1/2 left-1/2 p-2 bg-gray-800 text-white text-xs rounded w-48 transition-all pointer-events-none">
                        Please complete the RFP before submitting
                      </div>
                    </div>
                  )}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium w-64">
                  <div className="flex items-center justify-end space-x-2">
                    {renderRfpActionButton(pursuit)}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAskAI(pursuit);
                      }}
                      className="p-1.5 rounded-full text-emerald-600 hover:bg-emerald-100 transition-all"
                      title="Ask BizRadar AI"
                    >
                      <Bot size={18} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(pursuit.id);
                      }}
                      className="p-1.5 rounded-full text-gray-400 hover:bg-red-100 hover:text-red-600 transition-all"
                      title="Delete Pursuit"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}; 