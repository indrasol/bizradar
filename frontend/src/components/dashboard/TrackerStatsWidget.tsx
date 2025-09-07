import React, { useState, useEffect } from 'react';
import {
  Clock,
  AlertTriangle,
  CheckCircle2,
  Target,
  Calendar,
  TrendingUp
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../Auth/useAuth';
import { toast } from 'sonner';
import { trackersApi, TrackerStats } from '../../api/trackers';

interface TrackerStatsWidgetProps {
  className?: string;
}

const TrackerStatsWidget: React.FC<TrackerStatsWidgetProps> = ({ className = '' }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState<TrackerStats>({
    total: 0,
    active: 0,
    submitted: 0,
    overdue: 0,
    due_this_week: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  // Fetch tracker stats
  const fetchStats = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const response = await trackersApi.getStats();
      
      if (response.success) {
        setStats(response.stats);
        console.log('Fetched tracker stats:', response.stats);
      } else {
        console.warn('API returned success=false');
        setStats({
          total: 0,
          active: 0,
          submitted: 0,
          overdue: 0,
          due_this_week: 0
        });
      }
      
    } catch (error) {
      console.error('Error fetching tracker stats:', error);
      toast.error('Failed to load tracker statistics');
      setStats({
        total: 0,
        active: 0,
        submitted: 0,
        overdue: 0,
        due_this_week: 0
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [user]);

  // Calculate completion percentage
  const completionPercentage = stats.total > 0 
    ? Math.round((stats.submitted / stats.total) * 100) 
    : 0;

  return (
    <div className={`bg-white p-6 rounded-xl shadow-md border border-gray-200 transition-all hover:shadow-lg ${className}`}>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold text-gray-700 flex items-center">
          <Target className="h-5 w-5 mr-2 text-blue-500" />
          Tracker Summary
        </h2>
        {stats.overdue > 0 ? (
          <div className="p-2 bg-red-100 text-red-800 rounded-lg">
            <AlertTriangle className="h-5 w-5" />
          </div>
        ) : (
          <div className="p-2 bg-gray-100 text-gray-500 rounded-lg">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          {/* Main stats display */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {/* Total trackers */}
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">
                {stats.total}
              </div>
              <div className="text-sm text-gray-500 font-medium">
                Total Trackers
              </div>
            </div>

            {/* Active trackers */}
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {stats.active}
              </div>
              <div className="text-sm text-gray-500 font-medium">
                Active
              </div>
            </div>
          </div>

          {/* Status indicators */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              {stats.submitted > 0 && (
                <div className="flex items-center text-sm font-medium text-green-600 bg-green-50 px-2 py-1 rounded-lg">
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  <span>{stats.submitted} Submitted</span>
                </div>
              )}

              {stats.due_this_week > 0 && (
                <div className="flex items-center text-sm font-medium text-yellow-600 bg-yellow-50 px-2 py-1 rounded-lg">
                  <Calendar className="h-4 w-4 mr-1" />
                  <span>{stats.due_this_week} Due This Week</span>
                </div>
              )}

              {stats.overdue > 0 && (
                <div className="flex items-center text-sm font-medium text-red-600 bg-red-50 px-2 py-1 rounded-lg">
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  <span>{stats.overdue} Overdue</span>
                </div>
              )}
            </div>
          </div>

          {/* Progress bar */}
          <div className="space-y-2">
            <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-300"
                style={{ width: `${completionPercentage}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>{stats.submitted} Completed</span>
              <span>{completionPercentage}% Complete</span>
              <span>{stats.active} Remaining</span>
            </div>
          </div>

          {/* Quick stats grid */}
          {(stats.overdue > 0 || stats.due_this_week > 0) && (
            <div className="mt-4 grid grid-cols-2 gap-3">
              {stats.overdue > 0 && (
                <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex items-center">
                    <AlertTriangle className="h-4 w-4 text-red-500 mr-2" />
                    <div>
                      <div className="text-lg font-bold text-red-700">{stats.overdue}</div>
                      <div className="text-xs text-red-600">Overdue</div>
                    </div>
                  </div>
                </div>
              )}

              {stats.due_this_week > 0 && (
                <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 text-yellow-500 mr-2" />
                    <div>
                      <div className="text-lg font-bold text-yellow-700">{stats.due_this_week}</div>
                      <div className="text-xs text-yellow-600">Due This Week</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Link to trackers page */}
          <div className="mt-4 text-center">
            <Link
              to="/pursuits"
              className="text-blue-600 hover:text-blue-800 text-sm font-medium inline-flex items-center transition-colors"
            >
              <TrendingUp className="h-4 w-4 mr-1" />
              View all trackers
            </Link>
          </div>
        </>
      )}
    </div>
  );
};

export default TrackerStatsWidget;
