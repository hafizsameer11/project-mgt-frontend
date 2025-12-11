import React, { useState, useEffect } from 'react';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Textarea } from '../ui/Textarea';
import { Button } from '../ui/Button';
import api from '../../services/api';

interface BdPaymentFormProps {
  projectId: number;
  payment?: any;
  onSubmit: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const BdPaymentForm: React.FC<BdPaymentFormProps> = ({
  projectId,
  payment,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState({
    bd_id: '',
    payment_type: 'percentage',
    percentage: '',
    fixed_amount: '',
    payment_notes: '',
  });
  const [users, setUsers] = useState<any[]>([]);
  const [project, setProject] = useState<any>(null);

  useEffect(() => {
    fetchUsers();
    fetchProject();
  }, []);

  useEffect(() => {
    if (payment) {
      setFormData({
        bd_id: payment.bd_id?.toString() || '',
        payment_type: payment.payment_type || 'percentage',
        percentage: payment.percentage?.toString() || '',
        fixed_amount: payment.fixed_amount?.toString() || '',
        payment_notes: payment.payment_notes || '',
      });
    }
  }, [payment]);

  const fetchUsers = async () => {
    try {
      // Get team members with role 'Business Developer'
      const teamsResponse = await api.get('/teams', { params: { role: 'Business Developer' } });
      const teamsData = Array.isArray(teamsResponse.data.data) ? teamsResponse.data.data : (Array.isArray(teamsResponse.data) ? teamsResponse.data : []);
      
      // Get all users
      const usersResponse = await api.get('/users');
      const allUsers = Array.isArray(usersResponse.data) ? usersResponse.data : [];
      
      // Match team members with their user accounts
      const bdUsers = teamsData
        .map((team: any) => {
          if (team.user_id) {
            const user = allUsers.find((u: any) => u.id === team.user_id);
            if (user) {
              return { ...user, team_id: team.id, team_name: team.full_name };
            }
          }
          // If no user account, create a placeholder
          return {
            id: team.user_id || team.id, // Use team id as fallback
            name: team.full_name,
            email: team.email || '',
            role: team.role,
            team_id: team.id,
            team_name: team.full_name,
          };
        })
        .filter((u: any) => u);
      
      setUsers(bdUsers);
    } catch (error) {
      console.error('Error fetching BD users:', error);
      // Fallback: get users with Business Developer role
      try {
        const response = await api.get('/users');
        const allUsers = Array.isArray(response.data) ? response.data : [];
        const bdUsers = allUsers.filter((u: any) => u.role === 'Business Developer');
        setUsers(bdUsers);
      } catch (e) {
        console.error('Error in fallback:', e);
        setUsers([]);
      }
    }
  };

  const fetchProject = async () => {
    try {
      const response = await api.get(`/projects/${projectId}`);
      setProject(response.data);
    } catch (error) {
      console.error('Error fetching project:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data: any = {
        project_id: projectId,
        bd_id: parseInt(formData.bd_id),
        payment_type: formData.payment_type,
        payment_notes: formData.payment_notes,
      };

      if (formData.payment_type === 'percentage') {
        data.percentage = parseFloat(formData.percentage);
      } else {
        data.fixed_amount = parseFloat(formData.fixed_amount);
      }

      if (payment) {
        await api.put(`/project-bd-payments/${payment.id}`, data);
      } else {
        await api.post('/project-bd-payments', data);
      }

      onSubmit();
    } catch (error: any) {
      console.error('Error saving BD payment:', error);
      alert(error.response?.data?.message || 'Error saving payment');
    }
  };

  const calculatedAmount = formData.payment_type === 'percentage' && formData.percentage && project?.budget
    ? (project.budget * parseFloat(formData.percentage)) / 100
    : formData.payment_type === 'fixed_amount' && formData.fixed_amount
    ? parseFloat(formData.fixed_amount)
    : null;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Select
        label="Business Developer *"
        value={formData.bd_id}
        onChange={(e) => setFormData({ ...formData, bd_id: e.target.value })}
        required
        options={[
          { value: '', label: 'Select BD' },
          ...users.map(u => ({ 
            value: u.id.toString(), 
            label: u.team_name || u.name || `${u.name} (${u.email || 'No email'})` 
          })),
        ]}
      />

      <Select
        label="Payment Type *"
        value={formData.payment_type}
        onChange={(e) => setFormData({ ...formData, payment_type: e.target.value, percentage: '', fixed_amount: '' })}
        required
        options={[
          { value: 'percentage', label: 'Percentage' },
          { value: 'fixed_amount', label: 'Fixed Amount' },
        ]}
      />

      {formData.payment_type === 'percentage' ? (
        <>
          <Input
            label="Percentage *"
            type="number"
            step="0.01"
            min="0"
            max="100"
            value={formData.percentage}
            onChange={(e) => setFormData({ ...formData, percentage: e.target.value })}
            required
          />
          {project?.budget && formData.percentage && (
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600">
                Calculated Amount: <span className="font-semibold text-gray-900">
                  ${((project.budget * parseFloat(formData.percentage)) / 100).toLocaleString()}
                </span>
              </p>
              <p className="text-xs text-gray-500 mt-1">Based on project budget: ${project.budget.toLocaleString()}</p>
            </div>
          )}
        </>
      ) : (
        <Input
          label="Fixed Amount *"
          type="number"
          step="0.01"
          min="0"
          value={formData.fixed_amount}
          onChange={(e) => setFormData({ ...formData, fixed_amount: e.target.value })}
          required
        />
      )}

      <Textarea
        label="Payment Notes"
        rows={3}
        value={formData.payment_notes}
        onChange={(e) => setFormData({ ...formData, payment_notes: e.target.value })}
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

