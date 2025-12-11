import React, { useState, useEffect } from 'react';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Textarea } from '../ui/Textarea';
import { Button } from '../ui/Button';
import { Task } from '../../types';
import { projectService } from '../../services/projectService';
import { Project } from '../../types';

interface TaskFormProps {
  task?: Task;
  onSubmit: (data: Partial<Task>) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export const TaskForm: React.FC<TaskFormProps> = ({
  task,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<Partial<Task & { actual_time?: number }>>({
    title: '',
    description: '',
    project_id: undefined,
    assigned_to: undefined,
    priority: 'Medium',
    status: 'Pending',
    estimated_hours: undefined,
    actual_time: undefined,
    deadline: '',
    task_type: undefined,
  });

  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await projectService.getAll();
        setProjects(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error('Error fetching projects:', error);
      }
    };
    fetchProjects();
  }, []);

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        project_id: task.project_id,
        assigned_to: task.assigned_to,
        priority: task.priority || 'Medium',
        status: task.status || 'Pending',
        estimated_hours: task.estimated_hours,
        actual_time: (task as any).actual_time,
        deadline: task.deadline || '',
        task_type: task.task_type,
      });
    }
  }, [task]);

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

      <Textarea
        label="Description"
        rows={4}
        value={formData.description}
        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
      />

      <Select
        label="Project"
        value={formData.project_id || ''}
        onChange={(e) => setFormData({ ...formData, project_id: e.target.value ? parseInt(e.target.value) : undefined })}
        options={[
          { value: '', label: 'Select project' },
          ...projects.map(p => ({ value: p.id.toString(), label: p.title })),
        ]}
      />

      <Select
        label="Priority"
        value={formData.priority || 'Medium'}
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
        value={formData.status || 'Pending'}
        onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
        options={[
          { value: 'Pending', label: 'Pending' },
          { value: 'In Progress', label: 'In Progress' },
          { value: 'Completed', label: 'Completed' },
        ]}
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Estimated Hours"
          type="number"
          step="0.1"
          value={formData.estimated_hours || ''}
          onChange={(e) => setFormData({ ...formData, estimated_hours: parseFloat(e.target.value) || undefined })}
        />

        <Input
          label="Actual Time (hours)"
          type="number"
          step="0.1"
          value={(formData as any).actual_time || ''}
          onChange={(e) => setFormData({ ...formData, actual_time: parseFloat(e.target.value) || undefined })}
          disabled={formData.status !== 'Completed'}
        />
      </div>

      <Input
        label="Deadline"
        type="date"
        value={formData.deadline || ''}
        onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
      />

      <Select
        label="Task Type"
        value={formData.task_type || ''}
        onChange={(e) => setFormData({ ...formData, task_type: e.target.value as any })}
        options={[
          { value: '', label: 'Select type' },
          { value: 'Today', label: 'Today' },
          { value: 'Tomorrow', label: 'Tomorrow' },
          { value: 'Next 2–3 Days', label: 'Next 2–3 Days' },
          { value: 'This Week', label: 'This Week' },
          { value: 'Next Week', label: 'Next Week' },
        ]}
      />

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isLoading}>
          {task ? 'Update' : 'Create'} Task
        </Button>
      </div>
    </form>
  );
};

