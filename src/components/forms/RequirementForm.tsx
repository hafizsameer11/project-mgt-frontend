import React, { useState } from 'react';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Textarea } from '../ui/Textarea';
import { Button } from '../ui/Button';
import { Requirement } from '../../services/requirementService';

interface RequirementFormProps {
  projectId: number;
  requirement?: Requirement;
  onSubmit: (data: Partial<Requirement> & { document?: File }) => Promise<void>;
}

export const RequirementForm: React.FC<RequirementFormProps> = ({
  projectId,
  requirement,
  onSubmit,
}) => {
  const [formData, setFormData] = useState<Partial<Requirement> & { document?: File }>({
    title: requirement?.title || '',
    description: requirement?.description || '',
    type: requirement?.type || 'text',
    priority: requirement?.priority || 'Medium',
    status: requirement?.status || 'Draft',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Title *"
        value={formData.title}
        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        required
      />

      <Select
        label="Type *"
        value={formData.type}
        onChange={(e) => setFormData({ ...formData, type: e.target.value as 'document' | 'text' })}
        options={[
          { value: 'text', label: 'Text Requirement' },
          { value: 'document', label: 'Document Requirement' },
        ]}
      />

      {formData.type === 'text' && (
        <Textarea
          label="Description *"
          rows={6}
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          required
        />
      )}

      {formData.type === 'document' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Document *
          </label>
          <input
            type="file"
            accept=".pdf,.doc,.docx,.txt"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                setFormData({ ...formData, document: file });
              }
            }}
            required={!requirement}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
          />
          {requirement?.document_name && (
            <p className="mt-2 text-sm text-gray-600">Current: {requirement.document_name}</p>
          )}
        </div>
      )}

      <Select
        label="Priority"
        value={formData.priority}
        onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
        options={[
          { value: 'Low', label: 'Low' },
          { value: 'Medium', label: 'Medium' },
          { value: 'High', label: 'High' },
          { value: 'Critical', label: 'Critical' },
        ]}
      />

      <Select
        label="Status"
        value={formData.status}
        onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
        options={[
          { value: 'Draft', label: 'Draft' },
          { value: 'Active', label: 'Active' },
          { value: 'Completed', label: 'Completed' },
          { value: 'Cancelled', label: 'Cancelled' },
        ]}
      />

      <div className="flex justify-end gap-3 pt-4">
        <Button type="submit">
          {requirement ? 'Update' : 'Create'} Requirement
        </Button>
      </div>
    </form>
  );
};

