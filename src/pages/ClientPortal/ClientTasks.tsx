import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clientPortalService } from '../../services/clientPortalService';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { DataTable } from '../../components/ui/DataTable';
import { CheckSquare, Calendar } from 'lucide-react';
import { clientPortalService as cps } from '../../services/clientPortalService';

export default function ClientTasks() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<any[]>([]);
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
      'Pending': 'default',
      'In Progress': 'warning',
      'Completed': 'success',
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  const getDeveloperName = (task: any) => {
    if (!task.assigned_to || !dashboard) return 'Unassigned';
    
    // Find which project this task belongs to
    const projectId = task.project_id;
    if (!projectId) return 'Developer';
    
    const developers = dashboard.developers[projectId] || [];
    const dev = developers.find((d: any) => d.user_id === task.assigned_to);
    return dev ? dev.name : 'Developer';
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
        task.deadline ? (
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span>{new Date(task.deadline).toLocaleDateString()}</span>
          </div>
        ) : (
          'N/A'
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
      <div className="mb-8">
        <Button variant="outline" onClick={() => navigate('/client-portal')} className="mb-4">
          ← Back to Dashboard
        </Button>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
          My Tasks
        </h1>
        <p className="text-gray-600">View all tasks across your projects</p>
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
    </div>
  );
}

