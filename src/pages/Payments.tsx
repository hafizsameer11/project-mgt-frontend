import { useEffect, useState } from 'react';
import api from '../services/api';
import { DataTable } from '../components/ui/DataTable';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/Tabs';
import { DeveloperPaymentForm } from '../components/forms/DeveloperPaymentForm';
import { ClientPaymentForm } from '../components/forms/ClientPaymentForm';

interface DeveloperPayment {
  id: number;
  developer_id: number;
  developer?: { full_name: string };
  project_id: number;
  project?: { title: string };
  total_assigned_amount?: number;
  amount_paid: number;
  remaining_amount?: number;
  invoice_no?: string;
}

interface ClientPayment {
  id: number;
  client_id: number;
  client?: { name: string };
  project_id: number;
  project?: { title: string };
  invoice_no?: string;
  total_amount?: number;
  amount_paid: number;
  remaining_amount?: number;
  status: 'Paid' | 'Unpaid' | 'Partial';
}

export default function Payments() {
  const [developerPayments, setDeveloperPayments] = useState<DeveloperPayment[]>([]);
  const [clientPayments, setClientPayments] = useState<ClientPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDevPaymentModalOpen, setIsDevPaymentModalOpen] = useState(false);
  const [isClientPaymentModalOpen, setIsClientPaymentModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<number | null>(null);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const [devRes, clientRes] = await Promise.all([
        api.get('/developer-payments'),
        api.get('/client-payments'),
      ]);
      setDeveloperPayments(Array.isArray(devRes.data.data) ? devRes.data.data : []);
      setClientPayments(Array.isArray(clientRes.data.data) ? clientRes.data.data : []);
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
      'Paid': 'success',
      'Unpaid': 'danger',
      'Partial': 'warning',
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  const devColumns = [
    {
      key: 'developer',
      header: 'Developer',
      render: (payment: DeveloperPayment) => payment.developer?.full_name || 'N/A',
    },
    {
      key: 'project',
      header: 'Project',
      render: (payment: DeveloperPayment) => payment.project?.title || 'N/A',
    },
    {
      key: 'total_assigned_amount',
      header: 'Total Assigned',
      render: (payment: DeveloperPayment) => payment.total_assigned_amount ? `$${payment.total_assigned_amount.toLocaleString()}` : 'N/A',
    },
    {
      key: 'amount_paid',
      header: 'Paid',
      render: (payment: DeveloperPayment) => `$${payment.amount_paid.toLocaleString()}`,
    },
    {
      key: 'remaining_amount',
      header: 'Remaining',
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
      key: 'invoice_no',
      header: 'Invoice',
      render: (payment: DeveloperPayment) => payment.invoice_no || 'N/A',
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (payment: DeveloperPayment) => (
        <div className="flex gap-2">
          <Button size="sm" variant="primary" onClick={async () => {
            const amount = prompt('Enter payment amount:');
            if (amount && parseFloat(amount) > 0) {
              try {
                await api.post(`/developer-payments/${payment.id}/add-payment`, {
                  amount: parseFloat(amount),
                  payment_date: new Date().toISOString().split('T')[0],
                });
                fetchPayments();
              } catch (error) {
                console.error('Error adding payment:', error);
                alert('Error adding payment');
              }
            }
          }}>
            Add Payment
          </Button>
        </div>
      ),
    },
  ];

  const clientColumns = [
    {
      key: 'client',
      header: 'Client',
      render: (payment: ClientPayment) => payment.client?.name || 'N/A',
    },
    {
      key: 'project',
      header: 'Project',
      render: (payment: ClientPayment) => payment.project?.title || 'N/A',
    },
    {
      key: 'invoice_no',
      header: 'Invoice #',
      render: (payment: ClientPayment) => payment.invoice_no || 'N/A',
    },
    {
      key: 'total_amount',
      header: 'Total',
      render: (payment: ClientPayment) => payment.total_amount ? `$${payment.total_amount.toLocaleString()}` : 'N/A',
    },
    {
      key: 'amount_paid',
      header: 'Paid',
      render: (payment: ClientPayment) => `$${payment.amount_paid.toLocaleString()}`,
    },
    {
      key: 'remaining_amount',
      header: 'Remaining',
      render: (payment: ClientPayment) => {
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
      header: 'Status',
      render: (payment: ClientPayment) => getStatusBadge(payment.status),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (payment: ClientPayment) => (
        <div className="flex gap-2">
          <Button size="sm" variant="primary" onClick={async () => {
            const amount = prompt('Enter payment amount received:');
            if (amount && parseFloat(amount) > 0) {
              try {
                const currentPaid = payment.amount_paid || 0;
                const newAmount = currentPaid + parseFloat(amount);
                await api.put(`/client-payments/${payment.id}`, {
                  amount_paid: newAmount,
                });
                fetchPayments();
              } catch (error) {
                console.error('Error adding payment:', error);
                alert('Error adding payment');
              }
            }
          }}>
            Add Payment
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
          Payments
        </h1>
        <p className="text-gray-600">Track developer and client payments</p>
      </div>

      <Tabs defaultValue="developer" className="space-y-6">
        <TabsList>
          <TabsTrigger value="developer">Developer Payments</TabsTrigger>
          <TabsTrigger value="client">Client Payments</TabsTrigger>
        </TabsList>

        <TabsContent value="developer">
          <Card>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Developer Payments</h2>
              <Button onClick={() => setIsDevPaymentModalOpen(true)}>+ Allocate Developer Payment</Button>
            </div>
            <DataTable data={developerPayments} columns={devColumns} loading={loading} />
          </Card>
        </TabsContent>

        <TabsContent value="client">
          <Card>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Client Payments</h2>
              <Button onClick={() => setIsClientPaymentModalOpen(true)}>+ Add Client Payment</Button>
            </div>
            <DataTable data={clientPayments} columns={clientColumns} loading={loading} />
          </Card>
        </TabsContent>
      </Tabs>

      {/* Developer Payment Modal */}
      <Modal
        isOpen={isDevPaymentModalOpen}
        onClose={() => {
          setIsDevPaymentModalOpen(false);
          setSelectedProject(null);
        }}
        title="Allocate Developer Payment"
        size="lg"
      >
        <DeveloperPaymentForm
          projectId={selectedProject || undefined}
          onSubmit={() => {
            setIsDevPaymentModalOpen(false);
            setSelectedProject(null);
            fetchPayments();
          }}
          onCancel={() => {
            setIsDevPaymentModalOpen(false);
            setSelectedProject(null);
          }}
        />
      </Modal>

      {/* Client Payment Modal */}
      <Modal
        isOpen={isClientPaymentModalOpen}
        onClose={() => setIsClientPaymentModalOpen(false)}
        title="Add Client Payment"
        size="lg"
      >
        <ClientPaymentForm
          onSubmit={() => {
            setIsClientPaymentModalOpen(false);
            fetchPayments();
          }}
          onCancel={() => setIsClientPaymentModalOpen(false)}
        />
      </Modal>
    </div>
  );
}

