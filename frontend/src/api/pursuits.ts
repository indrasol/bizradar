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

export interface PursuitStats {
  total: number;
  active: number;
  submitted: number;
  overdue: number;
  due_this_week: number;
}

export interface PursuitStatsResponse {
  success: boolean;
  stats: PursuitStats;
}

export interface MarkSubmittedResponse {
  success: boolean;
  message: string;
  pursuit_id: string;
}

export const pursuitsApi = {

  /**
   * Get upcoming deadlines from user's pursuits (tracker)
   */
  async getDeadlines(
    days: number = 7,
    deadlineType: string = 'all'
  ): Promise<DeadlinesResponse> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    try {
      const response = await apiClient.get(
        `${API_ENDPOINTS.PURSUIT_DEADLINES}?user_id=${user.id}&days=${days}&deadline_type=${deadlineType}`
      );
      
      return response as DeadlinesResponse;
    } catch (error) {
      console.error('Error fetching deadlines:', error);
      throw error;
    }
  },

  /**
   * Mark a pursuit as submitted
   */
  async markAsSubmitted(pursuitId: string): Promise<MarkSubmittedResponse> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    try {
      const response = await apiClient.post(
        `${API_ENDPOINTS.PURSUIT_MARK_SUBMITTED}?user_id=${user.id}`,
        {
          pursuit_id: pursuitId
        }
      );
      
      return response as MarkSubmittedResponse;
    } catch (error) {
      console.error('Error marking pursuit as submitted:', error);
      throw error;
    }
  },

  /**
   * Get pursuit statistics for the user
   */
  async getStats(): Promise<PursuitStatsResponse> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    try {
      const response = await apiClient.get(
        `${API_ENDPOINTS.PURSUIT_STATS}?user_id=${user.id}`
      );
      
      return response as PursuitStatsResponse;
    } catch (error) {
      console.error('Error fetching pursuit stats:', error);
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
      details: `Deadline for: ${deadline.title}\nType: ${deadline.type}\nAgency: ${deadline.agency || 'N/A'}`
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
DESCRIPTION:Deadline for: ${deadline.title}\\nType: ${deadline.type}\\nAgency: ${deadline.agency || 'N/A'}
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

export default pursuitsApi;
