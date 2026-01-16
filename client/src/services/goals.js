import api from './api';

export const goalsService = {
  async getAll(date = null, startDate = null, endDate = null) {
    const params = {};
    if (date) params.date = date;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    
    const response = await api.get('/goals', { params });
    return response.data;
  },

  async getById(id) {
    const response = await api.get(`/goals/${id}`);
    return response.data;
  },

  async create(goalData) {
    const response = await api.post('/goals', goalData);
    return response.data;
  },

  async update(id, goalData) {
    const response = await api.put(`/goals/${id}`, goalData);
    return response.data;
  },

  async toggle(id) {
    const response = await api.patch(`/goals/${id}/toggle`);
    return response.data;
  },

  async delete(id) {
    const response = await api.delete(`/goals/${id}`);
    return response.data;
  }
};
