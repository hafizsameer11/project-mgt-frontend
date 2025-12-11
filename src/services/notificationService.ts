import api from './api';

export interface Notification {
  id: string;
  type: string;
  data: {
    task_id?: number;
    task_title?: string;
    [key: string]: any;
  };
  read_at: string | null;
  created_at: string;
}

export const notificationService = {
  async getAll() {
    const response = await api.get<{ data: Notification[] }>('/notifications');
    return response.data;
  },

  async getUnreadCount() {
    const response = await api.get<{ count: number }>('/notifications/unread');
    return response.data;
  },

  async markAsRead(id: string) {
    await api.post(`/notifications/${id}/read`);
  },

  async markAllAsRead() {
    await api.post('/notifications/read-all');
  },
};

