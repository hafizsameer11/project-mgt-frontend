import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clientPortalService } from '../../services/clientPortalService';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { DataTable } from '../../components/ui/DataTable';
import { FolderKanban, Calendar, Users, DollarSign, Plus } from 'lucide-react';
import { useToast } from '../../hooks/useToast';

export default function ClientProjects() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    budget: '',
    start_date: '',
    end_date: '',
    project_type: '',
    priority: 'Medium',
    tags: [] as string[],
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const data = await clientPortalService.getProjects();
      setProjects(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast({
        title: 'Error',
        description: 'Failed to load projects',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        budget: formData.budget ? parseFloat(formData.budget) : null,
        tags: formData.tags,
      };
      await clientPortalService.createProject(data);
      toast({
        title: 'Success',
        description: 'Project created successfully',
      });
      setShowCreateModal(false);
      setFormData({
        title: '',
        description: '',
        budget: '',
        start_date: '',
        end_date: '',
        project_type: '',
        priority: 'Medium',
        tags: [],
      });
      fetchProjects();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create project',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
      'Planning': 'default',
      'In Progress': 'warning',
      'On Hold': 'info',
      'Completed': 'success',
      'Cancelled': 'danger',
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  const columns = [
    {
      key: 'title',
      header: 'Project',
      render: (project: any) => (
        <div>
          <div className="font-medium">{project.title}</div>
          {project.description && (
            <div className="text-sm text-gray-500 line-clamp-1">{project.description}</div>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (project: any) => getStatusBadge(project.status),
    },
    {
      key: 'phases',
      header: 'Phases',
      render: (project: any) => (
        <div>
          {project.phases && project.phases.length > 0 ? (
            <div className="space-y-1">
              {project.phases.map((phase: any, idx: number) => (
                <div key={idx} className="text-sm">
                  <span className="font-medium">{phase.name}:</span>{' '}
                  <span className="text-gray-600">
                    {new Date(phase.deadline).toLocaleDateString()}
                  </span>
                  <Badge variant={phase.status === 'Completed' ? 'success' : 'default'} className="ml-2">
                    {phase.status}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <span className="text-gray-400">No phases</span>
          )}
        </div>
      ),
    },
    {
      key: 'end_date',
      header: 'Deadline',
      render: (project: any) => 
        project.end_date ? (
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span>{new Date(project.end_date).toLocaleDateString()}</span>
          </div>
        ) : (
          'N/A'
        ),
    },
    {
      key: 'developers',
      header: 'Developers',
      render: (project: any) => {
        // Get developers for this project
        const developers = project.teams?.flatMap((team: any) => 
          team.members?.map((member: any) => member.user?.name) || []
        ) || [];
        
        const taskDevelopers = project.tasks?.map((task: any) => 
          task.assigned_user?.name
        ).filter(Boolean) || [];
        
        const allDevelopers = [...new Set([...developers, ...taskDevelopers])];
        
        // Check if any developer appears in multiple projects
        // For now, show all developers (logic will be handled in detail view)
        return allDevelopers.length > 0 ? (
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4 text-gray-400" />
            <span>{allDevelopers.length} developer(s)</span>
          </div>
        ) : (
          'No developers assigned'
        );
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (project: any) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(`/client-portal/projects/${project.id}`)}
        >
          View Details
        </Button>
      ),
    },
  ];

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-8 flex justify-between items-start">
        <div>
          <Button variant="outline" onClick={() => navigate('/client-portal')} className="mb-4">
            ← Back to Dashboard
          </Button>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
            My Projects
          </h1>
          <p className="text-gray-600">View all your projects and their progress</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Create Project
        </Button>
      </div>

      <Card>
        <DataTable data={projects} columns={columns} loading={loading} />
      </Card>

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">Create New Project</h2>
              <form onSubmit={handleCreateProject} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Project Title *</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Budget</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.budget}
                      onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Priority</label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Critical">Critical</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Start Date</label>
                    <input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">End Date</label>
                    <input
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Project Type</label>
                  <input
                    type="text"
                    value={formData.project_type}
                    onChange={(e) => setFormData({ ...formData, project_type: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="e.g., Web Application, Mobile App"
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">Create Project</Button>
                </div>
              </form>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

