/// <reference types="vite/client" />
// Import environment configuration
import { getApiUrl, isDevelopment } from "@/config/env";

// Get the appropriate base URL from the environment configuration
const API_BASE_URL = `${getApiUrl()}`;
// const API_BASE_URL = `http://localhost:8000`;
// Log the API base URL being used
if (isDevelopment) {
  console.log(`Using API base URL: ${API_BASE_URL}`);
}


// Stripe price IDs
// Stripe price IDs are now resolved from backend API (subscriptions table)

// Supabase table names
export const SUPABASE_TABLES = {
  USER_SUBSCRIPTIONS: 'user_subscriptions',
  NOTIFICATIONS: 'notifications',
  SUPPORT_TICKETS: 'support_tickets',
  SUPPORT_MESSAGES: 'support_messages',
};

export const API_ENDPOINTS = {
  // Subscription endpoints
  CHECKOUT_SESSION: `${API_BASE_URL}/api/create-checkout-session`,
  SUBSCRIPTION_PAYMENT_INTENT: `${API_BASE_URL}/api/subscription/payment-intent`,
  STRIPE_PRICE_ID: (planType: string, billingCycle: 'monthly' | 'annual') => `${API_BASE_URL}/api/stripe/price-id?plan_type=${encodeURIComponent(planType)}&billing_cycle=${encodeURIComponent(billingCycle)}`,
  SUBSCRIPTION_STATUS: `${API_BASE_URL}/api/subscription/status`,
  SUBSCRIPTION_TIERS: `${API_BASE_URL}/api/subscription/tiers`,
  SUBSCRIPTION_UPGRADE: `${API_BASE_URL}/api/subscription/upgrade`,
  SUBSCRIPTION_CANCEL: `${API_BASE_URL}/api/subscription/cancel`,
  SUBSCRIPTION_TRIAL: `${API_BASE_URL}/api/subscription/trial`,
  SUBSCRIPTION_USAGE: `${API_BASE_URL}/api/subscription/usage`,
  SUBSCRIPTION_USAGE_INCREMENT: `${API_BASE_URL}/api/subscription/usage/increment`,
  SUBSCRIPTION_FEATURE_ACCESS: (feature: string) => `${API_BASE_URL}/api/subscription/feature-access/${feature}`,
  
  // Add-on endpoints
  ADDON_RFP_BOOST: `${API_BASE_URL}/api/subscription/addon/rfp-boost`,
  ADDONS_LIST: `${API_BASE_URL}/api/subscription/addons`,
  
  // Payment endpoints
  PAYMENT_METHODS: `${API_BASE_URL}/api/payment-methods`,
  PAYMENT_METHOD_BY_ID: (paymentMethodId: string) => `${API_BASE_URL}/api/payment-methods/${paymentMethodId}`,
  SET_DEFAULT_PAYMENT_METHOD: (paymentMethodId: string) => `${API_BASE_URL}/api/payment-methods/${paymentMethodId}/set-default`,
  SETUP_INTENT: `${API_BASE_URL}/api/create-setup-intent`,
  BILLING_HISTORY: (userId: string) => `${API_BASE_URL}/api/stripe/billing-history?user_id=${encodeURIComponent(userId)}`,
  
  // Company endpoints
  COMPANY_SETUP: `${API_BASE_URL}/api/company/setup`,
  COMPANY_PROFILE: `${API_BASE_URL}/api/company/profile`,
  COMPANY_UPDATE: `${API_BASE_URL}/api/company/update`,
  GENERATE_COMPANY_MARKDOWN: `${API_BASE_URL}/generate-company-markdown`,
  
  // Search and opportunities endpoints
  SEARCH_OPPORTUNITIES: `${API_BASE_URL}/search-opportunities`,
  AI_RECOMMENDATIONS: `${API_BASE_URL}/ai-recommendations`,
  ENHANCED_VECTOR_SEARCH: `${API_BASE_URL}/api/enhanced/vector-search`,
  ENHANCE_RFP_WITH_AI: `${API_BASE_URL}/enhance-rfp-with-ai`,
  
  // Pursuit/Tracker endpoints (legacy)
  PURSUIT_DEADLINES: `${API_BASE_URL}/api/pursuits/deadlines`,
  PURSUIT_MARK_SUBMITTED: `${API_BASE_URL}/api/pursuits/mark-submitted`,
  PURSUIT_STATS: `${API_BASE_URL}/api/pursuits/stats`,
  
  // New Tracker endpoints
  TRACKER_DEADLINES: `${API_BASE_URL}/api/trackers/deadlines`,
  TRACKER_MARK_SUBMITTED: `${API_BASE_URL}/api/trackers/mark-submitted`,
  TRACKER_STATS: `${API_BASE_URL}/api/trackers/stats`,
  
  // Profile endpoints
  PROFILE_GET: (userId: string) => `${API_BASE_URL}/api/profile?user_id=${encodeURIComponent(userId)}`,
  PROFILE_SUMMARY: (userId: string) => `${API_BASE_URL}/api/profile/summary?user_id=${encodeURIComponent(userId)}`,
  PROFILE_UPDATE_PERSONAL: (userId: string) => `${API_BASE_URL}/api/profile/personal?user_id=${encodeURIComponent(userId)}`,
  PROFILE_UPDATE_COMPANY: (userId: string) => `${API_BASE_URL}/api/profile/company?user_id=${encodeURIComponent(userId)}`,
  
};