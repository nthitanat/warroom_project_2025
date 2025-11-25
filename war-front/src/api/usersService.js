import axiosInstance from './axiosInstance';

// Get all users (Admin only)
export const getUsers = (params) =>
  axiosInstance.get('/users', { params });

// Get user by ID (Admin only)
export const getUserById = (id) =>
  axiosInstance.get(`/users/${id}`);

// Update user (Admin only)
export const updateUser = (id, data) =>
  axiosInstance.put(`/users/${id}`, data);

// Delete user (Admin only)
export const deleteUser = (id) =>
  axiosInstance.delete(`/users/${id}`);
