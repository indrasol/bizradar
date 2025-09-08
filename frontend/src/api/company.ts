import { apiClient } from '@/lib/api';
import { supabase } from '@/utils/supabase';
import { API_ENDPOINTS } from '@/config/apiEndpoints';

export interface CompanySetupData {
  user_id: string;
  company_name: string;
  company_url?: string;
  company_description?: string;
  user_role?: string;
  first_name?: string;
  last_name?: string;
}

export interface CompanyProfile {
  id: string;
  name: string;
  url?: string;
  description?: string;
  user_role?: string;
  markdown_content?: string;
  created_at: string;
  updated_at: string;
}

export const companyApi = {
  /**
   * Complete company setup - creates company, user relationship, and initializes subscription
   */
  async setupCompany(data: CompanySetupData): Promise<{
    success: boolean;
    message: string;
    data: {
      company: CompanyProfile;
      subscription: any;
      markdown_generated: boolean;
    };
  }> {
    try {
      const response = await apiClient.post(API_ENDPOINTS.COMPANY_SETUP, data);
      return response;
    } catch (error) {
      console.error('Error setting up company:', error);
      throw error;
    }
  },

  /**
   * Get user's company profile
   */
  async getCompanyProfile(userId: string): Promise<{
    success: boolean;
    data: CompanyProfile | null;
    message?: string;
  }> {
    try {
      const response = await apiClient.get(`${API_ENDPOINTS.COMPANY_PROFILE}?user_id=${encodeURIComponent(userId)}`);
      return response;
    } catch (error) {
      console.error('Error fetching company profile:', error);
      throw error;
    }
  },

  /**
   * Update existing company information
   */
  async updateCompany(data: CompanySetupData): Promise<{
    success: boolean;
    message: string;
    data: CompanyProfile;
  }> {
    try {
      const response = await apiClient.put(API_ENDPOINTS.COMPANY_UPDATE, data);
      return response;
    } catch (error) {
      console.error('Error updating company:', error);
      throw error;
    }
  },

  /**
   * Check if user has completed company setup
   */
  async hasCompanySetup(userId: string): Promise<boolean> {
    try {
      const response = await this.getCompanyProfile(userId);
      return response.success && response.data !== null;
    } catch (error) {
      console.error('Error checking company setup:', error);
      return false;
    }
  }
};
