import api from './api';

export interface ProjectDocument {
  id: number;
  project_id: number;
  title: string;
  type: 'Document' | 'GitHub Credentials' | 'Server Credentials' | 'Database Credentials' | 'API Keys' | 'Domain Credentials' | 'Hosting Credentials' | 'Other';
  description?: string;
  file_path?: string;
  credentials?: any;
  url?: string;
  notes?: string;
  uploaded_by?: number;
  created_at: string;
  updated_at: string;
}

export const projectDocumentService = {
  async getByProject(projectId: number) {
    const response = await api.get<ProjectDocument[]>(`/project-documents?project_id=${projectId}`);
    return response.data;
  },

  async create(data: Partial<ProjectDocument>, file?: File) {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if (key === 'credentials' && data.credentials) {
        formData.append(key, JSON.stringify(data.credentials));
      } else if (data[key as keyof ProjectDocument] !== undefined) {
        formData.append(key, data[key as keyof ProjectDocument] as any);
      }
    });
    if (file) {
      formData.append('file', file);
    }

    const response = await api.post<ProjectDocument>('/project-documents', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async update(id: number, data: Partial<ProjectDocument>, file?: File) {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if (key === 'credentials' && data.credentials) {
        formData.append(key, JSON.stringify(data.credentials));
      } else if (data[key as keyof ProjectDocument] !== undefined) {
        formData.append(key, data[key as keyof ProjectDocument] as any);
      }
    });
    if (file) {
      formData.append('file', file);
    }

    const response = await api.put<ProjectDocument>(`/project-documents/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async delete(id: number) {
    await api.delete(`/project-documents/${id}`);
  },

  async download(id: number) {
    const response = await api.get(`/project-documents/${id}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },
};

