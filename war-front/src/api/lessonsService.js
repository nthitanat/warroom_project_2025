import axiosInstance from './axiosInstance';

// Get all lessons
export const getLessons = (params) =>
  axiosInstance.get('/lessons', { params });

// Alias for getAllLessons
export const getAllLessons = (params) =>
  axiosInstance.get('/lessons', { params });

// Get lesson playlists
export const getLessonPlaylists = () =>
  axiosInstance.get('/lessons/playlists');

// Get lesson by ID
export const getLessonById = (id) =>
  axiosInstance.get(`/lessons/${id}`);

// Get lesson thumbnail by lesson ID
export const getLessonThumbnail = (lessonId) => 
  axiosInstance.get(`/lessons/${lessonId}/thumbnail`, {
    responseType: 'blob'
  });

// Get author avatar by author ID
export const getAuthorAvatar = (authorId) => 
  axiosInstance.get(`/lessons/authors/${authorId}/avatar`, {
    responseType: 'blob'
  });

// Create new lesson (admin only)
export const createLesson = (data) =>
  axiosInstance.post('/lessons', data);

// Update lesson (Admin only)
export const updateLesson = (id, data) =>
  axiosInstance.put(`/lessons/${id}`, data);

// Delete lesson (Admin only)
export const deleteLesson = (id) =>
  axiosInstance.delete(`/lessons/${id}`);
