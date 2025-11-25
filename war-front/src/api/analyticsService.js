import axiosInstance from './axiosInstance';

// Fetch analytics data from API server
export const fetchAnalyticsData = async () => {
  try {
    const response = await axiosInstance.get('/analytics/data');
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch analytics data');
  }
};

// Fetch village info
export const fetchVillageInfo = async () => {
  try {
    const response = await axiosInstance.get('/analytics/village-info');
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch village info');
  }
};
