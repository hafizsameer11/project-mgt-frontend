import { useEffect, useState } from 'react';
import { DataTable } from '../components/ui/DataTable';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Textarea } from '../components/ui/Textarea';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';

export default function Expenses() {
  const { user } = useAuthStore();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<any>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    expense_category_id: '',
    project_id: '',
    expense_date: new Date().toISOString().split('T')[0],
    amount: '',
    currency: 'USD',
    payment_method: 'cash',
    description: '',
  });
  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  useEffect(() => {
    fetchExpenses();
    fetchCategories();
    fetchProjects();
  }, []);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (user?.role !== 'Admin') {
        params.user_id = user?.id;
      }
      const response = await api.get('/expenses', { params });
      setExpenses(Array.isArray(response.data.data) ? response.data.data : []);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/expense-categories');
      setCategories(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await api.get('/projects');
      setProjects(Array.isArray(response.data.data) ? response.data.data : []);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const handleCreate = () => {
    setSelectedExpense(undefined);
    setFormData({
      expense_category_id: '',
      project_id: '',
      expense_date: new Date().toISOString().split('T')[0],
      amount: '',
      currency: 'USD',
      payment_method: 'cash',
      description: '',
    });
    setReceiptFile(null);
    setIsModalOpen(true);
  };

  const handleEdit = (expense: any) => {
    setSelectedExpense(expense);
    setFormData({
      expense_category_id: expense.expense_category_id?.toString() || '',
      project_id: expense.project_id?.toString() || '',
      expense_date: expense.expense_date || new Date().toISOString().split('T')[0],
      amount: expense.amount?.toString() || '',
      currency: expense.currency || 'USD',
      payment_method: expense.payment_method || 'cash',
      description: expense.description || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const formDataToSend = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value) formDataToSend.append(key, value);
      });
      if (receiptFile) {
        formDataToSend.append('receipt', receiptFile);
      }

      if (selectedExpense) {
        await api.put(`/expenses/${selectedExpense.id}`, formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        await api.post('/expenses', formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      setIsModalOpen(false);
      fetchExpenses();
    } catch (error) {
      console.error('Error saving expense:', error);
      alert('Error saving expense');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitExpense = async (id: number) => {
    try {
      await api.post(`/expenses/${id}/submit`);
      fetchExpenses();
    } catch (error) {
      console.error('Error submitting expense:', error);
      alert('Error submitting expense');
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
      'draft': 'default',
      'submitted': 'info',
      'approved': 'success',
      'rejected': 'danger',
      'paid': 'success',
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  const columns = [
    { key: 'expense_no', header: 'Expense #' },
    {
      key: 'expense_date',
      header: 'Date',
      render: (expense: any) => new Date(expense.expense_date).toLocaleDateString(),
    },
    {
      key: 'category',
      header: 'Category',
      render: (expense: any) => expense.category?.name || 'N/A',
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (expense: any) => `${expense.currency} ${expense.amount.toLocaleString()}`,
    },
    {
      key: 'project',
      header: 'Project',
      render: (expense: any) => expense.project?.title || 'N/A',
    },
    {
      key: 'status',
      header: 'Status',
      render: (expense: any) => getStatusBadge(expense.status),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (expense: any) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => handleEdit(expense)}>
            Edit
          </Button>
          {expense.status === 'draft' && expense.user_id === user?.id && (
            <Button size="sm" variant="primary" onClick={() => handleSubmitExpense(expense.id)}>
              Submit
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Expenses
          </h1>
          <p className="text-gray-600">Manage your expense records</p>
        </div>
        <Button onClick={handleCreate}>+ Add Expense</Button>
      </div>

      <div className="bg-white shadow rounded-lg">
        <DataTable data={expenses} columns={columns} loading={loading} />
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedExpense ? 'Edit Expense' : 'Add Expense'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Category"
            value={formData.expense_category_id}
            onChange={(e) => setFormData({ ...formData, expense_category_id: e.target.value })}
            options={[
              { value: '', label: 'Select category' },
              ...categories.map(cat => ({ value: cat.id.toString(), label: cat.name })),
            ]}
          />

          <Select
            label="Project"
            value={formData.project_id}
            onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
            options={[
              { value: '', label: 'Select project (optional)' },
              ...projects.map(proj => ({ value: proj.id.toString(), label: proj.title })),
            ]}
          />

          <Input
            label="Expense Date *"
            type="date"
            value={formData.expense_date}
            onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
            required
          />

          <Input
            label="Amount *"
            type="number"
            step="0.01"
            min="0"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            required
          />

          <Select
            label="Payment Method"
            value={formData.payment_method}
            onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
            options={[
              { value: 'cash', label: 'Cash' },
              { value: 'card', label: 'Card' },
              { value: 'bank_transfer', label: 'Bank Transfer' },
              { value: 'check', label: 'Check' },
              { value: 'other', label: 'Other' },
            ]}
          />

          <Textarea
            label="Description"
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />

          <Input
            label="Receipt"
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
          />

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              {selectedExpense ? 'Update' : 'Create'} Expense
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

