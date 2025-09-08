import { API_ENDPOINTS } from '@/config/apiEndpoints';
import { apiClient } from '@/lib/api';

export const paymentApi = {
  async listPaymentMethods(userId: string) {
    const data = await apiClient.get(`${API_ENDPOINTS.PAYMENT_METHODS}?user_id=${userId}`);
    return data.payment_methods;
  },
  async addPaymentMethod(paymentMethodId: string, userId: string) {
    const data = await apiClient.post(API_ENDPOINTS.PAYMENT_METHODS, { 
      payment_method_id: paymentMethodId, 
      user_id: userId 
    });
    return data.payment_method;
  },
  async removePaymentMethod(paymentMethodId: string, userId: string) {
    const data = await apiClient.delete(`${API_ENDPOINTS.PAYMENT_METHOD_BY_ID(paymentMethodId)}?user_id=${userId}`);
    return data.removed;
  },
  async setDefaultPaymentMethod(paymentMethodId: string, userId: string) {
    const data = await apiClient.post(`${API_ENDPOINTS.SET_DEFAULT_PAYMENT_METHOD(paymentMethodId)}?user_id=${userId}`);
    return data.default_set;
  },
  async createSetupIntent(userId: string) {
    const data = await apiClient.post(API_ENDPOINTS.SETUP_INTENT, { user_id: userId });
    return data.client_secret;
  },
}; 