import api from './api';

export interface GeneralRequest {
  id: number;
  team_id: number;
  title: string;
  description?: string;
  category?: 'Equipment' | 'Software' | 'Training' | 'Other';
  status: 'Pending' | 'Approved' | 'Rejected' | 'In Progress';
  approved_by?: number;
  response?: string;
}

export const generalRequestService = {
  async getAll(filters?: Record<string, any>) {
    const response = await api.get<{ data: GeneralRequest[] }>('/general-requests', { params: filters });
    return response.data;
  },

  async create(data: Partial<GeneralRequest>) {
    const response = await api.post<GeneralRequest>('/general-requests', data);
    return response.data;
  },

  async update(id: number, data: Partial<GeneralRequest>) {
    const response = await api.put<GeneralRequest>(`/general-requests/${id}`, data);
    return response.data;
  },
};

