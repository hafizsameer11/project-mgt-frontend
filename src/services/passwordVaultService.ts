import api from './api';

export interface PasswordVault {
  id: number;
  client_id: number;
  title?: string;
  username?: string;
  password?: string;
  url?: string;
  category?: 'Server' | 'Domain' | 'Hosting' | 'Admin Panel';
  extra_notes?: string;
}

export const passwordVaultService = {
  async getByClient(clientId: number) {
    const response = await api.get<PasswordVault[]>(`/password-vaults?client_id=${clientId}`);
    return response.data;
  },

  async create(data: Partial<PasswordVault>) {
    const response = await api.post<PasswordVault>('/password-vaults', data);
    return response.data;
  },

  async update(id: number, data: Partial<PasswordVault>) {
    const response = await api.put<PasswordVault>(`/password-vaults/${id}`, data);
    return response.data;
  },

  async delete(id: number) {
    await api.delete(`/password-vaults/${id}`);
  },
};

