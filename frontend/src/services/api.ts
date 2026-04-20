import axios from 'axios';
import { User, Package, Order, ESim } from '../types';

const api = axios.create({
  baseURL: '/api/v1',
  withCredentials: true, // Required for CSRF and Secure Session Cookies
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (email: string, password: string, name: string) =>
    api.post('/auth/register', { email, password, name }),
};

export const userApi = {
  getProfile: (): Promise<{ data: User }> => api.get('/user/profile'),
  updateProfile: (data: Partial<User>) => api.put('/user/profile', data),
};

export const packagesApi = {
  search: (params?: any): Promise<{ data: Package[] }> =>
    api.get('/packages', { params }),
  getDetails: (id: string, providerId: string) =>
    api.get(`/packages/${id}?providerId=${providerId}`),
};

export const ordersApi = {
  create: (packageId: string, providerId: string) =>
    api.post('/orders', { packageId, providerId }),
  getAll: (): Promise<{ data: Order[] }> => api.get('/orders'),
  getById: (id: string): Promise<{ data: Order }> => api.get(`/orders/${id}`),
  cancel: (id: string) => api.post(`/orders/${id}/cancel`),
};

export const esimsApi = {
  getAll: (): Promise<{ data: ESim[] }> => api.get('/esims'),
  getById: (id: string): Promise<{ data: ESim }> => api.get(`/esims/${id}`),
  getQrCode: (id: string) => api.get(`/esims/${id}/qr`),
  getUsage: (id: string) => api.get(`/esims/${id}/usage`),
  activate: (id: string) => api.post(`/esims/${id}/activate`),
};

export const paymentsApi = {
  createIntent: (orderId: string, amount: number, currency: string) =>
    api.post('/payments/create-intent', { orderId, amount, currency }),
  createSession: (orderId: string, method: 'crypto' | 'paystack') =>
    api.post('/payments/create-session', { orderId, method }),
};

export const partnersApi = {
  getWallet: () => api.get('/partners/wallet'),
  topUpWallet: (amount: number) => api.post('/partners/wallet/topup', { amount }),
  getProfile: () => api.get('/partners/profile'),
  updateBranding: (logoUrl: string, primaryColor: string) => 
    api.put('/partners/branding', { logoUrl, primaryColor }),
  regenerateApiKey: () => api.post('/partners/keys/regenerate'),
  updateWebhook: (url: string, secret: string, events: string[]) => 
    api.put('/partners/webhooks', { url, secret, events }),
};

export const adminApi = {
  getDashboard: () => api.get('/admin/dashboard'),
  getProviderHealth: () => api.get('/admin/providers/health'),
  getSalesAnalytics: (days?: number) => api.get(`/admin/analytics/sales${days ? `?days=${days}` : ''}`),
  getUserAnalytics: () => api.get('/admin/analytics/users'),
  updateProviderConfig: (id: string, config: any) => api.put(`/admin/providers/${id}/config`, config),
};