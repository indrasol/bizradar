import { supabase } from '@/utils/supabase';
import { API_ENDPOINTS } from '@/config/apiEndpoints';
import { apiClient } from '@/lib/api';

// Type definitions for API responses
export interface DeadlineItem {
  oppId: string;
  title: string;
  agency?: string;
  solicitation?: string;
  type: 'proposal' | 'qa' | 'amendment' | 'site_visit' | 'all';
  dueAt: string; // ISO string
  daysLeft: number;
  stage: string;
  owner?: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
}

export interface DeadlinesResponse {
  success: boolean;
  deadlines: DeadlineItem[];
  total_count: number;
  message?: string;
}

export interface TrackerStats {
  total: number;
  active: number;
  submitted: number;
  overdue: number;
  due_this_week: number;
}

export interface TrackerStatsResponse {
  success: boolean;
  stats: TrackerStats;
}

export interface MarkSubmittedResponse {
  success: boolean;
  message: string;
  tracker_id: string;
}

export const trackersApi = {

  /**
   * Get upcoming deadlines from user's trackers (no stage filtering)
   */
  async getDeadlines(
    days: number = 7
  ): Promise<DeadlinesResponse> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    try {
      const response = await apiClient.get(
        `${API_ENDPOINTS.TRACKER_DEADLINES}?user_id=${user.id}&days=${days}`
      );
      
      return response as DeadlinesResponse;
    } catch (error) {
      console.error('Error fetching deadlines:', error);
      throw error;
    }
  },

  /**
   * Mark a tracker as submitted
   */
  async markAsSubmitted(trackerId: string): Promise<MarkSubmittedResponse> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    try {
      const response = await apiClient.post(
        `${API_ENDPOINTS.TRACKER_MARK_SUBMITTED}?user_id=${user.id}`,
        {
          tracker_id: trackerId
        }
      );
      
      return response as MarkSubmittedResponse;
    } catch (error) {
      console.error('Error marking tracker as submitted:', error);
      throw error;
    }
  },

  /**
   * Get tracker statistics for the user
   */
  async getStats(): Promise<TrackerStatsResponse> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    try {
      const response = await apiClient.get(
        `${API_ENDPOINTS.TRACKER_STATS}?user_id=${user.id}`
      );
      
      return response as TrackerStatsResponse;
    } catch (error) {
      console.error('Error fetching tracker stats:', error);
      throw error;
    }
  },

  /**
   * Helper function to create calendar URL for Google Calendar
   */
  createCalendarUrl(deadline: DeadlineItem): string {
    const startDate = new Date(deadline.dueAt);
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // 1 hour duration
    
    const formatDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };
    
    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: deadline.title,
      dates: `${formatDate(startDate)}/${formatDate(endDate)}`,
      details: `Deadline for: ${deadline.title}\nAgency: ${deadline.agency || 'N/A'}`
    });
    
    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  },

  /**
   * Generate .ics calendar file content for bulk export
   */
  generateIcsContent(deadlines: DeadlineItem[]): string {
    const calendarEvents = deadlines.map(deadline => {
      const startDate = new Date(deadline.dueAt);
      const formatDate = (date: Date) => {
        return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      };
      
      return `BEGIN:VEVENT
DTSTART:${formatDate(startDate)}
DTEND:${formatDate(startDate)}
SUMMARY:${deadline.title}
DESCRIPTION:Deadline for: ${deadline.title}\\nAgency: ${deadline.agency || 'N/A'}
UID:${deadline.oppId}@bizradar.com
END:VEVENT`;
    }).join('\n');

    return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//BizRadar//Deadlines//EN
${calendarEvents}
END:VCALENDAR`;
  },

  /**
   * Download .ics file for bulk calendar export
   */
  downloadIcsFile(deadlines: DeadlineItem[], filename: string = 'bizradar-deadlines.ics'): void {
    const icsContent = this.generateIcsContent(deadlines);
    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

};

export default trackersApi;
