// src/config/env.ts
// This file provides typed access to environment variables

interface EnvConfig {
    APP_ENV: string;
    SUPABASE_URL: string;
    SUPABASE_ANON_KEY: string;
    SUPABASE_SERVICE_KEY: string;
    BASE_API_URL: string;
    DEV_BASE_API_URL: string;
  }
  
  // Helper function to convert string 'true'/'false' to boolean
  const stringToBoolean = (value: string | undefined): boolean => {
    return value?.toLowerCase() === 'true';
  };
  
  // Load and type the environment variables
  export const env: EnvConfig = {
    APP_ENV: import.meta.env.VITE_APP_ENV || 'development',
    SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || '',
    SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
    SUPABASE_SERVICE_KEY: import.meta.env.VITE_SUPABASE_SERVICE_KEY || '',
    BASE_API_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
    DEV_BASE_API_URL: import.meta.env.VITE_DEV_BASE_API_URL || 'http://localhost:8000/v1'
  };
  
  // Useful getters for determining environment and feature flags
  export const isDevelopment = env.APP_ENV === 'development';
  export const isProduction = env.APP_ENV === 'production';
  
  // Get the correct API URL based on environment
  export const getApiUrl = (): string => {
    const baseUrl = env.BASE_API_URL;
    
    // Ensure baseUrl doesn't have trailing slash
    return baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  };