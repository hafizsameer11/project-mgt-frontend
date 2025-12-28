import { useEffect, useState } from 'react';
import { DataTable } from '../components/ui/DataTable';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Textarea } from '../components/ui/Textarea';
import { Card } from '../components/ui/Card';
import api from '../services/api';
import { formatCurrency } from '../lib/currency';

export default function PlannedExpenses() {
  const [plannedExpenses, setPlannedExpenses] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<any>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [monthlySummary, setMonthlySummary] = useState<any>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [formData, setFormData] = useState({
    expense_category_id: '',
    name: '',
    description: '',
    amount: '',
    currency: 'PKR',
    day_of_month: '',
    is_active: true,
    is_recurring: true,
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    specific_month: '',
  });

  useEffect(() => {
    fetchPlannedExpenses();
    fetchCategories();
    fetchMonthlySummary();
  }, [selectedMonth]);

  const fetchPlannedExpenses = async () => {
    try {
      setLoading(true);
      const response = await api.get('/planned-expenses');
      setPlannedExpenses(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching planned expenses:', error);
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

  const fetchMonthlySummary = async () => {
    try {
      const [year, month] = selectedMonth.split('-');
      const response = await api.get('/planned-expenses/monthly-summary', {
        params: { year, month },
      });
      setMonthlySummary(response.data);
    } catch (error) {
      console.error('Error fetching monthly summary:', error);
    }
  };

  const handleCreate = () => {
    setSelectedExpense(undefined);
    setFormData({
      expense_category_id: '',
      name: '',
      description: '',
      amount: '',
      currency: 'PKR',
      day_of_month: '',
      is_active: true,
      is_recurring: true,
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      specific_month: '',
    });
    setIsModalOpen(true);
  };

  const handleEdit = (expense: any) => {
    setSelectedExpense(expense);
    setFormData({
      expense_category_id: expense.expense_category_id?.toString() || '',
      name: expense.name || '',
      description: expense.description || '',
      amount: expense.amount?.toString() || '',
      currency: expense.currency || 'PKR',
      day_of_month: expense.day_of_month?.toString() || '',
      is_active: expense.is_active ?? true,
      is_recurring: expense.is_recurring ?? true,
      start_date: expense.start_date || new Date().toISOString().split('T')[0],
      end_date: expense.end_date || '',
      specific_month: expense.specific_month || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const data = {
        ...formData,
        amount: parseFloat(formData.amount),
        day_of_month: parseInt(formData.day_of_month),
        expense_category_id: formData.expense_category_id || null,
        start_date: formData.is_recurring ? formData.start_date : null,
        end_date: formData.is_recurring ? (formData.end_date || null) : null,
        specific_month: !formData.is_recurring ? formData.specific_month : null,
      };

      if (selectedExpense) {
        await api.put(`/planned-expenses/${selectedExpense.id}`, data);
      } else {
        await api.post('/planned-expenses', data);
      }

      setIsModalOpen(false);
      fetchPlannedExpenses();
      fetchMonthlySummary();
    } catch (error) {
      console.error('Error saving planned expense:', error);
      alert('Error saving planned expense');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this planned expense?')) {
      return;
    }
    try {
      await api.delete(`/planned-expenses/${id}`);
      fetchPlannedExpenses();
      fetchMonthlySummary();
    } catch (error) {
      console.error('Error deleting planned expense:', error);
      alert('Error deleting planned expense');
    }
  };

  const columns = [
    { key: 'name', header: 'Name' },
    {
      key: 'category',
      header: 'Category',
      render: (expense: any) => expense.category?.name || 'N/A',
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (expense: any) => formatCurrency(expense.amount),
    },
    {
      key: 'day_of_month',
      header: 'Due Day',
      render: (expense: any) => `Day ${expense.day_of_month}`,
    },
    {
      key: 'type',
      header: 'Type',
      render: (expense: any) => (
        <Badge variant={expense.is_recurring ? 'info' : 'warning'}>
          {expense.is_recurring ? 'Recurring' : 'One-time'}
        </Badge>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (expense: any) => (
        <Badge variant={expense.is_active ? 'success' : 'default'}>
          {expense.is_active ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (expense: any) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => handleEdit(expense)}>
            Edit
          </Button>
          <Button size="sm" variant="danger" onClick={() => handleDelete(expense.id)}>
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
            Planned Expenses
          </h1>
          <p className="text-gray-600">Manage your recurring and one-time planned expenses</p>
        </div>
        <Button onClick={handleCreate}>+ Add Planned Expense</Button>
      </div>

      {/* Monthly Summary Card */}
      {monthlySummary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <div className="p-6">
              <div className="text-sm font-medium text-gray-500 mb-2">Month</div>
              <div className="text-2xl font-bold text-gray-900">{monthlySummary.month_name}</div>
            </div>
          </Card>
          
          <Card>
            <div className="p-6">
              <div className="text-sm font-medium text-gray-500 mb-2">Planned Expenses</div>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(monthlySummary.planned_expenses.total)}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {monthlySummary.planned_expenses.items.length} items
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <div className="text-sm font-medium text-gray-500 mb-2">Current Income</div>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(monthlySummary.income.current)}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Pending: {formatCurrency(monthlySummary.income.pending)}
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <div className="text-sm font-medium text-gray-500 mb-2">Required Income</div>
              <div className={`text-2xl font-bold ${monthlySummary.summary.is_sufficient ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(monthlySummary.summary.required_income)}
              </div>
              <div className={`text-xs mt-1 ${monthlySummary.summary.income_gap > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {monthlySummary.summary.income_gap > 0 
                  ? `Gap: ${formatCurrency(monthlySummary.summary.income_gap)}`
                  : `Surplus: ${formatCurrency(Math.abs(monthlySummary.summary.income_gap))}`
                }
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Month Selector */}
      <div className="mb-6">
        <Input
          label="Select Month"
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="max-w-xs"
        />
      </div>

      {/* Planned Expenses List for Selected Month */}
      {monthlySummary && monthlySummary.planned_expenses.items.length > 0 && (
        <Card className="mb-6">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Planned Expenses for {monthlySummary.month_name}</h2>
            <div className="space-y-3">
              {monthlySummary.planned_expenses.items.map((item: any) => (
                <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium">{item.name}</div>
                    <div className="text-sm text-gray-500">{item.category} • Due on day {item.day_of_month}</div>
                  </div>
                  <div className="font-semibold">{formatCurrency(item.amount)}</div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* All Planned Expenses Table */}
      <Card>
        <DataTable data={plannedExpenses} columns={columns} loading={loading} />
      </Card>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedExpense ? 'Edit Planned Expense' : 'Add Planned Expense'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Name *"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            placeholder="e.g., Office Rent, Internet Bill"
          />

          <Select
            label="Category"
            value={formData.expense_category_id}
            onChange={(e) => setFormData({ ...formData, expense_category_id: e.target.value })}
            options={[
              { value: '', label: 'Select category (optional)' },
              ...categories.map(cat => ({ value: cat.id.toString(), label: cat.name })),
            ]}
          />

          <Textarea
            label="Description"
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Additional details about this expense"
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
              label="Due Day of Month *"
              type="number"
              min="1"
              max="31"
              value={formData.day_of_month}
              onChange={(e) => setFormData({ ...formData, day_of_month: e.target.value })}
              required
              placeholder="1-31"
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="is_recurring"
              checked={formData.is_recurring}
              onChange={(e) => setFormData({ ...formData, is_recurring: e.target.checked })}
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="is_recurring" className="text-sm font-medium text-gray-700">
              Recurring expense (monthly)
            </label>
          </div>

          {formData.is_recurring ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Start Date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                />
                <Input
                  label="End Date (optional)"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                />
              </div>
            </>
          ) : (
            <Input
              label="Specific Month"
              type="month"
              value={formData.specific_month}
              onChange={(e) => setFormData({ ...formData, specific_month: e.target.value })}
              required={!formData.is_recurring}
            />
          )}

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
              Active
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              {selectedExpense ? 'Update' : 'Create'} Planned Expense
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

