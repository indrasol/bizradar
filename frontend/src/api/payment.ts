const isDevelopment = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
const API_BASE_URL = isDevelopment
  ? "http://localhost:5000"
  : import.meta.env.VITE_API_BASE_URL;

export const paymentApi = {
  async listPaymentMethods(userId: string) {
    const res = await fetch(`${API_BASE_URL}/api/payment-methods?user_id=${userId}`);
    const data = await res.json();
    return data.payment_methods;
  },
  async addPaymentMethod(paymentMethodId: string, userId: string) {
    const res = await fetch(`${API_BASE_URL}/api/payment-methods`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payment_method_id: paymentMethodId, user_id: userId }),
    });
    const data = await res.json();
    return data.payment_method;
  },
  async removePaymentMethod(paymentMethodId: string, userId: string) {
    const res = await fetch(`${API_BASE_URL}/api/payment-methods/${paymentMethodId}?user_id=${userId}`, { method: 'DELETE' });
    const data = await res.json();
    return data.removed;
  },
  async setDefaultPaymentMethod(paymentMethodId: string, userId: string) {
    const res = await fetch(`${API_BASE_URL}/api/payment-methods/${paymentMethodId}/set-default?user_id=${userId}`, { method: 'POST' });
    const data = await res.json();
    return data.default_set;
  },
  async createSetupIntent(userId: string) {
    const res = await fetch(`${API_BASE_URL}/api/create-setup-intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId }),
    });
    const data = await res.json();
    return data.client_secret;
  },
}; 