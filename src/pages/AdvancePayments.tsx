import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { DataTable } from '../components/ui/DataTable';
import { Plus, Edit, CheckCircle, XCircle, DollarSign } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import { formatCurrency } from '../lib/currency';

export default function AdvancePayments() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [payments, setPayments] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPayment, setEditingPayment] = useState<any>(null);
  const [formData, setFormData] = useState({
    user_id: '',
    monthly_salary: '',
    amount: '',
    currency: 'PKR',
    payment_date: new Date().toISOString().split('T')[0],
    description: '',
    status: 'pending',
    notes: '',
  });

  useEffect(() => {
    fetchPayments();
    fetchUsers();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const response = await api.get('/advance-payments');
      setPayments(response.data.data || response.data || []);
    } catch (error) {
      console.error('Error fetching advance payments:', error);
      toast({
        title: 'Error',
        description: 'Failed to load advance payments',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data.data || response.data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        monthly_salary: formData.monthly_salary ? parseFloat(formData.monthly_salary) : null,
        amount: parseFloat(formData.amount),
      };

      if (editingPayment) {
        await api.put(`/advance-payments/${editingPayment.id}`, data);
        toast({
          title: 'Success',
          description: 'Advance payment updated successfully',
        });
      } else {
        await api.post('/advance-payments', data);
        toast({
          title: 'Success',
          description: 'Advance payment created successfully',
        });
      }

      setShowModal(false);
      setEditingPayment(null);
      resetForm();
      fetchPayments();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to save advance payment',
        variant: 'destructive',
      });
    }
  };

  const handleApprove = async (id: number) => {
    try {
      await api.post(`/advance-payments/${id}/approve`);
      toast({
        title: 'Success',
        description: 'Advance payment approved',
      });
      fetchPayments();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to approve payment',
        variant: 'destructive',
      });
    }
  };

  const handleMarkAsPaid = async (id: number) => {
    try {
      await api.post(`/advance-payments/${id}/mark-as-paid`);
      toast({
        title: 'Success',
        description: 'Payment marked as paid',
      });
      fetchPayments();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to mark as paid',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this advance payment?')) return;

    try {
      await api.delete(`/advance-payments/${id}`);
      toast({
        title: 'Success',
        description: 'Advance payment deleted',
      });
      fetchPayments();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete payment',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      user_id: '',
      monthly_salary: '',
      amount: '',
      currency: 'PKR',
      payment_date: new Date().toISOString().split('T')[0],
      description: '',
      status: 'pending',
      notes: '',
    });
  };

  const openEditModal = (payment: any) => {
    setEditingPayment(payment);
    setFormData({
      user_id: payment.user_id.toString(),
      monthly_salary: payment.monthly_salary?.toString() || '',
      amount: payment.amount.toString(),
      currency: payment.currency || 'PKR',
      payment_date: payment.payment_date ? payment.payment_date.split('T')[0] : new Date().toISOString().split('T')[0],
      description: payment.description || '',
      status: payment.status,
      notes: payment.notes || '',
    });
    setShowModal(true);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'success' | 'warning' | 'danger'> = {
      'pending': 'default',
      'approved': 'warning',
      'paid': 'success',
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  const columns = [
    {
      key: 'user',
      header: 'Team Member',
      render: (payment: any) => (
        <div>
          <div className="font-medium">{payment.user?.name || 'N/A'}</div>
          {payment.monthly_salary > 0 && (
            <div className="text-xs text-gray-500">
              Salary: {formatCurrency(payment.monthly_salary)}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (payment: any) => (
        <div className="font-semibold">{formatCurrency(payment.amount)}</div>
      ),
    },
    {
      key: 'payment_date',
      header: 'Payment Date',
      render: (payment: any) => (
        <div>{new Date(payment.payment_date).toLocaleDateString()}</div>
      ),
    },
    {
      key: 'description',
      header: 'Description',
      render: (payment: any) => (
        <div className="text-sm text-gray-600">{payment.description || 'N/A'}</div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (payment: any) => getStatusBadge(payment.status),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (payment: any) => (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => openEditModal(payment)}
          >
            <Edit className="w-4 h-4" />
          </Button>
          {payment.status === 'pending' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleApprove(payment.id)}
              className="text-green-600"
            >
              <CheckCircle className="w-4 h-4" />
            </Button>
          )}
          {payment.status === 'approved' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleMarkAsPaid(payment.id)}
              className="text-blue-600"
            >
              <DollarSign className="w-4 h-4" />
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDelete(payment.id)}
            className="text-red-600"
          >
            <XCircle className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Advance Payments (Khata)
          </h1>
          <p className="text-gray-600">Manage advance payments and monthly salaries for team members</p>
        </div>
        <Button onClick={() => {
          resetForm();
          setEditingPayment(null);
          setShowModal(true);
        }} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Advance Payment
        </Button>
      </div>

      <Card>
        <DataTable data={payments} columns={columns} loading={loading} />
      </Card>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">
                {editingPayment ? 'Edit Advance Payment' : 'Add Advance Payment'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Team Member *</label>
                  <select
                    required
                    value={formData.user_id}
                    onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                    disabled={!!editingPayment}
                  >
                    <option value="">Select team member</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name} ({user.email})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Monthly Salary</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.monthly_salary}
                      onChange={(e) => setFormData({ ...formData, monthly_salary: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md"
                      placeholder="e.g., 150000"
                    />
                    <p className="text-xs text-gray-500 mt-1">Total monthly salary/allowance</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Advance Amount *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md"
                      placeholder="e.g., 20000"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Payment Date *</label>
                    <input
                      type="date"
                      required
                      value={formData.payment_date}
                      onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md"
                    >
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="paid">Paid</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                    rows={3}
                    placeholder="e.g., Partial payment for January"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                    rows={2}
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowModal(false);
                      setEditingPayment(null);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingPayment ? 'Update' : 'Create'}
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

