import React from 'react';

export type ViewType = 'list' | 'kanban' | 'calendar';

interface ViewSelectorProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
}

export const ViewSelector: React.FC<ViewSelectorProps> = ({
  currentView,
  onViewChange,
}) => {
  return (
    <div className="flex border-b border-gray-200 bg-white px-4">
      <button 
        className={`flex items-center justify-center py-3 px-6 font-medium rounded-t-lg transition-colors ${
          currentView === 'list' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
        }`}
        onClick={() => onViewChange('list')}
      >
        List
      </button>
      <button 
        className={`flex items-center justify-center py-3 px-6 font-medium rounded-t-lg transition-colors ${
          currentView === 'kanban' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
        }`}
        onClick={() => onViewChange('kanban')}
      >
        Kanban
      </button>
      <button 
        className={`flex items-center justify-center py-3 px-6 font-medium rounded-t-lg transition-colors ${
          currentView === 'calendar' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
        }`}
        onClick={() => onViewChange('calendar')}
      >
        Calendar
      </button>
    </div>
  );
}; 