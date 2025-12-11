import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clientPortalService } from '../../services/clientPortalService';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { DataTable } from '../../components/ui/DataTable';
import { FolderKanban, Calendar, Users, DollarSign } from 'lucide-react';

export default function ClientProjects() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const data = await clientPortalService.getProjects();
      setProjects(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
      'Planning': 'default',
      'In Progress': 'warning',
      'On Hold': 'info',
      'Completed': 'success',
      'Cancelled': 'danger',
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  const columns = [
    {
      key: 'title',
      header: 'Project',
      render: (project: any) => (
        <div>
          <div className="font-medium">{project.title}</div>
          {project.description && (
            <div className="text-sm text-gray-500 line-clamp-1">{project.description}</div>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (project: any) => getStatusBadge(project.status),
    },
    {
      key: 'phases',
      header: 'Phases',
      render: (project: any) => (
        <div>
          {project.phases && project.phases.length > 0 ? (
            <div className="space-y-1">
              {project.phases.map((phase: any, idx: number) => (
                <div key={idx} className="text-sm">
                  <span className="font-medium">{phase.name}:</span>{' '}
                  <span className="text-gray-600">
                    {new Date(phase.deadline).toLocaleDateString()}
                  </span>
                  <Badge variant={phase.status === 'Completed' ? 'success' : 'default'} className="ml-2">
                    {phase.status}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <span className="text-gray-400">No phases</span>
          )}
        </div>
      ),
    },
    {
      key: 'end_date',
      header: 'Deadline',
      render: (project: any) => 
        project.end_date ? (
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span>{new Date(project.end_date).toLocaleDateString()}</span>
          </div>
        ) : (
          'N/A'
        ),
    },
    {
      key: 'developers',
      header: 'Developers',
      render: (project: any) => {
        // Get developers for this project
        const developers = project.teams?.flatMap((team: any) => 
          team.members?.map((member: any) => member.user?.name) || []
        ) || [];
        
        const taskDevelopers = project.tasks?.map((task: any) => 
          task.assigned_user?.name
        ).filter(Boolean) || [];
        
        const allDevelopers = [...new Set([...developers, ...taskDevelopers])];
        
        // Check if any developer appears in multiple projects
        // For now, show all developers (logic will be handled in detail view)
        return allDevelopers.length > 0 ? (
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4 text-gray-400" />
            <span>{allDevelopers.length} developer(s)</span>
          </div>
        ) : (
          'No developers assigned'
        );
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (project: any) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(`/client-portal/projects/${project.id}`)}
        >
          View Details
        </Button>
      ),
    },
  ];

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-8">
        <Button variant="outline" onClick={() => navigate('/client-portal')} className="mb-4">
          ← Back to Dashboard
        </Button>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
          My Projects
        </h1>
        <p className="text-gray-600">View all your projects and their progress</p>
      </div>

      <Card>
        <DataTable data={projects} columns={columns} loading={loading} />
      </Card>
    </div>
  );
}

