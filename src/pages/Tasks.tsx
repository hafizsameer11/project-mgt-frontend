import { useEffect, useState } from 'react';
import { Task } from '../types';
import { taskService } from '../services/taskService';
import { Modal } from '../components/ui/Modal';
import { TaskForm } from '../components/forms/TaskForm';
import { DataTable } from '../components/ui/DataTable';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await taskService.getAll();
      setTasks(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedTask(undefined);
    setIsModalOpen(true);
  };

  const handleEdit = (task: Task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const handleSubmit = async (data: Partial<Task>) => {
    try {
      setIsSubmitting(true);
      if (selectedTask) {
        await taskService.update(selectedTask.id, data);
      } else {
        await taskService.create(data);
      }
      setIsModalOpen(false);
      fetchTasks();
    } catch (error) {
      console.error('Error saving task:', error);
      alert('Error saving task');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this task?')) {
      try {
        await taskService.delete(id);
        fetchTasks();
      } catch (error) {
        console.error('Error deleting task:', error);
        alert('Error deleting task');
      }
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
      'Pending': 'default',
      'In Progress': 'warning',
      'Completed': 'success',
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  const columns = [
    { key: 'title', header: 'Title' },
    {
      key: 'project',
      header: 'Project',
      render: (task: Task) => task.project?.title || 'N/A',
    },
    {
      key: 'priority',
      header: 'Priority',
      render: (task: Task) => task.priority ? <Badge variant="info">{task.priority}</Badge> : 'N/A',
    },
    {
      key: 'status',
      header: 'Status',
      render: (task: Task) => getStatusBadge(task.status),
    },
    {
      key: 'deadline',
      header: 'Deadline',
      render: (task: Task) => task.deadline || 'N/A',
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (task: Task) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => handleEdit(task)}>
            Edit
          </Button>
          <Button size="sm" variant="danger" onClick={() => handleDelete(task.id)}>
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
            Tasks
          </h1>
          <p className="text-gray-600">Organize and track your work</p>
        </div>
        <Button onClick={handleCreate}>+ Add Task</Button>
      </div>

      <div className="bg-white shadow rounded-lg">
        <DataTable data={tasks} columns={columns} loading={loading} />
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedTask ? 'Edit Task' : 'Create Task'}
        size="lg"
      >
        <TaskForm
          task={selectedTask}
          onSubmit={handleSubmit}
          onCancel={() => setIsModalOpen(false)}
          isLoading={isSubmitting}
        />
      </Modal>
    </div>
  );
}

