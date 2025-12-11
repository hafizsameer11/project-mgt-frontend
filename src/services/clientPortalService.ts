import api from './api';

export interface ClientPortalDashboard {
  client: any;
  projects: any[];
  tasks: any[];
  payments: any[];
  requirements: any[];
  documents: any[];
  developers: Record<number, any[]>;
}

export const clientPortalService = {
  async getDashboard(): Promise<ClientPortalDashboard> {
    const response = await api.get<ClientPortalDashboard>('/client-portal/dashboard');
    // Handle both direct data and wrapped response
    return response.data.data || response.data;
  },

  async getProjects() {
    const response = await api.get('/client-portal/projects');
    return response.data;
  },

  async getProject(id: number) {
    const response = await api.get(`/client-portal/projects/${id}`);
    return response.data;
  },

  async getTasks() {
    const response = await api.get('/client-portal/tasks');
    return response.data;
  },

  async getPayments() {
    const response = await api.get('/client-portal/payments');
    return response.data;
  },

  async getRequirements() {
    const response = await api.get('/client-portal/requirements');
    return response.data;
  },

  async getDocuments() {
    const response = await api.get('/client-portal/documents');
    return response.data;
  },
};

