import React, { createContext, useState, useEffect, ReactNode } from "react";
import auth, { User } from "../../api/auth";
import tokenService from "../../utils/tokenService";

// Define auth context type
interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (identifier: string, password: string) => Promise<void>;
  register: (firstName: string, lastName: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  updateProfile: (userData: Partial<User>) => Promise<void>;
  forgotPassword: (email: string) => Promise<{ message: string; success: boolean }>;
  resetPassword: (token: string, password: string) => Promise<{ message: string; success: boolean }>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ message: string; success: boolean }>;
}

// Create the auth context with default values
const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  loading: false,
  error: null,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  clearError: () => {},
  updateProfile: async () => {},
  forgotPassword: async () => ({ message: "", success: false }),
  resetPassword: async () => ({ message: "", success: false }),
  changePassword: async () => ({ message: "", success: false }),
});

interface AuthProviderProps {
  children: ReactNode;
}

// Create the auth provider component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(tokenService.isAuthenticated());
  const [user, setUser] = useState<User | null>(auth.getCurrentUser());
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Check authentication on mount and set up token expiry handling
  useEffect(() => {
    const checkAuth = () => {
      const authenticated = tokenService.isAuthenticated();
      setIsAuthenticated(authenticated);
      
      if (authenticated) {
        setUser(auth.getCurrentUser());
      } else {
        setUser(null);
      }
    };

    // Initial check
    checkAuth();

    // Set up interval to check token expiry periodically
    const intervalId = setInterval(() => {
      if (tokenService.getToken() && !tokenService.isAuthenticated()) {
        // Token expired, update state
        setIsAuthenticated(false);
        setUser(null);
      }
    }, 60000); // Check every minute

    return () => clearInterval(intervalId);
  }, []);

  // Clear any error message
  const clearError = () => setError(null);

  // Login function
  const login = async (identifier: string, password: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await auth.login(identifier, password);
      setUser(response.user);
      setIsAuthenticated(true);
    } catch (err: any) {
      const errorMsg = err.message || "Login failed. Please check your credentials.";
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Register function
  const register = async (firstName: string, lastName: string, email: string, password: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await auth.register(firstName, lastName, email, password);
      setUser(response.user);
      setIsAuthenticated(true);
    } catch (err: any) {
      const errorMsg = err.message || "Registration failed. Please try again.";
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    auth.logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  // Update profile function
  const updateProfile = async (userData: Partial<User>) => {
    setLoading(true);
    setError(null);

    try {
      const updatedUser = await auth.updateProfile(userData);
      setUser(updatedUser);
    } catch (err: any) {
      const errorMsg = err.message || "Profile update failed. Please try again.";
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Forgot password function
  const forgotPassword = async (email: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await auth.forgotPassword(email);
      return response;
    } catch (err: any) {
      const errorMsg = err.message || "Password reset request failed. Please try again.";
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Reset password function
  const resetPassword = async (token: string, password: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await auth.resetPassword(token, password);
      return response;
    } catch (err: any) {
      const errorMsg = err.message || "Password reset failed. Please try again.";
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Change password function
  const changePassword = async (currentPassword: string, newPassword: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await auth.changePassword(currentPassword, newPassword);
      return response;
    } catch (err: any) {
      const errorMsg = err.message || "Password change failed. Please try again.";
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        loading,
        error,
        login,
        register,
        logout,
        clearError,
        updateProfile,
        forgotPassword,
        resetPassword,
        changePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;