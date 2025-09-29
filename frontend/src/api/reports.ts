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
  id?: string;
  response_id: string;
  user_id: string;
  opportunity_id?: number;
  title?: string;
  description?: string;
  due_date?: string;
  content: ReportContent;
  completion_percentage: number;
  is_submitted: boolean;
  stage?: string;
  submitted_at?: string;
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
    return response;
    },
  
     async getReportByResponseId(responseId: string, userId: string): Promise<Report> {
    const response = await apiClient.get(`${API_ENDPOINTS.REPORTS_BY_RESPONSE_ID(responseId)}?user_id=${userId}`);
    return response;
    },

    async createReport(reportData: Omit<Report, 'id' | 'created_at' | 'updated_at' | 'stage'>, userId: string): Promise<Report> {
        const response = await apiClient.post(`${API_ENDPOINTS.REPORTS}?user_id=${userId}`, reportData);
        return response;
      },
      
    async updateReport(responseId: string, reportData: Partial<Omit<Report, 'id' | 'response_id' | 'user_id' | 'created_at' | 'stage'>>, userId: string): Promise<Report> {
        const response = await apiClient.put(`${API_ENDPOINTS.REPORTS_BY_RESPONSE_ID(responseId)}?user_id=${userId}`, reportData);
        return response;
    },

async upsertReport(
        responseId: string,
        content: ReportContent,
        completionPercentage: number,
        isSubmitted: boolean,
        userId: string,
        opportunityId?: number
      ): Promise<Report> {
        const payload = {
          response_id: responseId,  // Backend expects response_id for reports table
          opportunity_id: opportunityId,
          content,
          completion_percentage: completionPercentage,
          is_submitted: isSubmitted,
        };
        const response = await apiClient.post(`${API_ENDPOINTS.REPORTS_UPSERT}?user_id=${userId}`, payload);
        return response;
},

async deleteReport(responseId: string, userId: string): Promise<{ success: boolean }> {
    const response = await apiClient.delete(`${API_ENDPOINTS.REPORTS_BY_RESPONSE_ID(responseId)}?user_id=${userId}`);
    return response;
  },
  
  // Toggle submission status of a report
  async toggleSubmittedStatus(responseId: string, userId: string): Promise<Report> {
    try {
      // First try the dedicated toggle endpoint
      const response = await apiClient.post(`${API_ENDPOINTS.REPORTS_TOGGLE_SUBMITTED(responseId)}?user_id=${userId}`, {});
      console.log('Successfully toggled report submission status via dedicated endpoint');
      
      // Also update the tracker to keep them in sync
      try {
        const { trackersApi } = await import('./trackers');
        await trackersApi.syncTrackerWithReport(responseId, "Completed", true, userId);
        console.log('Successfully synced tracker submission status');
      } catch (trackerError) {
        console.warn('Failed to sync tracker submission status:', trackerError);
        // Continue even if tracker update fails
      }
      
      return response;
    } catch (error) {
      console.warn('Toggle endpoint failed, falling back to direct update:', error);
      
      // Fallback: Get current report and update it directly
      try {
        const report = await this.getReportByResponseId(responseId, userId);
        
        // Update the report with submission status = true
        const updatedReport = await this.updateReport(responseId, {
          is_submitted: true,
          content: {
            ...report.content,
            isSubmitted: true
          },
          completion_percentage: 100, // Mark as 100% complete when submitted
        }, userId);
        
        // Also update the tracker to keep them in sync
        try {
          const { trackersApi } = await import('./trackers');
          await trackersApi.syncTrackerWithReport(responseId, "Completed", true, userId);
          console.log('Successfully synced tracker submission status (fallback path)');
        } catch (trackerError) {
          console.warn('Failed to sync tracker submission status (fallback path):', trackerError);
          // Continue even if tracker update fails
        }
        
        console.log('Successfully updated report submission status via direct update');
        return updatedReport;
      } catch (fallbackError) {
        console.error('Both toggle methods failed:', fallbackError);
        throw fallbackError;
      }
    }
  }
};
