export type PlanType = 'trial' | 'free' | 'basic' | 'premium' | 'enterprise';
export type SubscriptionStatus = 'active' | 'cancelled' | 'expired';

export interface Subscription {
  id: string;
  userId: string;
  plan_type: PlanType;
  status: SubscriptionStatus;
  startDate: string;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
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