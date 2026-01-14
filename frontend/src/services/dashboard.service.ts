/**
 * Dashboard Service
 * Handles all dashboard API calls
 * Modular, type-safe, error-handled
 */

import axios, { AxiosError } from 'axios';
import { DashboardData, DashboardError } from '@/types/dashboard';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3002/api/v1';

class DashboardService {
  private client = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  /**
   * Add auth token to requests
   */
  setAuthToken(token: string) {
    this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  /**
   * Get complete dashboard data
   */
  async getDashboardData(): Promise<DashboardData> {
    try {
      const response = await this.client.get<DashboardData>('/dashboard');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get user's active eSIMs
   */
  async getActiveESIMs() {
    try {
      const response = await this.client.get('/esims?status=ACTIVE');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get recent orders
   */
  async getRecentOrders(limit: number = 5) {
    try {
      const response = await this.client.get(`/orders?limit=${limit}&sort=createdAt:desc`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get dashboard statistics
   */
  async getStats() {
    try {
      const response = await this.client.get('/dashboard/stats');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get eSIM QR code
   */
  async getESIMQRCode(esimId: string) {
    try {
      const response = await this.client.get(`/esims/${esimId}/qr`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get eSIM usage details
   */
  async getESIMUsage(esimId: string) {
    try {
      const response = await this.client.get(`/esims/${esimId}/usage`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Suspend eSIM
   */
  async suspendESIM(esimId: string) {
    try {
      const response = await this.client.post(`/esims/${esimId}/suspend`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Activate eSIM
   */
  async activateESIM(esimId: string) {
    try {
      const response = await this.client.post(`/esims/${esimId}/activate`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Error handler
   */
  private handleError(error: unknown): DashboardError {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      return {
        code: axiosError.code || 'UNKNOWN_ERROR',
        message: axiosError.message || 'An error occurred',
        timestamp: new Date().toISOString(),
      };
    }

    return {
      code: 'UNKNOWN_ERROR',
      message: 'An unexpected error occurred',
      timestamp: new Date().toISOString(),
    };
  }
}

export const dashboardService = new DashboardService();
