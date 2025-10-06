import React from 'react';
import { useRfpUsage } from '@/hooks/useRfpUsage';
import { Lock, AlertCircle, CheckCircle } from 'lucide-react';

interface RfpUsageLimitsProps {
  className?: string;
  compact?: boolean;
}

export const RfpUsageLimits: React.FC<RfpUsageLimitsProps> = ({ className = '', compact = false }) => {
  const { usageStatus, loading, error } = useRfpUsage();

  if (loading) {
    return (
      <div className={`text-sm flex items-center ${className}`}>
        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-2"></div>
        <span>Loading usage...</span>
      </div>
    );
  }

  if (error || !usageStatus) {
    return compact ? null : (
      <div className={`text-sm text-red-500 flex items-center ${className}`}>
        <AlertCircle className="w-4 h-4 mr-1" />
        <span>Could not load usage limits</span>
      </div>
    );
  }

  const { monthly_limit, current_usage, remaining, limit_reached } = usageStatus;

  if (compact) {
    return (
      <div className={`text-sm flex items-center ${className} ${limit_reached ? 'text-red-500' : 'text-gray-500'}`}>
        {limit_reached ? (
          <>
            <Lock className="w-4 h-4 mr-1" />
            <span>Limit reached</span>
          </>
        ) : (
          <>
            <span>{remaining} left</span>
          </>
        )}
      </div>
    );
  }

  return (
    <div className={`rounded-md p-2 ${className} ${limit_reached ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'}`}>
      <div className="flex items-center">
        {limit_reached ? (
          <Lock className="w-5 h-5 mr-2" />
        ) : (
          <CheckCircle className="w-5 h-5 mr-2" />
        )}
        <div>
          <div className="font-medium">
            {limit_reached 
              ? "Monthly limit reached" 
              : `${remaining} of ${monthly_limit} reports remaining`}
          </div>
          <div className="text-xs">
            {limit_reached 
              ? "Upgrade your plan to generate more reports" 
              : `You've used ${current_usage} of ${monthly_limit} reports this month`}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RfpUsageLimits;
