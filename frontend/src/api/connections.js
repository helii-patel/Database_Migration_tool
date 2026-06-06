import api from './axios';

export const getConnections = () => api.get('/connections');
export const createConnection = (data) => api.post('/connections', data);
export const updateConnection = (id, data) => api.put(`/connections/${id}`, data);
export const deleteConnection = (id) => api.delete(`/connections/${id}`);
export const testConnection = (id) => api.post(`/connections/${id}/test`);
export const getConnectionTables = (id) => api.get(`/connections/${id}/tables`);
export const getTableColumns = (id, table) => api.get(`/connections/${id}/tables/${table}/columns`);
