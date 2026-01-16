import api from './api';

export const streakService = {
  async useFreeze() {
    const response = await api.post('/streak/freeze');
    return response.data;
  },

  async recoverDay(date) {
    const response = await api.post('/streak/recover', { date });
    return response.data;
  },

  async getRecoveryInfo() {
    const response = await api.get('/streak/recovery-info');
    return response.data;
  }
};
