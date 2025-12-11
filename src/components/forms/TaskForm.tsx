import React, { useState, useEffect } from 'react';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Textarea } from '../ui/Textarea';
import { Button } from '../ui/Button';
import { Task } from '../../types';
import { projectService } from '../../services/projectService';
import { Project, User } from '../../types';
import { requirementService, Requirement } from '../../services/requirementService';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';

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
  const { user: currentUser } = useAuthStore();
  
  const [formData, setFormData] = useState<Partial<Task & { actual_time?: number }>>({
    title: '',
    description: '',
    project_id: undefined,
    assigned_to: currentUser?.id,
    priority: 'Medium',
    status: 'Pending',
    estimated_hours: undefined,
    actual_time: undefined,
    deadline: '',
    task_type: undefined,
  });

  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [selectedRequirementIds, setSelectedRequirementIds] = useState<number[]>([]);
  
  const canAssignToOthers = currentUser?.role === 'Admin' || currentUser?.role === 'Project Manager';

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
    const fetchUsers = async () => {
      if (!canAssignToOthers) {
        // For developers, still show "Me" option but no other users
        setUsers([]);
        return;
      }
      
      try {
        // Both Admin and PM can assign to anyone
        const response = await api.get('/users');
        const usersData = Array.isArray(response.data.data) 
          ? response.data.data 
          : (Array.isArray(response.data) ? response.data : []);
        setUsers(usersData);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };
    fetchUsers();
  }, [canAssignToOthers, currentUser]);

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        project_id: task.project_id,
        assigned_to: task.assigned_to || currentUser?.id,
        priority: task.priority || 'Medium',
        status: task.status || 'Pending',
        estimated_hours: task.estimated_hours,
        actual_time: (task as any).actual_time,
        deadline: task.deadline || '',
        task_type: task.task_type,
      });
      if (task.requirements) {
        setSelectedRequirementIds(task.requirements.map((r: Requirement) => r.id));
      }
    } else if (currentUser) {
      // For new tasks, ensure assigned_to is set to current user
      setFormData(prev => ({
        ...prev,
        assigned_to: prev.assigned_to || currentUser.id,
      }));
    }
  }, [task, currentUser]);

  useEffect(() => {
    const fetchRequirements = async () => {
      if (formData.project_id) {
        try {
          const response = await requirementService.getAll(formData.project_id);
          const data = Array.isArray(response.data) ? response.data : (Array.isArray(response) ? response : []);
          setRequirements(data);
        } catch (error) {
          console.error('Error fetching requirements:', error);
        }
      } else {
        setRequirements([]);
      }
    };
    fetchRequirements();
  }, [formData.project_id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Ensure assigned_to is always set (default to current user if not set)
    const submitData = {
      ...formData,
      assigned_to: formData.assigned_to || currentUser?.id,
      requirement_ids: selectedRequirementIds,
    };
    await onSubmit(submitData);
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
        label="Assign To"
        value={formData.assigned_to || currentUser?.id || ''}
        onChange={(e) => {
          const value = e.target.value;
          setFormData({ 
            ...formData, 
            assigned_to: value ? parseInt(value) : (currentUser?.id || undefined)
          });
        }}
        options={[
          { value: currentUser?.id.toString() || '', label: `Me (${currentUser?.name || 'Current User'})` },
          ...(canAssignToOthers ? users.filter(u => u.id !== currentUser?.id).map(u => ({ value: u.id.toString(), label: u.name })) : []),
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

      {formData.project_id && requirements.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Attach Requirements
          </label>
          <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-300 rounded-md p-3">
            {requirements.map((req) => (
              <label key={req.id} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedRequirementIds.includes(req.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedRequirementIds([...selectedRequirementIds, req.id]);
                    } else {
                      setSelectedRequirementIds(selectedRequirementIds.filter(id => id !== req.id));
                    }
                  }}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm">{req.title}</span>
                {req.type === 'document' && (
                  <span className="text-xs text-gray-500">({req.document_name})</span>
                )}
              </label>
            ))}
          </div>
        </div>
      )}

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

