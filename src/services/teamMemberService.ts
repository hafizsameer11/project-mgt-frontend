import api from './api';

export const teamMemberService = {
  async getDashboard() {
    const response = await api.get('/team-member/dashboard');
    return response.data;
  },
};

