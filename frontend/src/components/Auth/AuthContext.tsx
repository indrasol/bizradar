import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { Session, User, AuthError, Provider } from '@supabase/supabase-js';
import { supabase } from '../../utils/supabase';
import tokenService from "../../utils/tokenService";
import { subscriptionApi } from '@/api/subscription';
import { authDiagnostics } from '@/utils/authDiagnostics';
import { useUpgradeModal } from '../subscription/UpgradeModalContext';
import { API_ENDPOINTS } from '@/config/apiEndpoints';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  loginWithOAuth: (provider: Provider) => Promise<string | void>;
  register: (firstName: string, lastName: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (password: string, oldPassword: string) => Promise<void>;
  updateProfile: (data: { firstName?: string; lastName?: string; avatar?: string }) => Promise<void>;
  sendPhoneOtp: (phone: string) => Promise<void>;
  verifyPhoneOtp: (phone: string, otp: string) => Promise<{ success: boolean; user: User; session: Session; }>;
  updatePhoneNumber: (phone: string) => Promise<void>;
  sendEmailOtp: (email: string) => Promise<void>;
  verifyEmailOtp: (email: string, otp: string, firstName?: string, lastName?: string) => Promise<{ success: boolean; user: User; session: Session; }>;
  signupWithOtp: (firstName: string, lastName: string, email: string) => Promise<void>;
  checkUserExists: (email: string) => Promise<boolean>;
}

// Create the context with a default value
const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  isAuthenticated: false,
  login: async () => { },
  loginWithOAuth: async () => { },
  register: async () => { },
  logout: async () => { },
  resetPassword: async () => { },
  updatePassword: async () => { },
  updateProfile: async () => { },
  sendPhoneOtp: async () => { },
  verifyPhoneOtp: async () => ({ success: false, user: {} as User, session: {} as Session }),
  updatePhoneNumber: async () => { },
  sendEmailOtp: async () => { },
  verifyEmailOtp: async () => ({ success: false, user: {} as User, session: {} as Session }),
  signupWithOtp: async () => { },
  checkUserExists: async () => false,
});

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const { isOpen: isUpgradeModalOpen, openModal, closeModal } = useUpgradeModal();

  // Initialize the auth state on component mount
  useEffect(() => {
    // Get the current session
    const initializeAuth = async () => {
      setLoading(true);

      // Check if session exists
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.error('Error retrieving session:', error);
      }

      if (session) {
        setSession(session);
        setUser(session.user);

        // Store tokens for other API requests
        tokenService.setTokens(
          session.access_token,
          session.refresh_token
        );

        // Set session marker for browser close detection
        sessionStorage.setItem("userActiveSession", "true");
      }

      setLoading(false);
    };

    // Call the initialization
    initializeAuth();

    // Set up listener for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user || null);

        if (newSession) {
          tokenService.setTokens(
            newSession.access_token,
            newSession.refresh_token
          );

          // Update session marker
          sessionStorage.setItem("userActiveSession", "true");

        } else {
          tokenService.clearTokens();
          sessionStorage.removeItem("userActiveSession");
        }
      }
    );

    // Browser close detection
    const handleBeforeUnload = () => {
      // Session marker will be lost when browser closes
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    // Clean up subscription on unmount
    return () => {
      subscription.unsubscribe();
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  // Login function
  const login = async (identifier: string, password: string) => {
    setLoading(true);

    try {
      // Check if identifier is email
      const isEmail = identifier.includes('@');

      let response;

      if (isEmail) {
        // Login with email/password
        response = await supabase.auth.signInWithPassword({
          email: identifier,
          password,
        });
      } else {
        // For username login, we need a different approach
        // First, query the user profiles table to get the email
        const { data: profiles, error: profileError } = await supabase
          .from('profiles')
          .select('email')
          .eq('username', identifier)
          .single();

        if (profileError || !profiles) {
          throw new Error('Username not found');
        }

        // Then sign in with the email
        response = await supabase.auth.signInWithPassword({
          email: profiles.email,
          password,
        });
      }

      const { data, error } = response;

      if (error) {
        // Check if error is due to unconfirmed email
        if (error.message?.toLowerCase().includes('email not confirmed') || 
            error.message?.toLowerCase().includes('confirm your email')) {
          throw new Error('Please check your email and confirm your account before logging in.');
        }
        throw error;
      }

      // Check if user's email is confirmed
      if (data.user && !data.user.email_confirmed_at) {
        throw new Error('Please check your email and confirm your account before logging in.');
      }

      setSession(data.session);
      setUser(data.user);

      // Store tokens
      if (data.session) {
        tokenService.setTokens(
          data.session.access_token,
          data.session.refresh_token
        );

        // Set session marker
        sessionStorage.setItem("userActiveSession", "true");

        // --- Device/Session Tracking Logic ---
        // Generate or retrieve a unique device_id for this browser
        // Device tracking removed - using Supabase Auth built-in session management only
        console.log('Login successful - relying on Supabase Auth session management');
      }
    } catch (error) {
      const authError = error as AuthError;
      console.error('Login error:', authError);
      throw new Error(authError.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  // Register function
  // const register = async (firstName: string, lastName: string, email: string, password: string) => {
  //   setLoading(true);

  //   try {
  //     // Register the user
  //     const { data, error } = await supabase.auth.signUp({
  //       email,
  //       password,
  //       options: {
  //         data: {
  //           first_name: firstName,
  //           last_name: lastName,
  //         },
  //       },
  //     });

  //     if (error) throw error;

  //     // Create profile entry
  //     if (data.user) {
  //       const { error: profileError } = await supabase.from('profiles').insert({
  //         id: data.user.id,
  //         first_name: firstName,
  //         last_name: lastName,
  //         email: email,
  //         role: 'user',
  //         created_at: new Date().toISOString(),
  //       });

  //       if (profileError) {
  //         // If profile creation fails, sign out the user
  //         await supabase.auth.signOut();
  //         setUser(null);
  //         setSession(null);
  //         tokenService.clearTokens();

  //         // Check if it's a duplicate email error
  //         if (profileError.code === '23505' && profileError.message?.includes('profiles_email_key')) {
  //           throw new Error('An account with this email already exists. Please try logging in instead.');
  //         }
  //         throw new Error('Failed to create user profile. Please try again.');
  //       }
  //     }

  //     // Update state
  //     setSession(data.session);
  //     setUser(data.user);

  //     // Store tokens
  //     if (data.session) {
  //       tokenService.setTokens(
  //         data.session.access_token,
  //         data.session.refresh_token
  //       );
  //     }
  //   } catch (error) {
  //     const authError = error as AuthError;
  //     console.error('Registration error:', authError);
  //     throw new Error(authError.message || 'Failed to register');
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const register = async (
    firstName: string,
    lastName: string,
    email: string,
    password: string,
    // setUser: (user: any) => void,
    // setSession: (session: any) => void,
    // setLoading: (isLoading: boolean) => void
  ) => {
    setLoading(true);

    try {

      // Step 1: Check if user already exists in auth.users
      const { data: existingUser } = await supabase
        .from('profiles') // or `auth.users` if you have access
        .select('id')
        .eq('email', email)
        .maybeSingle();

      if (existingUser) {
        throw new Error('An account with this email already exists. Please log in instead.');
      }

      // Sign up the user with custom user_metadata
      console.log('Attempting signup with:', { email, firstName, lastName });
      
      // Sign up the user with custom user_metadata
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
          },
        },
      });

      if (error) {
        console.error('Detailed signup error:', {
          message: error.message,
          status: error.status,
          details: error
        });
        
        // Duplicate email or any other auth error
        if (error.message.toLowerCase().includes('user already registered')) {
          throw new Error('An account with this email already exists. Please try logging in.');
        }
        throw error;
      }

      if (data.user) {
        // Update profile fields (first_name/last_name) since the trigger only inserts basic info
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            first_name: firstName,
            last_name: lastName,
          })
          .eq('id', data.user.id);

        if (updateError) {
          console.warn('Profile update failed:', updateError.message);
        }

        // Set user and session (session will be null since email confirmation is required)
        setUser(data.user);
        setSession(data.session);

        // Email confirmation is always required, so no session will be returned
        if (data.session) {
          // This shouldn't happen with email confirmation enabled
          tokenService.setTokens(
            data.session.access_token,
            data.session.refresh_token
          );
        } else {
          // Expected behavior - email confirmation required
          console.log('Email confirmation required - no session returned');
        }

        // Note: Subscription will be created after company setup is completed
      }
    } catch (error) {
      const authError = error as AuthError;
      console.error('Registration error:', authError);
      throw new Error(authError.message || 'Failed to register');
    } finally {
      setLoading(false);
    }
  };

  // Logout function - UPDATED to clear cache
  const logout = async () => {
    try {
      // Clear cache if user exists - WITH BETTER ERROR HANDLING
      if (user) {
        try {
          const response = await fetch(API_ENDPOINTS.CLEAR_CACHE, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: user.id }),
          });

          // FIX: Check the response status properly
          if (!response.ok) {
            console.warn("Error clearing user cache:", await response.text());
          } else {
            console.log("User cache cleared successfully");
          }
        } catch (e) {
          console.error("Error clearing user cache:", e);
          // Continue with logout even if cache clearing fails
        }
      }

      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // Clear user and session
      setUser(null);
      setSession(null);

      // Clear tokens and session marker
      tokenService.clearTokens();
      sessionStorage.removeItem("userActiveSession");
      // Clear search/session related data
      sessionStorage.removeItem("lastOpportunitiesSearchState");
      sessionStorage.removeItem("aiRecommendations");
      sessionStorage.removeItem("allOpportunitiesForExport");
      sessionStorage.removeItem("userProfile");
      sessionStorage.removeItem("currentContract");
      sessionStorage.removeItem("selectedOpportunity");
      // Optional related localStorage keys that shouldn't persist across accounts
      localStorage.removeItem("auth_user");
    } catch (error) {
      console.error('Logout error:', error);
      throw new Error('Failed to logout');
    }
  };

  // Reset password function - sends a password reset email
  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;
    } catch (error) {
      const authError = error as AuthError;
      console.error('Reset password error:', authError);
      throw new Error(authError.message || 'Failed to send reset password email');
    }
  };

  // Update password function - used when user is already authenticated or has a recovery token
  const updatePassword = async (password: string, oldPassword: string) => {
    try {

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.error('Failed to get user:', userError.message);
        throw new Error('Failed to get current user details');
      }

      const email = user.email;

      // Step 1: Re-authenticate
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: oldPassword,
      });

      if (signInError) {
        console.error('Old password is incorrect:', signInError.message);
        throw new Error('Incorrect current password. Please verify and re-enter.');
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      });

      if (updateError) {
        console.error('Update new password error:', updateError);
        throw new Error('Failed to update password');
      }
    } catch (error) {
      const authError = error as AuthError;
      console.error('Update password error:', authError);
      throw new Error(authError.message || 'Failed to update password');
    }
  };

  // Update user profile
  const updateProfile = async (data: { firstName?: string; lastName?: string; avatar?: string }) => {
    if (!user) throw new Error('No authenticated user');

    try {
      // Update auth metadata
      const authUpdate: Record<string, any> = {};
      if (data.firstName) authUpdate.first_name = data.firstName;
      if (data.lastName) authUpdate.last_name = data.lastName;

      if (Object.keys(authUpdate).length > 0) {
        const { error: authError } = await supabase.auth.updateUser({
          data: authUpdate,
        });

        if (authError) throw authError;
      }

      // Update profile
      const profileUpdate: Record<string, any> = {};
      if (data.firstName) profileUpdate.first_name = data.firstName;
      if (data.lastName) profileUpdate.last_name = data.lastName;
      if (data.avatar) profileUpdate.avatar_url = data.avatar;

      if (Object.keys(profileUpdate).length > 0) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update(profileUpdate)
          .eq('id', user.id);

        if (profileError) throw profileError;
      }
    } catch (error) {
      console.error('Update profile error:', error);
      throw new Error('Failed to update profile');
    }
  };

  // Update password function - used when user is already authenticated or has a recovery token
  const loginWithOAuth = async (provider: Provider) => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: window.location.origin,
        },
      })

      if (error) {
        console.error("OAuth sign-in failed:", error.message)
        // Optional: show toast, alert, or return the error message
        return error.message
      }

      // Usually this doesn't reach here because the browser redirects
    } catch (err: any) {
      console.error("Unexpected error during OAuth:", err.message)
      return "Unexpected login error"
    }
  };

  const sendPhoneOtp = async (phone: string) => {
    try {
      const { error } = await supabase.auth.signInWithOtp({ phone });
      if (error) {
        console.error("Failed to send OTP:", error);
        throw new Error(error.message);
      }
    } catch (error) {
      throw new Error((error as AuthError).message || 'Failed to send OTP');
    }
  };

  const verifyPhoneOtp = async (phone: string, otp: string) => {
    try {
      console.log("Attempting SMS OTP verification for phone:", phone);
      
      const { data, error } = await supabase.auth.verifyOtp({
        phone,
        token: otp,
        type: 'sms',
      });

      if (error) {
        console.error("SMS OTP verification error:", error);
        console.error("Error details:", {
          message: error.message,
          status: error.status,
          code: error.code || 'unknown'
        });
        
        // Provide more specific error messages based on error type
        if (error.message?.includes('403') || error.status === 403) {
          throw new Error('SMS OTP verification failed. The code may have expired or is invalid. Please request a new code.');
        } else if (error.message?.includes('rate limit') || error.message?.includes('too many')) {
          throw new Error('Too many attempts. Please wait a few minutes before trying again.');
        } else if (error.message?.includes('invalid') || error.message?.includes('expired')) {
          throw new Error('Invalid or expired SMS code. Please request a new code.');
        } else {
          throw new Error(error.message || 'SMS OTP verification failed. Please try again.');
        }
      }

      // After successful verification, Supabase signs in user with a session
      if (data.session && data.user) {
        setSession(data.session);
        setUser(data.user);
        tokenService.setTokens(data.session.access_token, data.session.refresh_token);
        sessionStorage.setItem("userActiveSession", "true");
        
        // Log successful verification for diagnostics
        authDiagnostics.logOtpAttempt(phone, 'verify', true, null);
        
        // Return success to indicate verification completed
        return { success: true, user: data.user, session: data.session };
      } else {
        throw new Error('Phone OTP verification failed - no session returned');
      }
    } catch (error) {
      authDiagnostics.logOtpAttempt(phone, 'verify', false, error);
      throw new Error((error as AuthError).message || 'Failed to verify OTP');
    }
  };

  const updatePhoneNumber = async (phone: string) => {
    try {
      const { error } = await supabase.auth.updateUser({ phone });

      if (error) {
        console.error("Phone update error:", error);
        throw new Error(error.message);
      }

      setUser(prev => prev ? { ...prev, phone } : prev);
    } catch (error) {
      throw new Error((error as AuthError).message || 'Failed to update phone number');
    }
  };

  // Email OTP functions
  const sendEmailOtp = async (email: string) => {
    try {
      console.log("Sending OTP to email:", email);
      
      const { error } = await supabase.auth.signInWithOtp({ 
        email,
        options: {
          shouldCreateUser: false, // For login, don't create new users
        }
      });
      
      if (error) {
        console.error("Failed to send email OTP:", error);
        console.error("Error details:", {
          message: error.message,
          status: error.status,
          code: error.code || 'unknown'
        });
        
        // Provide more specific error messages
        if (error.message?.includes('rate limit') || error.message?.includes('too many')) {
          throw new Error('Too many OTP requests. Please wait a few minutes before requesting another code.');
        } else if (error.message?.includes('not found') || error.message?.includes('user')) {
          throw new Error('No account found with this email address. Please check your email or sign up.');
        } else {
          throw new Error(error.message || 'Failed to send OTP. Please try again.');
        }
      }
      
      console.log("OTP sent successfully to:", email);
      authDiagnostics.logOtpAttempt(email, 'send', true);
    } catch (error) {
      authDiagnostics.logOtpAttempt(email, 'send', false, error);
      throw new Error((error as AuthError).message || 'Failed to send OTP');
    }
  };

  const verifyEmailOtp = async (email: string, otp: string, firstName?: string, lastName?: string) => {
    try {
      console.log("Attempting OTP verification for email:", email);
      
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'email',
      });

      if (error) {
        console.error("Email OTP verification error:", error);
        console.error("Error details:", {
          message: error.message,
          status: error.status,
          code: error.code || 'unknown'
        });
        
        // Provide more specific error messages based on error type
        if (error.message?.includes('403') || error.status === 403) {
          throw new Error('OTP verification failed. The code may have expired or is invalid. Please request a new code.');
        } else if (error.message?.includes('rate limit') || error.message?.includes('too many')) {
          throw new Error('Too many attempts. Please wait a few minutes before trying again.');
        } else if (error.message?.includes('invalid') || error.message?.includes('expired')) {
          throw new Error('Invalid or expired OTP code. Please request a new code.');
        } else {
          throw new Error(error.message || 'OTP verification failed. Please try again.');
        }
      }

      // After successful verification, Supabase signs in user with a session
      if (data.session && data.user) {
        // If this is a new signup (firstName and lastName provided), update profile
        if (firstName && lastName) {
          try {
            const { error: updateError } = await supabase
              .from('profiles')
              .update({
                first_name: firstName,
                last_name: lastName,
              })
              .eq('id', data.user.id);

            if (updateError) {
              console.warn('Profile update failed:', updateError.message);
            }
          } catch (profileError) {
            console.warn('Profile update error:', profileError);
          }
        }

        setSession(data.session);
        setUser(data.user);
        tokenService.setTokens(data.session.access_token, data.session.refresh_token);
        sessionStorage.setItem("userActiveSession", "true");

        // Device tracking removed - Supabase Auth handles session management automatically
        console.log('Email OTP verification successful - session managed by Supabase Auth');

        // Create trial subscription for new signups
        if (firstName && lastName) {
          try {
            await subscriptionApi.getStatus(data.user.id);
          } catch (e) {
            // ignore – will also run on auth init
          }
        }

        // Log successful verification for diagnostics
        authDiagnostics.logOtpAttempt(email, 'verify', true, null);
        
        // Return success to indicate verification completed
        return { success: true, user: data.user, session: data.session };
      } else {
        throw new Error('OTP verification failed - no session returned');
      }
    } catch (error) {
      authDiagnostics.logOtpAttempt(email, 'verify', false, error);
      throw new Error((error as AuthError).message || 'Failed to verify OTP');
    }
  };

  const signupWithOtp = async (firstName: string, lastName: string, email: string) => {
    try {
      // First, check if user already exists
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .maybeSingle();

      if (existingUser) {
        throw new Error('An account with this email already exists. Please log in instead.');
      }

      // Send OTP for signup - this will create the user if they don't exist
      const { error } = await supabase.auth.signInWithOtp({ 
        email,
        options: {
          shouldCreateUser: true, // Allow user creation for signup
          data: {
            first_name: firstName,
            last_name: lastName,
          }
        }
      });
      
      if (error) {
        console.error("Failed to send signup OTP:", error);
        throw new Error(error.message);
      }
    } catch (error) {
      throw new Error((error as AuthError).message || 'Failed to send signup OTP');
    }
  };

  const checkUserExists = async (email: string): Promise<boolean> => {
    try {
      // Check if user exists in profiles table
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .maybeSingle();

      return !!existingUser;
    } catch (error) {
      console.error("Error checking user existence:", error);
      // In case of error, assume user doesn't exist to allow them to try signup
      return false;
    }
  };

  // The value to be provided to consumers
  const value = {
    user,
    session,
    loading,
    isAuthenticated: !!user,
    login,
    loginWithOAuth,
    register,
    logout,
    resetPassword,
    updatePassword,
    updateProfile,
    sendPhoneOtp,
    verifyPhoneOtp,
    updatePhoneNumber,
    sendEmailOtp,
    verifyEmailOtp,
    signupWithOtp,
    checkUserExists,
    refreshTrialStatus: async () => {
      if (!user) return;
      try {
        const status = await subscriptionApi.getStatus(user.id);
        const info = {
          remainingDays: status.remaining_days ?? 0,
          isTrial: status.is_trial ?? false,
          expired: status.expired ?? false
        };
      } catch (e) {
        // ignore
      }
    }
  };

  const handleUpgrade = () => {
    // Open the upgrade modal directly using the global context
    // The blocker will be hidden by the shouldShowBlocker logic when modal opens
    openModal();
  };

  const handleLogout = async () => {
    try {
      // Close the upgrade modal first if it's open
      if (isUpgradeModalOpen) {
        closeModal();
      }
      await logout();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
      
    </AuthContext.Provider>
  );
};

export default AuthContext;