import axios from 'axios';

export const API_BASE_URL: string = import.meta.env.VITE_API_URL || '/api';
/* Origin of the backend when the API URL is absolute (mobile app), '' when proxied (web) */
export const API_ORIGIN = /^https?:\/\//.test(API_BASE_URL) ? new URL(API_BASE_URL).origin : '';

/* Uploaded files are stored as /uploads/... paths; make them loadable from the app too */
export const fileUrl = (url?: string | null) => (!url ? '' : /^https?:\/\//.test(url) ? url : `${API_ORIGIN}${url}`);

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshing: Promise<string> | null = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    // Only try a refresh when we actually have a refresh token (not during sign-in)
    if (error.response?.status === 401 && !original._retry && localStorage.getItem('refreshToken')) {
      original._retry = true;
      try {
        // One refresh at a time: several screens can hit an expired token at once
        refreshing ??= axios
          .post(`${API_BASE_URL}/auth/refresh`, { refreshToken: localStorage.getItem('refreshToken') })
          .then((res) => {
            const { accessToken, refreshToken } = res.data.data;
            localStorage.setItem('accessToken', accessToken);
            if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
            return accessToken as string;
          })
          .finally(() => { refreshing = null; });
        const accessToken = await refreshing;
        original.headers.Authorization = `Bearer ${accessToken}`;
        return api(original);
      } catch {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('rw-session');
        if (!/^\/(signup|login)/.test(window.location.pathname)) window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

export default api;

/* Readable message from an API error */
export const apiError = (e: unknown, fallback = 'Something went wrong') => {
  const err = e as { response?: { data?: { error?: string } }; message?: string };
  if (err?.response?.data?.error) return err.response.data.error;
  if (err?.message === 'Network Error') return 'Cannot reach the server. Check your internet connection.';
  return fallback;
};

export const authService = {
  sendOtp: (phone: string) => api.post('/auth/otp/send', { phone }),
  verifyOtp: (phone: string, otp: string) => api.post('/auth/otp/verify', { phone, otp }),
  signup: (data: object) => api.post('/auth/signup', data),
  logout: () => api.post('/auth/logout', { refreshToken: localStorage.getItem('refreshToken') }),
  me: () => api.get('/auth/me'),
  setLanguage: (language: string) => api.put('/auth/me/language', { language }),
};

export const driverService = {
  getMe: () => api.get('/drivers/me'),
  saveStep: (step: 1 | 2, data: object) => api.put(`/drivers/registration/step/${step}`, data),
  submit: () => api.post('/drivers/registration/submit'),
  updateLocation: (latitude: number, longitude: number) => api.put('/drivers/me/location', { latitude, longitude }),
  setAvailability: (isAvailable: boolean) => api.put('/drivers/me/availability', { isAvailable }),
};

export const documentService = {
  saveUrl: (data: { documentType: string; fileUrl: string; fileName: string; mimeType?: string; fileSize?: number }) =>
    api.post('/documents/save-url', data),
  getMine: () => api.get('/documents/me'),
};

export const vehicleService = {
  create: (data: object) => api.post('/vehicles', data),
  update: (id: string, data: object) => api.put(`/vehicles/${id}`, data),
};

export const notificationService = {
  getAll: () => api.get('/notifications'),
  markAllRead: () => api.put('/notifications/read-all'),
};

export const fleetService = {
  getMe: () => api.get('/fleet/me'),
  updateMe: (data: object) => api.put('/fleet/me', data),
  updateLocation: (latitude: number, longitude: number) => api.put('/fleet/me/location', { latitude, longitude }),
  submit: () => api.post('/fleet/me/submit'),
  addVehicle: (data: object) => api.post('/fleet/vehicles', data),
  deleteVehicle: (id: string) => api.delete(`/fleet/vehicles/${id}`),
  nearbyDrivers: (params: { lat: number; lng: number; radiusKm?: number; vehicleType?: string }) =>
    api.get('/fleet/drivers/nearby', { params }),
};
