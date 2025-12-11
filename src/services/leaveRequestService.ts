import api from './api';

export interface LeaveRequest {
  id: number;
  team_id: number;
  start_date: string;
  end_date: string;
  days?: number;
  type?: 'Sick Leave' | 'Vacation' | 'Personal' | 'Other';
  reason?: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  approved_by?: number;
  rejection_reason?: string;
}

export const leaveRequestService = {
  async getAll(filters?: Record<string, any>) {
    const response = await api.get<{ data: LeaveRequest[] }>('/leave-requests', { params: filters });
    return response.data;
  },

  async create(data: Partial<LeaveRequest>) {
    const response = await api.post<LeaveRequest>('/leave-requests', data);
    return response.data;
  },

  async update(id: number, data: Partial<LeaveRequest>) {
    const response = await api.put<LeaveRequest>(`/leave-requests/${id}`, data);
    return response.data;
  },
};

