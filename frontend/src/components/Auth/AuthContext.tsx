import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { Session, User, AuthError } from '@supabase/supabase-js';
import { supabase } from '../../utils/supabase';
import tokenService from "../../utils/tokenService";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  register: (firstName: string, lastName: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (data: { firstName?: string; lastName?: string; avatar?: string }) => Promise<void>;
}

// Create the context with a default value
const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  isAuthenticated: false,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  resetPassword: async () => {},
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
        } else {
          tokenService.clearTokens();
        }
      }
    );

    // Clean up subscription on unmount
    return () => {
      subscription.unsubscribe();
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
          created_at: new Date().toISOString(),
        });
        
        if (profileError) {
          console.error('Error creating user profile:', profileError);
          // If profile creation fails, we should ideally delete the auth user
          // but Supabase doesn't expose a direct method for this from client
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

  // Logout function
  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Clear user and session
      setUser(null);
      setSession(null);
      
      // Clear tokens
      tokenService.clearTokens();
    } catch (error) {
      console.error('Logout error:', error);
      throw new Error('Failed to logout');
    }
  };

  // Reset password function
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

  // The value to be provided to consumers
  const value = {
    user,
    session,
    loading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    resetPassword,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;