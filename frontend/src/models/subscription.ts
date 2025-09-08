export type PlanType = 'trial' | 'free' | 'pro' | 'premium';
export type SubscriptionStatus = 'active' | 'cancelled' | 'expired';

export interface Subscription {
  id: string;
  user_id: string;
  plan_type: PlanType;
  status: SubscriptionStatus;
  start_date: string;
  end_date: string | null;
  created_at: string;
  updated_at: string;
  stripe_subscription_id?: string;
}

export interface SubscriptionPlan {
  type: PlanType;
  name: string;
  price: number;
  features: string[];
  description: string;
}

export interface SubscriptionState {
  currentSubscription: Subscription | null;
  availablePlans: SubscriptionPlan[];
  loading: boolean;
  error: string | null;
} 