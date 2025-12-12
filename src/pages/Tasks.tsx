import { useEffect, useState } from 'react';
import { Task } from '../types';
import { taskService } from '../services/taskService';
import { Modal } from '../components/ui/Modal';
import { TaskForm } from '../components/forms/TaskForm';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { FileText, GripVertical, Calendar, User, FolderKanban, Clock, Edit, Trash2, X } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export default function Tasks() {
  const { user } = useAuthStore();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | undefined>();
  const [detailTask, setDetailTask] = useState<Task | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [activeTab, setActiveTab] = useState<'my-tasks' | 'other-tasks'>('my-tasks');
  
  const isAdmin = user?.role === 'Admin';
  
  const canDelete = (task: Task) => {
    // Developers cannot delete any tasks
    if (user?.role === 'Developer') {
      return false;
    }
    // Only admin can delete tasks created by admin
    if (task.creator?.role === 'Admin' && user?.role !== 'Admin') {
      return false;
    }
    return true;
  };

  const statuses = ['Pending', 'In Progress', 'Completed'];

  useEffect(() => {
    if (isAdmin) {
      if (activeTab === 'my-tasks') {
        fetchTasks({ created_by: user?.id });
      } else {
        fetchTasks({ exclude_created_by: user?.id });
      }
    } else {
      fetchTasks();
    }
  }, [isAdmin, activeTab, user?.id]);

  const fetchTasks = async (filters?: Record<string, any>) => {
    try {
      setLoading(true);
      const response = await taskService.getAll(filters);
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

  const handleTaskClick = (task: Task) => {
    setDetailTask(task);
    setIsDetailModalOpen(true);
  };

  const handleEdit = (task: Task) => {
    setSelectedTask(task);
    setIsDetailModalOpen(false);
    setIsModalOpen(true);
  };

  const handleSubmit = async (data: Partial<Task & { requirement_ids?: number[] }>) => {
    try {
      setIsSubmitting(true);
      const { requirement_ids, ...taskData } = data;
      const submitData: any = { ...taskData };
      
      if (requirement_ids !== undefined) {
        submitData.requirement_ids = requirement_ids;
      }
      
      if (selectedTask) {
        await taskService.update(selectedTask.id, submitData);
      } else {
        await taskService.create(submitData);
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

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    if (!draggedTask || draggedTask.status === newStatus) {
      setDraggedTask(null);
      return;
    }

    try {
      await taskService.update(draggedTask.id, { status: newStatus as any });
      setDraggedTask(null);
      fetchTasks();
    } catch (error) {
      console.error('Error updating task status:', error);
      alert('Error updating task status');
      setDraggedTask(null);
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

  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
      'Low': 'default',
      'Medium': 'info',
      'High': 'warning',
      'Critical': 'danger',
    };
    return <Badge variant={variants[priority] || 'default'}>{priority}</Badge>;
  };

  const getTasksByStatus = (status: string) => {
    return tasks.filter(task => task.status === status);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Tasks
          </h1>
          <p className="text-gray-600">Organize and track your work - Drag tasks to change status</p>
        </div>
        <div className="flex gap-3">
          {!isAdmin && (
            <select
              value={''}
              onChange={(e) => {
                if (e.target.value === 'my_tasks' && user?.id) {
                  fetchTasks({ assigned_to: user.id });
                } else {
                  fetchTasks();
                }
              }}
              className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">All Tasks</option>
              <option value="my_tasks">My Tasks Only</option>
            </select>
          )}
          <Button onClick={handleCreate}>+ Add Task</Button>
        </div>
      </div>

      {/* Admin Tabs */}
      {isAdmin && (
        <div className="mb-6 border-b border-gray-200">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('my-tasks')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'my-tasks'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              My Tasks
            </button>
            <button
              onClick={() => setActiveTab('other-tasks')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'other-tasks'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Other Developers' Tasks
            </button>
          </nav>
        </div>
      )}

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statuses.map((status) => (
          <div
            key={status}
            className="bg-gray-50 rounded-lg p-4 min-h-[500px]"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, status)}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-700">{status}</h2>
              <Badge variant="default">{getTasksByStatus(status).length}</Badge>
            </div>
            <div className="space-y-3">
              {getTasksByStatus(status).map((task) => (
                <Card
                  key={task.id}
                  className="p-3 hover:shadow-lg transition-shadow bg-white cursor-pointer group"
                  onClick={() => handleTaskClick(task)}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <GripVertical 
                        className="w-4 h-4 text-gray-400 cursor-move flex-shrink-0"
                        draggable
                        onDragStart={(e) => {
                          e.stopPropagation();
                          handleDragStart(e, task);
                        }}
                      />
                      <h3 className="font-semibold text-gray-900 truncate flex-1">{task.title}</h3>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {task.priority && (
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                          {getPriorityBadge(task.priority)}
                        </span>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(task);
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity px-2 py-1"
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      {canDelete(task) && (
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(task.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity px-2 py-1"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
              {getTasksByStatus(status).length === 0 && (
                <div className="text-center text-gray-400 py-8">
                  No tasks in {status}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Task Detail Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="Task Details"
        size="lg"
      >
        {detailTask && (
          <div className="space-y-6">
            {/* Header Section */}
            <div className="border-b pb-4">
              <div className="flex items-start justify-between mb-3">
                <h2 className="text-2xl font-bold text-gray-900">{detailTask.title}</h2>
                <div className="flex gap-2">
                  {getStatusBadge(detailTask.status)}
                  {detailTask.priority && getPriorityBadge(detailTask.priority)}
                </div>
              </div>
              {detailTask.description && (
                <p className="text-gray-600 mt-2">{detailTask.description}</p>
              )}
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {detailTask.project && (
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <FolderKanban className="w-5 h-5 text-indigo-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Project</p>
                    <p className="text-gray-900 font-semibold">{detailTask.project.title}</p>
                  </div>
                </div>
              )}

              {detailTask.creator && (
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <User className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Created By</p>
                    <p className="text-gray-900 font-semibold">{detailTask.creator.name}</p>
                  </div>
                </div>
              )}

              {detailTask.assigned_user && (
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <User className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Assigned To</p>
                    <p className="text-gray-900 font-semibold">{detailTask.assigned_user.name}</p>
                  </div>
                </div>
              )}

              {detailTask.deadline && (
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <Calendar className="w-5 h-5 text-red-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Deadline</p>
                    <p className="text-gray-900 font-semibold">
                      {new Date(detailTask.deadline).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              )}

              {detailTask.estimated_hours && (
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <Clock className="w-5 h-5 text-purple-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Estimated Hours</p>
                    <p className="text-gray-900 font-semibold">{detailTask.estimated_hours} hrs</p>
                  </div>
                </div>
              )}

              {detailTask.actual_time && (
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <Clock className="w-5 h-5 text-orange-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Actual Time</p>
                    <p className="text-gray-900 font-semibold">{detailTask.actual_time} hrs</p>
                  </div>
                </div>
              )}

              {detailTask.task_type && (
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <Calendar className="w-5 h-5 text-indigo-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Task Type</p>
                    <p className="text-gray-900 font-semibold">{detailTask.task_type}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Requirements Section */}
            {detailTask.requirements && detailTask.requirements.length > 0 && (
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-600" />
                  Attached Requirements ({detailTask.requirements.length})
                </h3>
                <div className="space-y-2">
                  {detailTask.requirements.map((req: any) => (
                    <div key={req.id} className="p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{req.title}</p>
                          {req.description && (
                            <p className="text-sm text-gray-600 mt-1">{req.description}</p>
                          )}
                        </div>
                        <Badge variant="info">{req.type}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setIsDetailModalOpen(false);
                  handleEdit(detailTask);
                }}
                className="flex-1"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Task
              </Button>
              {canDelete(detailTask) && (
                <Button
                  variant="danger"
                  onClick={() => {
                    setIsDetailModalOpen(false);
                    handleDelete(detailTask.id);
                  }}
                  className="flex-1"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Task
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Create/Edit Task Modal */}
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
