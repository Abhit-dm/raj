import axios from 'axios';
import { API_BASE_URL } from './api';

const adminApi = axios.create({ baseURL: API_BASE_URL, withCredentials: true, headers: { 'Content-Type': 'application/json' } });

adminApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

adminApi.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401 || err.response?.status === 403) {
      localStorage.removeItem('adminToken');
      if (window.location.pathname !== '/admin/login') window.location.href = '/admin/login';
    }
    return Promise.reject(err);
  },
);

export type DriverBucket = 'all' | 'incomplete' | 'completed' | 'rc_pending' | 'resubmission' | 'approved' | 'rejected';

export const adminService = {
  login: (email: string, password: string) => adminApi.post('/admin/login', { email, password }),
  getStats: () => adminApi.get('/admin/stats'),
  getDrivers: (params: { bucket?: DriverBucket; search?: string; page?: number }) => adminApi.get('/admin/drivers', { params }),
  getDriver: (id: string) => adminApi.get(`/admin/drivers/${id}`),
  createDriver: (data: object) => adminApi.post('/admin/drivers', data),
  updateStatus: (id: string, status: string, rejectionReason?: string) => adminApi.put(`/admin/drivers/${id}/status`, { status, rejectionReason }),
  reviewDocument: (id: string, status: 'VERIFIED' | 'RESUBMISSION_REQUIRED', reason?: string) => adminApi.put(`/admin/documents/${id}`, { status, reason }),
  getFleetOwners: (params: { status?: string; search?: string }) => adminApi.get('/admin/fleet-owners', { params }),
  getFleetOwner: (id: string) => adminApi.get(`/admin/fleet-owners/${id}`),
  updateFleetOwnerStatus: (id: string, status: string, rejectionReason?: string) => adminApi.put(`/admin/fleet-owners/${id}/status`, { status, rejectionReason }),
};
