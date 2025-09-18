import React, { useEffect, useRef, useState } from 'react';
import { Bot, PenLine, CheckCircle, Trash2, CheckSquare } from 'lucide-react';
import { Pursuit } from './types';
import { format, parseISO, isValid } from 'date-fns';
import AILoader from './AILoader';

interface ListViewProps {
  pursuits: Pursuit[];
  onPursuitSelect: (pursuit: Pursuit) => void;
  onRfpAction: (pursuit: Pursuit) => void;
  onDelete: (id: string) => void;
  onAskAI: (pursuit: Pursuit) => void;
  onToggleSubmission: (id: string) => void;
  highlightedPursuitId?: string | null;
  fadingOutPursuitId?: string | null;
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

const isOverdue = (dueDateString: string): boolean => {
  if (!dueDateString || dueDateString === "TBD") return false;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset time to start of day for accurate comparison
  
  // Try to parse as ISO, fallback to Date constructor
  const dueDate = parseISO(dueDateString);
  if (isValid(dueDate)) {
    dueDate.setHours(0, 0, 0, 0);
    return dueDate < today;
  }
  
  // fallback for non-ISO strings
  const fallbackDate = new Date(dueDateString);
  if (isValid(fallbackDate)) {
    fallbackDate.setHours(0, 0, 0, 0);
    return fallbackDate < today;
  }
  
  return false;
};

export const ListView: React.FC<ListViewProps> = ({
  pursuits,
  onPursuitSelect,
  onRfpAction,
  onDelete,
  onAskAI,
  onToggleSubmission,
  highlightedPursuitId,
  fadingOutPursuitId,
}) => {
  const internalRef = React.useRef<HTMLDivElement>(null);
  const highlightedRowRef = useRef<HTMLTableRowElement>(null);
  const [aiProcessing, setAiProcessing] = useState<{ pursuitId: string; title: string } | null>(null);

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

  const handleAskAI = async (pursuit: Pursuit) => {
    // Show loader
    setAiProcessing({ pursuitId: pursuit.id, title: pursuit.title });
    
    try {
      // Call the original onAskAI function
      await onAskAI(pursuit);
      
      // Simulate AI processing time (you can adjust this or remove it)
      setTimeout(() => {
        setAiProcessing(null);
      }, 3000); // 3 seconds loader
    } catch (error) {
      console.error('AI processing error:', error);
      setAiProcessing(null);
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

  // Auto-scroll to highlighted pursuit when it's available
  useEffect(() => {
    if (highlightedPursuitId && highlightedRowRef.current) {
      setTimeout(() => {
        highlightedRowRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }, 100);
    }
  }, [highlightedPursuitId, pursuits]);

  return (
    <>
      {/* AI Loader */}
      {aiProcessing && (
        <AILoader 
          pursuitTitle={aiProcessing.title}
          isProcessing={true}
          onClose={() => setAiProcessing(null)}
        />
      )}
      
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden -mx-4">
        <div className="overflow-x-auto max-h-96">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tracker
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
              {pursuits.map((pursuit, index) => {
                const isHighlighted = highlightedPursuitId === pursuit.id;
                const isFadingOut = fadingOutPursuitId === pursuit.id;
                const isOverduePursuit = isOverdue(pursuit.dueDate);
                return (
                  <tr 
                    key={pursuit.id} 
                    ref={isHighlighted ? highlightedRowRef : null}
                    className={`group ${
                      isHighlighted 
                        ? 'bg-blue-100 border-2 border-blue-400' 
                        : isOverduePursuit
                        ? 'bg-red-50 dark:bg-red-900/20 border-l-4 border-red-300 dark:border-red-600'
                        : index % 2 === 0 ? 'bg-white dark:bg-background' : 'bg-gray-50 dark:bg-muted/40'
                    } hover:bg-blue-50 dark:hover:bg-primary/10 cursor-pointer`}
                    style={{
                      transition: 'all 0.5s ease-out',
                      ...(isFadingOut && {
                        backgroundColor: 'transparent',
                        borderColor: 'transparent'
                      })
                    }}
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
                    <div className={`text-sm font-medium ${
                      isOverduePursuit 
                        ? 'text-red-700 dark:text-red-400 font-bold' 
                        : 'text-red-600'
                    }`}>
                      {formatDate(pursuit.dueDate)}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-center w-28">
                    {pursuit.is_submitted ? (
                      <CheckSquare className="w-5 h-5 text-green-600 dark:text-green-400 mx-auto" />
                    ) : pursuit.stage === "RFP Response Completed" ? (
                      <div className="flex justify-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleSubmission(pursuit.id);
                          }}
                          className="w-5 h-5 border border-gray-300 dark:border-gray-400 rounded flex items-center justify-center bg-white dark:bg-gray-900/50 hover:bg-gray-100 dark:hover:bg-gray-800/70 transition-colors dark:ring-1 dark:ring-white/40 dark:hover:ring-white/60"
                          title="Mark as submitted"
                        >
                          <div className="w-3 h-3 rounded bg-gray-200 dark:bg-white"></div>
                        </button>
                      </div>
                    ) : (
                      <div className="flex justify-center tooltip relative">
                        <div className="w-5 h-5 border border-gray-200 dark:border-gray-400 rounded bg-gray-100 dark:bg-gray-700/70 opacity-90 cursor-not-allowed dark:ring-1 dark:ring-white/25"></div>
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
                        disabled={aiProcessing?.pursuitId === pursuit.id}
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
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}; 