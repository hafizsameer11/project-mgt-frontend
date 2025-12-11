import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clientPortalService } from '../../services/clientPortalService';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { DataTable } from '../../components/ui/DataTable';
import { FileCheck, Download } from 'lucide-react';

export default function ClientRequirements() {
  const navigate = useNavigate();
  const [requirements, setRequirements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequirements();
  }, []);

  const fetchRequirements = async () => {
    try {
      setLoading(true);
      const data = await clientPortalService.getRequirements();
      setRequirements(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching requirements:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
      'Draft': 'default',
      'Active': 'success',
      'Completed': 'info',
      'Cancelled': 'danger',
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  const columns = [
    {
      key: 'title',
      header: 'Title',
      render: (req: any) => (
        <div>
          <div className="font-medium">{req.title}</div>
          {req.description && (
            <div className="text-sm text-gray-500 line-clamp-2 mt-1">{req.description}</div>
          )}
        </div>
      ),
    },
    {
      key: 'project',
      header: 'Project',
      render: (req: any) => (
        <Button
          variant="link"
          onClick={() => navigate(`/client-portal/projects/${req.project_id}`)}
        >
          {req.project?.title || 'N/A'}
        </Button>
      ),
    },
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
      render: (req: any) => (
        <Badge variant={
          req.priority === 'Critical' ? 'danger' :
          req.priority === 'High' ? 'warning' :
          req.priority === 'Medium' ? 'info' : 'default'
        }>
          {req.priority}
        </Badge>
      ),
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
  ];

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-8">
        <Button variant="outline" onClick={() => navigate('/client-portal')} className="mb-4">
          ← Back to Dashboard
        </Button>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
          Requirements
        </h1>
        <p className="text-gray-600">View all project requirements</p>
      </div>

      <Card>
        <DataTable data={requirements} columns={columns} loading={loading} />
      </Card>
    </div>
  );
}

