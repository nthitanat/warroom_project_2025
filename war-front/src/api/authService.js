import axiosInstance from './axiosInstance';

// Auth endpoints
export const login = (credentials) =>
  axiosInstance.post('/auth/login', credentials);

export const register = (userData) =>
  axiosInstance.post('/auth/register', userData);

export const getCurrentUser = () =>
  axiosInstance.get('/auth/me');

export const checkAdmin = () =>
  axiosInstance.get('/admin/check');
