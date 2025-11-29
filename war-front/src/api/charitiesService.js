import axiosInstance from './axiosInstance';

// Get all charities
export const getCharities = (params) => 
  axiosInstance.get('/charities', { params });

// Alias for getAllCharities
export const getAllCharities = (params) => 
  axiosInstance.get('/charities', { params });

// Get charity by ID
export const getCharityById = (id) => 
  axiosInstance.get(`/charities/${id}`);

// Get slides for a specific charity
export const getCharitySlides = (charityId) => 
  axiosInstance.get(`/charities/${charityId}/slides`);

// Get charity slide image by slide ID
export const getCharitySlideImage = (slideId) => 
  axiosInstance.get(`/charities/slides/${slideId}/image`, {
    responseType: 'blob'
  });

// Get charity thumbnail by charity ID
export const getCharityThumbnail = (charityId) => 
  axiosInstance.get(`/charities/${charityId}/thumbnail`, {
    responseType: 'blob'
  });

// Create new charity (admin only)
export const createCharity = (data) => 
  axiosInstance.post('/charities', data);

// Update charity (admin only)
export const updateCharity = (id, data) => 
  axiosInstance.put(`/charities/${id}`, data);

// Delete charity (admin only)
export const deleteCharity = (id) => 
  axiosInstance.delete(`/charities/${id}`);

// ===== Charity Slides API =====

// Create new charity slide (admin only)
export const createCharitySlide = (charityId, data) => 
  axiosInstance.post(`/charities/${charityId}/slides`, data);

// Update charity slide (admin only)
export const updateCharitySlide = (slideId, data) => 
  axiosInstance.put(`/charities/slides/${slideId}`, data);

// Delete charity slide (admin only)
export const deleteCharitySlide = (slideId) => 
  axiosInstance.delete(`/charities/slides/${slideId}`);
