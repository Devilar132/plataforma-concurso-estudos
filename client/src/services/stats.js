import api from './api';

export const statsService = {
  async getGeneral() {
    const response = await api.get('/stats');
    return response.data;
  },

  async getPeriod(startDate, endDate) {
    const response = await api.get('/stats/period', {
      params: { startDate, endDate }
    });
    return response.data;
  },

  async getStreak() {
    const response = await api.get('/stats/streak');
    return response.data;
  },

  async getByTag() {
    const response = await api.get('/stats/by-tag');
    return response.data;
  }
};
