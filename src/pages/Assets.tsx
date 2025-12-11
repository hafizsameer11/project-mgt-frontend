import { useEffect, useState } from 'react';
import { DataTable } from '../components/ui/DataTable';
import { Badge } from '../components/ui/Badge';
import api from '../services/api';

export default function Assets() {
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    try {
      setLoading(true);
      const response = await api.get('/assets');
      setAssets(Array.isArray(response.data.data) ? response.data.data : []);
    } catch (error) {
      console.error('Error fetching assets:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
      'active': 'success',
      'disposed': 'danger',
      'maintenance': 'warning',
      'retired': 'default',
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  const columns = [
    { key: 'asset_code', header: 'Asset Code' },
    { key: 'asset_name', header: 'Asset Name' },
    { key: 'category', header: 'Category' },
    {
      key: 'purchase_cost',
      header: 'Purchase Cost',
      render: (asset: any) => `$${asset.purchase_cost.toLocaleString()}`,
    },
    {
      key: 'current_value',
      header: 'Current Value',
      render: (asset: any) => `$${asset.current_value.toLocaleString()}`,
    },
    {
      key: 'assigned_to',
      header: 'Assigned To',
      render: (asset: any) => asset.assignedUser?.name || 'Unassigned',
    },
    {
      key: 'status',
      header: 'Status',
      render: (asset: any) => getStatusBadge(asset.status),
    },
  ];

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
          Assets
        </h1>
        <p className="text-gray-600">Manage company assets and equipment</p>
      </div>

      <div className="bg-white shadow rounded-lg">
        <DataTable data={assets} columns={columns} loading={loading} />
      </div>
    </div>
  );
}

