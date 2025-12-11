import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { clientPortalService } from '../../services/clientPortalService';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { DataTable } from '../../components/ui/DataTable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/Tabs';
import { 
  Calendar, 
  Users, 
  FileText, 
  DollarSign, 
  CheckSquare,
  FileCheck,
  Download
} from 'lucide-react';
import { clientPortalService as cps } from '../../services/clientPortalService';

export default function ClientProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<any>(null);
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchProject();
      fetchDashboard();
    }
  }, [id]);

  const fetchProject = async () => {
    try {
      setLoading(true);
      const data = await clientPortalService.getProject(parseInt(id!));
      setProject(data);
    } catch (error) {
      console.error('Error fetching project:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboard = async () => {
    try {
      const data = await cps.getDashboard();
      setDashboard(data);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
      'Planning': 'default',
      'In Progress': 'warning',
      'On Hold': 'info',
      'Completed': 'success',
      'Cancelled': 'danger',
      'Pending': 'default',
      'Active': 'success',
      'Draft': 'default',
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-600">Project not found</div>
      </div>
    );
  }

  // Get developers for this project with name logic
  const getDeveloperName = (userId: number) => {
    if (!dashboard) return 'Developer';
    const developers = dashboard.developers[project.id] || [];
    const dev = developers.find((d: any) => d.user_id === userId);
    return dev ? dev.name : 'Developer';
  };

  const projectTasks = project.tasks || [];
  const projectRequirements = project.requirements || [];
  const projectDocuments = project.documents || [];

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-8">
        <Button variant="outline" onClick={() => navigate('/client-portal/projects')} className="mb-4">
          ← Back to Projects
        </Button>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
          {project.title}
        </h1>
        <div className="flex items-center gap-4">
          {getStatusBadge(project.status)}
          {project.end_date && (
            <div className="flex items-center gap-1 text-gray-600">
              <Calendar className="w-4 h-4" />
              <span>Deadline: {new Date(project.end_date).toLocaleDateString()}</span>
            </div>
          )}
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="phases">Phases</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="requirements">Requirements</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="developers">Developers</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Project Information</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-600">Description</label>
                  <p className="mt-1">{project.description || 'No description'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Status</label>
                  <div className="mt-1">{getStatusBadge(project.status)}</div>
                </div>
                {project.start_date && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Start Date</label>
                    <p className="mt-1">{new Date(project.start_date).toLocaleDateString()}</p>
                  </div>
                )}
                {project.end_date && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">End Date</label>
                    <p className="mt-1">{new Date(project.end_date).toLocaleDateString()}</p>
                  </div>
                )}
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Project Statistics</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Tasks</span>
                  <span className="font-semibold">{projectTasks.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Completed Tasks</span>
                  <span className="font-semibold">
                    {projectTasks.filter((t: any) => t.status === 'Completed').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Requirements</span>
                  <span className="font-semibold">{projectRequirements.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Documents</span>
                  <span className="font-semibold">{projectDocuments.length}</span>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="phases">
          <Card>
            <h2 className="text-xl font-semibold mb-4">Project Phases</h2>
            {project.phases && project.phases.length > 0 ? (
              <DataTable
                data={project.phases}
                columns={[
                  { key: 'name', header: 'Phase Name' },
                  {
                    key: 'description',
                    header: 'Description',
                    render: (phase: any) => phase.description || 'N/A',
                  },
                  {
                    key: 'deadline',
                    header: 'Deadline',
                    render: (phase: any) => new Date(phase.deadline).toLocaleDateString(),
                  },
                  {
                    key: 'status',
                    header: 'Status',
                    render: (phase: any) => getStatusBadge(phase.status),
                  },
                ]}
                loading={false}
              />
            ) : (
              <p className="text-gray-500">No phases defined for this project</p>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="tasks">
          <Card>
            <h2 className="text-xl font-semibold mb-4">Project Tasks</h2>
            <DataTable
              data={projectTasks}
              columns={[
                { key: 'title', header: 'Task' },
                {
                  key: 'status',
                  header: 'Status',
                  render: (task: any) => getStatusBadge(task.status),
                },
                {
                  key: 'assigned_user',
                  header: 'Developer',
                  render: (task: any) => {
                    if (!task.assigned_to) return 'Unassigned';
                    return getDeveloperName(task.assigned_to);
                  },
                },
                {
                  key: 'estimated_hours',
                  header: 'Estimated',
                  render: (task: any) => task.estimated_hours ? `${task.estimated_hours}h` : 'N/A',
                },
                {
                  key: 'actual_time',
                  header: 'Actual',
                  render: (task: any) => task.actual_time ? `${task.actual_time}h` : 'N/A',
                },
              ]}
              loading={false}
            />
          </Card>
        </TabsContent>

        <TabsContent value="requirements">
          <Card>
            <h2 className="text-xl font-semibold mb-4">Requirements</h2>
            <DataTable
              data={projectRequirements}
              columns={[
                { key: 'title', header: 'Title' },
                {
                  key: 'type',
                  header: 'Type',
                  render: (req: any) => (
                    <Badge variant={req.type === 'document' ? 'info' : 'default'}>
                      {req.type === 'document' ? '📄 Document' : '📝 Text'}
                    </Badge>
                  ),
                },
                {
                  key: 'priority',
                  header: 'Priority',
                  render: (req: any) => getStatusBadge(req.priority),
                },
                {
                  key: 'status',
                  header: 'Status',
                  render: (req: any) => getStatusBadge(req.status),
                },
                {
                  key: 'actions',
                  header: 'Actions',
                  render: (req: any) => {
                    if (req.type === 'document' && req.document_path) {
                      return (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            try {
                              const response = await fetch(`/api/requirements/${req.id}/download`, {
                                headers: {
                                  'Authorization': `Bearer ${localStorage.getItem('token')}`,
                                },
                              });
                              const blob = await response.blob();
                              const url = window.URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = req.document_name || 'document';
                              a.click();
                            } catch (error) {
                              alert('Error downloading document');
                            }
                          }}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      );
                    }
                    return null;
                  },
                },
              ]}
              loading={false}
            />
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <h2 className="text-xl font-semibold mb-4">Documents</h2>
            <DataTable
              data={projectDocuments}
              columns={[
                { key: 'title', header: 'Title' },
                {
                  key: 'type',
                  header: 'Type',
                  render: (doc: any) => doc.type || 'Document',
                },
                {
                  key: 'actions',
                  header: 'Actions',
                  render: (doc: any) => {
                    if (doc.file_path) {
                      return (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            try {
                              const response = await fetch(`/api/project-documents/${doc.id}/download`, {
                                headers: {
                                  'Authorization': `Bearer ${localStorage.getItem('token')}`,
                                },
                              });
                              const blob = await response.blob();
                              const url = window.URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = doc.file_name || 'document';
                              a.click();
                            } catch (error) {
                              alert('Error downloading document');
                            }
                          }}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      );
                    }
                    return null;
                  },
                },
              ]}
              loading={false}
            />
          </Card>
        </TabsContent>

        <TabsContent value="developers">
          <Card>
            <h2 className="text-xl font-semibold mb-4">Assigned Developers</h2>
            {dashboard && dashboard.developers[project.id] ? (
              <div className="space-y-2">
                {dashboard.developers[project.id].map((dev: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-gray-400" />
                      <span className="font-medium">{dev.name}</span>
                      {dev.projects_count > 1 && (
                        <Badge variant="info">Works on {dev.projects_count} projects</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No developers assigned to this project</p>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

