import { supabase } from '@/utils/supabase';
import { API_ENDPOINTS } from '@/config/apiEndpoints';


export interface Message {
  id: string;
  type: 'user' | 'ai' | 'system';
  content: string;
  timestamp: string;
  samGovUrl?: string;
  metadata?: any;
}

export interface Conversation {
  id: number;
  title: string;
  lastActive: string;
  createdAt?: string;
  pursuitId?: string;
  messageCount?: number;
  messages?: Message[];
}

export interface CreateConversationRequest {
  userId: string;
  pursuitId?: string;
  title?: string;
}

export interface AddMessageRequest {
  userId: string;
  type: 'user' | 'ai' | 'system';
  content: string;
  samGovUrl?: string;
  metadata?: any;
}

export interface UpdateConversationRequest {
  userId: string;
  title: string;
}

export class ConversationService {
  static async getConversations(userId: string, pursuitId?: string): Promise<Conversation[]> {
    try {
      const params = new URLSearchParams({ user_id: userId });
      if (pursuitId) {
        params.append('pursuit_id', pursuitId);
      }
      
      const response = await fetch(API_ENDPOINTS.CONVERSATIONS + `?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        return data.conversations;
      } else {
        throw new Error(data.message || 'Failed to fetch conversations');
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
      throw error;
    }
  }

  static async getMessages(conversationId: number, userId: string): Promise<Message[]> {
    try {
      const response = await fetch(`${API_ENDPOINTS.CONVERSATIONS}/${conversationId}/messages?user_id=${userId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        return data.messages;
      } else {
        throw new Error(data.message || 'Failed to fetch messages');
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
  }

  static async createConversation(request: CreateConversationRequest): Promise<number> {
    try {
      const response = await fetch(API_ENDPOINTS.CONVERSATIONS, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        return data.conversationId;
      } else {
        throw new Error(data.message || 'Failed to create conversation');
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
      throw error;
    }
  }

  static async addMessage(conversationId: number, request: AddMessageRequest): Promise<number> {
    try {
      const response = await fetch(`${API_ENDPOINTS.CONVERSATIONS}/${conversationId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        return data.messageId;
      } else {
        throw new Error(data.message || 'Failed to add message');
      }
    } catch (error) {
      console.error('Error adding message:', error);
      throw error;
    }
  }

  static async updateConversation(conversationId: number, request: UpdateConversationRequest): Promise<void> {
    try {
      const response = await fetch(API_ENDPOINTS.CONVERSATIONS + `/${conversationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to update conversation');
      }
    } catch (error) {
      console.error('Error updating conversation:', error);
      throw error;
    }
  }

  static async deleteConversation(conversationId: number, userId: string): Promise<void> {
    try {
      const response = await fetch(API_ENDPOINTS.CONVERSATIONS + `/${conversationId}?user_id=${userId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to delete conversation');
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
      throw error;
    }
  }
}
