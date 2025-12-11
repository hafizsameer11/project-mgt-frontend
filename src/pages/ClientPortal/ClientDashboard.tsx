import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clientPortalService, ClientPortalDashboard } from '../../services/clientPortalService';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { DataTable } from '../../components/ui/DataTable';
import { 
  FolderKanban, 
  CheckSquare, 
  DollarSign, 
  FileText, 
  FileCheck,
  Calendar,
  Users,
  TrendingUp
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export default function ClientDashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [dashboard, setDashboard] = useState<ClientPortalDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Redirect if not a client
    if (user?.role !== 'Client') {
      navigate('/dashboard');
      return;
    }

    fetchDashboard();
  }, [user, navigate]);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const data = await clientPortalService.getDashboard();
      setDashboard(data);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-600">No data available</div>
      </div>
    );
  }

  const stats = [
    {
      title: 'Total Projects',
      value: dashboard.projects.length,
      icon: FolderKanban,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Active Tasks',
      value: dashboard.tasks.filter(t => t.status !== 'Completed').length,
      icon: CheckSquare,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Total Payments',
      value: dashboard.payments.length,
      icon: DollarSign,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Requirements',
      value: dashboard.requirements.length,
      icon: FileCheck,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ];

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
      'Planning': 'default',
      'In Progress': 'warning',
      'On Hold': 'info',
      'Completed': 'success',
      'Cancelled': 'danger',
      'Pending': 'default',
      'Active': 'success',
      'Draft': 'default',
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  const recentProjects = dashboard.projects.slice(0, 5);
  const recentTasks = dashboard.tasks.slice(0, 5);

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
          Client Portal Dashboard
        </h1>
        <p className="text-gray-600">Welcome, {dashboard.client?.name || user?.name}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
                <div className={`${stat.bgColor} p-3 rounded-lg`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Projects */}
        <Card>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Recent Projects</h2>
            <Button variant="outline" onClick={() => navigate('/client-portal/projects')}>
              View All
            </Button>
          </div>
          <DataTable
            data={recentProjects}
            columns={[
              {
                key: 'title',
                header: 'Project',
                render: (project: any) => (
                  <div>
                    <div className="font-medium">{project.title}</div>
                    {project.client && (
                      <div className="text-sm text-gray-500">{project.client.name}</div>
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
                key: 'end_date',
                header: 'Deadline',
                render: (project: any) => 
                  project.end_date ? new Date(project.end_date).toLocaleDateString() : 'N/A',
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
                    View
                  </Button>
                ),
              },
            ]}
            loading={false}
          />
        </Card>

        {/* Recent Tasks */}
        <Card>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Recent Tasks</h2>
            <Button variant="outline" onClick={() => navigate('/client-portal/tasks')}>
              View All
            </Button>
          </div>
          <DataTable
            data={recentTasks}
            columns={[
              {
                key: 'title',
                header: 'Task',
                render: (task: any) => (
                  <div>
                    <div className="font-medium">{task.title}</div>
                    {task.project && (
                      <div className="text-sm text-gray-500">{task.project.title}</div>
                    )}
                  </div>
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
                render: (task: any) => {
                  // Check if developer works on multiple projects
                  const projectId = task.project_id;
                  const developers = dashboard.developers[projectId] || [];
                  const dev = developers.find((d: any) => d.user_id === task.assigned_to);
                  return dev ? dev.name : (task.assigned_user?.name || 'Unassigned');
                },
              },
            ]}
            loading={false}
          />
        </Card>
      </div>

      {/* Quick Links */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 cursor-pointer hover:shadow-lg transition" onClick={() => navigate('/client-portal/projects')}>
          <FolderKanban className="w-8 h-8 text-blue-600 mb-2" />
          <h3 className="font-semibold">All Projects</h3>
          <p className="text-sm text-gray-600">View all your projects</p>
        </Card>
        <Card className="p-4 cursor-pointer hover:shadow-lg transition" onClick={() => navigate('/client-portal/tasks')}>
          <CheckSquare className="w-8 h-8 text-green-600 mb-2" />
          <h3 className="font-semibold">Tasks</h3>
          <p className="text-sm text-gray-600">View all tasks</p>
        </Card>
        <Card className="p-4 cursor-pointer hover:shadow-lg transition" onClick={() => navigate('/client-portal/payments')}>
          <DollarSign className="w-8 h-8 text-purple-600 mb-2" />
          <h3 className="font-semibold">Payments</h3>
          <p className="text-sm text-gray-600">Payment history</p>
        </Card>
        <Card className="p-4 cursor-pointer hover:shadow-lg transition" onClick={() => navigate('/client-portal/requirements')}>
          <FileCheck className="w-8 h-8 text-orange-600 mb-2" />
          <h3 className="font-semibold">Requirements</h3>
          <p className="text-sm text-gray-600">Project requirements</p>
        </Card>
        <Card className="p-4 cursor-pointer hover:shadow-lg transition" onClick={() => navigate('/client-portal/settings')}>
          <Lock className="w-8 h-8 text-gray-600 mb-2" />
          <h3 className="font-semibold">Settings</h3>
          <p className="text-sm text-gray-600">Account & password</p>
        </Card>
      </div>
    </div>
  );
}

