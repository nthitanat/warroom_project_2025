import axios from 'axios';

// Switch between development and production API base URL
const getApiBaseUrl = () => {
  if (process.env.DEPLOYMENT_MODE === 'production') {
    return process.env.PROD_REACT_APP_API_BASE_URL || 'https://engagement.chula.ac.th/war-room-api';
  }
  return process.env.DEV_REACT_APP_API_BASE_URL || 'http://localhost:4000/api';
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
