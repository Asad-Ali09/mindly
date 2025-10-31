import apiClient from './axios';

// Types for authentication requests and responses
export interface SignupRequest {
  name: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: {
      id: string;
      name: string;
      email: string;
      createdAt: string;
    };
    token: string;
  };
}

export interface UserProfileResponse {
  success: boolean;
  data: {
    user: {
      id: string;
      name: string;
      email: string;
      createdAt: string;
      updatedAt: string;
    };
  };
}

export interface ErrorResponse {
  success: false;
  message: string;
  error?: string;
}

/**
 * Authentication API Service
 */
class AuthAPI {
  /**
   * Sign up a new user
   * @param data - User signup information
   * @returns Auth response with user data and token
   */
  async signup(data: SignupRequest): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>('/users/signup', data);
      
      // Store token in localStorage
      if (response.data.success && response.data.data.token) {
        this.setToken(response.data.data.token);
      }
      
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Login an existing user
   * @param data - User login credentials
   * @returns Auth response with user data and token
   */
  async login(data: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>('/users/login', data);
      
      // Store token in localStorage
      if (response.data.success && response.data.data.token) {
        this.setToken(response.data.data.token);
      }
      
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Get current authenticated user
   * @returns User profile data
   */
  async getCurrentUser(): Promise<UserProfileResponse> {
    try {
      const response = await apiClient.get<UserProfileResponse>('/users/me', {
        headers: this.getAuthHeaders(),
      });
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Get user profile by ID
   * @param userId - User ID
   * @returns User profile data
   */
  async getUserProfile(userId: string): Promise<UserProfileResponse> {
    try {
      const response = await apiClient.get<UserProfileResponse>(
        `/users/profile/${userId}`,
        {
          headers: this.getAuthHeaders(),
        }
      );
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Logout user (clear local token)
   */
  logout(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
  }

  /**
   * Store auth token in localStorage
   * @param token - JWT token
   */
  setToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
    }
  }

  /**
   * Get auth token from localStorage
   * @returns JWT token or null
   */
  getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token');
    }
    return null;
  }

  /**
   * Check if user is authenticated
   * @returns Boolean indicating authentication status
   */
  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  /**
   * Get authorization headers with token
   * @returns Headers object with Authorization
   */
  getAuthHeaders(): Record<string, string> {
    const token = this.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  /**
   * Handle API errors
   * @param error - Error object from axios
   * @returns Formatted error
   */
  private handleError(error: any): Error {
    if (error.response?.data?.message) {
      return new Error(error.response.data.message);
    }
    return new Error(error.message || 'An unexpected error occurred');
  }
}

// Export singleton instance
const authApi = new AuthAPI();
export default authApi;
