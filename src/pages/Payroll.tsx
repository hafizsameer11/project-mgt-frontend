import { useEffect, useState } from 'react';
import { DataTable } from '../components/ui/DataTable';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import api from '../services/api';

export default function Payroll() {
  const [payrolls, setPayrolls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayrolls();
  }, []);

  const fetchPayrolls = async () => {
    try {
      setLoading(true);
      const response = await api.get('/payroll');
      setPayrolls(Array.isArray(response.data.data) ? response.data.data : []);
    } catch (error) {
      console.error('Error fetching payrolls:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
      'draft': 'default',
      'processed': 'info',
      'paid': 'success',
      'cancelled': 'danger',
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  const columns = [
    { key: 'payroll_no', header: 'Payroll #' },
    {
      key: 'user',
      header: 'Employee',
      render: (payroll: any) => payroll.user?.name || 'N/A',
    },
    {
      key: 'pay_period',
      header: 'Pay Period',
      render: (payroll: any) => {
        const start = new Date(payroll.pay_period_start).toLocaleDateString();
        const end = new Date(payroll.pay_period_end).toLocaleDateString();
        return `${start} - ${end}`;
      },
    },
    {
      key: 'gross_salary',
      header: 'Gross Salary',
      render: (payroll: any) => `$${payroll.gross_salary.toLocaleString()}`,
    },
    {
      key: 'net_salary',
      header: 'Net Salary',
      render: (payroll: any) => `$${payroll.net_salary.toLocaleString()}`,
    },
    {
      key: 'status',
      header: 'Status',
      render: (payroll: any) => getStatusBadge(payroll.status),
    },
  ];

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
          Payroll
        </h1>
        <p className="text-gray-600">Manage employee payroll records</p>
      </div>

      <div className="bg-white shadow rounded-lg">
        <DataTable data={payrolls} columns={columns} loading={loading} />
      </div>
    </div>
  );
}

