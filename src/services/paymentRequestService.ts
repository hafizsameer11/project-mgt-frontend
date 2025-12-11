import api from './api';

export interface PaymentRequest {
  id: number;
  team_id: number;
  project_id?: number;
  amount: number;
  reason?: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  approved_by?: number;
  rejection_reason?: string;
}

export const paymentRequestService = {
  async getAll(filters?: Record<string, any>) {
    const response = await api.get<{ data: PaymentRequest[] }>('/payment-requests', { params: filters });
    return response.data;
  },

  async create(data: Partial<PaymentRequest>) {
    const response = await api.post<PaymentRequest>('/payment-requests', data);
    return response.data;
  },

  async update(id: number, data: Partial<PaymentRequest>) {
    const response = await api.put<PaymentRequest>(`/payment-requests/${id}`, data);
    return response.data;
  },
};

