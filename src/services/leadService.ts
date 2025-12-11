import api from './api';
import { Lead } from '../types';

export const leadService = {
  async getAll(filters?: Record<string, any>) {
    const response = await api.get<{ data: Lead[] }>('/leads', { params: filters });
    return response.data;
  },

  async getById(id: number) {
    const response = await api.get<Lead>(`/leads/${id}`);
    return response.data;
  },

  async create(data: Partial<Lead>) {
    const response = await api.post<Lead>('/leads', data);
    return response.data;
  },

  async update(id: number, data: Partial<Lead>) {
    const response = await api.put<Lead>(`/leads/${id}`, data);
    return response.data;
  },

  async delete(id: number) {
    await api.delete(`/leads/${id}`);
  },

  async convertToClient(id: number, clientData: any, projectData: any) {
    const response = await api.post(`/leads/${id}/convert`, {
      client: clientData,
      project: projectData,
    });
    return response.data;
  },

  async getFollowUpReminders() {
    const response = await api.get<{ data: Lead[] }>('/leads/follow-up/reminders');
    return response.data;
  },
};

