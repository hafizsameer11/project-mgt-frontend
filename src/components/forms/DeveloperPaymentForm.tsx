import React, { useState, useEffect } from 'react';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Textarea } from '../ui/Textarea';
import { Button } from '../ui/Button';
import { teamService } from '../../services/teamService';
import api from '../../services/api';

interface DeveloperPaymentFormProps {
  projectId?: number;
  payment?: any;
  onSubmit: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const DeveloperPaymentForm: React.FC<DeveloperPaymentFormProps> = ({
  projectId,
  payment,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState({
    project_id: projectId?.toString() || '',
    developer_id: '',
    total_assigned_amount: '',
    payment_notes: '',
  });
  const [teams, setTeams] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);

  useEffect(() => {
    fetchTeams();
    if (!projectId) {
      fetchProjects();
    }
  }, []);

  useEffect(() => {
    if (payment) {
      setFormData({
        project_id: payment.project_id?.toString() || projectId?.toString() || '',
        developer_id: payment.developer_id?.toString() || '',
        total_assigned_amount: payment.total_assigned_amount?.toString() || '',
        payment_notes: payment.payment_notes || '',
      });
    }
  }, [payment]);

  const fetchTeams = async () => {
    try {
      const response = await teamService.getAll({ role: 'Developer' });
      setTeams(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching teams:', error);
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
        project_id: projectId || parseInt(formData.project_id),
        developer_id: parseInt(formData.developer_id),
        total_assigned_amount: parseFloat(formData.total_assigned_amount),
        payment_notes: formData.payment_notes,
      };
      if (payment) {
        await api.put(`/developer-payments/${payment.id}`, data);
      } else {
        await api.post('/developer-payments', data);
      }

      onSubmit();
    } catch (error: any) {
      console.error('Error saving developer payment:', error);
      alert(error.response?.data?.message || 'Error saving payment');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!projectId && (
        <Select
          label="Project *"
          value={formData.project_id}
          onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
          required
          options={[
            { value: '', label: 'Select project' },
            ...projects.map(p => ({ value: p.id.toString(), label: p.title })),
          ]}
        />
      )}

      <Select
        label="Developer *"
        value={formData.developer_id}
        onChange={(e) => setFormData({ ...formData, developer_id: e.target.value })}
        required
        options={[
          { value: '', label: 'Select developer' },
          ...teams.map(t => ({ value: t.id.toString(), label: t.full_name })),
        ]}
      />

      <Input
        label="Assigned Amount *"
        type="number"
        step="0.01"
        min="0"
        value={formData.total_assigned_amount}
        onChange={(e) => setFormData({ ...formData, total_assigned_amount: e.target.value })}
        required
        placeholder="Enter the amount assigned to this developer for this project"
      />

      <Textarea
        label="Payment Notes"
        rows={3}
        value={formData.payment_notes}
        onChange={(e) => setFormData({ ...formData, payment_notes: e.target.value })}
      />

      <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
        <p className="text-sm text-yellow-800">
          <strong>Note:</strong> This is a variable amount assigned specifically for this project. 
          It's not a percentage or fixed rate - you can set any amount based on the project budget and developer's work.
        </p>
      </div>

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

