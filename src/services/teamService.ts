import api from './api';
import { Team } from '../types';

export const teamService = {
  async getAll(filters?: Record<string, any>) {
    const response = await api.get<{ data: Team[] }>('/teams', { params: filters });
    return response.data;
  },

  async getById(id: number) {
    const response = await api.get<Team>(`/teams/${id}`);
    return response.data;
  },

  async create(data: Partial<Team>) {
    const response = await api.post<Team>('/teams', data);
    return response.data;
  },

  async update(id: number, data: Partial<Team>) {
    const response = await api.put<Team>(`/teams/${id}`, data);
    return response.data;
  },

  async delete(id: number) {
    await api.delete(`/teams/${id}`);
  },
};

