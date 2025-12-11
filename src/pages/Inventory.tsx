import { useEffect, useState } from 'react';
import { DataTable } from '../components/ui/DataTable';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import api from '../services/api';

export default function Inventory() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const response = await api.get('/inventory-items');
      setItems(Array.isArray(response.data.data) ? response.data.data : []);
    } catch (error) {
      console.error('Error fetching inventory items:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
      'active': 'success',
      'inactive': 'default',
      'discontinued': 'danger',
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  const columns = [
    { key: 'item_code', header: 'Item Code' },
    { key: 'item_name', header: 'Item Name' },
    { key: 'category', header: 'Category' },
    {
      key: 'current_stock',
      header: 'Stock',
      render: (item: any) => {
        const isLow = item.current_stock <= item.minimum_stock;
        return (
          <span className={isLow ? 'text-red-600 font-semibold' : ''}>
            {item.current_stock} {item.unit_of_measure}
          </span>
        );
      },
    },
    {
      key: 'unit_cost',
      header: 'Unit Cost',
      render: (item: any) => `$${item.unit_cost.toLocaleString()}`,
    },
    {
      key: 'status',
      header: 'Status',
      render: (item: any) => getStatusBadge(item.status),
    },
  ];

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
          Inventory
        </h1>
        <p className="text-gray-600">Manage inventory items and stock levels</p>
      </div>

      <div className="bg-white shadow rounded-lg">
        <DataTable data={items} columns={columns} loading={loading} />
      </div>
    </div>
  );
}

