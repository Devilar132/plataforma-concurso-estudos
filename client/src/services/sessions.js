import api from './api';

export const sessionsService = {
  async getAll(date = null, startDate = null, endDate = null) {
    const params = {};
    if (date) params.date = date;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    
    const response = await api.get('/sessions', { params });
    return response.data;
  },

  async getById(id) {
    const response = await api.get(`/sessions/${id}`);
    return response.data;
  },

  async create(sessionData) {
    const response = await api.post('/sessions', sessionData);
    return response.data;
  },

  async update(id, sessionData) {
    const response = await api.put(`/sessions/${id}`, sessionData);
    return response.data;
  },

  async delete(id) {
    const response = await api.delete(`/sessions/${id}`);
    return response.data;
  },

  async getSummary() {
    const response = await api.get('/sessions/stats/summary');
    return response.data;
  }
};
