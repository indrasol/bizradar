import React, { useState, useEffect } from 'react';
import {
  Target,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle2,
  Calendar,
  BarChart3,
  Award,
  Activity,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from 'lucide-react';
import { useAuth } from '../Auth/useAuth';
import { toast } from 'sonner';
import { supabase } from '../../utils/supabase';

interface PerformanceMetrics {
  totalOpportunities: number;
  submissionRate: number;
  averageCompletionTime: number;
  thisMonthActivity: number;
  lastMonthActivity: number;
  successRate: number;
  overdueCount: number;
  dueThisWeek: number;
  stageDistribution: {
    assessment: number;
    initiated: number;
    completed: number;
  };
  trends: {
    submissionRate: 'up' | 'down' | 'stable';
    activity: 'up' | 'down' | 'stable';
    completionTime: 'up' | 'down' | 'stable';
  };
}

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  textColor: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  trendValue,
  icon,
  color,
  bgColor,
  textColor
}) => {
  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <ArrowUpRight className="h-4 w-4 text-green-500" />;
      case 'down':
        return <ArrowDownRight className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className={`${bgColor} rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-all duration-300`}>
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${color}`}>
          {icon}
        </div>
        {trend && trendValue && (
          <div className={`flex items-center space-x-1 text-sm font-medium ${getTrendColor()}`}>
            {getTrendIcon()}
            <span>{trendValue}</span>
          </div>
        )}
      </div>
      
      <div className="mb-2">
        <div className={`text-3xl font-bold ${textColor}`}>
          {value}
        </div>
        <div className="text-sm font-medium text-gray-600">
          {title}
        </div>
      </div>
      
      {subtitle && (
        <div className="text-xs text-gray-500">
          {subtitle}
        </div>
      )}
    </div>
  );
};

interface PerformanceMetricsWidgetProps {
  className?: string;
}

const PerformanceMetricsWidget: React.FC<PerformanceMetricsWidgetProps> = ({ className = '' }) => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    totalOpportunities: 0,
    submissionRate: 0,
    averageCompletionTime: 0,
    thisMonthActivity: 0,
    lastMonthActivity: 0,
    successRate: 0,
    overdueCount: 0,
    dueThisWeek: 0,
    stageDistribution: {
      assessment: 0,
      initiated: 0,
      completed: 0
    },
    trends: {
      submissionRate: 'stable',
      activity: 'stable',
      completionTime: 'stable'
    }
  });
  const [isLoading, setIsLoading] = useState(true);

  // Calculate trends
  const calculateTrend = (current: number, previous: number): 'up' | 'down' | 'stable' => {
    if (previous === 0) return 'stable';
    const change = ((current - previous) / previous) * 100;
    if (Math.abs(change) < 5) return 'stable';
    return change > 0 ? 'up' : 'down';
  };

  // Format trend value
  const formatTrendValue = (current: number, previous: number): string => {
    if (previous === 0) return 'N/A';
    const change = ((current - previous) / previous) * 100;
    return `${Math.abs(change).toFixed(1)}%`;
  };

  // Calculate average completion time
  const calculateAverageCompletionTime = (trackers: any[]): number => {
    const completedTrackers = trackers.filter(t => t.is_submitted && t.created_at && t.updated_at);
    
    if (completedTrackers.length === 0) return 0;
    
    const totalDays = completedTrackers.reduce((sum, tracker) => {
      const created = new Date(tracker.created_at);
      const updated = new Date(tracker.updated_at);
      const daysDiff = Math.ceil((updated.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
      return sum + daysDiff;
    }, 0);
    
    return Math.round(totalDays / completedTrackers.length);
  };

  // Get current and previous month dates
  const getMonthDates = () => {
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    
    return {
      currentMonthStart: currentMonthStart.toISOString().split('T')[0],
      lastMonthStart: lastMonthStart.toISOString().split('T')[0],
      lastMonthEnd: lastMonthEnd.toISOString().split('T')[0]
    };
  };

  // Fetch and calculate metrics
  const fetchMetrics = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      
      // Get month dates
      const { currentMonthStart, lastMonthStart, lastMonthEnd } = getMonthDates();
      
      // Fetch all trackers for the user
      const { data: allTrackers, error: allError } = await supabase
        .from('trackers')
        .select('*')
        .eq('user_id', user.id);

      if (allError) throw allError;

      // Fetch current month trackers
      const { data: currentMonthTrackers, error: currentMonthError } = await supabase
        .from('trackers')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', currentMonthStart);

      if (currentMonthError) throw currentMonthError;

      // Fetch last month trackers
      const { data: lastMonthTrackers, error: lastMonthError } = await supabase
        .from('trackers')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', lastMonthStart)
        .lte('created_at', lastMonthEnd);

      if (lastMonthError) throw lastMonthError;

      // Calculate metrics
      const totalOpportunities = allTrackers?.length || 0;
      const submittedCount = allTrackers?.filter(t => t.is_submitted).length || 0;
      const submissionRate = totalOpportunities > 0 ? Math.round((submittedCount / totalOpportunities) * 100) : 0;
      
      const averageCompletionTime = calculateAverageCompletionTime(allTrackers || []);
      
      const thisMonthActivity = currentMonthTrackers?.length || 0;
      const lastMonthActivity = lastMonthTrackers?.length || 0;
      
      // Calculate overdue count
      const now = new Date();
      const overdueCount = allTrackers?.filter(t => {
        if (!t.due_date) return false;
        const dueDate = new Date(t.due_date);
        return dueDate < now && !t.is_submitted;
      }).length || 0;
      
      // Calculate due this week
      const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const dueThisWeek = allTrackers?.filter(t => {
        if (!t.due_date) return false;
        const dueDate = new Date(t.due_date);
        return dueDate >= now && dueDate <= weekFromNow && !t.is_submitted;
      }).length || 0;
      
      // Calculate stage distribution
      const stageDistribution = {
        assessment: allTrackers?.filter(t => t.stage === 'Assessment').length || 0,
        initiated: allTrackers?.filter(t => t.stage === 'RFP Response Initiated').length || 0,
        completed: allTrackers?.filter(t => t.stage === 'RFP Response Completed').length || 0
      };
      
      // Calculate trends
      const trends = {
        submissionRate: calculateTrend(submissionRate, 0), // We'd need historical data for real trends
        activity: calculateTrend(thisMonthActivity, lastMonthActivity),
        completionTime: calculateTrend(averageCompletionTime, 0) // We'd need historical data for real trends
      };
      
      // Calculate success rate (submitted vs total)
      const successRate = submissionRate; // Same as submission rate for now
      
      setMetrics({
        totalOpportunities,
        submissionRate,
        averageCompletionTime,
        thisMonthActivity,
        lastMonthActivity,
        successRate,
        overdueCount,
        dueThisWeek,
        stageDistribution,
        trends
      });
      
    } catch (error) {
      console.error('Error fetching metrics:', error);
      toast.error('Failed to load performance metrics');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, [user]);

  if (isLoading) {
    return (
      <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${className}`}>
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
            <BarChart3 className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Performance Metrics
            </h2>
            <p className="text-sm text-gray-600">
              Key performance indicators and trends
            </p>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Opportunities */}
        <MetricCard
          title="Total Opportunities"
          value={metrics.totalOpportunities}
          subtitle="All tracked opportunities"
          icon={<Target className="h-6 w-6" />}
          color="bg-blue-100"
          bgColor="bg-blue-50"
          textColor="text-blue-700"
        />

        {/* Submission Rate */}
        <MetricCard
          title="Submission Rate"
          value={`${metrics.submissionRate}%`}
          subtitle="Successfully submitted"
          trend={metrics.trends.submissionRate}
          trendValue={metrics.trends.submissionRate === 'stable' ? 'N/A' : '5.2%'}
          icon={<CheckCircle2 className="h-6 w-6" />}
          color="bg-green-100"
          bgColor="bg-green-50"
          textColor="text-green-700"
        />

        {/* Average Completion Time */}
        <MetricCard
          title="Avg. Completion Time"
          value={`${metrics.averageCompletionTime} days`}
          subtitle="From start to submission"
          trend={metrics.trends.completionTime}
          trendValue={metrics.trends.completionTime === 'stable' ? 'N/A' : '2.1%'}
          icon={<Clock className="h-6 w-6" />}
          color="bg-purple-100"
          bgColor="bg-purple-50"
          textColor="text-purple-700"
        />

        {/* This Month's Activity */}
        <MetricCard
          title="This Month"
          value={metrics.thisMonthActivity}
          subtitle="New opportunities added"
          trend={metrics.trends.activity}
          trendValue={formatTrendValue(metrics.thisMonthActivity, metrics.lastMonthActivity)}
          icon={<Activity className="h-6 w-6" />}
          color="bg-orange-100"
          bgColor="bg-orange-50"
          textColor="text-orange-700"
        />

        {/* Success Rate */}
        <MetricCard
          title="Success Rate"
          value={`${metrics.successRate}%`}
          subtitle="Overall performance"
          icon={<Award className="h-6 w-6" />}
          color="bg-emerald-100"
          bgColor="bg-emerald-50"
          textColor="text-emerald-700"
        />

        {/* Overdue Count */}
        <MetricCard
          title="Overdue"
          value={metrics.overdueCount}
          subtitle="Past due date"
          icon={<Zap className="h-6 w-6" />}
          color="bg-red-100"
          bgColor="bg-red-50"
          textColor="text-red-700"
        />

        {/* Due This Week */}
        <MetricCard
          title="Due This Week"
          value={metrics.dueThisWeek}
          subtitle="Upcoming deadlines"
          icon={<Calendar className="h-6 w-6" />}
          color="bg-yellow-100"
          bgColor="bg-yellow-50"
          textColor="text-yellow-700"
        />

        {/* Stage Distribution - Assessment */}
        <MetricCard
          title="In Assessment"
          value={metrics.stageDistribution.assessment}
          subtitle="Initial review stage"
          icon={<Target className="h-6 w-6" />}
          color="bg-indigo-100"
          bgColor="bg-indigo-50"
          textColor="text-indigo-700"
        />
      </div>

      {/* Quick Stats Summary */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {metrics.stageDistribution.initiated}
            </div>
            <div className="text-sm text-gray-600">RFP Initiated</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {metrics.stageDistribution.completed}
            </div>
            <div className="text-sm text-gray-600">RFP Completed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {metrics.lastMonthActivity}
            </div>
            <div className="text-sm text-gray-600">Last Month</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceMetricsWidget;
