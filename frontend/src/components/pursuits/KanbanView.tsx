import React, { useEffect, useRef, useState } from 'react';
import { Bot, PenLine, CheckCircle, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Pursuit } from './types';

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
  { id: 'Assessment', title: 'Assessment', color: 'bg-orange-100 text-orange-800' },
  { id: 'Planning', title: 'Planning', color: 'bg-blue-100 text-blue-800' },
  { id: 'Implementation', title: 'Implementation', color: 'bg-purple-100 text-purple-800' },
  { id: 'Review', title: 'Review', color: 'bg-indigo-100 text-indigo-800' },
  { id: 'RFP Response Completed', title: 'Completed', color: 'bg-green-100 text-green-800' },
];

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

  const getPursuitsForStage = (stageId: string) => {
    return pursuits.filter(pursuit => pursuit.stage === stageId);
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

  return (
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
              return (
                <div
                  key={pursuit.id}
                  ref={isHighlighted ? highlightedCardRef : null}
                  className={`p-4 rounded-lg shadow-sm border cursor-pointer ${
                    isHighlighted 
                      ? 'bg-blue-100 border-blue-400 border-2' 
                      : 'bg-white border-gray-200 hover:border-blue-200'
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
                  <h4 className="font-medium text-sm text-gray-900">{pursuit.title}</h4>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onAskAI(pursuit);
                      }}
                      className="p-1.5 rounded-full text-emerald-600 hover:bg-emerald-100 transition-all"
                      title="Ask BizRadar AI"
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
                
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                  {pursuit.description}
                </p>
                
                <div className="mt-3 flex items-center justify-between">
                  <div className="text-xs text-gray-500">
                    Due: {pursuit.dueDate}
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
  );
}; 