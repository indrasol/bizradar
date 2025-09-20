import React, { useEffect, useRef, useState } from 'react';
import { Bot, PenLine, CheckCircle, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Pursuit } from './types';
import { format, parseISO, isValid } from 'date-fns';
import AILoader from './AILoader';

interface KanbanViewProps {
  pursuits: Pursuit[];
  onPursuitSelect: (pursuit: Pursuit) => void;
  onRfpAction: (pursuit: Pursuit) => void;
  onDelete: (id: string) => void;
  onAskAI: (pursuit: Pursuit) => void;
  highlightedPursuitId?: string | null;
  fadingOutPursuitId?: string | null;
}

const STAGES = [
  { id: 'Review', title: 'Review', color: 'bg-orange-100 text-orange-800' },
  { id: 'In Progress', title: 'In Progress', color: 'bg-blue-100 text-blue-800' },
  { id: 'Completed', title: 'Completed', color: 'bg-green-100 text-green-800' },
];

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

export const KanbanView: React.FC<KanbanViewProps> = ({
  pursuits,
  onPursuitSelect,
  onRfpAction,
  onDelete,
  onAskAI,
  highlightedPursuitId,
  fadingOutPursuitId,
}) => {
  const highlightedCardRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [aiProcessing, setAiProcessing] = useState<{ pursuitId: string; title: string } | null>(null);

  const getPursuitsForStage = (stageId: string) => {
    return pursuits.filter(pursuit => pursuit.stage === stageId);
  };

  const renderRfpActionButton = (pursuit: Pursuit) => {
    let buttonText = "Edit Response";
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
        className="ml-2 px-3 py-1 text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-full transition-colors flex items-center gap-1"
      >
        {icon} {buttonText}
      </button>
    );
  };

  // Check scroll position to show/hide scroll indicators
  const checkScrollPosition = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  // Auto-scroll to highlighted pursuit when it's available
  useEffect(() => {
    if (highlightedPursuitId && highlightedCardRef.current) {
      setTimeout(() => {
        highlightedCardRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }, 100);
    }
  }, [highlightedPursuitId, pursuits]);

  // Check scroll position on mount and when pursuits change
  useEffect(() => {
    checkScrollPosition();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScrollPosition);
      return () => container.removeEventListener('scroll', checkScrollPosition);
    }
  }, [pursuits]);

  const scrollToDirection = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 320; // Width of one column + gap
      const currentScroll = scrollContainerRef.current.scrollLeft;
      const newScroll = direction === 'left' 
        ? currentScroll - scrollAmount 
        : currentScroll + scrollAmount;
      
      scrollContainerRef.current.scrollTo({
        left: newScroll,
        behavior: 'smooth'
      });
    }
  };

  const handleAskAI = async (pursuit: Pursuit) => {
    setAiProcessing({ pursuitId: pursuit.id, title: pursuit.title });
    try {
      await onAskAI(pursuit);
      setTimeout(() => {
        setAiProcessing(null);
      }, 3000);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('AI processing error:', error);
      setAiProcessing(null);
    }
  };

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

      <div className="relative">
      {/* Left scroll indicator */}
      {canScrollLeft && (
        <button
          onClick={() => scrollToDirection('left')}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white border border-gray-200 rounded-full p-2 shadow-lg transition-all duration-200 hover:shadow-xl"
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-4 h-4 text-gray-600" />
        </button>
      )}

      {/* Right scroll indicator */}
      {canScrollRight && (
        <button
          onClick={() => scrollToDirection('right')}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white border border-gray-200 rounded-full p-2 shadow-lg transition-all duration-200 hover:shadow-xl"
          aria-label="Scroll right"
        >
          <ChevronRight className="w-4 h-4 text-gray-600" />
        </button>
      )}

      {/* Scroll container with gradient fade */}
      <div 
        ref={scrollContainerRef}
        className="flex gap-4 p-4 pb-6 overflow-auto h-[calc(100vh-280px)] min-h-[600px] scrollbar-thin scrollbar-track-gray-100 scrollbar-thumb-gray-300 relative"
        style={{
          background: canScrollRight 
            ? 'linear-gradient(to right, transparent 0%, transparent 85%, rgba(0,0,0,0.05) 100%)'
            : 'transparent'
        }}
      >
        {STAGES.map((stage) => (
        <div
          key={stage.id}
          className="flex-shrink-0 w-80 bg-gray-50 rounded-lg p-4"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-sm font-medium ${stage.color}`}>{stage.title}</h3>
            <span className="text-xs text-gray-500">
              {getPursuitsForStage(stage.id).length}
            </span>
          </div>
          
          <div className="space-y-3">
            {getPursuitsForStage(stage.id).map((pursuit) => {
              const isHighlighted = highlightedPursuitId === pursuit.id;
              const isFadingOut = fadingOutPursuitId === pursuit.id;
              const isOverduePursuit = isOverdue(pursuit.dueDate);
              return (
                <div
                  key={pursuit.id}
                  ref={isHighlighted ? highlightedCardRef : null}
                  className={`p-4 rounded-lg shadow-sm border cursor-pointer ${
                    isHighlighted 
                      ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-400 border-2' 
                      : isOverduePursuit
                      ? 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-600 border-l-4 hover:border-red-400 dark:hover:border-red-500'
                      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-600'
                  }`}
                  style={{
                    transition: 'all 0.5s ease-out',
                    ...(isFadingOut && {
                      backgroundColor: 'white',
                      borderColor: '#e5e7eb'
                    })
                  }}
                  onClick={() => onPursuitSelect(pursuit)}
                >
                <div className="flex items-start justify-between">
                  <h4 className={`font-medium text-sm ${
                    isOverduePursuit 
                      ? 'text-gray-900 dark:text-gray-100' 
                      : 'text-gray-900 dark:text-gray-100'
                  }`}>{pursuit.title}</h4>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAskAI(pursuit);
                      }}
                      className="p-1.5 rounded-full text-emerald-600 hover:bg-emerald-100 transition-all"
                      title="Ask BizRadar AI"
                      disabled={aiProcessing?.pursuitId === pursuit.id}
                    >
                      <Bot size={16} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(pursuit.id);
                      }}
                      className="p-1.5 rounded-full text-gray-400 hover:bg-red-100 hover:text-red-600 transition-all"
                      title="Delete Pursuit"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                
                <p className={`text-xs mt-1 line-clamp-2 ${
                  isOverduePursuit 
                    ? 'text-gray-600 dark:text-gray-300' 
                    : 'text-gray-500 dark:text-gray-400'
                }`}>
                  {pursuit.description}
                </p>
                
                <div className="mt-3 flex items-center justify-between">
                  <div className={`text-xs ${
                    isOverduePursuit 
                      ? 'text-red-700 dark:text-red-400 font-bold' 
                      : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    Due: {formatDate(pursuit.dueDate)}
                  </div>
                  {renderRfpActionButton(pursuit)}
                </div>
              </div>
              );
            })}
          </div>
        </div>
        ))}
      </div>
    </div>
    </>
  );
}; 