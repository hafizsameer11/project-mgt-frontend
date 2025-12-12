import { useEffect, useState } from 'react';
import { leaveRequestService, LeaveRequest } from '../services/leaveRequestService';
import { Modal } from '../components/ui/Modal';
import { DataTable } from '../components/ui/DataTable';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Textarea } from '../components/ui/Textarea';
import { useAuthStore } from '../store/authStore';
import { teamService } from '../services/teamService';

export default function LeaveRequests() {
  const { user } = useAuthStore();
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject' | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userTeam, setUserTeam] = useState<any>(null);
  const isAdmin = user?.role === 'Admin';
  const [formData, setFormData] = useState<Partial<LeaveRequest>>({
    team_id: undefined,
    start_date: '',
    end_date: '',
    type: undefined,
    reason: '',
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
      // Admins see all requests, team members see only their own
      const filters = isAdmin ? {} : (userTeam ? { team_id: userTeam.id } : {});
      const response = await leaveRequestService.getAll(filters);
      setRequests(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching leave requests:', error);
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
      await leaveRequestService.create(requestData);
      setIsModalOpen(false);
      fetchRequests();
      setFormData({
        team_id: userTeam?.id,
        start_date: '',
        end_date: '',
        type: undefined,
        reason: '',
      });
    } catch (error) {
      console.error('Error creating leave request:', error);
      alert('Error creating leave request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedRequest) return;
    try {
      setIsSubmitting(true);
      await leaveRequestService.update(selectedRequest.id, {
        status: 'Approved',
      });
      setIsApprovalModalOpen(false);
      setSelectedRequest(null);
      setApprovalAction(null);
      fetchRequests();
    } catch (error) {
      console.error('Error approving request:', error);
      alert('Error approving request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest) return;
    try {
      setIsSubmitting(true);
      await leaveRequestService.update(selectedRequest.id, {
        status: 'Rejected',
        rejection_reason: rejectionReason,
      });
      setIsApprovalModalOpen(false);
      setSelectedRequest(null);
      setApprovalAction(null);
      setRejectionReason('');
      fetchRequests();
    } catch (error) {
      console.error('Error rejecting request:', error);
      alert('Error rejecting request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openApprovalModal = (request: LeaveRequest, action: 'approve' | 'reject') => {
    setSelectedRequest(request);
    setApprovalAction(action);
    setRejectionReason('');
    setIsApprovalModalOpen(true);
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
      render: (req: LeaveRequest) => (req as any).team?.full_name || 'N/A',
    },
    {
      key: 'start_date',
      header: 'Start Date',
      render: (req: LeaveRequest) => new Date(req.start_date).toLocaleDateString(),
    },
    {
      key: 'end_date',
      header: 'End Date',
      render: (req: LeaveRequest) => new Date(req.end_date).toLocaleDateString(),
    },
    {
      key: 'days',
      header: 'Days',
      render: (req: LeaveRequest) => req.days || 'N/A',
    },
    {
      key: 'type',
      header: 'Type',
      render: (req: LeaveRequest) => req.type || 'N/A',
    },
    {
      key: 'status',
      header: 'Status',
      render: (req: LeaveRequest) => getStatusBadge(req.status),
    },
    {
      key: 'reason',
      header: 'Reason',
      render: (req: LeaveRequest) => req.reason || 'N/A',
    },
    ...(isAdmin ? [{
      key: 'actions',
      header: 'Actions',
      render: (req: LeaveRequest) => (
        <div className="flex gap-2">
          {req.status === 'Pending' && (
            <>
              <Button
                size="sm"
                variant="primary"
                onClick={() => openApprovalModal(req, 'approve')}
              >
                Approve
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={() => openApprovalModal(req, 'reject')}
              >
                Reject
              </Button>
            </>
          )}
          {req.rejection_reason && (
            <div className="text-xs text-gray-600 mt-1">
              <strong>Rejection reason:</strong> {req.rejection_reason}
            </div>
          )}
        </div>
      ),
    }] : []),
  ];

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Leave Requests
          </h1>
          <p className="text-gray-600">
            {isAdmin ? 'Manage all leave requests' : 'Request and manage leave applications'}
          </p>
        </div>
        {!isAdmin && <Button onClick={() => setIsModalOpen(true)}>+ Request Leave</Button>}
      </div>

      <div className="bg-white shadow rounded-lg">
        <DataTable data={requests} columns={columns} loading={loading} />
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Request Leave"
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

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Date *"
              type="date"
              value={formData.start_date || ''}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              required
            />

            <Input
              label="End Date *"
              type="date"
              value={formData.end_date || ''}
              onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              required
            />
          </div>

          <Select
            label="Leave Type"
            value={formData.type || ''}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
            options={[
              { value: '', label: 'Select type' },
              { value: 'Sick Leave', label: 'Sick Leave' },
              { value: 'Vacation', label: 'Vacation' },
              { value: 'Personal', label: 'Personal' },
              { value: 'Other', label: 'Other' },
            ]}
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

      {/* Approval/Rejection Modal */}
      <Modal
        isOpen={isApprovalModalOpen}
        onClose={() => {
          setIsApprovalModalOpen(false);
          setSelectedRequest(null);
          setApprovalAction(null);
          setRejectionReason('');
        }}
        title={approvalAction === 'approve' ? 'Approve Leave Request' : 'Reject Leave Request'}
        size="md"
      >
        {selectedRequest && (
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2"><strong>Team Member:</strong> {(selectedRequest as any).team?.full_name}</p>
              <p className="text-sm text-gray-600 mb-2"><strong>Dates:</strong> {new Date(selectedRequest.start_date).toLocaleDateString()} - {new Date(selectedRequest.end_date).toLocaleDateString()}</p>
              <p className="text-sm text-gray-600 mb-2"><strong>Days:</strong> {selectedRequest.days}</p>
              <p className="text-sm text-gray-600"><strong>Reason:</strong> {selectedRequest.reason || 'N/A'}</p>
            </div>

            {approvalAction === 'reject' && (
              <Textarea
                label="Rejection Reason *"
                rows={4}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Please provide a reason for rejection..."
                required
              />
            )}

            {approvalAction === 'approve' && (
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm text-green-800">
                  Are you sure you want to approve this leave request?
                </p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsApprovalModalOpen(false);
                  setSelectedRequest(null);
                  setApprovalAction(null);
                  setRejectionReason('');
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant={approvalAction === 'approve' ? 'primary' : 'danger'}
                onClick={approvalAction === 'approve' ? handleApprove : handleReject}
                isLoading={isSubmitting}
                disabled={approvalAction === 'reject' && !rejectionReason.trim()}
              >
                {approvalAction === 'approve' ? 'Approve' : 'Reject'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

