import axios from 'axios';

// Switch between development and production API base URL
const getApiBaseUrl = () => {
  // Use build-time environment variable if available (injected during build)
  if (process.env.REACT_APP_API_BASE_URL) {
    return process.env.REACT_APP_API_BASE_URL;
  }
  // Production default (for static deployment)
  // Note: Must include /api suffix since all routes use /api prefix
  return 'https://engagement.chula.ac.th/war-room-api/api';
};

const axiosInstance = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor for auth tokens
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor for global error handling
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Only redirect to signin for protected routes (admin, user profile, etc.)
      const token = localStorage.getItem('token');
      if (token) {
        // Token exists but is invalid - clear it and redirect
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/signin';
      }
      // If no token, let the error propagate without redirecting
      // (public pages should handle this gracefully)
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
