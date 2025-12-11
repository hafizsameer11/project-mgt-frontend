import api from './api';
import { Client } from '../types';

export const clientService = {
  async getAll(filters?: Record<string, any>) {
    const response = await api.get<{ data: Client[] }>('/clients', { params: filters });
    return response.data;
  },

  async getById(id: number) {
    const response = await api.get<Client>(`/clients/${id}`);
    return response.data;
  },

  async create(data: Partial<Client>) {
    const response = await api.post<Client>('/clients', data);
    return response.data;
  },

  async update(id: number, data: Partial<Client>) {
    const response = await api.put<Client>(`/clients/${id}`, data);
    return response.data;
  },

  async delete(id: number) {
    await api.delete(`/clients/${id}`);
  },

  async createUserAccount(id: number, data: { email: string; password: string; password_confirmation: string }) {
    const response = await api.post(`/clients/${id}/create-account`, data);
    return response.data;
  },
};

