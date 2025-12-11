import api from './api';

export interface Requirement {
  id: number;
  project_id: number;
  title: string;
  description?: string;
  type: 'document' | 'text';
  document_path?: string;
  document_name?: string;
  document_type?: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Draft' | 'Active' | 'Completed' | 'Cancelled';
  created_by: number;
  creator?: any;
  project?: any;
  created_at: string;
  updated_at: string;
}

export const requirementService = {
  async getAll(projectId?: number) {
    const params = projectId ? { project_id: projectId } : {};
    const response = await api.get<{ data: Requirement[] }>('/requirements', { params });
    return response.data;
  },

  async create(data: Partial<Requirement>) {
    const formData = new FormData();
    formData.append('project_id', data.project_id!.toString());
    formData.append('title', data.title!);
    if (data.description) formData.append('description', data.description);
    formData.append('type', data.type!);
    if (data.priority) formData.append('priority', data.priority);
    if (data.status) formData.append('status', data.status);
    
    if (data.type === 'document' && (data as any).document) {
      formData.append('document', (data as any).document);
    }

    const response = await api.post<Requirement>('/requirements', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async update(id: number, data: Partial<Requirement>) {
    const formData = new FormData();
    if (data.title) formData.append('title', data.title);
    if (data.description !== undefined) formData.append('description', data.description || '');
    if (data.type) formData.append('type', data.type);
    if (data.priority) formData.append('priority', data.priority);
    if (data.status) formData.append('status', data.status);
    
    if ((data as any).document) {
      formData.append('document', (data as any).document);
    }

    const response = await api.put<Requirement>(`/requirements/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async delete(id: number) {
    await api.delete(`/requirements/${id}`);
  },

  async download(id: number) {
    const response = await api.get(`/requirements/${id}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },
};

