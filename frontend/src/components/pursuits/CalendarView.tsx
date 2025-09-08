import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Pursuit } from './types';

interface CalendarViewProps {
  pursuits: Pursuit[];
  onPursuitSelect: (pursuit: Pursuit) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({
  pursuits,
  onPursuitSelect,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());

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

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDayOfMonth = getFirstDayOfMonth(currentDate);
    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="h-24 border border-gray-200 bg-gray-50" />);
    }

    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const pursuitsForDay = getPursuitsForDate(date);

      days.push(
        <div key={day} className="h-24 border border-gray-200 p-2 overflow-y-auto">
          <div className="text-sm font-medium text-gray-900 mb-1">{day}</div>
          <div className="space-y-1">
            {pursuitsForDay.map((pursuit) => (
              <div
                key={pursuit.id}
                className="text-xs p-1 bg-blue-50 text-blue-700 rounded cursor-pointer hover:bg-blue-100 transition-colors"
                onClick={() => onPursuitSelect(pursuit)}
              >
                {pursuit.title}
              </div>
            ))}
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
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-semibold">
          {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </h2>
        <button
          onClick={() => changeMonth(1)}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-px bg-gray-200">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="bg-white p-2 text-center text-sm font-medium text-gray-500">
            {day}
          </div>
        ))}
        {renderCalendar()}
      </div>
    </div>
  );
};

export default CalendarView; 