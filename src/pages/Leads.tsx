import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lead } from '../types';
import { leadService } from '../services/leadService';
import { Modal } from '../components/ui/Modal';
import { LeadForm } from '../components/forms/LeadForm';
import { DataTable } from '../components/ui/DataTable';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';

export default function Leads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const response = await leadService.getAll();
      setLeads(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedLead(undefined);
    setIsModalOpen(true);
  };

  const handleEdit = (lead: Lead) => {
    setSelectedLead(lead);
    setIsModalOpen(true);
  };

  const handleSubmit = async (data: Partial<Lead>) => {
    try {
      setIsSubmitting(true);
      if (selectedLead) {
        await leadService.update(selectedLead.id, data);
      } else {
        await leadService.create(data);
      }
      setIsModalOpen(false);
      fetchLeads();
    } catch (error) {
      console.error('Error saving lead:', error);
      alert('Error saving lead');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this lead?')) {
      try {
        await leadService.delete(id);
        fetchLeads();
      } catch (error) {
        console.error('Error deleting lead:', error);
        alert('Error deleting lead');
      }
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'success' | 'warning' | 'danger'> = {
      'New': 'info',
      'In Progress': 'warning',
      'Converted': 'success',
      'Lost': 'danger',
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  const columns = [
    { key: 'name', header: 'Name' },
    { key: 'email', header: 'Email' },
    { key: 'phone', header: 'Phone' },
    {
      key: 'lead_status',
      header: 'Status',
      render: (lead: Lead) => getStatusBadge(lead.lead_status),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (lead: Lead) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => handleEdit(lead)}>
            Edit
          </Button>
          <Button size="sm" variant="danger" onClick={() => handleDelete(lead.id)}>
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
            Leads
          </h1>
          <p className="text-gray-600">Manage and track your potential clients</p>
        </div>
        <Button onClick={handleCreate}>+ Add Lead</Button>
      </div>

      <div className="bg-white shadow rounded-lg">
        <DataTable data={leads} columns={columns} loading={loading} />
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedLead ? 'Edit Lead' : 'Create Lead'}
        size="lg"
      >
        <LeadForm
          lead={selectedLead}
          onSubmit={handleSubmit}
          onCancel={() => setIsModalOpen(false)}
          isLoading={isSubmitting}
        />
      </Modal>
    </div>
  );
}

