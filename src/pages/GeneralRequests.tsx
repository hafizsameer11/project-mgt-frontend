import { useEffect, useState } from 'react';
import { generalRequestService, GeneralRequest } from '../services/generalRequestService';
import { Modal } from '../components/ui/Modal';
import { DataTable } from '../components/ui/DataTable';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Textarea } from '../components/ui/Textarea';
import { useAuthStore } from '../store/authStore';
import { teamService } from '../services/teamService';

export default function GeneralRequests() {
  const { user } = useAuthStore();
  const [requests, setRequests] = useState<GeneralRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userTeam, setUserTeam] = useState<any>(null);
  const [formData, setFormData] = useState<Partial<GeneralRequest>>({
    team_id: undefined,
    title: '',
    description: '',
    category: undefined,
  });

  useEffect(() => {
    fetchRequests();
    fetchUserTeam();
  }, [user]);

  useEffect(() => {
    if (userTeam) {
      setFormData(prev => ({ ...prev, team_id: userTeam.id }));
    }
  }, [userTeam]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await generalRequestService.getAll();
      setRequests(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching general requests:', error);
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
      await generalRequestService.create(requestData);
      setIsModalOpen(false);
      fetchRequests();
      setFormData({
        team_id: userTeam?.id,
        title: '',
        description: '',
        category: undefined,
      });
    } catch (error) {
      console.error('Error creating request:', error);
      alert('Error creating request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
      'Pending': 'warning',
      'Approved': 'success',
      'Rejected': 'danger',
      'In Progress': 'info',
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  const columns = [
    {
      key: 'team',
      header: 'Team Member',
      render: (req: GeneralRequest) => (req as any).team?.full_name || 'N/A',
    },
    { key: 'title', header: 'Title' },
    {
      key: 'category',
      header: 'Category',
      render: (req: GeneralRequest) => req.category || 'N/A',
    },
    {
      key: 'status',
      header: 'Status',
      render: (req: GeneralRequest) => getStatusBadge(req.status),
    },
    {
      key: 'description',
      header: 'Description',
      render: (req: GeneralRequest) => req.description || 'N/A',
    },
  ];

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
            General Requests
          </h1>
          <p className="text-gray-600">Request equipment, software, training, or other needs</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>+ New Request</Button>
      </div>

      <div className="bg-white shadow rounded-lg">
        <DataTable data={requests} columns={columns} loading={loading} />
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Request"
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

          <Input
            label="Title *"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />

          <Select
            label="Category"
            value={formData.category || ''}
            onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
            options={[
              { value: '', label: 'Select category' },
              { value: 'Equipment', label: 'Equipment' },
              { value: 'Software', label: 'Software' },
              { value: 'Training', label: 'Training' },
              { value: 'Other', label: 'Other' },
            ]}
          />

          <Textarea
            label="Description"
            rows={4}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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

