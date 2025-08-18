import { supabase } from '@/utils/supabase';
import { Subscription, SubscriptionPlan } from '@/models/subscription';
import { useToast } from '@/components/ui/use-toast';

const isDevelopment = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
const API_BASE_URL = isDevelopment
  ? "http://localhost:5000"
  : import.meta.env.VITE_API_BASE_URL;

export const subscriptionApi = {

  async getCurrentSubscription(): Promise<Subscription | null> {
    const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          console.log("No user logged in");
          return;
        }
    const { data, error } = await supabase
    .from('user_subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false }) // if you want the latest
    .limit(1)
    .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "no rows returned"
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

  async createCheckoutSession(planType: string, userId: string): Promise<string> {
    const res = await fetch(`${API_BASE_URL}/api/subscription/checkout-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan_type: planType, user_id: userId })
    });
    if (!res.ok) throw new Error('Failed to create Stripe Checkout session');
    const data = await res.json();
    return data.url;
  },

  async createSubscriptionPaymentIntent(planType: string, userId: string): Promise<string> {
    const res = await fetch(`${API_BASE_URL}/api/subscription/payment-intent`, {
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
    const res = await fetch(`${API_BASE_URL}/api/subscription/status?user_id=${encodeURIComponent(userId)}`);
    if (!res.ok) throw new Error('Failed to fetch subscription status');
    return res.json();
  }
}; 