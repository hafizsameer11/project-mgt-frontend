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
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingTeams, setLoadingTeams] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const clientsRes = await clientService.getAll();
        setClients(Array.isArray(clientsRes.data) ? clientsRes.data : []);
        await fetchAllTeams();
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
  }, []);

  const fetchAllTeams = async () => {
    try {
      setLoadingTeams(true);
      let allTeams: Team[] = [];
      let currentPage = 1;
      let hasMore = true;

      // First, try to get all teams with a high per_page limit
      try {
        const response = await teamService.getAll({ page: 1, per_page: 1000 });
        const pageTeams = Array.isArray(response.data) ? response.data : [];
        if (response.meta && response.meta.total <= pageTeams.length) {
          // Got all teams in one request
          setTeams(pageTeams);
          return;
        }
        // If not all, continue with pagination
        allTeams = [...allTeams, ...pageTeams];
        if (response.meta) {
          hasMore = currentPage < response.meta.last_page;
          currentPage = 2; // Start from page 2
        }
      } catch (e) {
        // If per_page doesn't work, fall back to default pagination
        console.log('Large per_page not supported, using pagination');
      }

      // Fetch remaining pages if needed
      while (hasMore) {
        const response = await teamService.getAll({ page: currentPage });
        const pageTeams = Array.isArray(response.data) ? response.data : [];
        allTeams = [...allTeams, ...pageTeams];
        
        // Check if there are more pages
        if (response.meta) {
          hasMore = currentPage < response.meta.last_page;
          currentPage++;
        } else {
          hasMore = pageTeams.length === 15; // Assume 15 per page if no meta
          currentPage++;
        }
        
        // Safety check to prevent infinite loops
        if (currentPage > 100) break;
      }
      
      setTeams(allTeams);
    } catch (error) {
      console.error('Error fetching teams:', error);
    } finally {
      setLoadingTeams(false);
    }
  };

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
        
        {/* Search Input */}
        <Input
          placeholder="Search team members by name, email, or role..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="mb-3"
        />
        
        {loadingTeams ? (
          <div className="text-center py-4">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
            <p className="mt-2 text-sm text-gray-500">Loading team members...</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto border rounded-md p-3 bg-gray-50">
            {(() => {
              const filteredTeams = teams.filter((team) => {
                const query = searchQuery.toLowerCase();
                return (
                  team.full_name?.toLowerCase().includes(query) ||
                  team.email?.toLowerCase().includes(query) ||
                  team.role?.toLowerCase().includes(query) ||
                  team.phone?.toLowerCase().includes(query)
                );
              });

              if (filteredTeams.length === 0) {
                return (
                  <div className="text-center py-4 text-sm text-gray-500">
                    {searchQuery ? 'No team members found matching your search.' : 'No team members available.'}
                  </div>
                );
              }

              return filteredTeams.map((team) => (
                <label
                  key={team.id}
                  className="flex items-center space-x-3 p-2 hover:bg-white rounded cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={formData.team_ids?.includes(team.id) || false}
                    onChange={() => handleTeamToggle(team.id)}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-gray-900">{team.full_name}</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-gray-500">{team.role}</span>
                      {team.email && (
                        <>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs text-gray-500">{team.email}</span>
                        </>
                      )}
                    </div>
                  </div>
                </label>
              ));
            })()}
          </div>
        )}
        
        {formData.team_ids && formData.team_ids.length > 0 && (
          <div className="mt-2 text-sm text-gray-600">
            {formData.team_ids.length} team member{formData.team_ids.length !== 1 ? 's' : ''} selected
          </div>
        )}
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

