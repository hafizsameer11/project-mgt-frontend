import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectService } from '../services/projectService';
import { projectDocumentService, ProjectDocument } from '../services/projectDocumentService';
import { Project } from '../types';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Textarea } from '../components/ui/Textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/Tabs';
import { DataTable } from '../components/ui/DataTable';
import { FileText, Download, Eye, Lock, Globe, Server, Database, Key, Github, DollarSign, Users, FileCheck } from 'lucide-react';
import api from '../services/api';
import { BdPaymentForm } from '../components/forms/BdPaymentForm';
import { PmPaymentForm } from '../components/forms/PmPaymentForm';
import { DeveloperPaymentForm } from '../components/forms/DeveloperPaymentForm';
import ProjectChat from '../components/ProjectChat';
import { requirementService, Requirement } from '../services/requirementService';
import { useAuthStore } from '../store/authStore';
import { RequirementForm } from '../components/forms/RequirementForm';

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [documents, setDocuments] = useState<ProjectDocument[]>([]);
  const [bdPayments, setBdPayments] = useState<any[]>([]);
  const [pmPayments, setPmPayments] = useState<any[]>([]);
  const [developerPayments, setDeveloperPayments] = useState<any[]>([]);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRequirementModalOpen, setIsRequirementModalOpen] = useState(false);
  const [selectedRequirement, setSelectedRequirement] = useState<Requirement | undefined>();
  const { user } = useAuthStore();
  const canManagePayments = user?.role === 'Admin' || user?.role === 'Project Manager';
  const [isBdPaymentModalOpen, setIsBdPaymentModalOpen] = useState(false);
  const [isPmPaymentModalOpen, setIsPmPaymentModalOpen] = useState(false);
  const [selectedBdPayment, setSelectedBdPayment] = useState<any>(undefined);
  const [selectedPmPayment, setSelectedPmPayment] = useState<any>(undefined);
  const [isDevPaymentModalOpen, setIsDevPaymentModalOpen] = useState(false);
  const [selectedDevPayment, setSelectedDevPayment] = useState<any>(undefined);
  const [selectedDocument, setSelectedDocument] = useState<ProjectDocument | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCredentials, setShowCredentials] = useState<number | null>(null);
  const [formData, setFormData] = useState<Partial<ProjectDocument>>({
    title: '',
    type: 'Document',
    description: '',
    url: '',
    notes: '',
    credentials: {},
  });
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    if (id) {
      fetchProject();
      fetchDocuments();
      fetchBdPayments();
      fetchPmPayments();
      fetchDeveloperPayments();
      fetchRequirements();
    }
  }, [id]);

  const fetchRequirements = async () => {
    if (!id) return;
    try {
      const response = await requirementService.getAll(parseInt(id));
      const data = Array.isArray(response.data) ? response.data : [];
      setRequirements(data);
    } catch (error) {
      console.error('Error fetching requirements:', error);
    }
  };

  const fetchProject = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const response = await api.get(`/projects/${id}`);
      
      // Laravel Resource wraps response in 'data' property
      // Response structure: { data: { id: 1, title: "...", ... } }
      const projectData = response.data?.data || response.data;
      
      if (projectData && projectData.id) {
        setProject(projectData);
      } else {
        console.error('Invalid project data:', response.data);
        setProject(null);
      }
    } catch (error: any) {
      console.error('Error fetching project:', error);
      if (error.response?.status === 404) {
        setProject(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchDocuments = async () => {
    if (!id) return;
    try {
      const data = await projectDocumentService.getByProject(parseInt(id));
      setDocuments(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  };

  const fetchBdPayments = async () => {
    if (!id) return;
    try {
      const response = await api.get(`/project-bd-payments?project_id=${id}`);
      setBdPayments(Array.isArray(response.data.data) ? response.data.data : []);
    } catch (error) {
      console.error('Error fetching BD payments:', error);
    }
  };

  const fetchPmPayments = async () => {
    if (!id) return;
    try {
      const response = await api.get(`/project-pm-payments?project_id=${id}`);
      setPmPayments(Array.isArray(response.data.data) ? response.data.data : []);
    } catch (error) {
      console.error('Error fetching PM payments:', error);
    }
  };

  const fetchDeveloperPayments = async () => {
    if (!id) return;
    try {
      const response = await api.get(`/developer-payments?project_id=${id}`);
      setDeveloperPayments(Array.isArray(response.data.data) ? response.data.data : []);
    } catch (error) {
      console.error('Error fetching developer payments:', error);
    }
  };

  const handleCreate = () => {
    setSelectedDocument(undefined);
    setFormData({
      title: '',
      type: 'Document',
      description: '',
      url: '',
      notes: '',
      credentials: {},
    });
    setFile(null);
    setIsModalOpen(true);
  };

  const handleEdit = (doc: ProjectDocument) => {
    setSelectedDocument(doc);
    setFormData({
      title: doc.title,
      type: doc.type,
      description: doc.description || '',
      url: doc.url || '',
      notes: doc.notes || '',
      credentials: doc.credentials || {},
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    try {
      setIsSubmitting(true);
      const data = {
        ...formData,
        project_id: parseInt(id),
      };

      if (selectedDocument) {
        await projectDocumentService.update(selectedDocument.id, data, file || undefined);
      } else {
        await projectDocumentService.create(data, file || undefined);
      }

      setIsModalOpen(false);
      fetchDocuments();
    } catch (error) {
      console.error('Error saving document:', error);
      alert('Error saving document');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (docId: number) => {
    if (confirm('Are you sure you want to delete this document?')) {
      try {
        await projectDocumentService.delete(docId);
        fetchDocuments();
      } catch (error) {
        console.error('Error deleting document:', error);
        alert('Error deleting document');
      }
    }
  };

  const handleDownload = async (doc: ProjectDocument) => {
    try {
      const blob = await projectDocumentService.download(doc.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.title;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Error downloading file');
    }
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, any> = {
      'GitHub Credentials': Github,
      'Server Credentials': Server,
      'Database Credentials': Database,
      'API Keys': Key,
      'Domain Credentials': Globe,
      'Hosting Credentials': Server,
      'Document': FileText,
      'Other': FileText,
    };
    const Icon = icons[type] || FileText;
    return <Icon className="w-5 h-5" />;
  };

  const getCredentialFields = (type: string) => {
    const fields: Record<string, string[]> = {
      'GitHub Credentials': ['username', 'token', 'repository_url'],
      'Server Credentials': ['host', 'username', 'password', 'port', 'ssh_key'],
      'Database Credentials': ['host', 'database', 'username', 'password', 'port'],
      'API Keys': ['api_key', 'api_secret', 'endpoint'],
      'Domain Credentials': ['domain', 'username', 'password', 'registrar'],
      'Hosting Credentials': ['host', 'username', 'password', 'cpanel_url'],
    };
    return fields[type] || [];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!project && !loading) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Project Not Found</h2>
          <p className="text-gray-600 mb-4">The project you're looking for doesn't exist or you don't have access to it.</p>
          <Button onClick={() => navigate('/projects')}>Back to Projects</Button>
        </div>
      </div>
    );
  }

  if (!project) {
    return null;
  }

  const documentColumns = [
    {
      key: 'type',
      header: 'Type',
      render: (doc: ProjectDocument) => (
        <div className="flex items-center space-x-2">
          {getTypeIcon(doc.type)}
          <span>{doc.type}</span>
        </div>
      ),
    },
    { key: 'title', header: 'Title' },
    {
      key: 'description',
      header: 'Description',
      render: (doc: ProjectDocument) => doc.description || 'N/A',
    },
    {
      key: 'url',
      header: 'URL',
      render: (doc: ProjectDocument) =>
        doc.url ? (
          <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
            {doc.url}
          </a>
        ) : (
          'N/A'
        ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (doc: ProjectDocument) => (
        <div className="flex gap-2">
          {doc.file_path && (
            <Button size="sm" variant="outline" onClick={() => handleDownload(doc)}>
              <Download className="w-4 h-4" />
            </Button>
          )}
          {doc.credentials && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowCredentials(showCredentials === doc.id ? null : doc.id)}
            >
              <Lock className="w-4 h-4" />
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={() => handleEdit(doc)}>
            Edit
          </Button>
          <Button size="sm" variant="danger" onClick={() => handleDelete(doc.id)}>
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-8">
        <Button variant="outline" onClick={() => navigate('/projects')} className="mb-4">
          ← Back to Projects
        </Button>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
          {project.title}
        </h1>
        <div className="flex items-center gap-4">
          <Badge variant="info">{project.status}</Badge>
          {project.client && <span className="text-gray-600">Client: {project.client.name}</span>}
          {project.budget && <span className="text-gray-600">Budget: ${project.budget.toLocaleString()}</span>}
        </div>
      </div>

      <Tabs defaultValue="documents" className="space-y-6">
        <TabsList>
          <TabsTrigger value="documents">Documents & Credentials</TabsTrigger>
          <TabsTrigger value="requirements">Requirements</TabsTrigger>
          <TabsTrigger value="bd-payments">BD Payments</TabsTrigger>
          <TabsTrigger value="pm-payments">PM Payments</TabsTrigger>
          <TabsTrigger value="developer-payments">Developer Payments</TabsTrigger>
          <TabsTrigger value="chat">Team Chat</TabsTrigger>
          <TabsTrigger value="overview">Overview</TabsTrigger>
        </TabsList>

        <TabsContent value="documents">
          <Card>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Project Documents & Credentials</h2>
              <Button onClick={handleCreate}>+ Add Document</Button>
            </div>

            <DataTable data={documents} columns={documentColumns} loading={false} />

            {/* Credentials Display */}
            {documents
              .filter(doc => doc.credentials && showCredentials === doc.id)
              .map(doc => (
                <Card key={doc.id} className="mt-4 bg-yellow-50 border-yellow-200">
                  <div className="p-4">
                    <h3 className="font-semibold mb-3">{doc.title} - Credentials</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {Object.entries(doc.credentials || {}).map(([key, value]) => (
                        <div key={key}>
                          <label className="text-sm font-medium text-gray-700">{key}</label>
                          <div className="mt-1 p-2 bg-white rounded border border-gray-300 font-mono text-sm">
                            {String(value)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              ))}
          </Card>
        </TabsContent>

        <TabsContent value="bd-payments">
          <Card>
            {canManagePayments && (
              <div className="mb-4 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                <p className="text-sm text-indigo-800">
                  <strong>💡 Allocate Budget to Business Developer:</strong> Set payment for BD on this project. 
                  Choose between <strong>Percentage</strong> (e.g., 15% of project budget) or <strong>Fixed Amount</strong> (e.g., $500).
                  The system will automatically calculate the total amount based on your choice.
                </p>
              </div>
            )}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Business Developer Payments</h2>
              {canManagePayments && (
                <Button onClick={() => setIsBdPaymentModalOpen(true)}>+ Allocate BD Payment</Button>
              )}
            </div>

            <DataTable
              data={bdPayments}
              columns={[
                {
                  key: 'bd',
                  header: 'Business Developer',
                  render: (payment: any) => payment.bd?.name || 'N/A',
                },
                {
                  key: 'payment_type',
                  header: 'Type',
                  render: (payment: any) => (
                    <Badge variant="info">
                      {payment.payment_type === 'percentage' ? 'Percentage' : 'Fixed Amount'}
                    </Badge>
                  ),
                },
                {
                  key: 'percentage',
                  header: 'Percentage',
                  render: (payment: any) => payment.percentage ? `${payment.percentage}%` : 'N/A',
                },
                {
                  key: 'fixed_amount',
                  header: 'Fixed Amount',
                  render: (payment: any) => payment.fixed_amount ? `$${payment.fixed_amount.toLocaleString()}` : 'N/A',
                },
                {
                  key: 'calculated_amount',
                  header: 'Calculated Amount',
                  render: (payment: any) => payment.calculated_amount ? `$${payment.calculated_amount.toLocaleString()}` : 'N/A',
                },
                {
                  key: 'amount_paid',
                  header: 'Paid',
                  render: (payment: any) => `$${payment.amount_paid.toLocaleString()}`,
                },
                {
                  key: 'remaining_amount',
                  header: 'Remaining',
                  render: (payment: any) => {
                    const remaining = payment.remaining_amount || 0;
                    return remaining > 0 ? (
                      <span className="text-red-600 font-semibold">${remaining.toLocaleString()}</span>
                    ) : (
                      <span className="text-green-600 font-semibold">$0</span>
                    );
                  },
                },
                {
                  key: 'status',
                  header: 'Status',
                  render: (payment: any) => {
                    const statusVariants: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
                      'Paid': 'success',
                      'Partial': 'warning',
                      'Pending': 'danger',
                    };
                    return <Badge variant={statusVariants[payment.status] || 'default'}>{payment.status}</Badge>;
                  },
                },
                ...(canManagePayments ? [{
                  key: 'actions',
                  header: 'Actions',
                  render: (payment: any) => (
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => {
                        setSelectedBdPayment(payment);
                        setIsBdPaymentModalOpen(true);
                      }}>
                        Edit
                      </Button>
                      <Button size="sm" variant="primary" onClick={async () => {
                        const amount = prompt('Enter payment amount:');
                        if (amount && parseFloat(amount) > 0) {
                          try {
                            await api.post(`/project-bd-payments/${payment.id}/add-payment`, {
                              amount: parseFloat(amount),
                              payment_date: new Date().toISOString().split('T')[0],
                            });
                            fetchBdPayments();
                          } catch (error) {
                            console.error('Error adding payment:', error);
                            alert('Error adding payment');
                          }
                        }
                      }}>
                        Add Payment
                      </Button>
                    </div>
                  ),
                }] : []),
              ]}
              loading={false}
            />
          </Card>
        </TabsContent>

        <TabsContent value="pm-payments">
          <Card>
            {canManagePayments && (
              <div className="mb-4 p-4 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm text-green-800">
                  <strong>💡 Allocate Budget to Project Manager:</strong> Set payment for PM on this project. 
                  Choose between <strong>Percentage</strong> (e.g., 10% of project budget) or <strong>Fixed Amount</strong> (e.g., $1000).
                  The system will automatically calculate the total amount based on your choice.
                </p>
              </div>
            )}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Project Manager Payments</h2>
              {canManagePayments && (
                <Button onClick={() => setIsPmPaymentModalOpen(true)}>+ Allocate PM Payment</Button>
              )}
            </div>

            <DataTable
              data={pmPayments}
              columns={[
                {
                  key: 'pm',
                  header: 'Project Manager',
                  render: (payment: any) => payment.pm?.name || 'N/A',
                },
                {
                  key: 'payment_type',
                  header: 'Type',
                  render: (payment: any) => (
                    <Badge variant="info">
                      {payment.payment_type === 'percentage' ? 'Percentage' : 'Fixed Amount'}
                    </Badge>
                  ),
                },
                {
                  key: 'percentage',
                  header: 'Percentage',
                  render: (payment: any) => payment.percentage ? `${payment.percentage}%` : 'N/A',
                },
                {
                  key: 'fixed_amount',
                  header: 'Fixed Amount',
                  render: (payment: any) => payment.fixed_amount ? `$${payment.fixed_amount.toLocaleString()}` : 'N/A',
                },
                {
                  key: 'calculated_amount',
                  header: 'Calculated Amount',
                  render: (payment: any) => payment.calculated_amount ? `$${payment.calculated_amount.toLocaleString()}` : 'N/A',
                },
                {
                  key: 'amount_paid',
                  header: 'Paid',
                  render: (payment: any) => `$${payment.amount_paid.toLocaleString()}`,
                },
                {
                  key: 'remaining_amount',
                  header: 'Remaining',
                  render: (payment: any) => {
                    const remaining = payment.remaining_amount || 0;
                    return remaining > 0 ? (
                      <span className="text-red-600 font-semibold">${remaining.toLocaleString()}</span>
                    ) : (
                      <span className="text-green-600 font-semibold">$0</span>
                    );
                  },
                },
                {
                  key: 'status',
                  header: 'Status',
                  render: (payment: any) => {
                    const statusVariants: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
                      'Paid': 'success',
                      'Partial': 'warning',
                      'Pending': 'danger',
                    };
                    return <Badge variant={statusVariants[payment.status] || 'default'}>{payment.status}</Badge>;
                  },
                },
                ...(canManagePayments ? [{
                  key: 'actions',
                  header: 'Actions',
                  render: (payment: any) => (
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => {
                        setSelectedPmPayment(payment);
                        setIsPmPaymentModalOpen(true);
                      }}>
                        Edit
                      </Button>
                      <Button size="sm" variant="primary" onClick={async () => {
                        const amount = prompt('Enter payment amount:');
                        if (amount && parseFloat(amount) > 0) {
                          try {
                            await api.post(`/project-pm-payments/${payment.id}/add-payment`, {
                              amount: parseFloat(amount),
                              payment_date: new Date().toISOString().split('T')[0],
                            });
                            fetchPmPayments();
                          } catch (error) {
                            console.error('Error adding payment:', error);
                            alert('Error adding payment');
                          }
                        }
                      }}>
                        Add Payment
                      </Button>
                    </div>
                  ),
                }] : []),
              ]}
              loading={false}
            />
          </Card>
        </TabsContent>

        <TabsContent value="developer-payments">
          <Card>
            {canManagePayments && (
              <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800">
                  <strong>💡 Allocate Budget to Developers:</strong> Assign a specific amount to each developer for this project. 
                  This is a <strong>variable amount</strong> per project (not a percentage or fixed rate). 
                  You can set any amount based on the project budget and each developer's contribution.
                </p>
              </div>
            )}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Developer Payments</h2>
              {canManagePayments && (
                <Button onClick={() => setIsDevPaymentModalOpen(true)}>+ Allocate Developer Payment</Button>
              )}
            </div>

            <DataTable
              data={developerPayments}
              columns={[
                {
                  key: 'developer',
                  header: 'Developer',
                  render: (payment: any) => payment.developer?.full_name || 'N/A',
                },
                {
                  key: 'total_assigned_amount',
                  header: 'Assigned Amount',
                  render: (payment: any) => payment.total_assigned_amount ? `$${payment.total_assigned_amount.toLocaleString()}` : 'N/A',
                },
                {
                  key: 'amount_paid',
                  header: 'Paid',
                  render: (payment: any) => `$${payment.amount_paid.toLocaleString()}`,
                },
                {
                  key: 'remaining_amount',
                  header: 'Remaining',
                  render: (payment: any) => {
                    const remaining = payment.remaining_amount || 0;
                    return remaining > 0 ? (
                      <span className="text-red-600 font-semibold">${remaining.toLocaleString()}</span>
                    ) : (
                      <span className="text-green-600 font-semibold">$0</span>
                    );
                  },
                },
                ...(canManagePayments ? [{
                  key: 'actions',
                  header: 'Actions',
                  render: (payment: any) => (
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => {
                        setSelectedDevPayment(payment);
                        setIsDevPaymentModalOpen(true);
                      }}>
                        Edit
                      </Button>
                      <Button size="sm" variant="primary" onClick={async () => {
                        const amount = prompt('Enter payment amount:');
                        if (amount && parseFloat(amount) > 0) {
                          try {
                            await api.post(`/developer-payments/${payment.id}/add-payment`, {
                              amount: parseFloat(amount),
                              payment_date: new Date().toISOString().split('T')[0],
                            });
                            fetchDeveloperPayments();
                          } catch (error) {
                            console.error('Error adding payment:', error);
                            alert('Error adding payment');
                          }
                        }
                      }}>
                        Add Payment
                      </Button>
                    </div>
                  ),
                }] : []),
              ]}
              loading={false}
            />
          </Card>
        </TabsContent>

        <TabsContent value="chat">
          <Card>
            <div className="mb-4 p-4 bg-green-50 rounded-lg border border-green-200">
              <p className="text-sm text-green-800">
                <strong>💬 Project Team Chat:</strong> Communicate with all team members assigned to this project. 
                All messages are visible to everyone in the project team.
              </p>
            </div>
            <ProjectChat projectId={parseInt(id!)} />
          </Card>
        </TabsContent>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card title="Project Details">
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">Description</label>
                  <p className="mt-1 text-gray-900">{project.description || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Project Type</label>
                  <p className="mt-1 text-gray-900">{project.project_type || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Priority</label>
                  <p className="mt-1">
                    <Badge variant="info">{project.priority || 'N/A'}</Badge>
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Repository</label>
                  {project.repo_link ? (
                    <a href={project.repo_link} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
                      {project.repo_link}
                    </a>
                  ) : (
                    'N/A'
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Server URL</label>
                  {project.server_url ? (
                    <a href={project.server_url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
                      {project.server_url}
                    </a>
                  ) : (
                    'N/A'
                  )}
                </div>
              </div>
            </Card>

            <Card title="Timeline">
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">Start Date</label>
                  <p className="mt-1 text-gray-900">{project.start_date || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">End Date</label>
                  <p className="mt-1 text-gray-900">{project.end_date || 'N/A'}</p>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Document Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedDocument ? 'Edit Document' : 'Add Document'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Title *"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />

          <Select
            label="Type *"
            value={formData.type}
            onChange={(e) => {
              setFormData({ ...formData, type: e.target.value as any, credentials: {} });
            }}
            required
            options={[
              { value: 'Document', label: 'Document' },
              { value: 'GitHub Credentials', label: 'GitHub Credentials' },
              { value: 'Server Credentials', label: 'Server Credentials' },
              { value: 'Database Credentials', label: 'Database Credentials' },
              { value: 'API Keys', label: 'API Keys' },
              { value: 'Domain Credentials', label: 'Domain Credentials' },
              { value: 'Hosting Credentials', label: 'Hosting Credentials' },
              { value: 'Other', label: 'Other' },
            ]}
          />

          <Textarea
            label="Description"
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />

          <Input
            label="URL"
            type="url"
            value={formData.url}
            onChange={(e) => setFormData({ ...formData, url: e.target.value })}
          />

          {/* Credential Fields */}
          {formData.type && formData.type.includes('Credentials') && (
            <div className="border rounded-lg p-4 bg-gray-50">
              <label className="block text-sm font-medium text-gray-700 mb-3">Credentials</label>
              <div className="space-y-3">
                {getCredentialFields(formData.type).map((field) => (
                  <Input
                    key={field}
                    label={field.charAt(0).toUpperCase() + field.slice(1).replace('_', ' ')}
                    type={field.includes('password') || field.includes('secret') || field.includes('key') ? 'password' : 'text'}
                    value={(formData.credentials as any)?.[field] || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        credentials: {
                          ...(formData.credentials || {}),
                          [field]: e.target.value,
                        },
                      })
                    }
                  />
                ))}
              </div>
            </div>
          )}

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">File</label>
            <input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            />
          </div>

          <Textarea
            label="Notes"
            rows={3}
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              {selectedDocument ? 'Update' : 'Create'} Document
            </Button>
          </div>
        </form>
      </Modal>

      {/* BD Payment Modal */}
      <Modal
        isOpen={isBdPaymentModalOpen}
        onClose={() => {
          setIsBdPaymentModalOpen(false);
          setSelectedBdPayment(undefined);
        }}
        title={selectedBdPayment ? 'Edit BD Payment' : 'Add BD Payment'}
        size="lg"
      >
        <BdPaymentForm
          projectId={parseInt(id!)}
          payment={selectedBdPayment}
          onSubmit={() => {
            setIsBdPaymentModalOpen(false);
            setSelectedBdPayment(undefined);
            fetchBdPayments();
          }}
          onCancel={() => {
            setIsBdPaymentModalOpen(false);
            setSelectedBdPayment(undefined);
          }}
        />
      </Modal>

      {/* PM Payment Modal */}
      <Modal
        isOpen={isPmPaymentModalOpen}
        onClose={() => {
          setIsPmPaymentModalOpen(false);
          setSelectedPmPayment(undefined);
        }}
        title={selectedPmPayment ? 'Edit PM Payment' : 'Add PM Payment'}
        size="lg"
      >
        <PmPaymentForm
          projectId={parseInt(id!)}
          payment={selectedPmPayment}
          onSubmit={() => {
            setIsPmPaymentModalOpen(false);
            setSelectedPmPayment(undefined);
            fetchPmPayments();
          }}
          onCancel={() => {
            setIsPmPaymentModalOpen(false);
            setSelectedPmPayment(undefined);
          }}
        />
      </Modal>

      {/* PM Payment Modal */}
      <Modal
        isOpen={isPmPaymentModalOpen}
        onClose={() => {
          setIsPmPaymentModalOpen(false);
          setSelectedPmPayment(undefined);
        }}
        title={selectedPmPayment ? 'Edit PM Payment' : 'Add PM Payment'}
        size="lg"
      >
        <PmPaymentForm
          projectId={parseInt(id!)}
          payment={selectedPmPayment}
          onSubmit={() => {
            setIsPmPaymentModalOpen(false);
            setSelectedPmPayment(undefined);
            fetchPmPayments();
          }}
          onCancel={() => {
            setIsPmPaymentModalOpen(false);
            setSelectedPmPayment(undefined);
          }}
        />
      </Modal>

      {/* Developer Payment Modal */}
      <Modal
        isOpen={isDevPaymentModalOpen}
        onClose={() => {
          setIsDevPaymentModalOpen(false);
          setSelectedDevPayment(undefined);
        }}
        title={selectedDevPayment ? 'Edit Developer Payment' : 'Add Developer Payment'}
        size="lg"
      >
        <DeveloperPaymentForm
          projectId={parseInt(id!)}
          payment={selectedDevPayment}
          onSubmit={() => {
            setIsDevPaymentModalOpen(false);
            setSelectedDevPayment(undefined);
            fetchDeveloperPayments();
          }}
          onCancel={() => {
            setIsDevPaymentModalOpen(false);
            setSelectedDevPayment(undefined);
          }}
        />
      </Modal>
    </div>
  );
}

