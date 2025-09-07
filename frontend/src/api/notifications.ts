import { supabase } from '@/utils/supabase';
import { Notification } from '@/models/notifications';
import { SUPABASE_TABLES } from '@/config/apiEndpoints';

export const notificationsApi = {
  async getNotifications(): Promise<Notification[]> {
    const { data, error } = await supabase
      .from(SUPABASE_TABLES.NOTIFICATIONS)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getUnreadCount(): Promise<number> {
    const { count, error } = await supabase
      .from(SUPABASE_TABLES.NOTIFICATIONS)
      .select('*', { count: 'exact', head: true })
      .eq('is_read', false);

    if (error) throw error;
    return count || 0;
  },

  async markAsRead(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from(SUPABASE_TABLES.NOTIFICATIONS)
      .update({ is_read: true })
      .eq('id', notificationId);

    if (error) throw error;
  },

  async markAllAsRead(): Promise<void> {
    const { error } = await supabase
      .from(SUPABASE_TABLES.NOTIFICATIONS)
      .update({ is_read: true })
      .eq('is_read', false);

    if (error) throw error;
  },

  async deleteNotification(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from(SUPABASE_TABLES.NOTIFICATIONS)
      .delete()
      .eq('id', notificationId);

    if (error) throw error;
  }
}; 