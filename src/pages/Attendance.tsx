import { useEffect, useState } from 'react';
import { DataTable } from '../components/ui/DataTable';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Select } from '../components/ui/Select';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';

export default function Attendance() {
  const { user } = useAuthStore();
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [todayAttendance, setTodayAttendance] = useState<any>(null);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(user?.id || null);
  const [users, setUsers] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalDays: 0,
    presentDays: 0,
    absentDays: 0,
    totalHours: 0,
  });
  
  const canManageOthers = user?.role === 'Admin' || user?.role === 'Project Manager';

  useEffect(() => {
    if (canManageOthers) {
      fetchUsers();
    }
    fetchAttendance();
    fetchTodayAttendance();
  }, []);

  useEffect(() => {
    if (selectedUserId) {
      fetchTodayAttendance();
    }
  }, [selectedUserId]);
  
  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(Array.isArray(response.data.data) ? response.data.data : []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const params: any = {
        start_date: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0],
      };
      if (user?.role !== 'Admin') {
        params.user_id = user?.id;
      }
      const response = await api.get('/attendance', { params });
      const data = Array.isArray(response.data.data) ? response.data.data : [];
      setAttendance(data);

      // Calculate stats
      const presentDays = data.filter((a: any) => a.status === 'present').length;
      const absentDays = data.filter((a: any) => a.status === 'absent').length;
      const totalHours = data.reduce((sum: number, a: any) => sum + (a.total_hours || 0), 0);

      setStats({
        totalDays: data.length,
        presentDays,
        absentDays,
        totalHours: Math.round(totalHours * 100) / 100,
      });
    } catch (error) {
      console.error('Error fetching attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTodayAttendance = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const targetUserId = selectedUserId || user?.id;
      const response = await api.get('/attendance', {
        params: { date: today, user_id: targetUserId },
      });
      const data = Array.isArray(response.data.data) ? response.data.data : [];
      setTodayAttendance(data[0] || null);
    } catch (error) {
      console.error('Error fetching today attendance:', error);
    }
  };

  const handleClockIn = async () => {
    try {
      const targetUserId = canManageOthers && selectedUserId ? selectedUserId : undefined;
      await api.post('/attendance/clock-in', targetUserId ? { user_id: targetUserId } : {});
      fetchTodayAttendance();
      fetchAttendance();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error clocking in');
    }
  };

  const handleClockOut = async () => {
    try {
      const targetUserId = canManageOthers && selectedUserId ? selectedUserId : undefined;
      await api.post('/attendance/clock-out', targetUserId ? { user_id: targetUserId } : {});
      fetchTodayAttendance();
      fetchAttendance();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error clocking out');
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
      'present': 'success',
      'absent': 'danger',
      'late': 'warning',
      'half_day': 'warning',
      'holiday': 'info',
      'leave': 'info',
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  const columns = [
    {
      key: 'attendance_date',
      header: 'Date',
      render: (record: any) => new Date(record.attendance_date).toLocaleDateString(),
    },
    {
      key: 'user',
      header: 'Employee',
      render: (record: any) => record.user?.name || 'N/A',
    },
    {
      key: 'clock_in',
      header: 'Clock In',
      render: (record: any) => record.clock_in || 'N/A',
    },
    {
      key: 'clock_out',
      header: 'Clock Out',
      render: (record: any) => record.clock_out || 'N/A',
    },
    {
      key: 'total_hours',
      header: 'Hours',
      render: (record: any) => record.total_hours ? `${record.total_hours}h` : 'N/A',
    },
    {
      key: 'status',
      header: 'Status',
      render: (record: any) => getStatusBadge(record.status),
    },
  ];

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
          Attendance
        </h1>
        <p className="text-gray-600">Track employee attendance and working hours</p>
      </div>

      {/* Clock In/Out Card */}
      <Card className="mb-6 p-6">
        <div className="space-y-4">
          {canManageOthers && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Employee
              </label>
              <Select
                value={selectedUserId?.toString() || ''}
                onChange={(e) => setSelectedUserId(e.target.value ? parseInt(e.target.value) : user?.id || null)}
                options={[
                  { value: user?.id?.toString() || '', label: 'Myself' },
                  ...users
                    .filter((u) => u.id !== user?.id)
                    .map((u) => ({
                      value: u.id.toString(),
                      label: u.name,
                    })),
                ]}
              />
            </div>
          )}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold mb-2">
                Today's Attendance {canManageOthers && selectedUserId !== user?.id ? `(${users.find(u => u.id === selectedUserId)?.name || 'Selected User'})` : ''}
              </h2>
              {todayAttendance ? (
                <div className="space-y-1">
                  <p>Clock In: <strong>{todayAttendance.clock_in || 'Not clocked in'}</strong></p>
                  <p>Clock Out: <strong>{todayAttendance.clock_out || 'Not clocked out'}</strong></p>
                  {todayAttendance.total_hours && (
                    <p>Total Hours: <strong>{todayAttendance.total_hours}h</strong></p>
                  )}
                </div>
              ) : (
                <p className="text-gray-500">No attendance record for today</p>
              )}
            </div>
            <div className="flex gap-3">
              {!todayAttendance?.clock_in && (
                <Button onClick={handleClockIn} variant="primary">
                  Clock In
                </Button>
              )}
              {todayAttendance?.clock_in && !todayAttendance?.clock_out && (
                <Button onClick={handleClockOut} variant="success">
                  Clock Out
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <p className="text-sm text-gray-600">Total Days</p>
          <p className="text-2xl font-bold">{stats.totalDays}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Present Days</p>
          <p className="text-2xl font-bold text-green-600">{stats.presentDays}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Absent Days</p>
          <p className="text-2xl font-bold text-red-600">{stats.absentDays}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Total Hours</p>
          <p className="text-2xl font-bold">{stats.totalHours}h</p>
        </Card>
      </div>

      <div className="bg-white shadow rounded-lg">
        <DataTable data={attendance} columns={columns} loading={loading} />
      </div>
    </div>
  );
}

