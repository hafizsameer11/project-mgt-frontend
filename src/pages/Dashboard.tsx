import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import api from '../services/api';
import { Card } from '../components/ui/Card';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [charts, setCharts] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, chartsRes] = await Promise.all([
          api.get('/dashboard/stats'),
          api.get('/dashboard/charts'),
        ]);
        setStats(statsRes.data);
        setCharts(chartsRes.data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!stats) return <div>Error loading dashboard</div>;

  const projectStatusData = Object.entries(stats.projects.by_status || {}).map(([name, value]) => ({
    name,
    value,
  }));

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
          Dashboard
        </h1>
        <p className="text-gray-600">Welcome back! Here's what's happening with your projects.</p>
      </div>
      
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <div className="text-2xl font-bold text-gray-900">{stats.leads.total}</div>
          <div className="text-sm text-gray-500 mt-1">Total Leads</div>
          <div className="text-sm text-gray-700 mt-2">
            {stats.leads.converted} Converted
          </div>
        </Card>

        <Card>
          <div className="text-2xl font-bold text-gray-900">{stats.clients.total}</div>
          <div className="text-sm text-gray-500 mt-1">Total Clients</div>
          <div className="text-sm text-gray-700 mt-2">
            {stats.clients.active} Active
          </div>
        </Card>

        <Card>
          <div className="text-2xl font-bold text-gray-900">{stats.projects.total}</div>
          <div className="text-sm text-gray-500 mt-1">Total Projects</div>
        </Card>

        <Card>
          <div className="text-2xl font-bold text-gray-900">
            ${stats.revenue.total?.toLocaleString() || '0'}
          </div>
          <div className="text-sm text-gray-500 mt-1">Total Revenue</div>
          <div className="text-sm text-gray-700 mt-2">
            ${stats.revenue.pending?.toLocaleString() || '0'} Pending
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 mb-8">
        <Card title="Project Status Distribution">
          {projectStatusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={projectStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {projectStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12 text-gray-500">No data available</div>
          )}
        </Card>

        <Card title="Monthly Revenue (Last 12 Months)">
          {charts?.monthly_revenue && charts.monthly_revenue.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={charts.monthly_revenue}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
                <Legend />
                <Line type="monotone" dataKey="total" stroke="#8884d8" strokeWidth={2} name="Revenue" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12 text-gray-500">No data available</div>
          )}
        </Card>

        <Card title="Lead Status Distribution">
          {charts?.lead_status && charts.lead_status.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={charts.lead_status}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#00C49F" name="Leads" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12 text-gray-500">No data available</div>
          )}
        </Card>

        <Card title="Task Status Distribution">
          {charts?.task_status && charts.task_status.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={charts.task_status}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#FF8042" name="Tasks" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12 text-gray-500">No data available</div>
          )}
        </Card>

        <Card title="BD Performance (Projects per BD)">
          {charts?.bd_performance && charts.bd_performance.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={charts.bd_performance} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#0088FE" name="Projects" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12 text-gray-500">No data available</div>
          )}
        </Card>

        <Card title="Developer Task Distribution">
          {charts?.developer_tasks && charts.developer_tasks.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={charts.developer_tasks} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#FFBB28" name="Tasks" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12 text-gray-500">No data available</div>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card title="Tasks Due Today">
          <div className="text-3xl font-bold text-gray-900">{stats.tasks_due_today}</div>
        </Card>

        <Card title="Leads Requiring Follow-up">
          <div className="text-3xl font-bold text-gray-900">{stats.leads_follow_up}</div>
        </Card>
      </div>
    </div>
  );
}

