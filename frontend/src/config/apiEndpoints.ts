/// <reference types="vite/client" />
// Import environment configuration
import { getApiUrl, isDevelopment } from "@/config/env";

// Get the appropriate base URL from the environment configuration
const API_BASE_URL = `${getApiUrl()}`;
// Log the API base URL being used
if (isDevelopment) {
  console.log(`Using API base URL: ${API_BASE_URL}`);
}


export const API_ENDPOINTS = {
  // ------------------ SEARCH & AI ------------------
  SEARCH_OPPORTUNITIES: `${API_BASE_URL}/search-opportunities`,
  REFINE_QUERY: `${API_BASE_URL}/refine-query`,
  SEARCH_PROGRESS: `${API_BASE_URL}/search-progress`,
  SUMMARIZE_DESCRIPTION: `${API_BASE_URL}/summarize-description`,
  SUMMARIZE_DESCRIPTIONS: `${API_BASE_URL}/summarize-descriptions`,
  AI_RECOMMENDATIONS: `${API_BASE_URL}/ai-recommendations`,
  ASK_AI: `${API_BASE_URL}/ask-ai`,
  ASK_BIZRADAR_AI: `${API_BASE_URL}/ask-bizradar-ai`,
  PROCESS_DOCUMENTS: `${API_BASE_URL}/process-documents`,
  ENHANCE_RFP_WITH_AI: `${API_BASE_URL}/enhance-rfp-with-ai`,

  // ------------------ PAYMENTS & SUBSCRIPTIONS ------------------
  STRIPE_VERIFY_SESSION: `${API_BASE_URL}/api/stripe/verify-session`,
  PAYMENT_METHODS: `${API_BASE_URL}/api/payment-methods`,
  CREATE_SETUP_INTENT: `${API_BASE_URL}/api/create-setup-intent`,
  SUBSCRIPTION_CHECKOUT: `${API_BASE_URL}/api/subscription/checkout-session`,
  SUBSCRIPTION_PAYMENT_INTENT: `${API_BASE_URL}/api/subscription/payment-intent`,
  SUBSCRIPTION_STATUS: `${API_BASE_URL}/api/subscription/status`,
  CREATE_CHECKOUT_SESSION: `${API_BASE_URL}/api/create-checkout-session`,

  // ------------------ ADMIN ------------------
  ADMIN_TRIGGER_WORKFLOW: `${API_BASE_URL}/admin/trigger-workflow`,
  ADMIN_ETL_RECORDS: `${API_BASE_URL}/admin/etl-records`,
  ADMIN_TABLE_COUNTS: `${API_BASE_URL}/admin/table-counts`,
  CLEAR_CACHE: `${API_BASE_URL}/clear-cache`,

  // ------------------ COMMUNICATION ------------------
  EMAIL_SERVICE: `${API_BASE_URL}/api/send-welcome-email`,
  CONVERSATIONS: `${API_BASE_URL}/api/conversations`,
};
