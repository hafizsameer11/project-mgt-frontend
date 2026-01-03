import { useEffect, useState } from 'react';
import { DataTable } from '../components/ui/DataTable';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Textarea } from '../components/ui/Textarea';
import api from '../services/api';
import { formatCurrency } from '../lib/currency';

export default function AdvancePayments() {
  const [advancePayments, setAdvancePayments] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    user_id: '',
    amount: '',
    currency: 'PKR',
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'cash',
    monthly_salary: '',
    description: '',
    notes: '',
  });
  const [filters, setFilters] = useState({
    user_id: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  });

  useEffect(() => {
    fetchAdvancePayments();
    fetchUsers();
  }, [filters]);

  const fetchAdvancePayments = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (filters.user_id) params.user_id = filters.user_id;
      if (filters.month) params.month = filters.month;
      if (filters.year) params.year = filters.year;
      
      const response = await api.get('/advance-payments', { params });
      setAdvancePayments(Array.isArray(response.data.data) ? response.data.data : []);
    } catch (error) {
      console.error('Error fetching advance payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/team-members');
      setUsers(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleCreate = () => {
    setSelectedPayment(undefined);
    setFormData({
      user_id: '',
      amount: '',
      currency: 'PKR',
      payment_date: new Date().toISOString().split('T')[0],
      payment_method: 'cash',
      monthly_salary: '',
      description: '',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleEdit = (payment: any) => {
    setSelectedPayment(payment);
    setFormData({
      user_id: payment.user_id?.toString() || '',
      amount: payment.amount?.toString() || '',
      currency: payment.currency || 'PKR',
      payment_date: payment.payment_date || new Date().toISOString().split('T')[0],
      payment_method: payment.payment_method || 'cash',
      monthly_salary: payment.monthly_salary?.toString() || '',
      description: payment.description || '',
      notes: payment.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const dataToSend: any = { ...formData };
      if (!dataToSend.monthly_salary) delete dataToSend.monthly_salary;
      if (!dataToSend.description) delete dataToSend.description;
      if (!dataToSend.notes) delete dataToSend.notes;

      if (selectedPayment) {
        await api.put(`/advance-payments/${selectedPayment.id}`, dataToSend);
      } else {
        await api.post('/advance-payments', dataToSend);
      }
      
      setIsModalOpen(false);
      fetchAdvancePayments();
    } catch (error: any) {
      console.error('Error saving advance payment:', error);
      alert(error.response?.data?.message || 'Error saving advance payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this advance payment?')) return;
    
    try {
      await api.delete(`/advance-payments/${id}`);
      fetchAdvancePayments();
    } catch (error: any) {
      console.error('Error deleting advance payment:', error);
      alert(error.response?.data?.message || 'Error deleting advance payment');
    }
  };

  const columns = [
    {
      key: 'advance_no',
      label: 'Advance #',
    },
    {
      key: 'user',
      label: 'Team Member',
      render: (row: any) => row.user?.name || 'N/A',
    },
    {
      key: 'payment_date',
      label: 'Date',
      render: (row: any) => new Date(row.payment_date).toLocaleDateString(),
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (row: any) => formatCurrency(row.amount),
    },
    {
      key: 'monthly_salary',
      label: 'Monthly Salary',
      render: (row: any) => row.monthly_salary ? formatCurrency(row.monthly_salary) : 'N/A',
    },
    {
      key: 'payment_method',
      label: 'Payment Method',
      render: (row: any) => (
        <Badge variant="secondary">{row.payment_method || 'N/A'}</Badge>
      ),
    },
    {
      key: 'description',
      label: 'Description',
      render: (row: any) => row.description || '-',
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row: any) => (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleEdit(row)}
          >
            Edit
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => handleDelete(row.id)}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Advance Payments (Khata)</h1>
          <p className="text-gray-600 mt-1">Manage team member advance payments</p>
        </div>
        <Button onClick={handleCreate}>+ Add Advance Payment</Button>
      </div>

      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Team Member</label>
            <Select
              value={filters.user_id}
              onChange={(e) => setFilters({ ...filters, user_id: e.target.value })}
            >
              <option value="">All Members</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Month</label>
            <Select
              value={filters.month}
              onChange={(e) => setFilters({ ...filters, month: parseInt(e.target.value) })}
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                <option key={month} value={month}>
                  {new Date(2024, month - 1).toLocaleString('default', { month: 'long' })}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Year</label>
            <Input
              type="number"
              value={filters.year}
              onChange={(e) => setFilters({ ...filters, year: parseInt(e.target.value) })}
              min="2020"
              max="2100"
            />
          </div>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={advancePayments}
        loading={loading}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedPayment ? 'Edit Advance Payment' : 'Add Advance Payment'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Team Member *</label>
            <Select
              value={formData.user_id}
              onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
              required
              disabled={!!selectedPayment}
            >
              <option value="">Select Team Member</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Amount *</label>
            <Input
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              required
              min="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Payment Date *</label>
            <Input
              type="date"
              value={formData.payment_date}
              onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Payment Method</label>
            <Select
              value={formData.payment_method}
              onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
            >
              <option value="cash">Cash</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="cheque">Cheque</option>
              <option value="other">Other</option>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Monthly Salary (Optional)</label>
            <Input
              type="number"
              step="0.01"
              value={formData.monthly_salary}
              onChange={(e) => setFormData({ ...formData, monthly_salary: e.target.value })}
              min="0"
              placeholder="e.g., 150000"
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter the total monthly salary to track remaining balance
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              placeholder="e.g., Partial salary payment for January"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Notes</label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : selectedPayment ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

