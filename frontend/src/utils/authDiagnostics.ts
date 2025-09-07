/**
 * Authentication Diagnostics Utility
 * Helps troubleshoot OTP and authentication issues
 */

export interface AuthDiagnosticInfo {
  timestamp: string;
  userAgent: string;
  url: string;
  supabaseUrl: string;
  hasStoredSession: boolean;
  networkStatus: 'online' | 'offline';
}

export const authDiagnostics = {
  /**
   * Collect diagnostic information for troubleshooting
   */
  collectDiagnosticInfo(): AuthDiagnosticInfo {
    return {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      supabaseUrl: import.meta.env.VITE_SUPABASE_URL || 'Not configured',
      hasStoredSession: !!sessionStorage.getItem("userActiveSession"),
      networkStatus: navigator.onLine ? 'online' : 'offline'
    };
  },

  /**
   * Log diagnostic information for OTP issues
   */
  logOtpAttempt(email: string, type: 'send' | 'verify', success: boolean, error?: any) {
    const diagnostics = this.collectDiagnosticInfo();
    
    console.group(`🔐 OTP ${type.toUpperCase()} - ${success ? 'SUCCESS' : 'FAILED'}`);
    console.log('Email:', email);
    console.log('Timestamp:', diagnostics.timestamp);
    console.log('Network Status:', diagnostics.networkStatus);
    console.log('Supabase URL:', diagnostics.supabaseUrl);
    
    if (!success && error) {
      console.error('Error Details:', error);
      console.log('Error Type:', typeof error);
      console.log('Error Message:', error.message || 'No message');
      console.log('Error Status:', error.status || 'No status');
      console.log('Error Code:', error.code || 'No code');
    }
    
    console.log('Full Diagnostics:', diagnostics);
    console.groupEnd();
  },

  /**
   * Check if the current environment is properly configured for OTP
   */
  checkOtpConfiguration(): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];
    
    // Check Supabase URL
    if (!import.meta.env.VITE_SUPABASE_URL) {
      issues.push('VITE_SUPABASE_URL environment variable is not set');
    }
    
    // Check Supabase Anon Key
    if (!import.meta.env.VITE_SUPABASE_ANON_KEY) {
      issues.push('VITE_SUPABASE_ANON_KEY environment variable is not set');
    }
    
    // Check network connectivity
    if (!navigator.onLine) {
      issues.push('Device appears to be offline');
    }
    
    // Check if we're on HTTPS (required for some auth features)
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
      issues.push('HTTPS is required for OTP authentication in production');
    }
    
    return {
      isValid: issues.length === 0,
      issues
    };
  },

  /**
   * Get user-friendly error message for common OTP issues
   */
  getOtpErrorGuidance(error: any): string {
    const errorMessage = error?.message?.toLowerCase() || '';
    const errorStatus = error?.status;
    
    // Rate limiting
    if (errorMessage.includes('rate limit') || errorMessage.includes('too many')) {
      return 'You\'ve made too many attempts. Please wait 5-10 minutes before trying again.';
    }
    
    // 403 Forbidden
    if (errorStatus === 403 || errorMessage.includes('403') || errorMessage.includes('forbidden')) {
      return 'The verification code has expired or is invalid. Please request a new code and try again.';
    }
    
    // Invalid/expired OTP
    if (errorMessage.includes('invalid') || errorMessage.includes('expired')) {
      return 'The verification code is invalid or has expired. Please request a new code.';
    }
    
    // Network issues
    if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
      return 'Network connection issue. Please check your internet connection and try again.';
    }
    
    // User not found
    if (errorMessage.includes('not found') || errorMessage.includes('user')) {
      return 'No account found with this email address. Please check your email or create an account.';
    }
    
    // Configuration issues
    if (errorMessage.includes('configuration') || errorMessage.includes('setup')) {
      return 'Authentication service configuration issue. Please contact support.';
    }
    
    // Generic fallback
    return 'Verification failed. Please ensure you entered the correct code and try again.';
  },

  /**
   * Clear authentication-related storage (for troubleshooting)
   */
  clearAuthStorage() {
    try {
      sessionStorage.removeItem("userActiveSession");
      // Don't clear supabase session as it's managed by supabase client
      console.log('✅ Authentication storage cleared');
    } catch (error) {
      console.error('❌ Failed to clear auth storage:', error);
    }
  },

  /**
   * Test basic connectivity to Supabase
   */
  async testSupabaseConnectivity(): Promise<{ success: boolean; message: string }> {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!supabaseUrl) {
        return { success: false, message: 'Supabase URL not configured' };
      }
      
      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: 'GET',
        headers: {
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || '',
        },
      });
      
      if (response.ok || response.status === 404) {
        // 404 is expected for the root endpoint
        return { success: true, message: 'Supabase connection successful' };
      } else {
        return { success: false, message: `Supabase connection failed: ${response.status}` };
      }
    } catch (error) {
      return { success: false, message: `Network error: ${error}` };
    }
  }
};

export default authDiagnostics;
