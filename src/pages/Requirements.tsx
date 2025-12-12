import { useEffect, useState } from 'react';
import { requirementService, Requirement } from '../services/requirementService';
import { projectService } from '../services/projectService';
import { Modal } from '../components/ui/Modal';
import { RequirementForm } from '../components/forms/RequirementForm';
import { DataTable } from '../components/ui/DataTable';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { useAuthStore } from '../store/authStore';
import { Project } from '../types';
import { FileText, Download } from 'lucide-react';
import api from '../services/api';

export default function Requirements() {
  const { user } = useAuthStore();
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRequirement, setSelectedRequirement] = useState<Requirement | undefined>();
  const [selectedProjectId, setSelectedProjectId] = useState<number | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filterProjectId, setFilterProjectId] = useState<number | ''>('');

  const canManage = user?.role === 'Admin' || user?.role === 'Project Manager';
  const canView = canManage || user?.role === 'Developer';

  useEffect(() => {
    if (!canView) {
      return;
    }
    if (canManage) {
      fetchProjects();
    }
    fetchRequirements();
  }, [canView, canManage, filterProjectId]);

  const fetchProjects = async () => {
    try {
      const response = await projectService.getAll();
      setProjects(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const fetchRequirements = async () => {
    try {
      setLoading(true);
      const projectId = filterProjectId ? Number(filterProjectId) : undefined;
      const response = await requirementService.getAll(projectId);
      const data = Array.isArray(response.data) ? response.data : (Array.isArray(response) ? response : []);
      setRequirements(data);
    } catch (error) {
      console.error('Error fetching requirements:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = (projectId?: number) => {
    setSelectedRequirement(undefined);
    setSelectedProjectId(projectId);
    setIsModalOpen(true);
  };

  const handleEdit = (requirement: Requirement) => {
    setSelectedRequirement(requirement);
    setSelectedProjectId(requirement.project_id);
    setIsModalOpen(true);
  };

  const handleSubmit = async (data: Partial<Requirement> & { document?: File }) => {
    try {
      setIsSubmitting(true);
      const submitData = {
        ...data,
        project_id: selectedProjectId || data.project_id,
      };

      if (selectedRequirement) {
        await requirementService.update(selectedRequirement.id, submitData);
      } else {
        await requirementService.create(submitData);
      }
      setIsModalOpen(false);
      fetchRequirements();
    } catch (error) {
      console.error('Error saving requirement:', error);
      alert('Error saving requirement');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this requirement?')) {
      try {
        await requirementService.delete(id);
        fetchRequirements();
      } catch (error) {
        console.error('Error deleting requirement:', error);
        alert('Error deleting requirement');
      }
    }
  };

  const handleDownload = async (requirement: Requirement) => {
    try {
      const response = await api.get(`/requirements/${requirement.id}/download`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', requirement.document_name || 'requirement.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error downloading requirement:', error);
      alert('Error downloading requirement');
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
      'Draft': 'default',
      'Active': 'success',
      'Completed': 'success',
      'Cancelled': 'danger',
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
      'Low': 'default',
      'Medium': 'info',
      'High': 'warning',
      'Critical': 'danger',
    };
    return <Badge variant={variants[priority] || 'default'}>{priority}</Badge>;
  };

  if (!canView) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="text-center text-gray-600">You don't have permission to view this page.</div>
      </div>
    );
  }

  const columns = [
    { key: 'title', header: 'Title' },
    {
      key: 'project',
      header: 'Project',
      render: (req: Requirement) => req.project?.title || 'N/A',
    },
    {
      key: 'type',
      header: 'Type',
      render: (req: Requirement) => (
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4" />
          <span className="capitalize">{req.type}</span>
        </div>
      ),
    },
    {
      key: 'priority',
      header: 'Priority',
      render: (req: Requirement) => getPriorityBadge(req.priority || 'Medium'),
    },
    {
      key: 'status',
      header: 'Status',
      render: (req: Requirement) => getStatusBadge(req.status || 'Draft'),
    },
    {
      key: 'document',
      header: 'Document',
      render: (req: Requirement) => {
        if (req.type === 'document' && req.document_name) {
          return (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleDownload(req)}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              {req.document_name}
            </Button>
          );
        }
        return <span className="text-gray-400">N/A</span>;
      },
    },
    ...(canManage ? [{
      key: 'actions',
      header: 'Actions',
      render: (req: Requirement) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => handleEdit(req)}>
            Edit
          </Button>
          <Button size="sm" variant="danger" onClick={() => handleDelete(req.id)}>
            Delete
          </Button>
        </div>
      ),
    }] : []),
  ];

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Requirements Management
          </h1>
          <p className="text-gray-600">Manage project requirements and documents</p>
        </div>
        {canManage && (
          <div className="flex gap-3">
            <select
              value={filterProjectId}
              onChange={(e) => setFilterProjectId(e.target.value ? Number(e.target.value) : '')}
              className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">All Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
            <Button onClick={() => handleCreate()}>+ Add Requirement</Button>
          </div>
        )}
      </div>

      <div className="bg-white shadow rounded-lg">
        <DataTable data={requirements} columns={columns} loading={loading} />
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedRequirement ? 'Edit Requirement' : 'Create Requirement'}
        size="lg"
      >
        {!selectedProjectId && !selectedRequirement && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Project *
            </label>
            <select
              value={selectedProjectId || ''}
              onChange={(e) => setSelectedProjectId(Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
            >
              <option value="">Select a project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>
        )}
        {selectedProjectId && (
          <RequirementForm
            projectId={selectedProjectId}
            requirement={selectedRequirement}
            onSubmit={handleSubmit}
          />
        )}
      </Modal>
    </div>
  );
}

