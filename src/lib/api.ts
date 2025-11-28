import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor for auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// API Endpoints
export const connectVehicle = (data: {
  vehicle_id: string;
  mode: string;
  custom_kwh: number;
}) => api.post('/connect', data);

export const adminLogin = (credentials: {
  username: string;
  password: string;
}) => api.post('/admin/login', credentials);

export const getDashboardStats = () => api.get('/admin/dashboard_stats');
