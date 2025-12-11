import api from './api';
import { User } from '../types';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  role?: string;
}

export const authService = {
  async login(credentials: LoginCredentials) {
    const response = await api.post<{ user: User; token: string }>('/login', credentials);
    return response.data;
  },

  async register(data: RegisterData) {
    const response = await api.post<{ user: User; token: string }>('/register', data);
    return response.data;
  },

  async logout() {
    await api.post('/logout');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  async getProfile() {
    const response = await api.get<User>('/profile');
    return response.data;
  },

  async updateProfile(data: Partial<User>) {
    const response = await api.put<User>('/profile', data);
    return response.data;
  },

  async changePassword(data: { current_password: string; password: string; password_confirmation: string }) {
    const response = await api.post('/change-password', data);
    return response.data;
  },
};

