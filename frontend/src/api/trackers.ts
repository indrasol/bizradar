import { apiClient } from '@/lib/api';
import { API_ENDPOINTS } from '@/config/apiEndpoints';
import { DeadlineItem, DeadlinesResponse } from '@/api/pursuits';

// Types matching the backend models
export interface Tracker {
  id: string;
  title: string;
  description?: string;
  stage: string;
  created_at: string;
  updated_at: string;
  due_date?: string;
  user_id: string;
  is_submitted: boolean;
  naicscode?: string;
  opportunity_id?: number;
}

export interface CreateTrackerRequest {
  title: string;
  description?: string;
  stage?: string;
  due_date?: string;
  naicscode?: string;
  opportunity_id?: number;
}

export interface UpdateTrackerRequest {
  title?: string;
  description?: string;
  stage?: string;
  due_date?: string;
  naicscode?: string;
  is_submitted?: boolean;
}

export interface TrackersListResponse {
  success: boolean;
  trackers: Tracker[];
  total_count: number;
  message?: string;
}

export interface TrackerStatsResponse {
  success: boolean;
  stats: {
    total: number;
    active: number;
    submitted: number;
    overdue: number;
    due_this_week: number;
  };
}

export type TrackerStats = TrackerStatsResponse['stats'];

// Import pursuit calendar helper
import { pursuitsApi } from '@/api/pursuits';

export type { DeadlineItem, DeadlinesResponse } from '@/api/pursuits';

export const trackersApi = {
  // Get all trackers for a user
  async getTrackers(userId: string, isSubmitted?: boolean): Promise<TrackersListResponse> {
    const url = isSubmitted !== undefined 
      ? `${API_ENDPOINTS.TRACKERS}?user_id=${userId}&is_submitted=${isSubmitted}`
      : `${API_ENDPOINTS.TRACKERS}?user_id=${userId}`;
    
    const response = await apiClient.get(url);
    return response;
  },

  // Get a specific tracker by ID
  async getTrackerById(trackerId: string, userId: string): Promise<Tracker> {
    const response = await apiClient.get(`${API_ENDPOINTS.TRACKERS_BY_ID(trackerId)}?user_id=${userId}`);
    return response;
  },

  // Create a new tracker (with check for existing reports)
  async createTracker(trackerData: CreateTrackerRequest, userId: string): Promise<Tracker> {
    // First, check if a report already exists for this opportunity title
    let existingReport = null;
    let existingReportStage = null;
    let existingReportSubmitted = false;
    
    try {
      // Import reports API dynamically to avoid circular dependencies
      const { reportsApi } = await import('./reports');
      
      // Get all reports for this user
      const reportsResponse = await reportsApi.getReports(userId);
      
      if (reportsResponse.success && reportsResponse.reports.length > 0) {
        // Find a report with matching title
        const matchingReport = reportsResponse.reports.find(
          report => report.title?.toLowerCase() === trackerData.title?.toLowerCase()
        );
        
        if (matchingReport) {
          console.log('🔍 Found existing report with matching title:', matchingReport.title);
          existingReport = matchingReport;
          
          // Extract stage and submission status
          existingReportStage = matchingReport.stage || 'Review';
          existingReportSubmitted = matchingReport.is_submitted || false;
        }
      }
    } catch (error) {
      console.warn('Could not check for existing reports:', error);
      // Continue with tracker creation even if report check fails
    }
    
    // Update tracker data with existing report info if found
    if (existingReport) {
      trackerData.stage = existingReportStage;
      
      // Create tracker with synced data
      console.log('🔄 Creating tracker with synced data from existing report:', {
        title: trackerData.title,
        stage: trackerData.stage
      });
    }
    
    // Create the tracker
    const response = await apiClient.post(`${API_ENDPOINTS.TRACKERS}?user_id=${userId}`, trackerData);
    
    console.log('✅ Tracker created:', {
      id: response.id,
      opportunity_id: response.opportunity_id,
      title: response.title,
      stage: response.stage
    });
    
    // If we found an existing report, update the tracker's is_submitted status if needed
    if (existingReport && existingReportSubmitted) {
      try {
        await this.updateTracker(response.id, { is_submitted: true }, userId);
        response.is_submitted = true;
        console.log('✅ Updated tracker submission status to match existing report');
      } catch (error) {
        console.error('Failed to update tracker submission status:', error);
      }
    }
    
    return response;
  },

  // 🎯 NEW: Generate Response - Create report for existing tracker
  async generateResponse(trackerId: string, userId: string): Promise<{ success: boolean; message: string }> {
    try {
      // First, get the tracker details
      const tracker = await this.getTrackerById(trackerId, userId);
      
      // Create the report using the tracker ID as response_id
      const { reportsApi } = await import('./reports');
      console.log('🔍 Creating report for tracker:', trackerId);
      
      await reportsApi.upsertReport(
        trackerId, // Use tracker ID as response_id
        {
          rfpTitle: tracker.title,
          dueDate: tracker.due_date,
          sections: [],
          isSubmitted: false,
        },
        0, // completion percentage
        false, // isSubmitted
        userId,
        tracker.opportunity_id // opportunity_id from tracker
      );
      
      console.log(`✅ Report created for tracker ${trackerId}`);
      return { success: true, message: "Response generated successfully!" };
      
    } catch (error) {
      console.error('Failed to generate response:', error);
      return { success: false, message: "Failed to generate response. Please try again." };
    }
  },

  // 🎯 NEW: Check if a tracker has an associated report
  async hasReport(trackerId: string, userId: string): Promise<boolean> {
    try {
      const { reportsApi } = await import('./reports');
      await reportsApi.getReportByResponseId(trackerId, userId);
      return true; // If no error, report exists
    } catch (error) {
      return false; // If error, report doesn't exist
    }
  },

  // 🎯 NEW: Sync tracker stage with report progress
  async syncTrackerWithReport(trackerId: string, stage: string, isSubmitted: boolean, userId: string): Promise<void> {
    try {
      console.log(`🔄 Syncing tracker ${trackerId} with stage: ${stage}, submitted: ${isSubmitted}`);
      
      // Update the tracker stage and submission status
      await this.updateTracker(trackerId, {
        stage: stage,
        is_submitted: isSubmitted
      }, userId);
      
      console.log(`✅ Successfully synced tracker ${trackerId} stage to: ${stage}`);
    } catch (error) {
      console.error('Failed to sync tracker with report:', error);
      throw error;
    }
  },

  // Update an existing tracker
  async updateTracker(trackerId: string, trackerData: UpdateTrackerRequest, userId: string): Promise<Tracker> {
    const response = await apiClient.put(`${API_ENDPOINTS.TRACKERS_BY_ID(trackerId)}?user_id=${userId}`, trackerData);
    
    console.log(`✅ Successfully updated tracker ${trackerId}:`, trackerData);
    
    return response;
  },

  // Delete a tracker
  async deleteTracker(trackerId: string, userId: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete(`${API_ENDPOINTS.TRACKERS_BY_ID(trackerId)}?user_id=${userId}`);
    return response;
  },

  // Toggle submitted status of a tracker
  async toggleSubmittedStatus(trackerId: string, userId: string): Promise<Tracker> {
    const response = await apiClient.post(`${API_ENDPOINTS.TRACKERS_TOGGLE_SUBMITTED(trackerId)}?user_id=${userId}`, {});
    return response;
  },

  // Get tracker statistics
  async getTrackerStats(userId: string): Promise<TrackerStatsResponse> {
    const response = await apiClient.get(`${API_ENDPOINTS.TRACKER_STATS}?user_id=${userId}`);
    return response;
  },

  // Legacy endpoints for deadlines and mark submitted (keeping for compatibility)
  async getDeadlines(userId: string, days: number = 7): Promise<DeadlinesResponse> {
    const response = await apiClient.get(`${API_ENDPOINTS.TRACKER_DEADLINES}?user_id=${userId}&days=${days}`);
    return response;
  },

  async markSubmitted(trackerId: string, userId: string): Promise<any> {
    const response = await apiClient.post(`${API_ENDPOINTS.TRACKER_MARK_SUBMITTED}?user_id=${userId}`, {
      tracker_id: trackerId
    });
    return response;
  },

  // Calendar link generation for an individual deadline
  createCalendarUrl: pursuitsApi.createCalendarUrl,

  // Bulk .ics download stub
  downloadIcsFile: (deadlines: DeadlineItem[]) => {
    // For now, open individual calendar links
    deadlines.forEach(d => {
      const url = pursuitsApi.createCalendarUrl(d as any);
      window.open(url, '_blank');
    });
    console.warn('Bulk .ics export is not implemented. Opened individual calendar links instead.');
  }
};