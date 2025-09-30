import { API_ENDPOINTS } from '@/config/apiEndpoints';
import { apiClient } from '@/lib/api';
import { supabase } from '@/utils/supabase';

// Types for RFP usage API responses
export interface RfpUsageStatus {
  monthly_limit: number;
  current_usage: number;
  remaining: number;
  limit_reached: boolean;
  message: string;
}

export interface OpportunityCheckResult {
  can_generate: boolean;
  reason: 'under_limit' | 'existing_report' | 'limit_reached';
  status: RfpUsageStatus;
}

export const rfpUsageApi = {
  /**
   * Get the current user's RFP usage status
   */
  async getUsageStatus(): Promise<RfpUsageStatus> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User must be logged in');
    
    const url = `${API_ENDPOINTS.RFP_USAGE_STATUS}?user_id=${encodeURIComponent(user.id)}`;
    console.log('📊 Checking RFP usage status:', url);
    
    try {
      const response = await apiClient.get(url);
      console.log('📊 RFP usage status:', response);
      return response;
    } catch (error) {
      console.error('📊 Error getting RFP usage status:', error);
      throw error;
    }
  },

  /**
   * Check if a user can generate a report for a specific opportunity
   * This is a read-only operation that doesn't record usage
   */
  async checkOpportunity(opportunityId: number): Promise<OpportunityCheckResult> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User must be logged in');
    
    const url = `${API_ENDPOINTS.RFP_USAGE_CHECK_OPPORTUNITY(opportunityId)}?user_id=${encodeURIComponent(user.id)}`;
    console.log('📊 Checking if can generate report for opportunity:', url);
    
    try {
      const response = await apiClient.get(url);
      console.log('📊 Opportunity check result:', response);
      return response;
    } catch (error) {
      console.error('📊 Error checking opportunity:', error);
      throw error;
    }
  },

  /**
   * Record usage for an opportunity
   * This is a write operation that records usage in the database
   */
  async recordUsage(opportunityId: number): Promise<any> {
    console.log('📊 recordUsage called with opportunityId:', opportunityId);
    
    // Validate input
    if (!opportunityId || isNaN(opportunityId)) {
      console.error('📊 Invalid opportunityId:', opportunityId);
      throw new Error(`Invalid opportunityId: ${opportunityId}`);
    }
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('📊 User not authenticated');
      throw new Error('User must be logged in');
    }
    
    const url = `${API_ENDPOINTS.RFP_USAGE_RECORD(opportunityId)}?user_id=${encodeURIComponent(user.id)}`;
    console.log('📊 Recording RFP usage with POST request to:', url);
    
    try {
      // Direct fetch for maximum debugging
      console.log('📊 Making direct fetch call');
      
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      console.log('📊 Fetch headers:', headers);
      
      const fetchResponse = await fetch(url, {
        method: 'POST',
        headers
      });
      
      console.log('📊 Raw fetch response status:', fetchResponse.status);
      
      if (!fetchResponse.ok) {
        const errorText = await fetchResponse.text();
        console.error('📊 Error response from server:', fetchResponse.status, fetchResponse.statusText, errorText);
        throw new Error(`Server error: ${fetchResponse.status} ${fetchResponse.statusText}`);
      }
      
      const responseData = await fetchResponse.json();
      console.log('📊 RFP usage recorded successfully:', responseData);
      return responseData;
    } catch (error) {
      console.error('📊 Error recording RFP usage:', error);
      throw error;
    }
  }
};

