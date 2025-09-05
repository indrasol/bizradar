import { supabase } from '@/utils/supabase';
import { Subscription, SubscriptionPlan } from '@/models/subscription';
import { useToast } from '@/components/ui/use-toast';
import { API_ENDPOINTS } from '@/config/apiEndpoints';

// Stripe price IDs
const STRIPE_PRICES = {
  basic_monthly: 'price_1RqIaWFKTK8ICUprZJJh44Hc',
  basic_annual: 'price_1RqIcWFKTK8ICUprtagiVbzf',
  premium_monthly: 'price_1RqIdGFKTK8ICUprDEo5P7AB',
  premium_annual: 'price_1RqIdxFKTK8ICUprSgy50avW',
  enterprise_monthly: 'price_1RqIebFKTK8ICUpr6QN0hZ9a',
  enterprise_annual: 'price_1RqIewFKTK8ICUprSvBvDwvg',
};

export const subscriptionApi = {

  async getCurrentSubscription(): Promise<Subscription | null> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.log("No user logged in");
      return null;
    }
    
    const { data, error } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['active', 'trialing', 'past_due']) // Include active-like statuses
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error fetching subscription:', error);
      throw error;
    }
    
    return data;
  },

  async getAvailablePlans(): Promise<SubscriptionPlan[]> {
    // In a real application, this would come from your backend
    // For now, we'll return hardcoded plans
    return [
      {
        type: 'basic',
        name: 'Basic Plan',
        price: 9.99,
        features: [
          'Basic opportunity tracking',
          'Email notifications',
          'Basic analytics'
        ],
        description: 'Perfect for small businesses getting started'
      },
      {
        type: 'premium',
        name: 'Premium Plan',
        price: 29.99,
        features: [
          '100 opportunity searches',
          '20 AI generated RFP responses per month',
          'Advanced analytics and reporting',
          'Priority customer support',
          'Advanced opportunity tracking',
          'Real-time notifications',
          'Priority support',
          'Custom reports'
        ],
        description: 'Ideal for growing businesses'
      },
      {
        type: 'enterprise',
        name: 'Enterprise Plan',
        price: 99.99,
        features: [
          'Unlimited opportunity searches',
          '50 AI generated RFP responses per month',
          'Advanced analytics and reporting',
          'Priority customer support',
          'Team collaboration (up to 5 users)',
          'Everything in Premium',
          'Dedicated account manager',
          'Custom integrations',
          'SLA guarantees',
          'Team collaboration tools',
          'API access'
        ],
        description: 'For large organizations with complex needs'
      }
    ];
  },

  async createCheckoutSession(planType: string, billingCycle: 'monthly' | 'annual' = 'monthly'): Promise<{ sessionId: string }> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('User must be logged in to create a checkout session.');
    }

    // Get the price ID based on plan and billing cycle
    const priceId = STRIPE_PRICES[`${planType}_${billingCycle}` as keyof typeof STRIPE_PRICES];
    if (!priceId) {
      throw new Error('Invalid plan type or billing cycle');
    }

    // Call our backend to create a checkout session
    const response = await fetch(API_ENDPOINTS.CREATE_CHECKOUT_SESSION, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
      },
      body: JSON.stringify({
        priceId: priceId,
        planType: planType
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create checkout session');
    }

    const { sessionId } = await response.json();
    return { sessionId };
  },

  async createSubscription(planType: string): Promise<Subscription> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('User must be logged in to create a subscription.');
    }

    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);

    const { data, error } = await supabase
      .from('user_subscriptions')
      .upsert({
        user_id: user.id,
        plan_type: planType,
        status: 'active',
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString()
      }, { onConflict: 'user_id' })
      .select()
      .single();
    // const { toast } = useToast();
    // toast({
    //   title: 'Subscription Upgraded',
    //   description: 'Your subscription has been upgraded successfully!',
    // });

    if (error) throw error;
    return data;
  },

  async cancelSubscription(subscriptionId: string): Promise<void> {
    const { error } = await supabase
      .from('user_subscriptions')
      .update({ status: 'cancelled' })
      .eq('id', subscriptionId);

    if (error) throw error;
  },

  async updateSubscription(subscriptionId: string, updates: Partial<Subscription>): Promise<void> {
    const { error } = await supabase
      .from('user_subscriptions')
      .update(updates)
      .eq('id', subscriptionId);

    if (error) throw error;
  },

  // async createCheckoutSession(planType: string, userId: string): Promise<string> {
  //   const res = await fetch(`${API_BASE_URL}/api/subscription/checkout-session`, {
  //     method: 'POST',
  //     headers: { 'Content-Type': 'application/json' },
  //     body: JSON.stringify({ plan_type: planType, user_id: userId })
  //   });
  //   if (!res.ok) throw new Error('Failed to create Stripe Checkout session');
  //   const data = await res.json();
  //   return data.url;
  // },

  async createSubscriptionPaymentIntent(planType: string, userId: string): Promise<string> {
    const res = await fetch(API_ENDPOINTS.SUBSCRIPTION_PAYMENT_INTENT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan_type: planType, user_id: userId })
    });
    if (!res.ok) throw new Error('Failed to create Stripe PaymentIntent');
    const data = await res.json();
    return data.client_secret;
  }
  ,

  async getStatus(userId: string) {
    const res = await fetch(API_ENDPOINTS.SUBSCRIPTION_STATUS + `?user_id=${encodeURIComponent(userId)}`);
    if (!res.ok) throw new Error('Failed to fetch subscription status');
    return res.json();
  }
}; 