import { useEffect, useState } from 'react';
import { Client } from '../types';
import { clientService } from '../services/clientService';
import { Modal } from '../components/ui/Modal';
import { ClientForm } from '../components/forms/ClientForm';
import { DataTable } from '../components/ui/DataTable';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { UserPlus } from 'lucide-react';

export default function Clients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [selectedClientForAccount, setSelectedClientForAccount] = useState<Client | undefined>();
  const [accountFormData, setAccountFormData] = useState({
    email: '',
    password: '',
    password_confirmation: '',
  });

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const response = await clientService.getAll();
      setClients(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedClient(undefined);
    setIsModalOpen(true);
  };

  const handleEdit = (client: Client) => {
    setSelectedClient(client);
    setIsModalOpen(true);
  };

  const handleSubmit = async (data: Partial<Client>) => {
    try {
      setIsSubmitting(true);
      if (selectedClient) {
        await clientService.update(selectedClient.id, data);
      } else {
        await clientService.create(data);
      }
      setIsModalOpen(false);
      fetchClients();
    } catch (error) {
      console.error('Error saving client:', error);
      alert('Error saving client');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this client?')) {
      try {
        await clientService.delete(id);
        fetchClients();
      } catch (error) {
        console.error('Error deleting client:', error);
        alert('Error deleting client');
      }
    }
  };

  const columns = [
    { key: 'name', header: 'Name' },
    { key: 'company', header: 'Company' },
    { key: 'email', header: 'Email' },
    { key: 'phone', header: 'Phone' },
    {
      key: 'status',
      header: 'Status',
      render: (client: Client) => (
        <Badge variant={client.status === 'Active' ? 'success' : 'default'}>
          {client.status}
        </Badge>
      ),
    },
    {
      key: 'account',
      header: 'Account',
      render: (client: Client) => (
        client.has_account ? (
          <Badge variant="success">Account Created</Badge>
        ) : (
          <Badge variant="default">No Account</Badge>
        )
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (client: Client) => (
        <div className="flex gap-2">
          {!client.has_account && (
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => {
                setSelectedClientForAccount(client);
                setAccountFormData({
                  email: client.email || '',
                  password: '',
                  password_confirmation: '',
                });
                setIsAccountModalOpen(true);
              }}
              title="Create login account for client"
            >
              <UserPlus className="w-4 h-4 mr-1" />
              Create Account
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={() => handleEdit(client)}>
            Edit
          </Button>
          <Button size="sm" variant="danger" onClick={() => handleDelete(client.id)}>
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
            Clients
          </h1>
          <p className="text-gray-600">Manage your client relationships</p>
        </div>
        <Button onClick={handleCreate}>+ Add Client</Button>
      </div>

      <div className="bg-white shadow rounded-lg">
        <DataTable data={clients} columns={columns} loading={loading} />
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedClient ? 'Edit Client' : 'Create Client'}
        size="lg"
      >
        <ClientForm
          client={selectedClient}
          onSubmit={handleSubmit}
          onCancel={() => setIsModalOpen(false)}
          isLoading={isSubmitting}
        />
      </Modal>

      {/* Create Account Modal */}
      <Modal
        isOpen={isAccountModalOpen}
        onClose={() => {
          setIsAccountModalOpen(false);
          setSelectedClientForAccount(undefined);
          setAccountFormData({ email: '', password: '', password_confirmation: '' });
        }}
        title="Create Login Account for Client"
      >
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!selectedClientForAccount) return;
            
            if (accountFormData.password !== accountFormData.password_confirmation) {
              alert('Passwords do not match');
              return;
            }

            try {
              setIsSubmitting(true);
              await clientService.createUserAccount(selectedClientForAccount.id, accountFormData);
              alert('Account created successfully! Client can now login with these credentials.');
              setIsAccountModalOpen(false);
              setAccountFormData({ email: '', password: '', password_confirmation: '' });
            } catch (error: any) {
              alert(error.response?.data?.message || 'Error creating account');
            } finally {
              setIsSubmitting(false);
            }
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Client Name
            </label>
            <input
              type="text"
              value={selectedClientForAccount?.name || ''}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
            />
          </div>

          <Input
            label="Email *"
            type="email"
            value={accountFormData.email}
            onChange={(e) => setAccountFormData({ ...accountFormData, email: e.target.value })}
            required
            placeholder="client@example.com"
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

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsAccountModalOpen(false);
                setAccountFormData({ email: '', password: '', password_confirmation: '' });
              }}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Create Account
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

