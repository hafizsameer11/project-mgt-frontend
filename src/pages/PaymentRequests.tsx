import { useEffect, useState } from 'react';
import { paymentRequestService, PaymentRequest } from '../services/paymentRequestService';
import { Modal } from '../components/ui/Modal';
import { DataTable } from '../components/ui/DataTable';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Textarea } from '../components/ui/Textarea';
import { useAuthStore } from '../store/authStore';
import { teamService } from '../services/teamService';
import { projectService } from '../services/projectService';
import api from '../services/api';

export default function PaymentRequests() {
  const { user } = useAuthStore();
  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userTeam, setUserTeam] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [formData, setFormData] = useState<Partial<PaymentRequest>>({
    team_id: undefined,
    project_id: undefined,
    amount: undefined,
    reason: '',
  });

  useEffect(() => {
    fetchRequests();
    fetchUserTeam();
  }, [user]);

  useEffect(() => {
    if (userTeam) {
      fetchUserProjects();
      setFormData(prev => ({ ...prev, team_id: userTeam.id }));
    }
  }, [userTeam]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await paymentRequestService.getAll();
      setRequests(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching payment requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserTeam = async () => {
    if (!user?.id) return;
    
    try {
      const response = await teamService.getAll();
      const teamsData = Array.isArray(response.data) ? response.data : [];
      const team = teamsData.find((t: any) => t.user_id === user.id);
      if (team) {
        setUserTeam(team);
      }
    } catch (error) {
      console.error('Error fetching user team:', error);
    }
  };

  const fetchUserProjects = async () => {
    if (!userTeam) return;
    
    try {
      // Get projects where this team member is assigned
      const response = await api.get(`/team-member/dashboard`);
      const dashboardData = response.data;
      
      // Projects from dashboard are already filtered for this team member
      if (dashboardData.projects) {
        setProjects(Array.isArray(dashboardData.projects) ? dashboardData.projects : []);
      } else {
        // Fallback: get all projects and filter client-side
        const allProjects = await projectService.getAll();
        const allProjectsData = Array.isArray(allProjects.data) ? allProjects.data : [];
        // Filter projects where team is assigned
        const userProjects = allProjectsData.filter((p: any) => 
          p.teams?.some((t: any) => t.id === userTeam.id)
        );
        setProjects(userProjects);
      }
    } catch (error) {
      console.error('Error fetching user projects:', error);
      // Fallback to empty array
      setProjects([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userTeam) {
      alert('Team member profile not found. Please contact administrator.');
      return;
    }
    
    try {
      setIsSubmitting(true);
      const requestData = {
        ...formData,
        team_id: userTeam.id, // Always use the logged-in user's team
      };
      await paymentRequestService.create(requestData);
      setIsModalOpen(false);
      fetchRequests();
      setFormData({
        team_id: userTeam.id,
        project_id: undefined,
        amount: undefined,
        reason: '',
      });
    } catch (error) {
      console.error('Error creating payment request:', error);
      alert('Error creating payment request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
      'Pending': 'warning',
      'Approved': 'success',
      'Rejected': 'danger',
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  const columns = [
    {
      key: 'team',
      header: 'Team Member',
      render: (req: PaymentRequest) => (req as any).team?.full_name || 'N/A',
    },
    {
      key: 'project',
      header: 'Project',
      render: (req: PaymentRequest) => (req as any).project?.title || 'N/A',
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (req: PaymentRequest) => `$${req.amount.toLocaleString()}`,
    },
    {
      key: 'status',
      header: 'Status',
      render: (req: PaymentRequest) => getStatusBadge(req.status),
    },
    {
      key: 'reason',
      header: 'Reason',
      render: (req: PaymentRequest) => req.reason || 'N/A',
    },
  ];

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Payment Requests
          </h1>
          <p className="text-gray-600">Request payments for your work</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>+ Request Payment</Button>
      </div>

      <div className="bg-white shadow rounded-lg">
        <DataTable data={requests} columns={columns} loading={loading} />
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Request Payment"
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {userTeam ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Team Member *
              </label>
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-gray-900 font-medium">{userTeam.full_name}</p>
                <p className="text-xs text-gray-500 mt-1">Your account</p>
              </div>
              <input type="hidden" value={userTeam.id} />
            </div>
          ) : (
            <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <p className="text-sm text-yellow-800">
                Team member profile not found. Please contact administrator.
              </p>
            </div>
          )}

          <Select
            label="Project"
            value={formData.project_id?.toString() || ''}
            onChange={(e) => setFormData({ ...formData, project_id: e.target.value ? parseInt(e.target.value) : undefined })}
            disabled={!userTeam || projects.length === 0}
            options={[
              { value: '', label: projects.length === 0 ? 'No projects assigned' : 'Select project (optional)' },
              ...projects.map(p => ({ value: p.id.toString(), label: p.title })),
            ]}
          />
          
          {projects.length === 0 && userTeam && (
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800">
                You are not assigned to any projects yet. You can still request payment without selecting a project.
              </p>
            </div>
          )}

          <Input
            label="Amount *"
            type="number"
            step="0.01"
            value={formData.amount || ''}
            onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || undefined })}
            required
          />

          <Textarea
            label="Reason"
            rows={4}
            value={formData.reason}
            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
          />

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Submit Request
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

