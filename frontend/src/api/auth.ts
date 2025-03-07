import apiClient from '../utils/apiclient';
import tokenService from '../utils/tokenService';

// Define user interface
export interface User {
  id: string;
  firstName?: string;
  lastName?: string;
  email: string;
  username?: string;
  avatarUrl?: string;
  role?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Define auth response interface
export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken?: string;
}

// Define password reset request response
export interface PasswordResetResponse {
  message: string;
  success: boolean;
}

/**
 * Authentication service with methods for login, register, password reset, etc.
 */
class AuthService {
  private currentUser: User | null = null;

  constructor() {
    this.loadUserFromStorage();
  }

  /**
   * Load user data from storage
   */
  private loadUserFromStorage(): void {
    const userStr = localStorage.getItem('auth_user');
    if (userStr) {
      try {
        this.currentUser = JSON.parse(userStr);
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        this.currentUser = null;
      }
    }
  }

  /**
   * Save user data to storage
   */
  private saveUserToStorage(user: User): void {
    localStorage.setItem('auth_user', JSON.stringify(user));
    this.currentUser = user;
  }

  /**
   * Login user with email/username and password
   */
  async login(identifier: string, password: string): Promise<AuthResponse> {
    try {
      // In a real implementation, this would be an actual API call
      // const response = await apiClient.post<AuthResponse>('/auth/login', { identifier, password });
      
      // For demo purposes, we'll simulate the API response
      const response = this.simulateLoginResponse(identifier);
      const { user, accessToken, refreshToken } = response;
      
      // Store auth data
      tokenService.setTokens(accessToken, refreshToken);
      this.saveUserToStorage(user);
      
      return response;
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Register a new user
   */
  async register(firstName: string, lastName: string, email: string, password: string): Promise<AuthResponse> {
    try {
      // In a real implementation, this would be an actual API call
      // const response = await apiClient.post<AuthResponse>('/auth/register', {
      //   firstName, lastName, email, password
      // });
      
      // For demo purposes, we'll simulate the API response
      const response = this.simulateRegisterResponse(firstName, lastName, email);
      const { user, accessToken, refreshToken } = response;
      
      // Store auth data
      tokenService.setTokens(accessToken, refreshToken);
      this.saveUserToStorage(user);
      
      return response;
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Request a password reset
   */
  async forgotPassword(email: string): Promise<PasswordResetResponse> {
    try {
      // In a real implementation, this would be an actual API call
      // return await apiClient.post<PasswordResetResponse>('/auth/forgot-password', { email });
      
      // For demo purposes, simulate a success response
      return { 
        message: 'Password reset instructions sent to your email',
        success: true 
      };
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, password: string): Promise<PasswordResetResponse> {
    try {
      // In a real implementation, this would be an actual API call
      // return await apiClient.post<PasswordResetResponse>('/auth/reset-password', { token, password });
      
      // For demo purposes, simulate a success response
      return { 
        message: 'Password has been reset successfully', 
        success: true 
      };
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(userData: Partial<User>): Promise<User> {
    try {
      if (!this.currentUser) {
        throw new Error('User not authenticated');
      }
      
      // In a real implementation, this would be an actual API call
      // const updatedUser = await apiClient.put<User>('/users/profile', userData);
      
      // For demo purposes, simulate a response
      const updatedUser = {
        ...this.currentUser,
        ...userData,
        updatedAt: new Date().toISOString()
      };
      
      this.saveUserToStorage(updatedUser);
      return updatedUser;
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Change user password
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<PasswordResetResponse> {
    try {
      // In a real implementation, this would be an actual API call
      // return await apiClient.post<PasswordResetResponse>('/auth/change-password', {
      //   currentPassword, newPassword
      // });
      
      // For demo purposes, simulate a success response
      return { 
        message: 'Password has been changed successfully', 
        success: true 
      };
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Log out current user
   */
  logout(): void {
    // Clear stored auth data
    tokenService.clearTokens();
    localStorage.removeItem('auth_user');
    this.currentUser = null;
    
    // Optional: Make API call to invalidate token on server
    // apiClient.post('/auth/logout', {});
  }

  /**
   * Get current authenticated user
   */
  getCurrentUser(): User | null {
    if (this.currentUser) return this.currentUser;
    
    this.loadUserFromStorage();
    return this.currentUser;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return tokenService.isAuthenticated();
  }

  /**
   * Get time until token expiry in seconds
   */
  getTokenExpiryTime(): number {
    const token = tokenService.getToken();
    if (!token) return 0;
    return tokenService.getTokenExpiryTime(token);
  }

  /**
   * For demo purposes - simulate login API response
   */
  private simulateLoginResponse(identifier: string): AuthResponse {
    const isEmail = identifier.includes('@');
    const username = isEmail ? identifier.split('@')[0] : identifier;
    
    return {
      accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyXzEyMyIsImV4cCI6MTcyNTMxMDgyOCwiaWF0IjoxNzA5ODM3MjI4fQ.XEq0W_rxKxC-o_Wshlj4G9GJEHYgCqrJN9LVKcSjDJA",
      refreshToken: "refresh_token_" + Math.random().toString(36).substring(2),
      user: {
        id: "user_" + Math.random().toString(36).substring(2),
        email: isEmail ? identifier : `${username}@example.com`,
        username: username,
        firstName: "Demo",
        lastName: "User",
        avatarUrl: "https://ui-avatars.com/api/?name=Demo+User&background=0D8ABC&color=fff",
        role: "user",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
    };
  }

  /**
   * For demo purposes - simulate register API response
   */
  private simulateRegisterResponse(firstName: string, lastName: string, email: string): AuthResponse {
    const username = email.split('@')[0];
    
    return {
      accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyXzEyMyIsImV4cCI6MTcyNTMxMDgyOCwiaWF0IjoxNzA5ODM3MjI4fQ.XEq0W_rxKxC-o_Wshlj4G9GJEHYgCqrJN9LVKcSjDJA",
      refreshToken: "refresh_token_" + Math.random().toString(36).substring(2),
      user: {
        id: "user_" + Math.random().toString(36).substring(2),
        email: email,
        username: username,
        firstName: firstName,
        lastName: lastName,
        avatarUrl: `https://ui-avatars.com/api/?name=${firstName}+${lastName}&background=0D8ABC&color=fff`,
        role: "user",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
    };
  }
}

// Export singleton instance
const authService = new AuthService();
export default authService;