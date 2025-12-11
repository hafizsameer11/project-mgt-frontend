import { useEffect, useState } from 'react';
import { teamMemberService } from '../services/teamMemberService';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Briefcase, CheckSquare, DollarSign, TrendingUp, Clock } from 'lucide-react';
import { DataTable } from '../components/ui/DataTable';
import { Project, Task, DeveloperPayment } from '../types';

export default function TeamMemberDashboard() {
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const data = await teamMemberService.getDashboard();
      setDashboard(data);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!dashboard) return <div>Error loading dashboard</div>;

  const projectColumns = [
    { key: 'title', header: 'Project' },
    {
      key: 'client',
      header: 'Client',
      render: (project: Project) => project.client?.name || 'N/A',
    },
    {
      key: 'status',
      header: 'Status',
      render: (project: Project) => (
        <Badge variant={project.status === 'Completed' ? 'success' : 'warning'}>
          {project.status}
        </Badge>
      ),
    },
  ];

  const taskColumns = [
    { key: 'title', header: 'Task' },
    {
      key: 'project',
      header: 'Project',
      render: (task: Task) => task.project?.title || 'N/A',
    },
    {
      key: 'status',
      header: 'Status',
      render: (task: Task) => (
        <Badge variant={task.status === 'Completed' ? 'success' : 'warning'}>
          {task.status}
        </Badge>
      ),
    },
    {
      key: 'deadline',
      header: 'Deadline',
      render: (task: Task) => task.deadline || 'N/A',
    },
  ];

  const paymentColumns = [
    {
      key: 'project',
      header: 'Project',
      render: (payment: DeveloperPayment) => (payment as any).project?.title || 'N/A',
    },
    {
      key: 'total_assigned_amount',
      header: 'Total Assigned',
      render: (payment: DeveloperPayment) =>
        payment.total_assigned_amount ? `$${payment.total_assigned_amount.toLocaleString()}` : 'N/A',
    },
    {
      key: 'amount_paid',
      header: 'Amount Paid',
      render: (payment: DeveloperPayment) => `$${(payment.amount_paid || 0).toLocaleString()}`,
    },
    {
      key: 'remaining_amount',
      header: 'Pending Payment',
      render: (payment: DeveloperPayment) => {
        const remaining = payment.remaining_amount || 0;
        return remaining > 0 ? (
          <span className="text-red-600 font-semibold">${remaining.toLocaleString()}</span>
        ) : (
          <span className="text-green-600 font-semibold">$0</span>
        );
      },
    },
    {
      key: 'status',
      header: 'My Payment Status',
      render: (payment: DeveloperPayment) => {
        const status = (payment as any).status || 'Pending';
        const variants: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
          'Paid': 'success',
          'Pending': 'warning',
          'Partial': 'info',
        };
        return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
      },
    },
    {
      key: 'client_payment_status',
      header: 'Client Payment Status',
      render: (payment: DeveloperPayment) => {
        const clientStatus = (payment as any).client_payment_status || 'Unpaid';
        const variants: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
          'Fully Paid': 'success',
          'Partially Paid': 'warning',
          'Unpaid': 'danger',
        };
        return <Badge variant={variants[clientStatus] || 'default'}>{clientStatus}</Badge>;
      },
    },
  ];

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
          My Dashboard
        </h1>
        <p className="text-gray-600">Welcome back, {dashboard.team?.full_name}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5 mb-8">
        <Card>
          <div className="flex items-center">
            <div className="p-3 bg-indigo-100 rounded-lg mr-4">
              <Briefcase className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{dashboard.stats?.total_projects || 0}</div>
              <div className="text-sm text-gray-500">Total Projects</div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg mr-4">
              <CheckSquare className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{dashboard.stats?.completed_tasks || 0}</div>
              <div className="text-sm text-gray-500">Completed Tasks</div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-lg mr-4">
              <TrendingUp className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{dashboard.stats?.active_tasks || 0}</div>
              <div className="text-sm text-gray-500">Active Tasks</div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg mr-4">
              <DollarSign className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                ${dashboard.stats?.total_earned?.toLocaleString() || '0'}
              </div>
              <div className="text-sm text-gray-500">Total Earned</div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="p-3 bg-orange-100 rounded-lg mr-4">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                ${dashboard.stats?.pending_balance?.toLocaleString() || '0'}
              </div>
              <div className="text-sm text-gray-500">Pending Balance</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Projects */}
      <Card title="My Projects" className="mb-6">
        <DataTable
          data={dashboard.projects || []}
          columns={projectColumns}
          loading={false}
        />
      </Card>

      {/* Tasks */}
      <Card title="My Tasks" className="mb-6">
        <DataTable
          data={dashboard.tasks || []}
          columns={taskColumns}
          loading={false}
        />
      </Card>

      {/* Payments */}
      <Card title="My Payments & Client Payment Status">
        <p className="text-sm text-gray-600 mb-4">
          View your pending payments and track whether clients have paid for the projects you're working on.
        </p>
        <DataTable
          data={dashboard.payments || []}
          columns={paymentColumns}
          loading={false}
        />
      </Card>
    </div>
  );
}

