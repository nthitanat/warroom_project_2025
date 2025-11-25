import axiosInstance from './axiosInstance';

// Get all warroom entries
export const getWarroomEntries = (params) => 
  axiosInstance.get('/warroom', { params });

// Alias for getAllWarroom
export const getAllWarroom = (params) => 
  axiosInstance.get('/warroom', { params });

// Get warroom entry by ID
export const getWarroomById = (id) => 
  axiosInstance.get(`/warroom/${id}`);

// Create new warroom entry (admin only)
export const createWarroomEntry = (data) => 
  axiosInstance.post('/warroom', data);

// Update warroom entry (admin only)
export const updateWarroomEntry = (id, data) => 
  axiosInstance.put(`/warroom/${id}`, data);

// Delete warroom entry (admin only)
export const deleteWarroomEntry = (id) => 
  axiosInstance.delete(`/warroom/${id}`);
