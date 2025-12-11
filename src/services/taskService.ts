import api from './api';
import { Task } from '../types';

export const taskService = {
  async getAll(filters?: Record<string, any>) {
    const response = await api.get<{ data: Task[] }>('/tasks', { params: filters });
    return response.data;
  },

  async getById(id: number) {
    const response = await api.get<Task>(`/tasks/${id}`);
    return response.data;
  },

  async create(data: Partial<Task>) {
    const response = await api.post<Task>('/tasks', data);
    return response.data;
  },

  async update(id: number, data: Partial<Task>) {
    const response = await api.put<Task>(`/tasks/${id}`, data);
    return response.data;
  },

  async delete(id: number) {
    await api.delete(`/tasks/${id}`);
  },

  async startTimer(taskId: number) {
    const response = await api.post(`/tasks/${taskId}/timer/start`);
    return response.data;
  },

  async stopTimer(timerId: number) {
    const response = await api.post(`/tasks/timer/${timerId}/stop`);
    return response.data;
  },
};

