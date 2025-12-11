import { useEffect, useState } from 'react';
import api from '../services/api';
import { DataTable } from '../components/ui/DataTable';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';

interface ActivityLog {
  id: number;
  model_type: string;
  model_id: number;
  user_id?: number;
  user?: { name: string; email: string };
  action: string;
  old_value?: any;
  new_value?: any;
  description?: string;
  created_at: string;
}

export default function ActivityLogs() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    model_type: '',
    action: '',
  });

  useEffect(() => {
    fetchLogs();
  }, [filters]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (filters.model_type) params.model_type = filters.model_type;
      if (filters.action) params.action = filters.action;

      const response = await api.get('/activity-logs', { params });
      setLogs(Array.isArray(response.data.data) ? response.data.data : []);
    } catch (error) {
      console.error('Error fetching activity logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionBadge = (action: string) => {
    const variants: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
      'created': 'success',
      'updated': 'info',
      'deleted': 'danger',
      'converted': 'warning',
      'payment_added': 'success',
    };
    return <Badge variant={variants[action] || 'default'}>{action}</Badge>;
  };

  const formatModelType = (type: string) => {
    return type.split('\\').pop() || type;
  };

  const columns = [
    {
      key: 'created_at',
      header: 'Date',
      render: (log: ActivityLog) => new Date(log.created_at).toLocaleString(),
    },
    {
      key: 'user',
      header: 'User',
      render: (log: ActivityLog) => log.user?.name || 'System',
    },
    {
      key: 'model_type',
      header: 'Module',
      render: (log: ActivityLog) => formatModelType(log.model_type),
    },
    {
      key: 'action',
      header: 'Action',
      render: (log: ActivityLog) => getActionBadge(log.action),
    },
    {
      key: 'description',
      header: 'Description',
      render: (log: ActivityLog) => log.description || `${log.action} ${formatModelType(log.model_type)} #${log.model_id}`,
    },
  ];

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
          Activity Logs
        </h1>
        <p className="text-gray-600">Track all system activities and changes</p>
      </div>

      <Card className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Module</label>
            <select
              value={filters.model_type}
              onChange={(e) => setFilters({ ...filters, model_type: e.target.value })}
              className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 sm:text-sm px-4 py-2.5 bg-gray-50 focus:bg-white"
            >
              <option value="">All Modules</option>
              <option value="App\\Models\\Lead">Leads</option>
              <option value="App\\Models\\Client">Clients</option>
              <option value="App\\Models\\Project">Projects</option>
              <option value="App\\Models\\Task">Tasks</option>
              <option value="App\\Models\\Team">Teams</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Action</label>
            <select
              value={filters.action}
              onChange={(e) => setFilters({ ...filters, action: e.target.value })}
              className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 sm:text-sm px-4 py-2.5 bg-gray-50 focus:bg-white"
            >
              <option value="">All Actions</option>
              <option value="created">Created</option>
              <option value="updated">Updated</option>
              <option value="deleted">Deleted</option>
              <option value="converted">Converted</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => setFilters({ model_type: '', action: '' })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </Card>

      <div className="bg-white shadow rounded-lg">
        <DataTable data={logs} columns={columns} loading={loading} />
      </div>
    </div>
  );
}

