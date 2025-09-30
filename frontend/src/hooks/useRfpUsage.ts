import { useState, useEffect } from 'react';
import { rfpUsageApi, RfpUsageStatus } from '@/api/rfpUsage';
import { supabase } from '@/utils/supabase';

export function useRfpUsage() {
  const [usageStatus, setUsageStatus] = useState<RfpUsageStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsageStatus = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('User not authenticated');
        return;
      }

      const status = await rfpUsageApi.getUsageStatus();
      setUsageStatus(status);
    } catch (err) {
      console.error('Error fetching RFP usage status:', err);
      setError('Failed to fetch usage status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsageStatus();
  }, []);

  return {
    usageStatus,
    loading,
    error,
    refetch: fetchUsageStatus,
    isLimitReached: usageStatus?.limit_reached || false,
    remainingReports: usageStatus?.remaining || 0
  };
}
