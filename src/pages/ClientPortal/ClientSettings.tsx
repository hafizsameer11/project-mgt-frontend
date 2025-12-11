import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { authService } from '../../services/authService';
import { useAuthStore } from '../../store/authStore';
import { useToastContext } from '../../contexts/ToastContext';
import { Lock, User, Mail, Phone } from 'lucide-react';

export default function ClientSettings() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { showToast } = useToastContext();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    password: '',
    password_confirmation: '',
  });

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await authService.updateProfile(profileData);
      showToast('Profile updated successfully', 'success');
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Error updating profile', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.password !== passwordData.password_confirmation) {
      showToast('Passwords do not match', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      await authService.changePassword(passwordData);
      showToast('Password changed successfully', 'success');
      setPasswordData({
        current_password: '',
        password: '',
        password_confirmation: '',
      });
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Error changing password', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-8">
        <Button variant="outline" onClick={() => navigate('/client-portal')} className="mb-4">
          ← Back to Dashboard
        </Button>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
          Account Settings
        </h1>
        <p className="text-gray-600">Manage your account information and password</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Settings */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <User className="w-5 h-5" />
            Profile Information
          </h2>
          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <Input
              label="Name"
              value={profileData.name}
              onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
              required
            />

            <Input
              label="Email"
              type="email"
              value={profileData.email}
              onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
              required
            />

            <Input
              label="Phone"
              type="tel"
              value={profileData.phone || ''}
              onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
            />

            <div className="flex justify-end pt-4">
              <Button type="submit" isLoading={isSubmitting}>
                Update Profile
              </Button>
            </div>
          </form>
        </Card>

        {/* Password Change */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Change Password
          </h2>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <Input
              label="Current Password"
              type="password"
              value={passwordData.current_password}
              onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
              required
            />

            <Input
              label="New Password"
              type="password"
              value={passwordData.password}
              onChange={(e) => setPasswordData({ ...passwordData, password: e.target.value })}
              required
              minLength={8}
              placeholder="Minimum 8 characters"
            />

            <Input
              label="Confirm New Password"
              type="password"
              value={passwordData.password_confirmation}
              onChange={(e) => setPasswordData({ ...passwordData, password_confirmation: e.target.value })}
              required
              minLength={8}
            />

            <div className="flex justify-end pt-4">
              <Button type="submit" isLoading={isSubmitting}>
                Change Password
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}

