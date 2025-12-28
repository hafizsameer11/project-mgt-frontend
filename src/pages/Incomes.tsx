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

export default function Incomes() {
  const [incomes, setIncomes] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedIncome, setSelectedIncome] = useState<any>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    amount: '',
    currency: 'PKR',
    income_date: new Date().toISOString().split('T')[0],
    income_type: 'other',
    project_id: '',
    notes: '',
  });
  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  useEffect(() => {
    fetchIncomes();
    fetchProjects();
  }, []);

  const fetchIncomes = async () => {
    try {
      setLoading(true);
      const response = await api.get('/incomes');
      setIncomes(Array.isArray(response.data.data) ? response.data.data : []);
    } catch (error) {
      console.error('Error fetching incomes:', error);
    } finally {
      setLoading(false);
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
    setSelectedIncome(undefined);
    setFormData({
      title: '',
      description: '',
      amount: '',
      currency: 'PKR',
      income_date: new Date().toISOString().split('T')[0],
      income_type: 'other',
      project_id: '',
      notes: '',
    });
    setReceiptFile(null);
    setIsModalOpen(true);
  };

  const handleEdit = (income: any) => {
    setSelectedIncome(income);
    setFormData({
      title: income.title || '',
      description: income.description || '',
      amount: income.amount?.toString() || '',
      currency: income.currency || 'PKR',
      income_date: income.income_date || new Date().toISOString().split('T')[0],
      income_type: income.income_type || 'other',
      project_id: income.project_id?.toString() || '',
      notes: income.notes || '',
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

      if (selectedIncome) {
        await api.put(`/incomes/${selectedIncome.id}`, formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        await api.post('/incomes', formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      setIsModalOpen(false);
      fetchIncomes();
    } catch (error) {
      console.error('Error saving income:', error);
      alert('Error saving income');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this income record?')) {
      return;
    }
    try {
      await api.delete(`/incomes/${id}`);
      fetchIncomes();
    } catch (error) {
      console.error('Error deleting income:', error);
      alert('Error deleting income');
    }
  };

  const getIncomeTypeBadge = (type: string) => {
    const variants: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
      'project': 'info',
      'investment': 'success',
      'service': 'warning',
      'consultation': 'default',
      'other': 'default',
    };
    return <Badge variant={variants[type] || 'default'}>{type}</Badge>;
  };

  const columns = [
    { key: 'income_no', header: 'Income #' },
    { key: 'title', header: 'Title' },
    {
      key: 'income_date',
      header: 'Date',
      render: (income: any) => new Date(income.income_date).toLocaleDateString(),
    },
    {
      key: 'income_type',
      header: 'Type',
      render: (income: any) => getIncomeTypeBadge(income.income_type),
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (income: any) => formatCurrency(income.amount),
    },
    {
      key: 'project',
      header: 'Project',
      render: (income: any) => income.project?.title || 'N/A',
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (income: any) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => handleEdit(income)}>
            Edit
          </Button>
          <Button size="sm" variant="danger" onClick={() => handleDelete(income.id)}>
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Income Records
          </h1>
          <p className="text-gray-600">Manage your income records (separate from project payments)</p>
        </div>
        <Button onClick={handleCreate}>+ Add Income</Button>
      </div>

      <div className="bg-white shadow rounded-lg">
        <DataTable data={incomes} columns={columns} loading={loading} />
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedIncome ? 'Edit Income' : 'Add Income'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Title *"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
            placeholder="e.g., Consultation Fee, Investment Return"
          />

          <Textarea
            label="Description"
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Additional details about this income"
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Amount *"
              type="number"
              step="0.01"
              min="0"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              required
            />

            <Input
              label="Income Date *"
              type="date"
              value={formData.income_date}
              onChange={(e) => setFormData({ ...formData, income_date: e.target.value })}
              required
            />
          </div>

          <Select
            label="Income Type *"
            value={formData.income_type}
            onChange={(e) => setFormData({ ...formData, income_type: e.target.value })}
            options={[
              { value: 'project', label: 'Project Related' },
              { value: 'service', label: 'Service' },
              { value: 'consultation', label: 'Consultation' },
              { value: 'investment', label: 'Investment' },
              { value: 'other', label: 'Other' },
            ]}
          />

          <Select
            label="Project (optional)"
            value={formData.project_id}
            onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
            options={[
              { value: '', label: 'Select project (optional)' },
              ...projects.map(proj => ({ value: proj.id.toString(), label: proj.title })),
            ]}
          />

          <Textarea
            label="Notes"
            rows={3}
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Additional notes about this income"
          />

          <Input
            label="Receipt (optional)"
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
          />

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              {selectedIncome ? 'Update' : 'Create'} Income
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

