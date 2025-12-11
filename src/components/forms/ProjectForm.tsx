import React, { useState, useEffect } from 'react';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Textarea } from '../ui/Textarea';
import { Button } from '../ui/Button';
import { Project } from '../../types';
import { clientService } from '../../services/clientService';
import { teamService } from '../../services/teamService';
import { Client, Team } from '../../types';

interface ProjectFormProps {
  project?: Project;
  onSubmit: (data: Partial<Project>) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export const ProjectForm: React.FC<ProjectFormProps> = ({
  project,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<Partial<Project>>({
    title: '',
    client_id: undefined,
    budget: undefined,
    description: '',
    start_date: '',
    end_date: '',
    project_type: '',
    priority: 'Medium',
    status: 'Planning',
    repo_link: '',
    server_url: '',
    team_ids: [],
  });

  const [clients, setClients] = useState<Client[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [clientsRes, teamsRes] = await Promise.all([
          clientService.getAll(),
          teamService.getAll(),
        ]);
        setClients(Array.isArray(clientsRes.data) ? clientsRes.data : []);
        setTeams(Array.isArray(teamsRes.data) ? teamsRes.data : []);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (project) {
      setFormData({
        title: project.title || '',
        client_id: project.client_id,
        budget: project.budget,
        description: project.description || '',
        start_date: project.start_date || '',
        end_date: project.end_date || '',
        project_type: project.project_type || '',
        priority: project.priority || 'Medium',
        status: project.status || 'Planning',
        repo_link: project.repo_link || '',
        server_url: project.server_url || '',
        team_ids: project.teams?.map(t => t.id) || [],
      });
    }
  }, [project]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  const handleTeamToggle = (teamId: number) => {
    setFormData(prev => {
      const currentIds = prev.team_ids || [];
      const newIds = currentIds.includes(teamId)
        ? currentIds.filter(id => id !== teamId)
        : [...currentIds, teamId];
      return { ...prev, team_ids: newIds };
    });
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
        label="Client"
        value={formData.client_id || ''}
        onChange={(e) => setFormData({ ...formData, client_id: e.target.value ? parseInt(e.target.value) : undefined })}
        options={[
          { value: '', label: 'Select client' },
          ...clients.map(c => ({ value: c.id.toString(), label: c.name })),
        ]}
      />

      <Input
        label="Budget"
        type="number"
        step="0.01"
        value={formData.budget || ''}
        onChange={(e) => setFormData({ ...formData, budget: parseFloat(e.target.value) || undefined })}
      />

      <Textarea
        label="Description"
        rows={4}
        value={formData.description}
        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Start Date"
          type="date"
          value={formData.start_date || ''}
          onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
        />

        <Input
          label="End Date"
          type="date"
          value={formData.end_date || ''}
          onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
        />
      </div>

      <Input
        label="Project Type"
        value={formData.project_type}
        onChange={(e) => setFormData({ ...formData, project_type: e.target.value })}
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
        label="Status *"
        value={formData.status}
        onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
        required
        options={[
          { value: 'Planning', label: 'Planning' },
          { value: 'In Progress', label: 'In Progress' },
          { value: 'On Hold', label: 'On Hold' },
          { value: 'Completed', label: 'Completed' },
          { value: 'Cancelled', label: 'Cancelled' },
        ]}
      />

      <Input
        label="Repository Link"
        type="url"
        value={formData.repo_link}
        onChange={(e) => setFormData({ ...formData, repo_link: e.target.value })}
      />

      <Input
        label="Server URL"
        type="url"
        value={formData.server_url}
        onChange={(e) => setFormData({ ...formData, server_url: e.target.value })}
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Team Members
        </label>
        <div className="space-y-2 max-h-40 overflow-y-auto border rounded-md p-2">
          {teams.map((team) => (
            <label key={team.id} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.team_ids?.includes(team.id) || false}
                onChange={() => handleTeamToggle(team.id)}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-700">{team.full_name}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isLoading}>
          {project ? 'Update' : 'Create'} Project
        </Button>
      </div>
    </form>
  );
};

