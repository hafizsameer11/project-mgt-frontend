import React, { useState, useEffect } from 'react';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Textarea } from '../ui/Textarea';
import { Button } from '../ui/Button';
import api from '../../services/api';

interface ClientPaymentFormProps {
  payment?: any;
  onSubmit: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const ClientPaymentForm: React.FC<ClientPaymentFormProps> = ({
  payment,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState({
    client_id: '',
    project_id: '',
    invoice_no: '',
    total_amount: '',
    amount_paid: '',
    notes: '',
  });
  const [clients, setClients] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);

  useEffect(() => {
    fetchClients();
    fetchProjects();
  }, []);

  useEffect(() => {
    if (payment) {
      setFormData({
        client_id: payment.client_id?.toString() || '',
        project_id: payment.project_id?.toString() || '',
        invoice_no: payment.invoice_no || '',
        total_amount: payment.total_amount?.toString() || '',
        amount_paid: payment.amount_paid?.toString() || '',
        notes: payment.notes || '',
      });
    }
  }, [payment]);

  const fetchClients = async () => {
    try {
      const response = await api.get('/clients');
      setClients(Array.isArray(response.data.data) ? response.data.data : []);
    } catch (error) {
      console.error('Error fetching clients:', error);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        client_id: parseInt(formData.client_id),
        project_id: parseInt(formData.project_id),
        invoice_no: formData.invoice_no || undefined,
        total_amount: formData.total_amount ? parseFloat(formData.total_amount) : undefined,
        amount_paid: formData.amount_paid ? parseFloat(formData.amount_paid) : 0,
        notes: formData.notes || undefined,
      };

      if (payment) {
        await api.put(`/client-payments/${payment.id}`, data);
      } else {
        await api.post('/client-payments', data);
      }

      onSubmit();
    } catch (error: any) {
      console.error('Error saving client payment:', error);
      alert(error.response?.data?.message || 'Error saving payment');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Select
        label="Client *"
        value={formData.client_id}
        onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
        required
        options={[
          { value: '', label: 'Select client' },
          ...clients.map(c => ({ value: c.id.toString(), label: c.name })),
        ]}
      />

      <Select
        label="Project *"
        value={formData.project_id}
        onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
        required
        options={[
          { value: '', label: 'Select project' },
          ...projects
            .filter(p => !formData.client_id || p.client_id?.toString() === formData.client_id)
            .map(p => ({ value: p.id.toString(), label: p.title })),
        ]}
      />

      <Input
        label="Invoice Number"
        value={formData.invoice_no}
        onChange={(e) => setFormData({ ...formData, invoice_no: e.target.value })}
        placeholder="Auto-generated if left empty"
      />

      <Input
        label="Total Amount"
        type="number"
        step="0.01"
        min="0"
        value={formData.total_amount}
        onChange={(e) => setFormData({ ...formData, total_amount: e.target.value })}
        placeholder="Total invoice amount"
      />

      <Input
        label="Amount Paid"
        type="number"
        step="0.01"
        min="0"
        value={formData.amount_paid}
        onChange={(e) => setFormData({ ...formData, amount_paid: e.target.value })}
        placeholder="Amount received from client"
      />

      <Textarea
        label="Notes"
        rows={3}
        value={formData.notes}
        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
      />

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isLoading}>
          {payment ? 'Update' : 'Create'} Payment
        </Button>
      </div>
    </form>
  );
};

