import { apiClient } from '@/lib/api';
import { API_ENDPOINTS } from '@/config/apiEndpoints';

export interface ReportContent {
  logo?: string;
  companyName?: string;
  companyWebsite?: string;
  letterhead?: string;
  phone?: string;
  rfpTitle?: string;
  rfpNumber?: string;
  naicsCode?: string;
  solicitationNumber?: string;
  issuedDate?: string;
  submittedBy?: string;
  theme?: string;
  sections?: any[];
  isSubmitted?: boolean;
  dueDate?: string;
}

export interface Report {
  id: string;
  response_id: string;
  user_id: string;
  content: ReportContent;
  completion_percentage: number;
  is_submitted: boolean;
  stage: string;
  created_at: string;
  updated_at: string;
}

interface ReportsListResponse {
  success: boolean;
  reports: Report[];
  count: number;
}

interface ReportResponse {
  success: boolean;
  report: Report;
}

export const reportsApi = {
// Replace both get functions with:
    async getReports(userId: string, isSubmitted: boolean = false): Promise<ReportsListResponse> {
    const response = await apiClient.get(`${API_ENDPOINTS.REPORTS}?user_id=${userId}&is_submitted=${isSubmitted}`);
    return response.data;
    },
  
     async getReportByResponseId(responseId: string, userId: string): Promise<Report> {
    const response = await apiClient.get(`${API_ENDPOINTS.REPORTS_BY_RESPONSE_ID(responseId)}?user_id=${userId}`);
    return response.data;
    },

    async createReport(reportData: Omit<Report, 'id' | 'created_at' | 'updated_at' | 'stage'>, userId: string): Promise<Report> {
        const response = await apiClient.post(`${API_ENDPOINTS.REPORTS}?user_id=${userId}`, reportData);
        return response.data;
      },
      
    async updateReport(responseId: string, reportData: Partial<Omit<Report, 'id' | 'response_id' | 'user_id' | 'created_at' | 'stage'>>, userId: string): Promise<Report> {
        const response = await apiClient.put(`${API_ENDPOINTS.REPORTS_BY_RESPONSE_ID(responseId)}?user_id=${userId}`, reportData);
        return response.data;
    },

async upsertReport(
        responseId: string,
        content: ReportContent,
        completionPercentage: number,
        isSubmitted: boolean,
        userId: string
      ): Promise<Report> {
        const payload = {
          response_id: responseId,  // Backend expects response_id for reports table
          content,
          completion_percentage: completionPercentage,
          is_submitted: isSubmitted,
        };
        const response = await apiClient.post(`${API_ENDPOINTS.REPORTS_UPSERT}?user_id=${userId}`, payload);
        return response.data;
},

async deleteReport(responseId: string, userId: string): Promise<{ success: boolean }> {
    const response = await apiClient.delete(`${API_ENDPOINTS.REPORTS_BY_RESPONSE_ID(responseId)}?user_id=${userId}`);
    return response.data;
  },
  
  // Fix toggleSubmittedStatus method
  async toggleSubmittedStatus(responseId: string, userId: string): Promise<Report> {
    const response = await apiClient.post(`${API_ENDPOINTS.REPORTS_TOGGLE_SUBMITTED(responseId)}?user_id=${userId}`, {});
    return response.data;
  }
};
