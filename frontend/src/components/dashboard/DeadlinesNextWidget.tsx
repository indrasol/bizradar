import React, { useState, useEffect } from 'react';
import {
  Clock,
  ChevronDown,
  Calendar,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Shield,
  Eye,
  CalendarPlus,
  UserCheck,
  ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../Auth/useAuth';
import { toast } from 'sonner';
import { trackersApi, DeadlineItem } from '../../api/trackers';

// Use the DeadlineItem type from the API
type DeadlineRow = DeadlineItem;

interface DeadlinesNextWidgetProps {
  className?: string;
}

const DeadlinesNextWidget: React.FC<DeadlinesNextWidgetProps> = ({ className = '' }) => {
  const { user } = useAuth();
  const [selectedDays, setSelectedDays] = useState<number>(7);
  const [deadlines, setDeadlines] = useState<DeadlineRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);

  // Days options for dropdown
  const daysOptions = [
    { value: 7, label: '7 days' },
    { value: 14, label: '14 days' },
    { value: 28, label: '28 days' }
  ];

  // Remove type filtering - display all deadlines by due date only

  // Calculate days left and color coding based on the daysLeft from API
  const getDaysLeftInfo = (daysLeft: number) => {
    let colorClass = 'text-gray-600';
    let bgClass = 'bg-gray-100';
    let label = '';

    if (daysLeft < 0) {
      colorClass = 'text-red-700';
      bgClass = 'bg-red-100';
      label = 'Overdue';
    } else if (daysLeft === 0) {
      colorClass = 'text-red-700';
      bgClass = 'bg-red-100';
      label = 'Due today';
    } else if (daysLeft <= 2) {
      colorClass = 'text-red-700';
      bgClass = 'bg-red-100';
      label = `in ${daysLeft}d`;
    } else if (daysLeft <= 7) {
      colorClass = 'text-amber-700';
      bgClass = 'bg-amber-100';
      label = `in ${daysLeft}d`;
    } else {
      colorClass = 'text-gray-600';
      bgClass = 'bg-gray-100';
      label = `in ${daysLeft}d`;
    }

    return { daysLeft, colorClass, bgClass, label };
  };

  // Fetch deadlines data using the API
  const fetchDeadlines = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      
      // Use the new trackers API to fetch deadlines (no type filtering)
      const response = await trackersApi.getDeadlines(selectedDays);
      
      if (response.success) {
        setDeadlines(response.deadlines);
        console.log(`Fetched ${response.deadlines.length} deadlines for next ${selectedDays} days`);
      } else {
        console.warn('API returned success=false:', response.message);
        setDeadlines([]);
      }
      
    } catch (error) {
      console.error('Error fetching deadlines:', error);
      toast.error('Failed to load deadlines from your tracker');
      setDeadlines([]); // Set empty array on error
    } finally {
      setIsLoading(false);
    }
  };

  // Since API handles filtering and we removed type filtering, use all deadlines
  const filteredDeadlines = deadlines;

  // Quick actions
  const handleViewPursuit = (oppId: string) => {
    // Navigate to pursuits page with the specific pursuit highlighted
    window.open(`/pursuits?highlight=${oppId}`, '_blank');
  };

  const handleAddToCalendar = (deadline: DeadlineRow) => {
    // Use the API helper to create calendar URL
    const calendarUrl = trackersApi.createCalendarUrl(deadline);
    window.open(calendarUrl, '_blank');
  };

  const handleMarkSubmitted = async (oppId: string) => {
    try {
      // Use the API to mark as submitted
      const response = await trackersApi.markAsSubmitted(oppId);
      
      if (response.success) {
        toast.success('Marked as submitted');
        fetchDeadlines(); // Refresh data
      } else {
        throw new Error(response.message || 'Failed to mark as submitted');
      }
    } catch (error) {
      console.error('Error marking as submitted:', error);
      toast.error('Failed to mark as submitted');
    }
  };


  // Effects
  useEffect(() => {
    fetchDeadlines();
  }, [user, selectedDays]);

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-50 text-blue-500 rounded-lg">
              <Clock className="h-5 w-5" />
            </div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-semibold text-gray-700">
                Deadlines Next
              </h2>
              
              {/* Days Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  {selectedDays} days
                  <ChevronDown className="ml-1 h-4 w-4" />
                </button>
                
                {showDropdown && (
                  <div className="absolute top-full left-0 mt-1 w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                    {daysOptions.map(option => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setSelectedDays(option.value);
                          setShowDropdown(false);
                        }}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
            </div>
          </div>
        </div>

        {/* Removed type tabs - displaying all deadlines by due date only */}
      </div>

      {/* Content */}
      <div className="max-h-96 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredDeadlines.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <Clock className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm">No upcoming deadlines in the next {selectedDays} days</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredDeadlines.map((deadline, index) => {
              const daysInfo = getDaysLeftInfo(deadline.daysLeft);
              
              return (
                <div key={deadline.oppId} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      {/* Title and Agency */}
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-gray-900 truncate">
                            {deadline.title}
                          </h3>
                          <div className="flex items-center text-xs text-gray-500 mt-1">
                            <Shield className="h-3 w-3 mr-1" />
                            <span className="truncate">{deadline.agency}</span>
                            <span className="mx-1">•</span>
                            <span>{deadline.solicitation}</span>
                          </div>
                        </div>
                        
                        {/* Days Left Badge */}
                        <div className={`ml-3 px-2 py-1 rounded-full text-xs font-medium ${daysInfo.bgClass} ${daysInfo.colorClass}`}>
                          {daysInfo.label}
                        </div>
                      </div>

                      {/* Owner info only (removed type badge) */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {deadline.owner && (
                            <div className="flex items-center text-xs text-gray-500">
                              <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-medium mr-1">
                                {deadline.owner.name.charAt(0)}
                              </div>
                              <span>{deadline.owner.name}</span>
                            </div>
                          )}
                        </div>

                        {/* Quick Actions */}
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => handleViewPursuit(deadline.oppId)}
                            className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded transition-colors"
                            title="View"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleAddToCalendar(deadline)}
                            className="p-1.5 text-gray-400 hover:text-green-500 hover:bg-green-50 rounded transition-colors"
                            title="Add to Calendar"
                          >
                            <CalendarPlus className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleMarkSubmitted(deadline.oppId)}
                            className="p-1.5 text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 rounded transition-colors"
                            title="Mark Submitted"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      {filteredDeadlines.length > 0 && (
        <div className="px-6 py-3 border-t border-gray-100 bg-gray-50">
          <div className="flex items-center justify-between">
            <Link
              to="/pursuits"
              className="text-blue-600 hover:text-blue-800 text-sm font-medium inline-flex items-center"
            >
              View all pursuits
              <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
            <button
              onClick={() => {
                // Use the API helper to download .ics file
                trackersApi.downloadIcsFile(filteredDeadlines);
              }}
              className="text-gray-600 hover:text-gray-800 text-sm font-medium"
            >
              Bulk export .ics
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeadlinesNextWidget;
