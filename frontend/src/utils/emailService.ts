import { supabase } from './supabase';

const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_BASE_URL = isDevelopment ? 'http://localhost:5000' : import.meta.env.VITE_API_BASE_URL;

interface EmailResponse {
  success: boolean;
  message: string;
}

/**
 * Email service for handling newsletter subscriptions and other email communications
 */
class EmailService {
  /**
   * Subscribe to newsletter
   */
  async subscribeToNewsletter(email: string): Promise<EmailResponse> {
    try {
      // Store the email in the newsletter_subscribers table
      const { error } = await supabase
        .from('newsletter_subscribers')
        .insert([{ 
          email, 
          subscribed_at: new Date().toISOString(),
          is_active: true
        }]);

      if (error) throw error;

      // Send welcome email using SendGrid
      const response = await fetch(`${API_BASE_URL}/api/send-welcome-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          name: email.split('@')[0], // Use part before @ as name
          unsubscribe_link: `${window.location.origin}/unsubscribe?email=${encodeURIComponent(email)}`
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to send welcome email');
      }

      return {
        success: true,
        message: "Successfully subscribed to newsletter"
      };
    } catch (error: any) {
      throw new Error(error.message || 'Failed to subscribe to newsletter');
    }
  }
}

export const emailService = new EmailService(); 