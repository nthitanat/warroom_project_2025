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

// ===== Charity Items API =====

// Get all charity items (optionally filter by charity_id)
export const getCharityItems = (params) => 
  axiosInstance.get('/charity-items', { params });

// Get items for a specific charity
export const getCharityItemsByCharityId = (charityId) => 
  axiosInstance.get(`/charity-items/charity/${charityId}`);

// Get charity item by ID
export const getCharityItemById = (itemId) => 
  axiosInstance.get(`/charity-items/${itemId}`);

// Create new charity item (admin only)
export const createCharityItem = (charityId, data) => 
  axiosInstance.post(`/charity-items/charity/${charityId}`, data);

// Update charity item (admin only)
export const updateCharityItem = (itemId, data) => 
  axiosInstance.put(`/charity-items/${itemId}`, data);

// Update charity item quantity (admin only)
export const updateCharityItemQuantity = (itemId, amount) => 
  axiosInstance.patch(`/charity-items/${itemId}/quantity`, { amount });

// Delete charity item (admin only)
export const deleteCharityItem = (itemId) => 
  axiosInstance.delete(`/charity-items/${itemId}`);
