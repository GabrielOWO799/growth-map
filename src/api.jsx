import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': import.meta.env.VITE_API_KEY  // 添加API Key头
  }
});

export const fetchAchievements = (params) => api.get('/achievements', { params });
export const fetchAchievement = (id) => api.get(`/achievements/${id}`);
export const createAchievement = (data) => api.post('/achievements', data);
export const updateAchievement = (id, data) => api.put(`/achievements/${id}`, data);
export const deleteAchievement = (id) => api.delete(`/achievements/${id}`);
export const fetchStatsByCategory = () => api.get('/achievements/stats/by_category');
export const fetchOverallStats = () => api.get('/achievements/stats/overall');