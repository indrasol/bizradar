import React, { useState, useRef, useEffect } from 'react';
import { Search, Filter, ChevronDown, Check, ArrowUpDown, Calendar, Clock } from 'lucide-react';

interface SearchAndActionsProps {
  onSearch: (query: string) => void;
  onNewTracker?: () => void; // Made optional since we're removing it
}

export const SearchAndActions: React.FC<SearchAndActionsProps> = ({
  onSearch,
}) => {
  const [dueDateFilter, setDueDateFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('due_date');
  const [dueDateDropdownOpen, setDueDateDropdownOpen] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  
  const dueDateDropdownRef = useRef<HTMLDivElement>(null);
  const statusDropdownRef = useRef<HTMLDivElement>(null);
  const sortDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dueDateDropdownRef.current && !dueDateDropdownRef.current.contains(event.target as Node)) {
        setDueDateDropdownOpen(false);
      }
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node)) {
        setStatusDropdownOpen(false);
      }
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target as Node)) {
        setSortDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const dueDateOptions = [
    { value: 'all', label: 'All Due Dates' },
    { value: 'overdue', label: 'Overdue' },
    { value: 'this_week', label: 'Due This Week' },
    { value: 'next_week', label: 'Due Next Week' },
    { value: 'this_month', label: 'Due This Month' }
  ];

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'submitted', label: 'Submitted' },
    { value: 'draft', label: 'Draft' }
  ];

  const sortOptions = [
    { value: 'due_date', label: 'Due Date' },
    { value: 'created_at', label: 'Date Created' },
    { value: 'title', label: 'Title A-Z' },
    { value: 'stage', label: 'Stage' }
  ];

  const getSelectedLabel = (value: string, options: { value: string; label: string }[]) => {
    return options.find(option => option.value === value)?.label || 'Select';
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 border-b border-gray-200 bg-white gap-4">
      <div className="relative flex-1 max-w-md">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search size={18} className="text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search trackers..."
          className="w-full pl-12 pr-12 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-transparent transition-all shadow-sm bg-gray-50"
          onChange={(e) => onSearch(e.target.value)}
        />
      </div>
      
      <div className="flex items-center gap-3 flex-wrap">
        {/* Due Date Filter */}
        <div className="relative" ref={dueDateDropdownRef}>
          <button
            onClick={() => setDueDateDropdownOpen(!dueDateDropdownOpen)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors min-w-[140px] justify-between"
          >
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span>{getSelectedLabel(dueDateFilter, dueDateOptions)}</span>
            </div>
            <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${dueDateDropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          
          {dueDateDropdownOpen && (
            <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-10 py-1">
              {dueDateOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    setDueDateFilter(option.value);
                    setDueDateDropdownOpen(false);
                  }}
                  className="w-full px-4 py-2 text-sm text-left hover:bg-gray-50 flex items-center justify-between transition-colors"
                >
                  <span>{option.label}</span>
                  {dueDateFilter === option.value && <Check className="h-4 w-4 text-blue-600" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Status Filter */}
        <div className="relative" ref={statusDropdownRef}>
          <button
            onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors min-w-[120px] justify-between"
          >
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <span>{getSelectedLabel(statusFilter, statusOptions)}</span>
            </div>
            <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${statusDropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          
          {statusDropdownOpen && (
            <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-10 py-1">
              {statusOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    setStatusFilter(option.value);
                    setStatusDropdownOpen(false);
                  }}
                  className="w-full px-4 py-2 text-sm text-left hover:bg-gray-50 flex items-center justify-between transition-colors"
                >
                  <span>{option.label}</span>
                  {statusFilter === option.value && <Check className="h-4 w-4 text-blue-600" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Sort By */}
        <div className="relative" ref={sortDropdownRef}>
          <button
            onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors min-w-[130px] justify-between"
          >
            <div className="flex items-center gap-2">
              <ArrowUpDown className="h-4 w-4 text-gray-500" />
              <span>{getSelectedLabel(sortBy, sortOptions)}</span>
            </div>
            <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${sortDropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          
          {sortDropdownOpen && (
            <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-10 py-1">
              {sortOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    setSortBy(option.value);
                    setSortDropdownOpen(false);
                  }}
                  className="w-full px-4 py-2 text-sm text-left hover:bg-gray-50 flex items-center justify-between transition-colors"
                >
                  <span>{option.label}</span>
                  {sortBy === option.value && <Check className="h-4 w-4 text-blue-600" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 