import axios from 'axios';
import jwtDecode from 'jwt-decode';

// Create an axios instance with default config
const api = axios.create({
  baseURL: '/api', // This will be updated based on environment
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include auth token in requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add a response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If error is 401 and we haven't tried to refresh the token yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Try to refresh the token
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }
        
        const response = await axios.post('/api/auth/refresh-token', {
          refreshToken,
        });
        
        const { accessToken } = response.data;
        localStorage.setItem('accessToken', accessToken);
        
        // Retry the original request with the new token
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // If refresh fails, log out the user
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// Authentication API methods
const authAPI = {
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    const { accessToken, refreshToken } = response.data;
    
    // Store tokens
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    
    // Decode and return user info
    const user = jwtDecode(accessToken);
    return user;
  },
  
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },
  
  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  },
  
  forgotPassword: async (email) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },
  
  resetPassword: async (token, newPassword) => {
    const response = await api.post('/auth/reset-password', {
      token,
      newPassword,
    });
    return response.data;
  },
  
  getCurrentUser: () => {
    const token = localStorage.getItem('accessToken');
    if (!token) return null;
    
    try {
      return jwtDecode(token);
    } catch (error) {
      console.error('Invalid token', error);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      return null;
    }
  },
  
  updateProfile: async (userData) => {
    const response = await api.put('/users/profile', userData);
    return response.data;
  },
};

// Doctor API methods
const doctorAPI = {
  getProfile: async () => {
    const response = await api.get('/doctors/profile');
    return response.data;
  },
  
  updatePreferences: async (preferences) => {
    const response = await api.put('/doctors/preferences', preferences);
    return response.data;
  },
  
  getSchedule: async (month, year) => {
    const response = await api.get(`/doctors/schedule?month=${month}&year=${year}`);
    return response.data;
  },
  
  getRecertificationStatus: async () => {
    const response = await api.get('/doctors/recertification');
    return response.data;
  },
  
  submitRecertification: async (data) => {
    const response = await api.post('/doctors/recertification', data);
    return response.data;
  },
};

// Admin API methods
const adminAPI = {
  getAllDoctors: async () => {
    const response = await api.get('/admin/doctors');
    return response.data;
  },
  
  getDoctorById: async (id) => {
    const response = await api.get(`/admin/doctors/${id}`);
    return response.data;
  },
  
  updateDoctor: async (id, data) => {
    const response = await api.put(`/admin/doctors/${id}`, data);
    return response.data;
  },
  
  generateSchedule: async (month, year, parameters) => {
    const response = await api.post('/admin/schedule/generate', {
      month,
      year,
      parameters,
    });
    return response.data;
  },
  
  getSchedule: async (month, year) => {
    const response = await api.get(`/admin/schedule?month=${month}&year=${year}`);
    return response.data;
  },
  
  updateSchedule: async (scheduleData) => {
    const response = await api.put('/admin/schedule', scheduleData);
    return response.data;
  },
  
  exportSchedule: async (month, year, format) => {
    const response = await api.get(`/admin/schedule/export?month=${month}&year=${year}&format=${format}`, {
      responseType: 'blob',
    });
    return response.data;
  },
  
  getRecertificationStatus: async () => {
    const response = await api.get('/admin/recertification');
    return response.data;
  },
};

export { api, authAPI, doctorAPI, adminAPI };