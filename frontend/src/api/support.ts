import { supabase } from '@/utils/supabase';
import { SupportTicket, SupportMessage } from '@/models/support';

export const supportApi = {
  async getTickets(): Promise<SupportTicket[]> {
    const { data, error } = await supabase
      .from('support_tickets')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getTicket(ticketId: string): Promise<SupportTicket> {
    const { data, error } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('id', ticketId)
      .single();

    if (error) throw error;
    return data;
  },

  async createTicket(ticket: Omit<SupportTicket, 'id' | 'createdAt' | 'updatedAt'>): Promise<SupportTicket> {
    const { data, error } = await supabase
      .from('support_tickets')
      .insert([ticket])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateTicket(ticketId: string, updates: Partial<SupportTicket>): Promise<void> {
    const { error } = await supabase
      .from('support_tickets')
      .update(updates)
      .eq('id', ticketId);

    if (error) throw error;
  },

  async getMessages(ticketId: string): Promise<SupportMessage[]> {
    const { data, error } = await supabase
      .from('support_messages')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data;
  },

  async sendMessage(message: Omit<SupportMessage, 'id' | 'createdAt'>): Promise<SupportMessage> {
    const { data, error } = await supabase
      .from('support_messages')
      .insert([message])
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}; 