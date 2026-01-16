import api from './api';

export const milestonesService = {
  async getAll() {
    const response = await api.get('/milestones');
    return response.data;
  },

  async check() {
    const response = await api.post('/milestones/check');
    return response.data;
  }
};
