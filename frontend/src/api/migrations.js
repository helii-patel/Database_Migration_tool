import api from './axios';

export const getMigrations = () => api.get('/migrations');
export const getMigration = (id) => api.get(`/migrations/${id}`);
export const createMigration = (data) => api.post('/migrations', data);
export const cancelMigration = (id) => api.post(`/migrations/${id}/cancel`);
export const retryMigration = (id) => api.post(`/migrations/${id}/retry`);
export const getMigrationLogs = (id) => api.get(`/migrations/${id}/logs`);
export const validateMigration = (id) => api.post(`/migrations/${id}/validate`);
