import api from './axios';

export const getAnalyticsOverview = () => api.get('/analytics/overview');
export const getDbGrowth = () => api.get('/analytics/growth');
