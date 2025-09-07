import { apiClient } from '@/lib/api';
import { API_ENDPOINTS } from '@/config/apiEndpoints';

// Types for profile data
export interface PersonalInfo {
  full_name?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone_number?: string;
  phone_verified?: boolean;
}

export interface CompanyInfo {
  company_name?: string;
  company_url?: string;
  company_description?: string;
  role?: string;
  industry?: string;
  company_size?: string;
}

export interface UserProfile {
  id: string;
  personal_info: PersonalInfo;
  company_info: CompanyInfo;
  created_at?: string;
  updated_at?: string;
}

export interface UpdatePersonalInfoRequest {
  first_name?: string;
  last_name?: string;
  phone_number?: string;
}

export interface UpdateCompanyInfoRequest {
  company_name?: string;
  company_url?: string;
  company_description?: string;
  role?: string;
  industry?: string;
  company_size?: string;
}

export interface ProfileSummary {
  id: string;
  full_name?: string;
  email?: string;
  company_name?: string;
  role?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  profile?: T;
  updated_fields?: string[];
}

export const profileApi = {
  /**
   * Get complete user profile including personal and company information
   */
  async getUserProfile(userId: string): Promise<UserProfile> {
    try {
      if (!userId || userId.trim() === '') {
        throw new Error('User ID is required and cannot be empty');
      }

      const profile = await apiClient.get(API_ENDPOINTS.PROFILE_GET(userId));
      return profile;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  },

  /**
   * Get profile summary for quick display
   */
  async getProfileSummary(userId: string): Promise<ProfileSummary> {
    try {
      if (!userId || userId.trim() === '') {
        throw new Error('User ID is required and cannot be empty');
      }

      const result = await apiClient.get(API_ENDPOINTS.PROFILE_SUMMARY(userId));
      
      if (!result.success || !result.profile) {
        throw new Error('Invalid response format from profile summary API');
      }

      return result.profile;
    } catch (error) {
      console.error('Error fetching profile summary:', error);
      throw error;
    }
  },

  /**
   * Update user's personal information
   */
  async updatePersonalInfo(userId: string, personalInfo: UpdatePersonalInfoRequest): Promise<ApiResponse<any>> {
    try {
      if (!userId || userId.trim() === '') {
        throw new Error('User ID is required and cannot be empty');
      }

      const result = await apiClient.put(
        API_ENDPOINTS.PROFILE_UPDATE_PERSONAL(userId),
        personalInfo
      );
      return result;
    } catch (error) {
      console.error('Error updating personal information:', error);
      throw error;
    }
  },

  /**
   * Update user's company information
   */
  async updateCompanyInfo(userId: string, companyInfo: UpdateCompanyInfoRequest): Promise<ApiResponse<any>> {
    try {
      if (!userId || userId.trim() === '') {
        throw new Error('User ID is required and cannot be empty');
      }

      const result = await apiClient.put(
        API_ENDPOINTS.PROFILE_UPDATE_COMPANY(userId),
        companyInfo
      );
      return result;
    } catch (error) {
      console.error('Error updating company information:', error);
      throw error;
    }
  },

  /**
   * Validate email format
   */
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  /**
   * Validate phone number format (basic validation)
   */
  isValidPhone(phone: string): boolean {
    // Basic phone validation - at least 10 digits
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
    return phoneRegex.test(phone);
  },

  /**
   * Format company URL to ensure it has protocol
   */
  formatCompanyUrl(url: string): string {
    if (!url) return '';
    const trimmed = url.trim();
    if (!trimmed) return '';
    
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      return `https://${trimmed}`;
    }
    return trimmed;
  },

  /**
   * Get display name from personal info
   */
  getDisplayName(personalInfo: PersonalInfo): string {
    if (personalInfo.full_name) {
      return personalInfo.full_name;
    }
    
    const firstName = personalInfo.first_name?.trim() || '';
    const lastName = personalInfo.last_name?.trim() || '';
    
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    } else if (firstName) {
      return firstName;
    } else if (lastName) {
      return lastName;
    }
    
    return personalInfo.email || 'User';
  },

  /**
   * Check if profile is complete
   */
  isProfileComplete(profile: UserProfile): boolean {
    const personal = profile.personal_info;
    const company = profile.company_info;
    
    // Check required personal fields
    const hasPersonalInfo = !!(
      personal.first_name && 
      personal.last_name && 
      personal.email
    );
    
    // Check if at least some company info is provided
    const hasCompanyInfo = !!(
      company.company_name || 
      company.role
    );
    
    return hasPersonalInfo && hasCompanyInfo;
  },

  /**
   * Get profile completion percentage
   */
  getProfileCompletionPercentage(profile: UserProfile): number {
    const fields = [
      profile.personal_info.first_name,
      profile.personal_info.last_name,
      profile.personal_info.email,
      profile.personal_info.phone_number,
      profile.company_info.company_name,
      profile.company_info.role,
      profile.company_info.company_url,
      profile.company_info.industry,
    ];
    
    const completedFields = fields.filter(field => field && field.trim() !== '').length;
    return Math.round((completedFields / fields.length) * 100);
  }
};

export default profileApi;
