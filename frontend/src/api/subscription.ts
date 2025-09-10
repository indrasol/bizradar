import { supabase } from '@/utils/supabase';
import { Subscription, SubscriptionPlan, PlanType, SubscriptionStatus } from '@/models/subscription';
import { API_ENDPOINTS, STRIPE_PRICES, SUPABASE_TABLES } from '@/config/apiEndpoints';
import { apiClient } from '@/lib/api';

export const subscriptionApi = {

  async getCurrentSubscription(): Promise<Subscription | null> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.log("No user logged in");
      return null;
    }
    
    try {
      // Use the new server-side API
      const status = await this.getStatus(user.id);
      
      // Convert server response to frontend Subscription format
      if (status && status.plan_type) {
        return {
          id: user.id, // Use user ID as subscription ID
          user_id: user.id,
          plan_type: status.plan_type as PlanType,
          status: status.status as SubscriptionStatus,
          start_date: status.start_date,
          end_date: status.end_date,
          created_at: status.start_date,
          updated_at: new Date().toISOString(),
          stripe_subscription_id: status.stripe_subscription_id
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching subscription:', error);
      throw error;
    }
  },

  async getAvailablePlans(): Promise<SubscriptionPlan[]> {
    try {
      // Get plans from the server
      const response = await apiClient.get(`${API_ENDPOINTS.SUBSCRIPTION_TIERS}`);
      const tiers = response.tiers;
      
      // Convert server tier configs to frontend SubscriptionPlan format
      return Object.entries(tiers).map(([key, config]: [string, any]) => ({
        type: key as PlanType,
        name: config.name,
        price: config.price,
        features: config.features,
        description: `${config.name} - ${config.monthly_searches === -1 ? 'Unlimited' : config.monthly_searches} searches, ${config.ai_rfp_responses} AI responses per month`
      }));
    } catch (error) {
      console.error('Error fetching plans from server:', error);
      // Fallback to hardcoded plans
      return [
        {
          type: 'free' as PlanType,
          name: 'Free Plan',
          price: 0,
          features: [
            'Unlimited opportunity searches',
            'AI Search Boost - up to 5 smart suggestions per search',
            'Starter tracking',
            'Basic dashboard',
            '2 AI-assisted RFP drafts per month'
          ],
          description: 'Perfect for getting started'
        },
        {
          type: 'pro' as PlanType,
          name: 'Pro Plan',
          price: 29.99,
          features: [
            'Unlimited opportunity searches',
            'AI Search Boost — up to 5 smart suggestions per search',
            'Tracking with Bizradar AI Assistant',
            'Radar Matches — daily AI-picked opportunities for your company',
            'Advanced dashboard',
            '5 AI-assisted RFP drafts per month'
          ],
          description: 'Ideal for growing businesses'
        },
        {
          type: 'premium' as PlanType,
          name: 'Premium Plan',
          price: 99.99,
          features: [
            'Unlimited opportunity searches',
            'AI Search Boost — up to 5 smart suggestions per search',
            'Tracking with Bizradar AI Assistant',
            'Radar Matches+ — matches with priority alerts',
            'Tracking alerts — deadlines updates',
            'Advanced dashbaord with analytics',
            '10 AI-assisted RFP drafts per month'
          ],
          description: 'For large organizations with complex needs'
        }
      ];
    }
  },

  async createCheckoutSession(planType: string, billingCycle: 'monthly' | 'annual' = 'monthly'): Promise<{ sessionId: string; url?: string }> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('User must be logged in to create a checkout session.');
    }

    // Normalize inputs
    let normalizedPlan = (planType || '').toLowerCase().trim();
    if (normalizedPlan === 'basic') normalizedPlan = 'pro';
    const normalizedCycle = (billingCycle || 'monthly').toLowerCase().trim() as 'monthly' | 'annual';

    // Get the price ID based on normalized plan and billing cycle
    const priceId = STRIPE_PRICES[`${normalizedPlan}_${normalizedCycle}` as keyof typeof STRIPE_PRICES];
    if (!priceId) {
      throw new Error('Invalid plan type or billing cycle');
    }

    // Call our backend to create a checkout session
    const data = await apiClient.post(API_ENDPOINTS.CHECKOUT_SESSION, {
      priceId: priceId,
      planType: normalizedPlan
    });
    
    const { sessionId, url } = data;
    return { sessionId, url };
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
      .from(SUPABASE_TABLES.USER_SUBSCRIPTIONS)
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


  async updateSubscription(subscriptionId: string, updates: Partial<Subscription>): Promise<void> {
    const { error } = await supabase
      .from(SUPABASE_TABLES.USER_SUBSCRIPTIONS)
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
    const data = await apiClient.post(API_ENDPOINTS.SUBSCRIPTION_PAYMENT_INTENT, { 
      plan_type: planType, 
      user_id: userId 
    });
    return data.client_secret;
  }
  ,

  async getStatus(userId: string) {
    return apiClient.get(`${API_ENDPOINTS.SUBSCRIPTION_STATUS}?user_id=${encodeURIComponent(userId)}`);
  },

  async upgradeSubscription(planType: string, stripeSubscriptionId?: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User must be logged in');

    return apiClient.post(`${API_ENDPOINTS.SUBSCRIPTION_UPGRADE}?user_id=${encodeURIComponent(user.id)}`, {
      plan_type: planType,
      stripe_subscription_id: stripeSubscriptionId
    });
  },

  async cancelSubscription() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User must be logged in');

    return apiClient.post(`${API_ENDPOINTS.SUBSCRIPTION_CANCEL}?user_id=${encodeURIComponent(user.id)}`);
  },

  async startTrial() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User must be logged in');

    return apiClient.post(`${API_ENDPOINTS.SUBSCRIPTION_TRIAL}?user_id=${encodeURIComponent(user.id)}`);
  },

  async getUsageStats() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User must be logged in');

    return apiClient.get(`${API_ENDPOINTS.SUBSCRIPTION_USAGE}?user_id=${encodeURIComponent(user.id)}`);
  },

  async incrementUsage(usageType: 'search' | 'ai_rfp') {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User must be logged in');

    return apiClient.post(`${API_ENDPOINTS.SUBSCRIPTION_USAGE_INCREMENT}?user_id=${encodeURIComponent(user.id)}`, {
      usage_type: usageType
    });
  },

  async checkFeatureAccess(feature: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User must be logged in');

    return apiClient.get(API_ENDPOINTS.SUBSCRIPTION_FEATURE_ACCESS(feature) + `?user_id=${encodeURIComponent(user.id)}`);
  },

  async addRfpBoostPack() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User must be logged in');

    return apiClient.post(`${API_ENDPOINTS.ADDON_RFP_BOOST}?user_id=${encodeURIComponent(user.id)}`);
  },

  async removeRfpBoostPack() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User must be logged in');

    return apiClient.delete(`${API_ENDPOINTS.ADDON_RFP_BOOST}?user_id=${encodeURIComponent(user.id)}`);
  },

  async getUserAddons() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User must be logged in');

    return apiClient.get(`${API_ENDPOINTS.ADDONS_LIST}?user_id=${encodeURIComponent(user.id)}`);
  }
}; 