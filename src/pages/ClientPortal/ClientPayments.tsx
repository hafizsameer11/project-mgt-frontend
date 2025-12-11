import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clientPortalService } from '../../services/clientPortalService';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { DataTable } from '../../components/ui/DataTable';
import { DollarSign, Download, Calendar } from 'lucide-react';

export default function ClientPayments() {
  const navigate = useNavigate();
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const data = await clientPortalService.getPayments();
      setPayments(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
      'Pending': 'warning',
      'Partial': 'info',
      'Paid': 'success',
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  const columns = [
    {
      key: 'project',
      header: 'Project',
      render: (payment: any) => (
        <div>
          <div className="font-medium">{payment.project?.title || 'N/A'}</div>
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (payment: any) => (
        <div className="font-semibold">${payment.amount?.toLocaleString() || '0'}</div>
      ),
    },
    {
      key: 'payment_date',
      header: 'Payment Date',
      render: (payment: any) => (
        <div className="flex items-center gap-1">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span>{payment.payment_date ? new Date(payment.payment_date).toLocaleDateString() : 'N/A'}</span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (payment: any) => getStatusBadge(payment.status || 'Pending'),
    },
    {
      key: 'payment_method',
      header: 'Method',
      render: (payment: any) => payment.payment_method || 'N/A',
    },
    {
      key: 'invoice_path',
      header: 'Invoice',
      render: (payment: any) => {
        if (payment.invoice_path) {
          return (
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                try {
                  const response = await fetch(`/api/client-payments/${payment.id}/invoice/download`, {
                    headers: {
                      'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    },
                  });
                  const blob = await response.blob();
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `invoice-${payment.id}.pdf`;
                  a.click();
                } catch (error) {
                  alert('Error downloading invoice');
                }
              }}
            >
              <Download className="w-4 h-4" />
            </Button>
          );
        }
        return 'N/A';
      },
    },
  ];

  const totalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const pendingPayments = payments.filter(p => p.status === 'Pending' || p.status === 'Partial');

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-8">
        <Button variant="outline" onClick={() => navigate('/client-portal')} className="mb-4">
          ← Back to Dashboard
        </Button>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
          Payment History
        </h1>
        <p className="text-gray-600">View all your payment transactions</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="p-4">
          <p className="text-sm text-gray-600">Total Payments</p>
          <p className="text-2xl font-bold">{payments.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Total Amount Paid</p>
          <p className="text-2xl font-bold text-green-600">${totalPaid.toLocaleString()}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Pending Payments</p>
          <p className="text-2xl font-bold text-yellow-600">{pendingPayments.length}</p>
        </Card>
      </div>

      <Card>
        <DataTable data={payments} columns={columns} loading={loading} />
      </Card>
    </div>
  );
}

