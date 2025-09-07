interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

// Import centralized API configuration
import { API_ENDPOINTS } from '@/config/apiEndpoints';
import { getApiUrl } from '@/config/env';
import { supabase } from '@/utils/supabase';

// Create base API client with common functionality
export const apiClient = {
  async get(url: string, options?: RequestInit) {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        ...this.getAuthHeaders(),
        ...options?.headers,
      },
      ...options,
    });
    return this.handleResponse(response);
  },

  async post(url: string, data?: any, options?: RequestInit) {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
        ...options?.headers,
      },
      body: JSON.stringify(data),
      ...options,
    });
    return this.handleResponse(response);
  },

  async put(url: string, data?: any, options?: RequestInit) {
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
        ...options?.headers,
      },
      body: JSON.stringify(data),
      ...options,
    });
    return this.handleResponse(response);
  },

  async delete(url: string, options?: RequestInit) {
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        ...this.getAuthHeaders(),
        ...options?.headers,
      },
      ...options,
    });
    return this.handleResponse(response);
  },

  async getAuthHeaders() {
    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  },

  async handleResponse(response: Response) {
    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }
      throw new Error(errorData.message || `API Error: ${response.status} ${response.statusText}`);
    }
    
    // Handle empty responses
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    } else {
      return response.text();
    }
  }
};

export async function getAIResponse(messages: ChatMessage[], documentContent?: string) {
  try {
    return await apiClient.post(`${getApiUrl()}/ask-ai`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages,
        documentContent,
      }),
    });
  } catch (error) {
    console.error('Error getting AI response:', error);
    throw error;
  }
}

// Example API function
export const fetchOpportunities = async (query: string, page: number, pageSize: number) => {
    return apiClient.post(`${getApiUrl()}/search-opportunities`, {
        query,
        page,
        page_size: pageSize,
    });
};