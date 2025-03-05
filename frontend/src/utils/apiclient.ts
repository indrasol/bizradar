import tokenService from './tokenService';

// Define request options interface
interface RequestOptions extends RequestInit {
  params?: Record<string, string>;
  onUploadProgress?: (percentage: number) => void;
}

// Define response type
interface ApiResponse<T> {
  data: T;
  status: number;
  statusText: string;
  headers: Headers;
}

/**
 * API Client for making authenticated HTTP requests using native fetch
 */
class ApiClient {
  private baseURL: string;
  private isRefreshing: boolean = false;
  private refreshSubscribers: Array<(token: string) => void> = [];

  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || 'https://api.bizradar.com';
  }

  /**
   * Add query parameters to URL
   */
  private addParamsToUrl(url: string, params?: Record<string, string>): string {
    if (!params) return url;
    
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      searchParams.append(key, value);
    });
    
    const queryString = searchParams.toString();
    if (queryString) {
      return `${url}${url.includes('?') ? '&' : '?'}${queryString}`;
    }
    
    return url;
  }

  /**
   * Create request headers with authentication
   */
  private createHeaders(customHeaders?: HeadersInit): Headers {
    const headers = new Headers(customHeaders);
    
    // Set default headers if not overridden
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
    
    if (!headers.has('Accept')) {
      headers.set('Accept', 'application/json');
    }
    
    // Add authorization header if token exists
    const token = tokenService.getToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    
    return headers;
  }

  /**
   * Execute fetch request with error handling and token refresh
   */
  private async fetchWithAuth<T>(
    url: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    // Build full URL with query parameters
    const fullUrl = this.addParamsToUrl(
      url.startsWith('http') ? url : `${this.baseURL}${url}`,
      options.params
    );
    
    // Create headers with auth token
    const headers = this.createHeaders(options.headers);
    
    // Execute request
    try {
      const response = await fetch(fullUrl, {
        ...options,
        headers
      });
      
      // Handle token expiration (401 Unauthorized)
      if (response.status === 401 && tokenService.getRefreshToken()) {
        // Try to refresh the token and retry the request
        return this.handleTokenRefresh<T>(fullUrl, options);
      }
      
      // Handle non-2xx responses
      if (!response.ok) {
        return this.handleErrorResponse(response);
      }
      
      // Parse response body
      let data: T;
      const contentType = response.headers.get('Content-Type');
      
      if (contentType?.includes('application/json')) {
        data = await response.json();
      } else if (contentType?.includes('text/')) {
        data = await response.text() as unknown as T;
      } else {
        data = await response.blob() as unknown as T;
      }
      
      // Return successful response
      return {
        data,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers
      };
    } catch (error) {
      // Handle network errors
      const networkError = new Error(
        'Network error. Please check your connection.'
      );
      (networkError as any).status = 0;
      throw networkError;
    }
  }

  /**
   * Handle error responses
   */
  private async handleErrorResponse(response: Response): Promise<never> {
    let errorMessage = `Request failed with status ${response.status}`;
    let errorData = {};
    
    try {
      // Try to parse error message from response
      if (response.headers.get('Content-Type')?.includes('application/json')) {
        const data = await response.json();
        errorData = data;
        errorMessage = data.message || data.error || errorMessage;
      } else {
        errorMessage = await response.text();
      }
    } catch (e) {
      // If parsing fails, use default error message
    }
    
    const error = new Error(errorMessage);
    (error as any).status = response.status;
    (error as any).data = errorData;
    
    throw error;
  }

  /**
   * Handle token refresh and request retry
   */
  private async handleTokenRefresh<T>(
    url: string,
    options: RequestOptions
  ): Promise<ApiResponse<T>> {
    // Wait for token refresh if already in progress
    if (this.isRefreshing) {
      return new Promise((resolve, reject) => {
        this.refreshSubscribers.push(async (token) => {
          try {
            // Update Authorization header and retry
            const headers = new Headers(options.headers);
            headers.set('Authorization', `Bearer ${token}`);
            
            const retryOptions = {
              ...options,
              headers
            };
            
            // Retry original request with new token
            const result = await this.fetchWithAuth<T>(url, retryOptions);
            resolve(result);
          } catch (err) {
            reject(err);
          }
        });
      });
    }
    
    // Start token refresh process
    this.isRefreshing = true;
    
    try {
      // Obtain new token
      const token = await this.refreshToken();
      
      // Notify subscribers about the new token
      this.refreshSubscribers.forEach((callback) => callback(token));
      this.refreshSubscribers = [];
      
      // Retry original request with new token
      const headers = new Headers(options.headers);
      headers.set('Authorization', `Bearer ${token}`);
      
      const retryOptions = {
        ...options,
        headers
      };
      
      return await this.fetchWithAuth<T>(url, retryOptions);
    } catch (refreshError) {
      // If refresh fails, redirect to login
      tokenService.clearTokens();
      window.location.href = '/login';
      throw refreshError;
    } finally {
      this.isRefreshing = false;
    }
  }

  /**
   * Refresh the access token using refresh token
   */
  private async refreshToken(): Promise<string> {
    try {
      const refreshToken = tokenService.getRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }
      
      const response = await fetch(`${this.baseURL}/auth/refresh-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refreshToken })
      });
      
      if (!response.ok) {
        throw new Error('Token refresh failed');
      }
      
      const data = await response.json();
      const { accessToken, refreshToken: newRefreshToken } = data;
      
      // Store the new tokens
      tokenService.setTokens(accessToken, newRefreshToken);
      
      return accessToken;
    } catch (error) {
      console.error('Token refresh failed:', error);
      throw error;
    }
  }

  /**
   * Make a GET request
   */
  async get<T = any>(url: string, options: RequestOptions = {}): Promise<T> {
    const response = await this.fetchWithAuth<T>(url, {
      ...options,
      method: 'GET'
    });
    return response.data;
  }

  /**
   * Make a POST request
   */
  async post<T = any>(url: string, data?: any, options: RequestOptions = {}): Promise<T> {
    const response = await this.fetchWithAuth<T>(url, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined
    });
    return response.data;
  }

  /**
   * Make a PUT request
   */
  async put<T = any>(url: string, data?: any, options: RequestOptions = {}): Promise<T> {
    const response = await this.fetchWithAuth<T>(url, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined
    });
    return response.data;
  }

  /**
   * Make a PATCH request
   */
  async patch<T = any>(url: string, data?: any, options: RequestOptions = {}): Promise<T> {
    const response = await this.fetchWithAuth<T>(url, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined
    });
    return response.data;
  }

  /**
   * Make a DELETE request
   */
  async delete<T = any>(url: string, options: RequestOptions = {}): Promise<T> {
    const response = await this.fetchWithAuth<T>(url, {
      ...options,
      method: 'DELETE'
    });
    return response.data;
  }

  /**
   * Upload file(s) with progress tracking
   */
  async uploadFile<T = any>(
    url: string,
    files: File | File[] | FormData,
    onProgress?: (percentage: number) => void,
    options: RequestOptions = {}
  ): Promise<T> {
    // Create form data if not already provided
    let formData: FormData;
    
    if (files instanceof FormData) {
      formData = files;
    } else {
      formData = new FormData();
      if (Array.isArray(files)) {
        files.forEach((file, index) => {
          formData.append(`file${index}`, file);
        });
      } else {
        formData.append('file', files);
      }
    }
    
    // For progress tracking, we need to use XMLHttpRequest instead of fetch
    if (onProgress) {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        // Setup progress tracking
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const percentage = Math.round((event.loaded * 100) / event.total);
            onProgress(percentage);
          }
        });
        
        // Setup completion handler
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              resolve(response);
            } catch (e) {
              resolve(xhr.responseText as unknown as T);
            }
          } else {
            try {
              const errorData = JSON.parse(xhr.responseText);
              const error = new Error(errorData.message || 'Upload failed');
              (error as any).status = xhr.status;
              (error as any).data = errorData;
              reject(error);
            } catch (e) {
              reject(new Error(`Upload failed with status ${xhr.status}`));
            }
          }
        };
        
        // Setup error handler
        xhr.onerror = () => {
          reject(new Error('Network error during file upload'));
        };
        
        // Open and send request
        const fullUrl = this.addParamsToUrl(
          url.startsWith('http') ? url : `${this.baseURL}${url}`,
          options.params
        );
        
        xhr.open('POST', fullUrl, true);
        
        // Add authorization header if available
        const token = tokenService.getToken();
        if (token) {
          xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        }
        
        // Add custom headers (except Content-Type which is auto-set with FormData)
        const headers = this.createHeaders(options.headers);
        headers.forEach((value, key) => {
          if (key !== 'Content-Type') {
            xhr.setRequestHeader(key, value);
          }
        });
        
        xhr.send(formData);
      });
    }
    
    // If no progress tracking needed, use normal fetch
    const response = await this.fetchWithAuth<T>(url, {
      ...options,
      method: 'POST',
      body: formData,
      headers: new Headers({
        // Don't set Content-Type for FormData as browser will set it with boundary
        ...(options.headers || {})
      })
    });
    
    return response.data;
  }
}

// Export singleton instance
const apiClient = new ApiClient();
export default apiClient;