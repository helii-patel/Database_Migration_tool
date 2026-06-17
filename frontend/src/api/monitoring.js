import api from './axios';

export const getMetrics = (connId) => api.get(`/monitoring/${connId}/metrics`);
export const getMetricsHistory = (connId, minutes = 30) =>
  api.get(`/monitoring/${connId}/history?minutes=${minutes}`);
export const getSlowQueries = (connId) => api.get(`/monitoring/${connId}/slow-queries`);
