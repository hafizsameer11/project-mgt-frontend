import { useEffect, useState } from 'react';
import { Project } from '../types';
import { projectService } from '../services/projectService';
import { Modal } from '../components/ui/Modal';
import { ProjectForm } from '../components/forms/ProjectForm';
import { DataTable } from '../components/ui/DataTable';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function Projects() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const canManage = user?.role === 'Admin' || user?.role === 'Project Manager';

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await projectService.getAll();
      setProjects(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedProject(undefined);
    setIsModalOpen(true);
  };

  const handleEdit = (project: Project) => {
    setSelectedProject(project);
    setIsModalOpen(true);
  };

  const handleSubmit = async (data: Partial<Project>) => {
    try {
      setIsSubmitting(true);
      if (selectedProject) {
        await projectService.update(selectedProject.id, data);
      } else {
        await projectService.create(data);
      }
      setIsModalOpen(false);
      fetchProjects();
    } catch (error) {
      console.error('Error saving project:', error);
      alert('Error saving project');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this project?')) {
      try {
        await projectService.delete(id);
        fetchProjects();
      } catch (error) {
        console.error('Error deleting project:', error);
        alert('Error deleting project');
      }
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
      'Planning': 'info',
      'In Progress': 'warning',
      'Completed': 'success',
      'On Hold': 'default',
      'Cancelled': 'danger',
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  const columns = [
    { key: 'title', header: 'Title' },
    {
      key: 'client',
      header: 'Client',
      render: (project: Project) => project.client?.name || 'N/A',
    },
    {
      key: 'budget',
      header: 'Budget',
      render: (project: Project) => project.budget ? `$${project.budget.toLocaleString()}` : 'N/A',
    },
    {
      key: 'status',
      header: 'Status',
      render: (project: Project) => getStatusBadge(project.status),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (project: Project) => (
        <div className="flex gap-2">
          <Button size="sm" variant="primary" onClick={() => navigate(`/projects/${project.id}`)}>
            View
          </Button>
          {canManage && (
            <>
              <Button size="sm" variant="outline" onClick={() => handleEdit(project)}>
                Edit
              </Button>
              <Button size="sm" variant="danger" onClick={() => handleDelete(project.id)}>
                Delete
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Projects
          </h1>
          <p className="text-gray-600">
            {canManage ? 'Track and manage all your projects' : 'View your assigned projects'}
          </p>
        </div>
        {canManage && <Button onClick={handleCreate}>+ Add Project</Button>}
      </div>

      <div className="bg-white shadow rounded-lg">
        <DataTable data={projects} columns={columns} loading={loading} />
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedProject ? 'Edit Project' : 'Create Project'}
        size="xl"
      >
        <ProjectForm
          project={selectedProject}
          onSubmit={handleSubmit}
          onCancel={() => setIsModalOpen(false)}
          isLoading={isSubmitting}
        />
      </Modal>
    </div>
  );
}

