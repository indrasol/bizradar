import { API_ENDPOINTS } from "@/config/apiEndpoints";

export const paymentApi = {
  async listPaymentMethods(userId: string) {
    const res = await fetch(API_ENDPOINTS.PAYMENT_METHODS + `?user_id=${userId}`);
    const data = await res.json();
    return data.payment_methods;
  },
  async addPaymentMethod(paymentMethodId: string, userId: string) {
    const res = await fetch(API_ENDPOINTS.PAYMENT_METHODS, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payment_method_id: paymentMethodId, user_id: userId }),
    });
    const data = await res.json();
    return data.payment_method;
  },
  async removePaymentMethod(paymentMethodId: string, userId: string) {
    const res = await fetch(API_ENDPOINTS.PAYMENT_METHODS + `/${paymentMethodId}?user_id=${userId}`, { method: 'DELETE' });
    const data = await res.json();
    return data.removed;
  },
  async setDefaultPaymentMethod(paymentMethodId: string, userId: string) {
    const res = await fetch(API_ENDPOINTS.PAYMENT_METHODS + `/${paymentMethodId}/set-default?user_id=${userId}`, { method: 'POST' });
    const data = await res.json();
    return data.default_set;
  },
  async createSetupIntent(userId: string) {
    const res = await fetch(API_ENDPOINTS.CREATE_SETUP_INTENT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId }),
    });
    const data = await res.json();
    return data.client_secret;
  },
}; 