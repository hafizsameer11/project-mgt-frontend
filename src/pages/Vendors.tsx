import { useEffect, useState } from 'react';
import { DataTable } from '../components/ui/DataTable';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import api from '../services/api';

export default function Vendors() {
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<any>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company_name: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    country: '',
    tax_id: '',
    payment_terms: '',
    credit_limit: '',
    status: 'active',
    notes: '',
  });

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const response = await api.get('/vendors');
      setVendors(Array.isArray(response.data.data) ? response.data.data : []);
    } catch (error) {
      console.error('Error fetching vendors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedVendor(undefined);
    setFormData({
      name: '',
      email: '',
      phone: '',
      company_name: '',
      address: '',
      city: '',
      state: '',
      zip_code: '',
      country: '',
      tax_id: '',
      payment_terms: '',
      credit_limit: '',
      status: 'active',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleEdit = (vendor: any) => {
    setSelectedVendor(vendor);
    setFormData({
      name: vendor.name || '',
      email: vendor.email || '',
      phone: vendor.phone || '',
      company_name: vendor.company_name || '',
      address: vendor.address || '',
      city: vendor.city || '',
      state: vendor.state || '',
      zip_code: vendor.zip_code || '',
      country: vendor.country || '',
      tax_id: vendor.tax_id || '',
      payment_terms: vendor.payment_terms || '',
      credit_limit: vendor.credit_limit?.toString() || '',
      status: vendor.status || 'active',
      notes: vendor.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const data = { ...formData };
      if (data.credit_limit) {
        data.credit_limit = parseFloat(data.credit_limit);
      }

      if (selectedVendor) {
        await api.put(`/vendors/${selectedVendor.id}`, data);
      } else {
        await api.post('/vendors', data);
      }

      setIsModalOpen(false);
      fetchVendors();
    } catch (error) {
      console.error('Error saving vendor:', error);
      alert('Error saving vendor');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this vendor?')) {
      try {
        await api.delete(`/vendors/${id}`);
        fetchVendors();
      } catch (error) {
        console.error('Error deleting vendor:', error);
        alert('Error deleting vendor');
      }
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
      'active': 'success',
      'inactive': 'default',
      'blocked': 'danger',
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  const columns = [
    { key: 'name', header: 'Name' },
    { key: 'email', header: 'Email' },
    { key: 'phone', header: 'Phone' },
    { key: 'company_name', header: 'Company' },
    {
      key: 'status',
      header: 'Status',
      render: (vendor: any) => getStatusBadge(vendor.status),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (vendor: any) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => handleEdit(vendor)}>
            Edit
          </Button>
          <Button size="sm" variant="danger" onClick={() => handleDelete(vendor.id)}>
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
            Vendors
          </h1>
          <p className="text-gray-600">Manage your vendors and suppliers</p>
        </div>
        <Button onClick={handleCreate}>+ Add Vendor</Button>
      </div>

      <div className="bg-white shadow rounded-lg">
        <DataTable data={vendors} columns={columns} loading={loading} />
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedVendor ? 'Edit Vendor' : 'Add Vendor'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Name *"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />

          <Input
            label="Phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />

          <Input
            label="Company Name"
            value={formData.company_name}
            onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
          />

          <Textarea
            label="Address"
            rows={2}
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="City"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            />
            <Input
              label="State"
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Zip Code"
              value={formData.zip_code}
              onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
            />
            <Input
              label="Country"
              value={formData.country}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
            />
          </div>

          <Input
            label="Tax ID"
            value={formData.tax_id}
            onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
          />

          <Input
            label="Payment Terms"
            value={formData.payment_terms}
            onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
          />

          <Input
            label="Credit Limit"
            type="number"
            step="0.01"
            value={formData.credit_limit}
            onChange={(e) => setFormData({ ...formData, credit_limit: e.target.value })}
          />

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              {selectedVendor ? 'Update' : 'Create'} Vendor
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

