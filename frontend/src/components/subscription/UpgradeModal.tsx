import React, { useEffect, useState } from 'react';
import { X, Check } from 'lucide-react';
import { subscriptionApi } from '@/api/subscription';
import { SubscriptionPlan, Subscription } from '@/models/subscription';

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
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentSubscription, setCurrentSubscription] = useState<Subscription | null>(null);
  const [subLoading, setSubLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadPlans();
      loadCurrentSubscription();
    }
    // Also reload when refreshKey changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const loadCurrentSubscription = async () => {
    setSubLoading(true);
    try {
      const sub = await subscriptionApi.getCurrentSubscription();
      setCurrentSubscription(sub);
      if (sub) {
        setSelectedPlan(sub.plan_type);
      } else {
        setSelectedPlan(null);
      }
    } catch (err) {
      console.error('Failed to load current subscription:', err);
      setSelectedPlan(null);
    } finally {
      setSubLoading(false);
    }
  };

  const handleUpgrade = async () => {
    if (!selectedPlan) return;

    setLoading(true);
    setError(null);

    try {
      await subscriptionApi.createSubscription(selectedPlan);
      onSuccess();
    } catch (err) {
      console.error('Error upgrading subscription:', err);
      setError('Failed to upgrade subscription. Please try again.');
    } finally {
      setLoading(false);
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
              Current Plan: <strong>{currentSubscription.plan_type}</strong>
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.type}
                className={`border rounded-lg p-6 cursor-pointer transition-all ${
                  selectedPlan === plan.type
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300'
                } ${currentSubscription && currentSubscription.plan_type === plan.type ? 'ring-2 ring-blue-400' : ''}`}
                onClick={() => setSelectedPlan(plan.type)}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold">{plan.name}</h3>
                    <p className="text-gray-600 mt-1">{plan.description}</p>
                  </div>
                  {selectedPlan === plan.type && (
                    <div className="bg-blue-500 text-white p-1 rounded-full">
                      <Check size={16} />
                    </div>
                  )}
                </div>

                <div className="mb-4">
                  <span className="text-3xl font-bold">${plan.price}</span>
                  <span className="text-gray-600">/month</span>
                </div>

                <ul className="space-y-2">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center text-gray-600">
                      <Check size={16} className="text-green-500 mr-2" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-8 flex justify-end">
            <button
              onClick={handleUpgrade}
              disabled={!selectedPlan || loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Upgrade Now'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}; 