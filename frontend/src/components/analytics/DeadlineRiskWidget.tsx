import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  TrendingUp,
  Calendar,
  Target,
  ChevronDown,
  ExternalLink,
  Eye
} from 'lucide-react';
import { useAuth } from '../Auth/useAuth';
import { toast } from 'sonner';
import { supabase } from '../../utils/supabase';
import { trackersApi, DeadlineItem } from '../../api/trackers';

interface RiskLevel {
  level: 'low' | 'medium' | 'high' | 'critical';
  color: string;
  bgColor: string;
  textColor: string;
  icon: React.ReactNode;
  description: string;
}

interface RiskAssessment {
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  overdue: number;
  riskScore: number; // 0-100, higher = more risk
}

interface DeadlineRiskWidgetProps {
  className?: string;
}

const DeadlineRiskWidget: React.FC<DeadlineRiskWidgetProps> = ({ className = '' }) => {
  const { user } = useAuth();
  const [deadlines, setDeadlines] = useState<DeadlineItem[]>([]);
  const [riskAssessment, setRiskAssessment] = useState<RiskAssessment>({
    total: 0,
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    overdue: 0,
    riskScore: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState<number>(30);
  const [showDropdown, setShowDropdown] = useState(false);

  const timeframeOptions = [
    { value: 7, label: '7 days' },
    { value: 14, label: '14 days' },
    { value: 30, label: '30 days' },
    { value: 60, label: '60 days' }
  ];

  // Risk level definitions
  const riskLevels: Record<string, RiskLevel> = {
    critical: {
      level: 'critical',
      color: 'red',
      bgColor: 'bg-red-100',
      textColor: 'text-red-700',
      icon: <AlertTriangle className="h-4 w-4" />,
      description: 'Due within 2 days or overdue'
    },
    high: {
      level: 'high',
      color: 'orange',
      bgColor: 'bg-orange-100',
      textColor: 'text-orange-700',
      icon: <Clock className="h-4 w-4" />,
      description: 'Due within 3-7 days'
    },
    medium: {
      level: 'medium',
      color: 'yellow',
      bgColor: 'bg-yellow-100',
      textColor: 'text-yellow-700',
      icon: <Target className="h-4 w-4" />,
      description: 'Due within 8-14 days'
    },
    low: {
      level: 'low',
      color: 'green',
      bgColor: 'bg-green-100',
      textColor: 'text-green-700',
      icon: <CheckCircle2 className="h-4 w-4" />,
      description: 'Due within 15+ days'
    }
  };

  // Calculate risk level for a deadline
  const calculateRiskLevel = (daysLeft: number): string => {
    if (daysLeft < 0) return 'critical'; // Overdue
    if (daysLeft <= 2) return 'critical';
    if (daysLeft <= 7) return 'high';
    if (daysLeft <= 14) return 'medium';
    return 'low';
  };

  // Calculate overall risk score (0-100)
  const calculateRiskScore = (assessment: Omit<RiskAssessment, 'riskScore'>): number => {
    if (assessment.total === 0) return 0;
    
    const criticalWeight = 4;
    const highWeight = 3;
    const mediumWeight = 2;
    const lowWeight = 1;
    
    const weightedScore = (assessment.critical * criticalWeight) + 
                        (assessment.high * highWeight) + 
                        (assessment.medium * mediumWeight) + 
                        (assessment.low * lowWeight);
    
    const maxPossibleScore = assessment.total * criticalWeight;
    return Math.round((weightedScore / maxPossibleScore) * 100);
  };

  // Fetch deadlines and calculate risk assessment
  const fetchDeadlinesAndAssess = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      
      // Fetch deadlines for the selected timeframe
      const response = await trackersApi.getDeadlines(selectedTimeframe);
      
      if (response.success) {
        const allDeadlines = response.deadlines;
        setDeadlines(allDeadlines);

        // Calculate risk assessment
        const assessment = {
          total: allDeadlines.length,
          critical: 0,
          high: 0,
          medium: 0,
          low: 0,
          overdue: 0
        };

        allDeadlines.forEach(deadline => {
          const riskLevel = calculateRiskLevel(deadline.daysLeft);
          assessment[riskLevel]++;
          if (deadline.daysLeft < 0) assessment.overdue++;
        });

        const riskScore = calculateRiskScore(assessment);
        
        setRiskAssessment({
          ...assessment,
          riskScore
        });
      } else {
        console.warn('API returned success=false:', response.message);
        setDeadlines([]);
        setRiskAssessment({
          total: 0,
          critical: 0,
          high: 0,
          medium: 0,
          low: 0,
          overdue: 0,
          riskScore: 0
        });
      }
      
    } catch (error) {
      console.error('Error fetching deadlines:', error);
      toast.error('Failed to load deadline risk assessment');
      setDeadlines([]);
      setRiskAssessment({
        total: 0,
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        overdue: 0,
        riskScore: 0
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Get risk score color
  const getRiskScoreColor = (score: number): string => {
    if (score >= 75) return 'text-red-600';
    if (score >= 50) return 'text-orange-600';
    if (score >= 25) return 'text-yellow-600';
    return 'text-green-600';
  };

  // Get risk score background
  const getRiskScoreBg = (score: number): string => {
    if (score >= 75) return 'bg-red-100';
    if (score >= 50) return 'bg-orange-100';
    if (score >= 25) return 'bg-yellow-100';
    return 'bg-green-100';
  };

  // Handle view pursuit
  const handleViewPursuit = (oppId: string) => {
    window.open(`/trackers?highlight=${oppId}`, '_blank');
  };

  useEffect(() => {
    fetchDeadlinesAndAssess();
  }, [user, selectedTimeframe]);

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-100 text-red-600 rounded-lg">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Deadline Risk Assessment
              </h2>
              <p className="text-sm text-gray-600">
                Monitor and prioritize upcoming deadlines
              </p>
            </div>
          </div>
          
          {/* Timeframe Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              Next {selectedTimeframe} days
              <ChevronDown className="ml-2 h-4 w-4" />
            </button>
            
            {showDropdown && (
              <div className="absolute top-full right-0 mt-1 w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                {timeframeOptions.map(option => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setSelectedTimeframe(option.value);
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

      {/* Content */}
      <div className="p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            {/* Risk Score Overview */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-md font-semibold text-gray-900">Overall Risk Score</h3>
                <div className={`px-3 py-1 rounded-full text-sm font-bold ${getRiskScoreBg(riskAssessment.riskScore)} ${getRiskScoreColor(riskAssessment.riskScore)}`}>
                  {riskAssessment.riskScore}/100
                </div>
              </div>
              
              {/* Risk Score Bar */}
              <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                <div 
                  className={`h-3 rounded-full transition-all duration-500 ${
                    riskAssessment.riskScore >= 75 ? 'bg-red-500' :
                    riskAssessment.riskScore >= 50 ? 'bg-orange-500' :
                    riskAssessment.riskScore >= 25 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${riskAssessment.riskScore}%` }}
                ></div>
              </div>
              
              <p className="text-sm text-gray-600">
                {riskAssessment.riskScore >= 75 ? 'High risk - Immediate attention needed' :
                 riskAssessment.riskScore >= 50 ? 'Medium risk - Monitor closely' :
                 riskAssessment.riskScore >= 25 ? 'Low risk - Good progress' : 'Very low risk - On track'}
              </p>
            </div>

            {/* Risk Breakdown */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {Object.entries(riskLevels).map(([key, level]) => {
                const count = riskAssessment[key as keyof RiskAssessment] as number;
                const percentage = riskAssessment.total > 0 ? Math.round((count / riskAssessment.total) * 100) : 0;
                
                return (
                  <div key={key} className={`p-4 rounded-lg border ${level.bgColor} border-${level.color}-200`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className={`p-2 rounded-lg ${level.bgColor}`}>
                        {level.icon}
                      </div>
                      <span className={`text-2xl font-bold ${level.textColor}`}>
                        {count}
                      </span>
                    </div>
                    <div className="text-sm font-medium text-gray-700 capitalize">
                      {level.level} Risk
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      {percentage}% of total
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Critical Deadlines List */}
            {riskAssessment.critical > 0 && (
              <div className="mb-6">
                <h3 className="text-md font-semibold text-gray-900 mb-3 flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-2 text-red-500" />
                  Critical Deadlines ({riskAssessment.critical})
                </h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {deadlines
                    .filter(d => calculateRiskLevel(d.daysLeft) === 'critical')
                    .map(deadline => (
                      <div key={deadline.oppId} className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {deadline.title}
                          </h4>
                          <div className="flex items-center text-xs text-gray-600 mt-1">
                            <Calendar className="h-3 w-3 mr-1" />
                            <span>
                              {deadline.daysLeft < 0 ? `Overdue by ${Math.abs(deadline.daysLeft)} days` :
                               deadline.daysLeft === 0 ? 'Due today' :
                               `Due in ${deadline.daysLeft} days`}
                            </span>
                            <span className="mx-2">•</span>
                            <span>{deadline.agency}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleViewPursuit(deadline.oppId)}
                          className="ml-3 p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{riskAssessment.total}</div>
                <div className="text-sm text-gray-600">Total Deadlines</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{riskAssessment.overdue}</div>
                <div className="text-sm text-gray-600">Overdue</div>
              </div>
              <div className="text-center col-span-2 md:col-span-1">
                <div className="text-2xl font-bold text-blue-600">
                  {riskAssessment.total > 0 ? Math.round(((riskAssessment.total - riskAssessment.overdue) / riskAssessment.total) * 100) : 0}%
                </div>
                <div className="text-sm text-gray-600">On Track</div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DeadlineRiskWidget;
