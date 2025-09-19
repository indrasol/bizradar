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

  // Create a new tracker
  async createTracker(trackerData: CreateTrackerRequest, userId: string): Promise<Tracker> {
    const response = await apiClient.post(`${API_ENDPOINTS.TRACKERS}?user_id=${userId}`, trackerData);
    return response;
  },

  // Update an existing tracker
  async updateTracker(trackerId: string, trackerData: UpdateTrackerRequest, userId: string): Promise<Tracker> {
    const response = await apiClient.put(`${API_ENDPOINTS.TRACKERS_BY_ID(trackerId)}?user_id=${userId}`, trackerData);
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