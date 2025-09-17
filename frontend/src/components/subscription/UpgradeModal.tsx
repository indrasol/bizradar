import React, { useEffect, useState } from 'react';
import { X, Check, Loader2, Star } from 'lucide-react';
import { subscriptionApi } from '@/api/subscription';
import { SubscriptionPlan, Subscription } from '@/models/subscription';
import { useToast } from '@/components/ui/use-toast';
// Remove next/navigation import as we're not using it
import { loadStripe } from '@stripe/stripe-js';
import { useSubscription } from '@/hooks/useSubscription';

type BillingCycle = 'monthly' | 'annual';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  refreshKey?: number;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  refreshKey
}) => {
  const { toast } = useToast();
  const { subscription: currentSubscription, loading: subLoading, refreshSubscription } = useSubscription();
  
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadPlans();
      refreshSubscription();
    }
  }, [isOpen, refreshKey]);

  const loadPlans = async () => {
    try {
      const availablePlans = await subscriptionApi.getAvailablePlans();
      setPlans(availablePlans);
    } catch (err) {
      console.error('Failed to load subscription plans:', err);
      setError('Failed to load subscription plans. Please try again.');
    }
  };

  // Update selected plan when current subscription changes
  useEffect(() => {
    if (currentSubscription) {
      // Extract base plan type (remove _monthly or _annual suffix) and normalize basic->pro
      const basePlan = currentSubscription.plan_type.split('_')[0];
      const normalizedPlan = basePlan === 'basic' ? 'pro' : basePlan;
      setSelectedPlan(normalizedPlan);
      
      // Set billing cycle based on current subscription
      if (currentSubscription.plan_type.endsWith('_annual')) {
        setBillingCycle('annual');
      } else {
        setBillingCycle('monthly');
      }
    } else {
      setSelectedPlan(null);
    }
  }, [currentSubscription]);

  const handleCheckout = async (plan: string) => {
    if (!plan) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Normalize basic->pro
      const normalizedPlan = plan === 'basic' ? 'pro' : plan;
      // Create a checkout session
      const { sessionId, url } = await subscriptionApi.createCheckoutSession(normalizedPlan, billingCycle);
      
      // Redirect to Stripe Checkout
      // Prefer the URL if backend returns it (works even if Stripe.js has issues)
      if (url) {
        window.location.assign(url);
      } else {
        const stripe = await loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
        if (!stripe) {
          throw new Error('Failed to load Stripe');
        }
        const { error } = await stripe.redirectToCheckout({ sessionId });
        if (error) throw error;
      }
      
      if (error) {
        throw error;
      }
      
      // Close the modal on success
      onClose();
      
      // Show success message
      toast({
        title: 'Redirecting to checkout',
        description: 'You are being redirected to complete your subscription.',
      });
      
    } catch (err) {
      console.error('Error during checkout:', err);
      setError('Failed to start checkout. Please try again.');
      toast({
        title: 'Checkout Error',
        description: 'There was an error starting the checkout process.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async () => {
    if (!selectedPlan) return;
    await handleCheckout(selectedPlan);
  };

  const getPlanPrice = (basePrice: number) => {
    return billingCycle === 'annual' ? basePrice * 12 * 0.8 : basePrice; // 20% discount for annual
  };

  const getPlanSuffix = (type: string) => {
    return type.endsWith('_annual') ? ' (Annual)' : '';
  };

  const formatPlanType = (planType: string) => {
    return planType
      .replace(/[_-]+/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getPlanIcon = (planType: string) => {
    switch (planType) {
      case 'free':
        return {
          icon: Star,
          bgColor: 'bg-gradient-to-br from-blue-500 to-blue-600',
          textColor: 'text-white'
        };
      case 'pro':
        return {
          icon: Star,
          bgColor: 'bg-gradient-to-br from-purple-500 to-purple-600',
          textColor: 'text-white'
        };
      case 'premium':
        return {
          icon: Star,
          bgColor: 'bg-gradient-to-br from-amber-500 to-amber-600',
          textColor: 'text-white'
        };
      default:
        return {
          icon: Star,
          bgColor: 'bg-gradient-to-br from-gray-500 to-gray-600',
          textColor: 'text-white'
        };
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold">Upgrade Your Plan</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X size={24} />
            </button>
          </div>

          {subLoading ? (
            <div className="mb-4">Loading your current subscription...</div>
          ) : currentSubscription ? (
            <div className="mb-4 p-3 bg-blue-50 text-blue-700 rounded-md">
              Current Plan: <strong>{formatPlanType(currentSubscription.plan_type)}</strong>
            </div>
          ) : (
            <div className="mb-4 p-3 bg-gray-50 text-gray-700 rounded-md">
              No active subscription found.
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md">
              {error}
            </div>
          )}

          <div className="mb-6">
            <div className="flex justify-center mb-6">
              <div className="inline-flex rounded-md shadow-sm" role="group">
                <button
                  type="button"
                  onClick={() => setBillingCycle('monthly')}
                  className={`px-4 py-2 text-sm font-medium rounded-l-lg ${
                    billingCycle === 'monthly'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Monthly Billing
                </button>
                <button
                  type="button"
                  onClick={() => setBillingCycle('annual')}
                  className={`px-4 py-2 text-sm font-medium rounded-r-lg ${
                    billingCycle === 'annual'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Annual Billing (20% off)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {plans.map((plan) => {
                const isAnnual = billingCycle === 'annual';
                const displayPrice = isAnnual ? getPlanPrice(plan.price) : plan.price;
                const displaySuffix = isAnnual ? 'year' : 'month';
                const displayName = isAnnual ? `${plan.name} (Annual)` : plan.name;
                const planIcon = getPlanIcon(plan.type);
                const IconComponent = planIcon.icon;

                return (
                  <div
                    key={`${plan.type}_${billingCycle}`}
                    className={`border rounded-lg p-6 cursor-pointer transition-all ${
                      selectedPlan === plan.type
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    } ${currentSubscription && currentSubscription.plan_type === plan.type ? 'ring-2 ring-blue-400' : ''}`}
                    onClick={() => setSelectedPlan(plan.type)}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${planIcon.bgColor} shadow-sm`}>
                          <IconComponent className={`w-5 h-5 ${planIcon.textColor}`} />
                        </div>
                        <h3 className="text-xl font-semibold">{displayName}</h3>
                      </div>
                      {selectedPlan === plan.type && (
                        <div className="bg-blue-500 text-white p-1 rounded-full">
                          <Check className="w-4 h-4" />
                        </div>
                      )}
                    </div>

                    <div className="mb-4">
                      <span className="text-3xl font-bold">${displayPrice}</span>
                      <span className="text-gray-600">/{displaySuffix}</span>
                      {isAnnual && plan.type !== 'free' && (
                        <div className="text-sm text-green-600 mt-1">
                          Save 20% with annual billing
                        </div>
                      )}
                    </div>

                    <ul className="space-y-2">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-center text-gray-600">
                          <Check className="w-4 h-4 text-green-500 mr-2 shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>

          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md">
              {error}
            </div>
          )}

          <div className="mt-8 flex justify-end">
            <button
              onClick={handleUpgrade}
              disabled={!selectedPlan || loading}
              className={`w-full py-3 px-6 rounded-lg font-medium text-white transition-colors flex items-center justify-center ${
                !selectedPlan || loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                  Processing...
                </>
              ) : (
                'Upgrade Now'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};