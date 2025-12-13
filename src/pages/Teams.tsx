import { useEffect, useState } from 'react';
import { Team } from '../types';
import { teamService } from '../services/teamService';
import { Modal } from '../components/ui/Modal';
import { DataTable } from '../components/ui/DataTable';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Textarea } from '../components/ui/Textarea';
import api from '../services/api';

export default function Teams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | undefined>();
  const [selectedTeamForAccount, setSelectedTeamForAccount] = useState<Team | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAccountSubmitting, setIsAccountSubmitting] = useState(false);
  const [accountFormData, setAccountFormData] = useState({
    email: '',
    password: '',
    password_confirmation: '',
  });
  const [formData, setFormData] = useState<Partial<Team>>({
    full_name: '',
    email: '',
    phone: '',
    role: 'Developer',
    payment_type: undefined,
    salary_amount: undefined,
    skills: [],
    joining_date: '',
    notes: '',
  });
  const [createAccount, setCreateAccount] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 15,
    total: 0,
    from: 0,
    to: 0,
  });
  const [links, setLinks] = useState<any>({});

  useEffect(() => {
    fetchTeams(1);
  }, []);

  const fetchTeams = async (page: number = 1) => {
    try {
      setLoading(true);
      const response = await teamService.getAll({ page });
      setTeams(Array.isArray(response.data) ? response.data : []);
      
      // Handle pagination metadata
      if (response.meta) {
        setPagination({
          current_page: response.meta.current_page || 1,
          last_page: response.meta.last_page || 1,
          per_page: response.meta.per_page || 15,
          total: response.meta.total || 0,
          from: response.meta.from || 0,
          to: response.meta.to || 0,
        });
      }
      
      if (response.links) {
        setLinks(response.links);
      }
    } catch (error) {
      console.error('Error fetching teams:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedTeam) {
      setFormData({
        full_name: selectedTeam.full_name || '',
        email: selectedTeam.email || '',
        phone: selectedTeam.phone || '',
        role: selectedTeam.role || 'Developer',
        payment_type: selectedTeam.payment_type,
        salary_amount: selectedTeam.salary_amount,
        skills: selectedTeam.skills || [],
        joining_date: selectedTeam.joining_date || '',
        notes: selectedTeam.notes || '',
      });
      setCreateAccount(false);
      setPassword('');
      setPasswordConfirm('');
    } else {
      setFormData({
        full_name: '',
        email: '',
        phone: '',
        role: 'Developer',
        payment_type: undefined,
        salary_amount: undefined,
        skills: [],
        joining_date: '',
        notes: '',
      });
      setCreateAccount(true);
      setPassword('');
      setPasswordConfirm('');
    }
  }, [selectedTeam]);


  const handleCreate = () => {
    setSelectedTeam(undefined);
    setIsModalOpen(true);
  };

  const handleEdit = (team: Team) => {
    setSelectedTeam(team);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate password if creating account
    if (createAccount && !selectedTeam) {
      if (!formData.email) {
        alert('Email is required to create an account');
        return;
      }
      if (!password || password.length < 8) {
        alert('Password must be at least 8 characters');
        return;
      }
      if (password !== passwordConfirm) {
        alert('Passwords do not match');
        return;
      }
    }

    try {
      setIsSubmitting(true);
      let teamId: number;
      
      if (selectedTeam) {
        await teamService.update(selectedTeam.id, formData);
        teamId = selectedTeam.id;
      } else {
        const response = await teamService.create(formData);
        teamId = response.id;
      }

      // Create user account if requested
      if (createAccount && !selectedTeam && formData.email && password) {
        try {
          await api.post(`/teams/${teamId}/create-account`, {
            email: formData.email,
            password,
            password_confirmation: passwordConfirm,
          });
        } catch (error: any) {
          console.error('Error creating account:', error);
          // Don't fail the whole operation if account creation fails
          alert('Team member created but account creation failed: ' + (error.response?.data?.message || 'Unknown error'));
        }
      }

      setIsModalOpen(false);
      setPassword('');
      setPasswordConfirm('');
      fetchTeams(pagination.current_page);
    } catch (error) {
      console.error('Error saving team:', error);
      alert('Error saving team');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this team member?')) {
      try {
        await teamService.delete(id);
        fetchTeams(pagination.current_page);
      } catch (error) {
        console.error('Error deleting team:', error);
        alert('Error deleting team');
      }
    }
  };

  const handleCreateAccount = (team: Team) => {
    setSelectedTeamForAccount(team);
    setAccountFormData({
      email: team.email || '',
      password: '',
      password_confirmation: '',
    });
    setIsAccountModalOpen(true);
  };

  const handleAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedTeamForAccount) return;

    if (!accountFormData.email) {
      alert('Email is required');
      return;
    }

    if (!accountFormData.password || accountFormData.password.length < 8) {
      alert('Password must be at least 8 characters');
      return;
    }

    if (accountFormData.password !== accountFormData.password_confirmation) {
      alert('Passwords do not match');
      return;
    }

    try {
      setIsAccountSubmitting(true);
      await api.post(`/teams/${selectedTeamForAccount.id}/create-account`, {
        email: accountFormData.email,
        password: accountFormData.password,
        password_confirmation: accountFormData.password_confirmation,
      });
      alert('User account created successfully!');
      setIsAccountModalOpen(false);
      setSelectedTeamForAccount(undefined);
      setAccountFormData({
        email: '',
        password: '',
        password_confirmation: '',
      });
      fetchTeams(pagination.current_page);
    } catch (error: any) {
      console.error('Error creating account:', error);
      alert(error.response?.data?.message || 'Error creating account');
    } finally {
      setIsAccountSubmitting(false);
    }
  };

  const getRoleBadge = (role: string) => {
    const variants: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
      'Admin': 'danger',
      'Project Manager': 'info',
      'Developer': 'success',
      'Business Developer': 'warning',
      'Client': 'default',
    };
    return <Badge variant={variants[role] || 'default'}>{role}</Badge>;
  };

  const columns = [
    { key: 'full_name', header: 'Name' },
    { key: 'email', header: 'Email' },
    { key: 'phone', header: 'Phone' },
    {
      key: 'role',
      header: 'Role',
      render: (team: Team) => getRoleBadge(team.role),
    },
    {
      key: 'payment_type',
      header: 'Payment Type',
      render: (team: Team) => team.payment_type ? <Badge variant="info">{team.payment_type}</Badge> : 'N/A',
    },
    {
      key: 'salary_amount',
      header: 'Salary',
      render: (team: Team) => team.salary_amount ? `$${team.salary_amount.toLocaleString()}` : 'N/A',
    },
    {
      key: 'user_account',
      header: 'Account',
      render: (team: Team) => team.user_id ? (
        <Badge variant="success">Has Account</Badge>
      ) : (
        <Badge variant="warning">No Account</Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (team: Team) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => handleEdit(team)}>
            Edit
          </Button>
          {!team.user_id && (
            <Button size="sm" variant="primary" onClick={() => handleCreateAccount(team)}>
              Create Account
            </Button>
          )}
          <Button size="sm" variant="danger" onClick={() => handleDelete(team.id)}>
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
            Team Members
          </h1>
          <p className="text-gray-600">Manage your team members and their information</p>
        </div>
        <Button onClick={handleCreate}>+ Add Team Member</Button>
      </div>

      <div className="bg-white shadow rounded-lg">
        <DataTable data={teams} columns={columns} loading={loading} />
        
        {/* Pagination Controls */}
        {pagination.last_page > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing <span className="font-medium">{pagination.from}</span> to{' '}
              <span className="font-medium">{pagination.to}</span> of{' '}
              <span className="font-medium">{pagination.total}</span> results
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchTeams(pagination.current_page - 1)}
                disabled={pagination.current_page === 1 || loading}
              >
                Previous
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, pagination.last_page) }, (_, i) => {
                  let pageNum;
                  if (pagination.last_page <= 5) {
                    pageNum = i + 1;
                  } else if (pagination.current_page <= 3) {
                    pageNum = i + 1;
                  } else if (pagination.current_page >= pagination.last_page - 2) {
                    pageNum = pagination.last_page - 4 + i;
                  } else {
                    pageNum = pagination.current_page - 2 + i;
                  }
                  
                  return (
                    <Button
                      key={pageNum}
                      variant={pagination.current_page === pageNum ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => fetchTeams(pageNum)}
                      disabled={loading}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchTeams(pagination.current_page + 1)}
                disabled={pagination.current_page === pagination.last_page || loading}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedTeam ? 'Edit Team Member' : 'Create Team Member'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Full Name *"
            value={formData.full_name}
            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            required
          />

          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required={createAccount && !selectedTeam}
          />

          {!selectedTeam && (
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="createAccount"
                checked={createAccount}
                onChange={(e) => setCreateAccount(e.target.checked)}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="createAccount" className="text-sm font-medium text-gray-700">
                Create user account for this team member
              </label>
            </div>
          )}

          {createAccount && !selectedTeam && (
            <>
              <Input
                label="Password *"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Minimum 8 characters"
              />

              <Input
                label="Confirm Password *"
                type="password"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                required
                placeholder="Re-enter password"
              />
            </>
          )}

          <Input
            label="Phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />

          <Select
            label="Role *"
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
            required
            options={[
              { value: 'Admin', label: 'Admin' },
              { value: 'Project Manager', label: 'Project Manager' },
              { value: 'Developer', label: 'Developer' },
              { value: 'Business Developer', label: 'Business Developer' },
              { value: 'Client', label: 'Client' },
            ]}
          />

          <Select
            label="Payment Type"
            value={formData.payment_type || ''}
            onChange={(e) => setFormData({ ...formData, payment_type: e.target.value as any })}
            options={[
              { value: '', label: 'Select payment type' },
              { value: 'salary', label: 'Salary' },
              { value: 'project_based', label: 'Project Based' },
            ]}
          />

          <Input
            label="Salary Amount"
            type="number"
            step="0.01"
            value={formData.salary_amount || ''}
            onChange={(e) => setFormData({ ...formData, salary_amount: parseFloat(e.target.value) || undefined })}
          />

          <Input
            label="Joining Date"
            type="date"
            value={formData.joining_date || ''}
            onChange={(e) => setFormData({ ...formData, joining_date: e.target.value })}
          />

          <Textarea
            label="Notes"
            rows={4}
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              {selectedTeam ? 'Update' : 'Create'} Team Member
            </Button>
          </div>
        </form>
      </Modal>

      {/* Create Account Modal */}
      <Modal
        isOpen={isAccountModalOpen}
        onClose={() => {
          setIsAccountModalOpen(false);
          setSelectedTeamForAccount(undefined);
          setAccountFormData({
            email: '',
            password: '',
            password_confirmation: '',
          });
        }}
        title="Create User Account"
        size="md"
      >
        <form onSubmit={handleAccountSubmit} className="space-y-4">
          <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              <strong>Team Member:</strong> {selectedTeamForAccount?.full_name}
            </p>
            <p className="text-xs text-blue-600 mt-1">Role: {selectedTeamForAccount?.role}</p>
          </div>

          <Input
            label="Email *"
            type="email"
            value={accountFormData.email}
            onChange={(e) => setAccountFormData({ ...accountFormData, email: e.target.value })}
            required
            placeholder="team.member@example.com"
          />

          <Input
            label="Password *"
            type="password"
            value={accountFormData.password}
            onChange={(e) => setAccountFormData({ ...accountFormData, password: e.target.value })}
            required
            placeholder="Minimum 8 characters"
            minLength={8}
          />

          <Input
            label="Confirm Password *"
            type="password"
            value={accountFormData.password_confirmation}
            onChange={(e) => setAccountFormData({ ...accountFormData, password_confirmation: e.target.value })}
            required
            placeholder="Re-enter password"
            minLength={8}
          />

          <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <p className="text-xs text-yellow-800">
              <strong>Note:</strong> This will create a user account that allows the team member to log in to the system.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                setIsAccountModalOpen(false);
                setSelectedTeamForAccount(undefined);
                setAccountFormData({
                  email: '',
                  password: '',
                  password_confirmation: '',
                });
              }}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={isAccountSubmitting}>
              Create Account
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

