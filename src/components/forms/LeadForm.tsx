import React, { useState, useEffect } from 'react';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Textarea } from '../ui/Textarea';
import { Button } from '../ui/Button';
import { Lead } from '../../types';

interface LeadFormProps {
  lead?: Lead;
  onSubmit: (data: Partial<Lead>) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export const LeadForm: React.FC<LeadFormProps> = ({
  lead,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<Partial<Lead>>({
    name: '',
    email: '',
    phone: '',
    source: undefined,
    estimated_budget: undefined,
    lead_status: 'New',
    assigned_to: undefined,
    notes: '',
    follow_up_date: '',
  });

  useEffect(() => {
    if (lead) {
      setFormData({
        name: lead.name || '',
        email: lead.email || '',
        phone: lead.phone || '',
        source: lead.source,
        estimated_budget: lead.estimated_budget,
        lead_status: lead.lead_status,
        assigned_to: lead.assigned_to,
        notes: lead.notes || '',
        follow_up_date: lead.follow_up_date || '',
      });
    }
  }, [lead]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Name *"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        required
      />

      <Input
        label="Email"
        type="email"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
      />

      <Input
        label="Phone"
        value={formData.phone}
        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
      />

      <Select
        label="Source"
        value={formData.source || ''}
        onChange={(e) => setFormData({ ...formData, source: e.target.value as any })}
        options={[
          { value: '', label: 'Select source' },
          { value: 'Facebook', label: 'Facebook' },
          { value: 'Upwork', label: 'Upwork' },
          { value: 'Fiverr', label: 'Fiverr' },
          { value: 'Website', label: 'Website' },
          { value: 'Referral', label: 'Referral' },
          { value: 'Other', label: 'Other' },
        ]}
      />

      <Input
        label="Estimated Budget"
        type="number"
        step="0.01"
        value={formData.estimated_budget || ''}
        onChange={(e) => setFormData({ ...formData, estimated_budget: parseFloat(e.target.value) || undefined })}
      />

      <Select
        label="Status *"
        value={formData.lead_status}
        onChange={(e) => setFormData({ ...formData, lead_status: e.target.value as any })}
        required
        options={[
          { value: 'New', label: 'New' },
          { value: 'In Progress', label: 'In Progress' },
          { value: 'Converted', label: 'Converted' },
          { value: 'Lost', label: 'Lost' },
        ]}
      />

      <Input
        label="Follow-up Date"
        type="date"
        value={formData.follow_up_date || ''}
        onChange={(e) => setFormData({ ...formData, follow_up_date: e.target.value })}
      />

      <Textarea
        label="Notes"
        rows={4}
        value={formData.notes}
        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
      />

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isLoading}>
          {lead ? 'Update' : 'Create'} Lead
        </Button>
      </div>
    </form>
  );
};

