import React from 'react';
import { Search, Plus } from 'lucide-react';

interface SearchAndActionsProps {
  onSearch: (query: string) => void;
  onNewPursuit: () => void;
}

export const SearchAndActions: React.FC<SearchAndActionsProps> = ({
  onSearch,
  onNewPursuit,
}) => {
  return (
    <div className="flex items-center justify-between p-5 border-b border-gray-200 bg-white">
      <div className="relative flex-1 max-w-md">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search size={18} className="text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search pursuits..."
          className="w-full pl-12 pr-12 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-transparent transition-all shadow-sm bg-gray-50"
          onChange={(e) => onSearch(e.target.value)}
        />
      </div>
      
      <div className="flex items-center gap-3 ml-4">
        <button 
          onClick={onNewPursuit}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg shadow-sm transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>New Pursuit</span>
        </button>
      </div>
    </div>
  );
}; 