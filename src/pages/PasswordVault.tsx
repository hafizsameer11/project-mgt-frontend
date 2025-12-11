import { useEffect, useState } from 'react';
import { passwordVaultService, PasswordVault as PasswordVaultType } from '../services/passwordVaultService';
import { clientService } from '../services/clientService';
import { Client } from '../types';
import { Modal } from '../components/ui/Modal';
import { DataTable } from '../components/ui/DataTable';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Textarea } from '../components/ui/Textarea';
import { Lock, Eye, EyeOff, Copy, ExternalLink, Plus, Edit, Trash2 } from 'lucide-react';
import { useToastContext } from '../contexts/ToastContext';

export default function PasswordVault() {
  const [vaults, setVaults] = useState<PasswordVaultType[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVault, setSelectedVault] = useState<PasswordVaultType | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPasswords, setShowPasswords] = useState<Record<number, boolean>>({});
  const { showToast } = useToastContext();

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    if (selectedClient) {
      fetchVaults();
    } else {
      setVaults([]);
    }
  }, [selectedClient]);

  const fetchClients = async () => {
    try {
      const response = await clientService.getAll();
      setClients(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const fetchVaults = async () => {
    if (!selectedClient) return;
    
    try {
      setLoading(true);
      const response = await passwordVaultService.getByClient(selectedClient);
      // Handle response structure
      const data = response?.data || response;
      setVaults(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error('Error fetching password vaults:', error);
      showToast(error.response?.data?.message || 'Error fetching password vaults', 'error');
      setVaults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    if (!selectedClient) {
      showToast('Please select a client first', 'error');
      return;
    }
    setSelectedVault(undefined);
    setIsModalOpen(true);
  };

  const handleEdit = (vault: PasswordVaultType) => {
    setSelectedVault(vault);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this password vault entry?')) {
      return;
    }

    try {
      await passwordVaultService.delete(id);
      showToast('Password vault entry deleted successfully', 'success');
      fetchVaults();
    } catch (error) {
      console.error('Error deleting password vault:', error);
      showToast('Error deleting password vault entry', 'error');
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedClient) return;

    const formData = new FormData(e.currentTarget);
    const data: Partial<PasswordVaultType> = {
      client_id: selectedClient,
      title: formData.get('title') as string || undefined,
      username: formData.get('username') as string || undefined,
      password: formData.get('password') as string || undefined,
      url: formData.get('url') as string || undefined,
      category: formData.get('category') as PasswordVaultType['category'] || undefined,
      extra_notes: formData.get('extra_notes') as string || undefined,
    };

    try {
      setIsSubmitting(true);
      if (selectedVault) {
        await passwordVaultService.update(selectedVault.id, data);
        showToast('Password vault updated successfully', 'success');
      } else {
        await passwordVaultService.create(data);
        showToast('Password vault created successfully', 'success');
      }
      setIsModalOpen(false);
      fetchVaults();
    } catch (error: any) {
      console.error('Error saving password vault:', error);
      showToast(error.response?.data?.message || 'Error saving password vault', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePasswordVisibility = (id: number) => {
    setShowPasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast(`${type} copied to clipboard`, 'success');
    } catch (error) {
      showToast('Failed to copy to clipboard', 'error');
    }
  };

  const columns = [
    {
      key: 'title',
      header: 'Title',
      render: (vault: PasswordVaultType) => vault.title || 'N/A',
    },
    {
      key: 'category',
      header: 'Category',
      render: (vault: PasswordVaultType) => (
        <Badge variant="info">{vault.category || 'N/A'}</Badge>
      ),
    },
    {
      key: 'username',
      header: 'Username',
      render: (vault: PasswordVaultType) => (
        <div className="flex items-center space-x-2">
          <span>{vault.username || 'N/A'}</span>
          {vault.username && (
            <button
              onClick={() => copyToClipboard(vault.username!, 'Username')}
              className="p-1 hover:bg-gray-100 rounded"
              title="Copy username"
            >
              <Copy className="w-4 h-4 text-gray-500" />
            </button>
          )}
        </div>
      ),
    },
    {
      key: 'password',
      header: 'Password',
      render: (vault: PasswordVaultType) => (
        <div className="flex items-center space-x-2">
          {showPasswords[vault.id] ? (
            <>
              <span className="font-mono">{vault.password || 'N/A'}</span>
              <button
                onClick={() => copyToClipboard(vault.password || '', 'Password')}
                className="p-1 hover:bg-gray-100 rounded"
                title="Copy password"
              >
                <Copy className="w-4 h-4 text-gray-500" />
              </button>
            </>
          ) : (
            <span className="font-mono">••••••••</span>
          )}
          {vault.password && (
            <button
              onClick={() => togglePasswordVisibility(vault.id)}
              className="p-1 hover:bg-gray-100 rounded"
              title={showPasswords[vault.id] ? 'Hide password' : 'Show password'}
            >
              {showPasswords[vault.id] ? (
                <EyeOff className="w-4 h-4 text-gray-500" />
              ) : (
                <Eye className="w-4 h-4 text-gray-500" />
              )}
            </button>
          )}
        </div>
      ),
    },
    {
      key: 'url',
      header: 'URL',
      render: (vault: PasswordVaultType) =>
        vault.url ? (
          <div className="flex items-center space-x-2">
            <a
              href={vault.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 hover:underline flex items-center space-x-1"
            >
              <span className="truncate max-w-xs">{vault.url}</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        ) : (
          'N/A'
        ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (vault: PasswordVaultType) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleEdit(vault)}
            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(vault.id)}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Password Vault
          </h1>
          <p className="text-gray-600">Securely store and manage client passwords and credentials</p>
        </div>
      </div>

      <Card>
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Client
          </label>
          <Select
            value={selectedClient?.toString() || ''}
            onChange={(e) => setSelectedClient(e.target.value ? parseInt(e.target.value) : null)}
            options={[
              { value: '', label: 'Select a client...' },
              ...clients.map((client) => ({
                value: client.id.toString(),
                label: `${client.name}${client.company ? ` - ${client.company}` : ''}`,
              })),
            ]}
          />
        </div>

        {selectedClient && (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Password Vault Entries
              </h2>
              <Button onClick={handleCreate} className="flex items-center space-x-2">
                <Plus className="w-4 h-4" />
                <span>Add Entry</span>
              </Button>
            </div>

            <DataTable
              data={vaults}
              columns={columns}
              loading={loading}
            />
          </>
        )}

        {!selectedClient && (
          <div className="text-center py-12">
            <Lock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Please select a client to view their password vault</p>
          </div>
        )}
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedVault ? 'Edit Password Vault Entry' : 'Add Password Vault Entry'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <Input
              name="title"
              defaultValue={selectedVault?.title || ''}
              placeholder="e.g., Production Server"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <Select
              name="category"
              defaultValue={selectedVault?.category || ''}
              options={[
                { value: '', label: 'Select category...' },
                { value: 'Server', label: 'Server' },
                { value: 'Domain', label: 'Domain' },
                { value: 'Hosting', label: 'Hosting' },
                { value: 'Admin Panel', label: 'Admin Panel' },
              ]}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            <Input
              name="username"
              defaultValue={selectedVault?.username || ''}
              placeholder="Enter username"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <Input
              name="password"
              type="password"
              defaultValue={selectedVault?.password || ''}
              placeholder="Enter password"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              URL
            </label>
            <Input
              name="url"
              type="url"
              defaultValue={selectedVault?.url || ''}
              placeholder="https://example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Extra Notes
            </label>
            <Textarea
              name="extra_notes"
              defaultValue={selectedVault?.extra_notes || ''}
              placeholder="Additional notes or information..."
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : selectedVault ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

