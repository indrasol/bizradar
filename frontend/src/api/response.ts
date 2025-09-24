import { API_ENDPOINTS } from '@/config/apiEndpoints';
import { apiClient } from '@/lib/api';

export interface PutResponsePayload {
  stage?: string;
  content?: any;
  completion_percentage?: number;
  is_submitted?: boolean;
  opportunity_id?: number;
}

export const responseApi = {
  async putResponse(responseId: string, userId: string, payload: PutResponsePayload) {
    const url = `${API_ENDPOINTS.RESPONSES_BY_ID(responseId)}?user_id=${encodeURIComponent(userId)}`;
    return await apiClient.put(url, payload);
  }
};

