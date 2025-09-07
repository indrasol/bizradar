import { supabase } from '@/utils/supabase';
import { SupportTicket, SupportMessage } from '@/models/support';
import { SUPABASE_TABLES } from '@/config/apiEndpoints';

export const supportApi = {
  async getTickets(): Promise<SupportTicket[]> {
    const { data, error } = await supabase
      .from(SUPABASE_TABLES.SUPPORT_TICKETS)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getTicket(ticketId: string): Promise<SupportTicket> {
    const { data, error } = await supabase
      .from(SUPABASE_TABLES.SUPPORT_TICKETS)
      .select('*')
      .eq('id', ticketId)
      .single();

    if (error) throw error;
    return data;
  },

  async createTicket(ticket: Omit<SupportTicket, 'id' | 'created_at' | 'updated_at' | 'user_id'>): Promise<SupportTicket> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User must be logged in to create a support ticket.');
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from(SUPABASE_TABLES.SUPPORT_TICKETS)
      .insert([
        {
          ...ticket,
          user_id: user.id,
          created_at: now,
          updated_at: now
        }
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateTicket(ticketId: string, updates: Partial<SupportTicket>): Promise<void> {
    const { error } = await supabase
      .from(SUPABASE_TABLES.SUPPORT_TICKETS)
      .update(updates)
      .eq('id', ticketId);

    if (error) throw error;
  },

  async getMessages(ticketId: string): Promise<SupportMessage[]> {
    const { data, error } = await supabase
      .from(SUPABASE_TABLES.SUPPORT_MESSAGES)
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data;
  },

  async sendMessage(message: Omit<SupportMessage, 'id' | 'createdAt'>): Promise<SupportMessage> {
    const { data, error } = await supabase
      .from(SUPABASE_TABLES.SUPPORT_MESSAGES)
      .insert([message])
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}; 