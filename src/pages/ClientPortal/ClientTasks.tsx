import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clientPortalService } from '../../services/clientPortalService';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { DataTable } from '../../components/ui/DataTable';
import { CheckSquare, Calendar, Plus, Edit } from 'lucide-react';
import { clientPortalService as cps } from '../../services/clientPortalService';
import { useToast } from '../../hooks/useToast';

export default function ClientTasks() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<any[]>([]);
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [formData, setFormData] = useState({
    project_id: '',
    title: '',
    description: '',
    priority: 'Medium',
    due_date: '',
    estimated_hours: '',
  });

  useEffect(() => {
    fetchTasks();
    fetchDashboard();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const data = await clientPortalService.getTasks();
      setTasks(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboard = async () => {
    try {
      const data = await cps.getDashboard();
      setDashboard(data);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        estimated_hours: formData.estimated_hours ? parseFloat(formData.estimated_hours) : null,
      };
      await clientPortalService.createTask(data);
      toast({
        title: 'Success',
        description: 'Task created successfully',
      });
      setShowCreateModal(false);
      resetForm();
      fetchTasks();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create task',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;
    try {
      const data = {
        ...formData,
        estimated_hours: formData.estimated_hours ? parseFloat(formData.estimated_hours) : null,
      };
      await clientPortalService.updateTask(editingTask.id, data);
      toast({
        title: 'Success',
        description: 'Task updated successfully',
      });
      setEditingTask(null);
      resetForm();
      fetchTasks();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update task',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      project_id: '',
      title: '',
      description: '',
      priority: 'Medium',
      due_date: '',
      estimated_hours: '',
    });
  };

  const openEditModal = (task: any) => {
    setEditingTask(task);
    setFormData({
      project_id: task.project_id.toString(),
      title: task.title,
      description: task.description || '',
      priority: task.priority || 'Medium',
      due_date: task.due_date ? task.due_date.split('T')[0] : '',
      estimated_hours: task.estimated_hours?.toString() || '',
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
      'Pending': 'default',
      'In Progress': 'warning',
      'Completed': 'success',
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  const getDeveloperName = (task: any) => {
    // First check if display_name is set (from backend alias)
    if (task.assigned_user_display_name) {
      return task.assigned_user_display_name;
    }
    
    if (!task.assigned_to || !dashboard) return 'Unassigned';
    
    // Find which project this task belongs to
    const projectId = task.project_id;
    if (!projectId) return 'Developer';
    
    const developers = dashboard.developers[projectId] || [];
    const dev = developers.find((d: any) => d.user_id === task.assigned_to);
    return dev ? dev.name : (task.assigned_user?.name || 'Developer');
  };

  const columns = [
    {
      key: 'title',
      header: 'Task',
      render: (task: any) => (
        <div>
          <div className="font-medium">{task.title}</div>
          {task.description && (
            <div className="text-sm text-gray-500 line-clamp-1">{task.description}</div>
          )}
        </div>
      ),
    },
    {
      key: 'project',
      header: 'Project',
      render: (task: any) => (
        <Button
          variant="link"
          onClick={() => navigate(`/client-portal/projects/${task.project_id}`)}
        >
          {task.project?.title || 'N/A'}
        </Button>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (task: any) => getStatusBadge(task.status),
    },
    {
      key: 'assigned_user',
      header: 'Developer',
      render: (task: any) => getDeveloperName(task),
    },
    {
      key: 'estimated_hours',
      header: 'Estimated',
      render: (task: any) => task.estimated_hours ? `${task.estimated_hours}h` : 'N/A',
    },
    {
      key: 'actual_time',
      header: 'Actual Time',
      render: (task: any) => task.actual_time ? `${task.actual_time}h` : 'N/A',
    },
    {
      key: 'deadline',
      header: 'Deadline',
      render: (task: any) => 
        task.due_date ? (
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span>{new Date(task.due_date).toLocaleDateString()}</span>
          </div>
        ) : (
          'N/A'
        ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (task: any) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => openEditModal(task)}
        >
          <Edit className="w-4 h-4" />
        </Button>
      ),
    },
  ];

  const stats = {
    total: tasks.length,
    completed: tasks.filter(t => t.status === 'Completed').length,
    inProgress: tasks.filter(t => t.status === 'In Progress').length,
    pending: tasks.filter(t => t.status === 'Pending').length,
  };

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-8 flex justify-between items-start">
        <div>
          <Button variant="outline" onClick={() => navigate('/client-portal')} className="mb-4">
            ← Back to Dashboard
          </Button>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
            My Tasks
          </h1>
          <p className="text-gray-600">View all tasks across your projects</p>
        </div>
        <Button onClick={() => {
          resetForm();
          setEditingTask(null);
          setShowCreateModal(true);
        }} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Create Task
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <p className="text-sm text-gray-600">Total Tasks</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Completed</p>
          <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">In Progress</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.inProgress}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Pending</p>
          <p className="text-2xl font-bold text-gray-600">{stats.pending}</p>
        </Card>
      </div>

      <Card>
        <DataTable data={tasks} columns={columns} loading={loading} />
      </Card>

      {/* Create/Edit Task Modal */}
      {(showCreateModal || editingTask) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">
                {editingTask ? 'Edit Task' : 'Create New Task'}
              </h2>
              <form onSubmit={editingTask ? handleUpdateTask : handleCreateTask} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Project *</label>
                  <select
                    required
                    value={formData.project_id}
                    onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                    disabled={!!editingTask}
                  >
                    <option value="">Select a project</option>
                    {dashboard?.projects?.map((project: any) => (
                      <option key={project.id} value={project.id}>
                        {project.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Task Title *</label>
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
                  <div>
                    <label className="block text-sm font-medium mb-1">Due Date</label>
                    <input
                      type="date"
                      value={formData.due_date}
                      onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Estimated Hours</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.estimated_hours}
                    onChange={(e) => setFormData({ ...formData, estimated_hours: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowCreateModal(false);
                      setEditingTask(null);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingTask ? 'Update Task' : 'Create Task'}
                  </Button>
                </div>
              </form>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

