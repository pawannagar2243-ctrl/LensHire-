import api from './api';

export const getBookings = (params) => api.get('/bookings', { params });
export const getBooking = (id) => api.get(`/bookings/${id}`);
export const createBooking = (payload) => api.post('/bookings', payload);
export const updateBooking = (id, payload) => api.put(`/bookings/${id}`, payload);
export const deleteBooking = (id) => api.delete(`/bookings/${id}`);

export default { getBookings, getBooking, createBooking, updateBooking, deleteBooking };
