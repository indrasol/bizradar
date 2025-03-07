/**
 * Service for handling authentication tokens
 * Manages storing, retrieving, and validating tokens
 */

interface DecodedToken {
    sub: string;
    exp: number;
    iat: number;
    [key: string]: any;
  }
  
  class TokenService {
    private readonly tokenKey: string = 'auth_token';
    private readonly refreshTokenKey: string = 'refresh_token';
    private readonly storage: Storage;
  
    constructor(useSessionStorage: boolean = false) {
      // Use sessionStorage or localStorage based on configuration
      this.storage = useSessionStorage ? sessionStorage : localStorage;
    }
  
    /**
     * Store authentication tokens
     */
    setTokens(accessToken: string, refreshToken?: string): void {
      this.storage.setItem(this.tokenKey, accessToken);
      if (refreshToken) {
        this.storage.setItem(this.refreshTokenKey, refreshToken);
      }
    }
  
    /**
     * Get the access token
     */
    getToken(): string | null {
      return this.storage.getItem(this.tokenKey);
    }
  
    /**
     * Get the refresh token
     */
    getRefreshToken(): string | null {
      return this.storage.getItem(this.refreshTokenKey);
    }
  
    /**
     * Remove all tokens (logout)
     */
    clearTokens(): void {
      this.storage.removeItem(this.tokenKey);
      this.storage.removeItem(this.refreshTokenKey);
    }
  
    /**
     * Check if user has valid tokens
     */
    isAuthenticated(): boolean {
      const token = this.getToken();
      return !!token && !this.isTokenExpired(token);
    }
  
    /**
     * Check if token is expired
     */
    isTokenExpired(token: string): boolean {
      try {
        const decoded = this.decodeToken(token);
        // Check if the expiration time has passed
        return decoded.exp * 1000 < Date.now();
      } catch (error) {
        // If there's an error decoding the token, consider it expired
        return true;
      }
    }
  
    /**
     * Get time remaining before token expires (in seconds)
     */
    getTokenExpiryTime(token: string): number {
      try {
        const decoded = this.decodeToken(token);
        return Math.max(0, decoded.exp - Math.floor(Date.now() / 1000));
      } catch (error) {
        return 0;
      }
    }
  
    /**
     * Decode JWT token
     */
    decodeToken(token: string): DecodedToken {
      try {
        // Split the token and get the payload part
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        
        // Create a safe version for modern browsers
        const decodedPayload = this.safeAtob(base64);
        
        return JSON.parse(decodedPayload);
      } catch (error) {
        throw new Error('Invalid token format');
      }
    }
  
    /**
     * Safely decode base64 string in different environments
     */
    private safeAtob(str: string): string {
      try {
        // Browser environment
        const binaryString = atob(str);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        return new TextDecoder().decode(bytes);
      } catch (e) {
        // Alternative approach if the above fails
        const binaryString = Buffer.from(str, 'base64').toString('binary');
        return decodeURIComponent(
          binaryString
            .split('')
            .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );
      }
    }
  
    /**
     * Get user ID from token
     */
    getUserIdFromToken(token: string = this.getToken() || ''): string | null {
      try {
        const decoded = this.decodeToken(token);
        return decoded.sub || null;
      } catch (error) {
        return null;
      }
    }
  }
  
  // Export a singleton instance
  const tokenService = new TokenService();
  export default tokenService;