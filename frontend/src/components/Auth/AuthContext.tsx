import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { Session, User, AuthError, Provider } from '@supabase/supabase-js';
import { supabase } from '../../utils/supabase';
import tokenService from "../../utils/tokenService";

// Define your API base URL
const isDevelopment = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
const API_BASE_URL = isDevelopment
  ? "http://localhost:5000"
  : import.meta.env.VITE_API_BASE_URL;

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  loginWithOAuth: (provider:Provider) => Promise<string | void>;
  register: (firstName: string, lastName: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (password: string,oldPassword:string) => Promise<void>;
  updateProfile: (data: { firstName?: string; lastName?: string; avatar?: string }) => Promise<void>;
}

// Create the context with a default value
const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  isAuthenticated: false,
  login: async () => {},
  loginWithOAuth: async () => {},
  register: async () => {},
  logout: async () => {},
  resetPassword: async () => {},
  updatePassword: async () => {},
  updateProfile: async () => {},
});

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

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
      
      if (error) throw error;
      
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
  const register = async (firstName: string, lastName: string, email: string, password: string) => {
    setLoading(true);
    
    try {
      // Register the user
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
      
      if (error) throw error;
      
      // Create profile entry
      if (data.user) {
        const { error: profileError } = await supabase.from('profiles').insert({
          id: data.user.id,
          first_name: firstName,
          last_name: lastName,
          email: email,
          role: 'user',
          created_at: new Date().toISOString(),
        });
        
        if (profileError) {
          // If profile creation fails, sign out the user
          await supabase.auth.signOut();
          setUser(null);
          setSession(null);
          tokenService.clearTokens();
          
          // Check if it's a duplicate email error
          if (profileError.code === '23505' && profileError.message?.includes('profiles_email_key')) {
            throw new Error('An account with this email already exists. Please try logging in instead.');
          }
          throw new Error('Failed to create user profile. Please try again.');
        }
      }
      
      // Update state
      setSession(data.session);
      setUser(data.user);
      
      // Store tokens
      if (data.session) {
        tokenService.setTokens(
          data.session.access_token,
          data.session.refresh_token
        );
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
          const response = await fetch(`${API_BASE_URL}/clear-cache`, {
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
      sessionStorage.removeItem("lastOpportunitiesSearchState");
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
  const updatePassword = async (password: string, oldPassword:string) => {
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
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;