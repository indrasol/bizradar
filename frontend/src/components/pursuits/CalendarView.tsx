import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Pursuit } from './types';

interface CalendarViewProps {
  pursuits: Pursuit[];
  onPursuitSelect: (pursuit: Pursuit) => void;
  highlightedPursuitId?: string | null;
  fadingOutPursuitId?: string | null;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  pursuits,
  onPursuitSelect,
  highlightedPursuitId,
  fadingOutPursuitId,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const highlightedPursuitRef = useRef<HTMLDivElement>(null);

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getPursuitsForDate = (date: Date) => {
    return pursuits.filter(pursuit => {
      const pursuitDate = new Date(pursuit.dueDate);
      return (
        pursuitDate.getDate() === date.getDate() &&
        pursuitDate.getMonth() === date.getMonth() &&
        pursuitDate.getFullYear() === date.getFullYear()
      );
    });
  };

  // Auto-scroll to highlighted pursuit when it's available
  useEffect(() => {
    if (highlightedPursuitId && highlightedPursuitRef.current) {
      setTimeout(() => {
        highlightedPursuitRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }, 100);
    }
  }, [highlightedPursuitId, pursuits]);

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDayOfMonth = getFirstDayOfMonth(currentDate);
    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="h-24 border border-border bg-muted/40" />);
    }

    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const pursuitsForDay = getPursuitsForDate(date);

      days.push(
        <div key={day} className="h-24 border border-border p-2 overflow-y-auto bg-background">
          <div className="text-sm font-medium text-foreground mb-1">{day}</div>
          <div className="space-y-1">
            {pursuitsForDay.map((pursuit) => {
              const isHighlighted = highlightedPursuitId === pursuit.id;
              const isFadingOut = fadingOutPursuitId === pursuit.id;
              return (
                <div
                  key={pursuit.id}
                  ref={isHighlighted ? highlightedPursuitRef : null}
                  className={`text-xs p-1 rounded cursor-pointer ${
                    isHighlighted 
                      ? 'bg-blue-200 dark:bg-blue-800/60 text-blue-900 dark:text-blue-100 border border-blue-400 dark:border-blue-600' 
                      : 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50'
                  }`}
                  style={{
                    transition: 'all 0.5s ease-out',
                    ...(isFadingOut && {
                      backgroundColor: '#dbeafe',
                      borderColor: 'transparent',
                      color: '#1e40af'
                    })
                  }}
                  onClick={() => onPursuitSelect(pursuit)}
                >
                  {pursuit.title}
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    return days;
  };

  const changeMonth = (delta: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + delta, 1));
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => changeMonth(-1)}
          className="p-2 hover:bg-muted rounded-full transition-colors text-foreground"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-semibold text-foreground">
          {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </h2>
        <button
          onClick={() => changeMonth(1)}
          className="p-2 hover:bg-muted rounded-full transition-colors text-foreground"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-px bg-border">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="bg-card p-2 text-center text-sm font-medium text-muted-foreground">
            {day}
          </div>
        ))}
        {renderCalendar()}
      </div>
    </div>
  );
}; 