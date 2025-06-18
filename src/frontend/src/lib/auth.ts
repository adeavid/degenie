// Simple authentication service for DeGenie
import { apiService } from './api';

interface AuthResponse {
  token: string;
  user: {
    id: string;
    walletAddress: string;
    tier: 'free' | 'starter' | 'viral';
    credits: number;
  };
}

class AuthService {
  private token: string | null = null;

  constructor() {
    // Load token from localStorage on initialization
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
    }
  }

  async loginWithWallet(walletAddress: string): Promise<AuthResponse | null> {
    try {
      console.log('Attempting wallet login for:', walletAddress);
      console.log('Backend URL:', 'http://localhost:4000');
      
      const response = await fetch('http://localhost:4000/api/auth/wallet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress,
          // No signature needed for now - backend accepts walletAddress only
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Login failed');
      }

      const data = await response.json();
      this.setToken(data.token);
      console.log('Login successful:', data);
      return data;
    } catch (error) {
      console.error('Authentication failed:', error);
      
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        throw new Error('Backend server is not running. Please start the backend server on port 4000.');
      }
      
      throw error;
    }
  }

  async registerWithWallet(walletAddress: string): Promise<AuthResponse | null> {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress,
          username: `user_${walletAddress.slice(-6)}`
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Registration failed');
      }

      const data = await response.json();
      this.setToken(data.token);
      return data;
    } catch (error) {
      console.error('Registration failed:', error);
      throw error; // Don't fall back to mock auth - throw real errors
    }
  }

  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
    }
  }

  getToken(): string | null {
    return this.token;
  }

  logout() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }

  getAuthHeaders(): Record<string, string> {
    if (this.token) {
      return {
        'Authorization': `Bearer ${this.token}`
      };
    }
    return {};
  }
}

export const authService = new AuthService();
export default authService;