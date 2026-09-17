import api from './api';

export const getCameras = (params) => api.get('/cameras', { params });
export const getCamera = (id) => api.get(`/cameras/${id}`);
export const createCamera = (payload) => api.post('/cameras', payload);
export const updateCamera = (id, payload) => api.put(`/cameras/${id}`, payload);
export const deleteCamera = (id) => api.delete(`/cameras/${id}`);

export default { getCameras, getCamera, createCamera, updateCamera, deleteCamera };
