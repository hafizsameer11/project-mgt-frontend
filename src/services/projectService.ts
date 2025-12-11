import api from './api';
import { Project } from '../types';

export const projectService = {
  async getAll(filters?: Record<string, any>) {
    const response = await api.get<{ data: Project[] }>('/projects', { params: filters });
    return response.data;
  },

  async getById(id: number) {
    const response = await api.get(`/projects/${id}`);
    // Laravel Resource wraps in 'data' property
    return response.data?.data || response.data;
  },

  async create(data: Partial<Project>) {
    const response = await api.post<Project>('/projects', data);
    return response.data;
  },

  async update(id: number, data: Partial<Project>) {
    const response = await api.put<Project>(`/projects/${id}`, data);
    return response.data;
  },

  async delete(id: number) {
    await api.delete(`/projects/${id}`);
  },
};

