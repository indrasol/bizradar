import { useState, useEffect, useCallback } from 'react';
import { subscriptionApi } from '@/api/subscription';
import { useAuth } from '@/components/Auth/useAuth';
import { Subscription } from '@/models/subscription';

export const useSubscription = () => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscription = useCallback(async () => {
    if (!user) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const sub = await subscriptionApi.getCurrentSubscription();
      setSubscription(sub);
    } catch (err) {
      console.error('Error fetching subscription:', err);
      setError('Failed to load subscription details');
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSubscription();
    
    // Set up a listener for auth state changes
    const handleAuthChange = () => {
      fetchSubscription();
    };
    
    window.addEventListener('auth-state-changed', handleAuthChange);
    return () => {
      window.removeEventListener('auth-state-changed', handleAuthChange);
    };
  }, [fetchSubscription]);

  const refreshSubscription = async () => {
    await fetchSubscription();
  };

  return {
    subscription,
    loading,
    error,
    refreshSubscription,
    isSubscribed: !!subscription && subscription.status === 'active',
    isPremium: subscription?.plan_type?.includes('premium') || false,
    isEnterprise: subscription?.plan_type?.includes('enterprise') || false,
  };
};

export default useSubscription;
