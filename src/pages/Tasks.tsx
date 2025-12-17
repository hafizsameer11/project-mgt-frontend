import { useEffect, useState } from 'react';
import { Task } from '../types';
import { taskService } from '../services/taskService';
import { Modal } from '../components/ui/Modal';
import { TaskForm } from '../components/forms/TaskForm';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { FileText, GripVertical, Calendar, User, FolderKanban, Clock, Edit, Trash2, X, Play, Pause, Square } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

// Helper function to round numbers
const round = (value: number, decimals: number) => {
  return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
};

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
  const [activeTimers, setActiveTimers] = useState<Record<number, any>>({});
  const [timerIntervals, setTimerIntervals] = useState<Record<number, NodeJS.Timeout>>({});
  
  const isAdmin = user?.role === 'Admin';
  const isDeveloper = user?.role === 'Developer';
  
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

  const statuses = ['Pending', 'In Progress', 'Review', 'Completed'];

  useEffect(() => {
    if (isAdmin) {
      if (activeTab === 'my-tasks') {
        // Show only Admin's personal tasks (created by and assigned to admin)
        fetchTasks({ created_by: user?.id, assigned_to: user?.id });
      } else {
        // Show tasks NOT created by admin AND NOT assigned to admin
        fetchTasks({ exclude_created_by: user?.id, exclude_assigned_to: user?.id });
      }
    } else {
      fetchTasks();
    }
  }, [isAdmin, activeTab, user?.id]);

  // Fetch active timers for all tasks
  useEffect(() => {
    const fetchActiveTimers = async () => {
      const timerMap: Record<number, any> = {};
      for (const task of tasks) {
        if (task.assigned_to === user?.id) {
          try {
            const response = await taskService.getActiveTimer(task.id);
            if (response.timer) {
              timerMap[task.id] = response.timer;
            }
          } catch (error) {
            // Ignore errors
          }
        }
      }
      // Merge with existing timers to preserve any that were just set
      setActiveTimers(prev => ({ ...prev, ...timerMap }));
    };

    if (tasks.length > 0 && user?.id) {
      fetchActiveTimers();
    }
  }, [tasks, user?.id]);

  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      Object.values(timerIntervals).forEach(interval => clearInterval(interval));
    };
  }, [timerIntervals]);

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

  const handleTaskClick = async (task: Task) => {
    // Fetch full task details with timers
    try {
      const fullTask = await taskService.getById(task.id);
      console.log('Fetched task:', fullTask); // Debug log
      setDetailTask(fullTask);
      setIsDetailModalOpen(true);
      // Fetch active timer for this task
      if (task.assigned_to === user?.id) {
        try {
          const response = await taskService.getActiveTimer(task.id);
          if (response.timer) {
            setActiveTimers(prev => ({ ...prev, [task.id]: response.timer }));
          }
        } catch (error) {
          // Ignore errors
        }
      }
    } catch (error) {
      console.error('Error fetching task details:', error);
      // Fallback to the task from list if fetch fails
      setDetailTask(task);
      setIsDetailModalOpen(true);
    }
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

  const handleStartTimer = async (taskId: number) => {
    try {
      const response = await taskService.startTimer(taskId);
      // Update the timer state immediately
      setActiveTimers(prev => ({ ...prev, [taskId]: response }));
      // Also fetch the active timer to ensure we have the latest data
      try {
        const timerResponse = await taskService.getActiveTimer(taskId);
        if (timerResponse.timer) {
          setActiveTimers(prev => ({ ...prev, [taskId]: timerResponse.timer }));
        }
      } catch (error) {
        // Ignore errors, we already have the response from startTimer
      }
      fetchTasks();
    } catch (error) {
      console.error('Error starting timer:', error);
      alert('Error starting timer');
    }
  };

  const handlePauseTimer = async (timerId: number, taskId: number) => {
    try {
      const response = await taskService.pauseTimer(timerId);
      // Update with the full response from the API
      setActiveTimers(prev => ({ ...prev, [taskId]: response }));
      // Also fetch the active timer to ensure we have the latest state
      try {
        const timerResponse = await taskService.getActiveTimer(taskId);
        if (timerResponse.timer) {
          setActiveTimers(prev => ({ ...prev, [taskId]: timerResponse.timer }));
        }
      } catch (error) {
        // Ignore errors, we already have the response from pauseTimer
      }
      if (timerIntervals[taskId]) {
        clearInterval(timerIntervals[taskId]);
        setTimerIntervals(prev => {
          const updated = { ...prev };
          delete updated[taskId];
          return updated;
        });
      }
      fetchTasks();
    } catch (error) {
      console.error('Error pausing timer:', error);
      alert('Error pausing timer');
    }
  };

  const handleResumeTimer = async (timerId: number, taskId: number) => {
    try {
      const response = await taskService.resumeTimer(timerId);
      // Update with the response from the API
      setActiveTimers(prev => ({ ...prev, [taskId]: response }));
      // Also fetch the active timer to ensure we have the latest data
      try {
        const timerResponse = await taskService.getActiveTimer(taskId);
        if (timerResponse.timer) {
          setActiveTimers(prev => ({ ...prev, [taskId]: timerResponse.timer }));
        }
      } catch (error) {
        // Ignore errors, we already have the response from resumeTimer
      }
      fetchTasks();
    } catch (error) {
      console.error('Error resuming timer:', error);
      alert('Error resuming timer');
    }
  };

  const handleEndTimer = async (timerId: number, taskId: number) => {
    if (!confirm('Are you sure you want to end this task? The status will be changed to Review.')) {
      return;
    }
    try {
      await taskService.stopTimer(timerId);
      setActiveTimers(prev => {
        const updated = { ...prev };
        delete updated[taskId];
        return updated;
      });
      if (timerIntervals[taskId]) {
        clearInterval(timerIntervals[taskId]);
        setTimerIntervals(prev => {
          const updated = { ...prev };
          delete updated[taskId];
          return updated;
        });
      }
      fetchTasks();
      if (detailTask?.id === taskId) {
        setIsDetailModalOpen(false);
      }
    } catch (error) {
      console.error('Error ending timer:', error);
      alert('Error ending timer');
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
      'Pending': 'default',
      'In Progress': 'warning',
      'Review': 'info',
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

  // Helper function to check if a timer is paused (matching backend logic)
  const isTimerPaused = (timer: any): boolean => {
    if (!timer || !timer.paused_at) {
      return false;
    }
    // Timer is paused if paused_at exists AND (resumed_at is null OR paused_at timestamp > resumed_at timestamp)
    if (!timer.resumed_at) {
      return true;
    }
    const pausedTimestamp = new Date(timer.paused_at).getTime();
    const resumedTimestamp = new Date(timer.resumed_at).getTime();
    return pausedTimestamp > resumedTimestamp;
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">{task.title}</h3>
                        {task.assigned_user && (
                          <div className="flex items-center gap-1 mt-1">
                            <User className="w-3 h-3 text-gray-400" />
                            <span className="text-xs text-gray-500">
                              {task.assigned_user.name}
                            </span>
                          </div>
                        )}
                        {task.assigned_to === user?.id && (task.actual_time || task.actual_time === 0) && (
                          <div className="flex items-center gap-1 mt-1">
                            <Clock className="w-3 h-3 text-orange-600" />
                            <span className="text-xs text-gray-600 font-medium">
                              {task.actual_time || 0} hrs
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {task.priority && (
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                          {getPriorityBadge(task.priority)}
                        </span>
                      )}
                      {/* Timer buttons for assigned users */}
                      {task.assigned_to === user?.id && task.status !== 'Completed' && task.status !== 'Review' && (
                        <>
                          {!activeTimers[task.id] ? (
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStartTimer(task.id);
                              }}
                              className="opacity-0 group-hover:opacity-100 transition-opacity px-2 py-1"
                              title="Start Timer"
                            >
                              <Play className="w-3 h-3" />
                            </Button>
                          ) : isTimerPaused(activeTimers[task.id]) ? (
                            <>
                              <Button
                                size="sm"
                                variant="primary"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleResumeTimer(activeTimers[task.id].id, task.id);
                                }}
                                className="opacity-0 group-hover:opacity-100 transition-opacity px-2 py-1"
                                title="Resume Timer"
                              >
                                <Play className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="danger"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEndTimer(activeTimers[task.id].id, task.id);
                                }}
                                className="opacity-0 group-hover:opacity-100 transition-opacity px-2 py-1"
                                title="End Task"
                              >
                                <Square className="w-3 h-3" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                size="sm"
                                variant="warning"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePauseTimer(activeTimers[task.id].id, task.id);
                                }}
                                className="opacity-0 group-hover:opacity-100 transition-opacity px-2 py-1"
                                title="Pause Timer"
                              >
                                <Pause className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="danger"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEndTimer(activeTimers[task.id].id, task.id);
                                }}
                                className="opacity-0 group-hover:opacity-100 transition-opacity px-2 py-1"
                                title="End Task"
                              >
                                <Square className="w-3 h-3" />
                              </Button>
                            </>
                          )}
                        </>
                      )}
                      {/* Edit button - only for Admin and PM, not for developers */}
                      {!isDeveloper && (
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
                      )}
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
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <FolderKanban className="w-5 h-5 text-indigo-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Project</p>
                  <p className="text-gray-900 font-semibold">
                    {detailTask.project?.title || 'No project assigned'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <User className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Created By</p>
                  <p className="text-gray-900 font-semibold">
                    {detailTask.creator?.name || 'Unknown'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <User className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Assigned To</p>
                  <p className="text-gray-900 font-semibold">
                    {detailTask.assigned_user?.name || 'Unassigned'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <Calendar className="w-5 h-5 text-red-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Deadline</p>
                  <p className="text-gray-900 font-semibold">
                    {detailTask.deadline ? (
                      new Date(detailTask.deadline).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })
                    ) : (
                      'No deadline set'
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <Clock className="w-5 h-5 text-purple-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Estimated Hours</p>
                  <p className="text-gray-900 font-semibold">
                    {detailTask.estimated_hours ? `${detailTask.estimated_hours} hrs` : 'Not estimated'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <Clock className="w-5 h-5 text-orange-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-500">Actual Time</p>
                  <p className="text-gray-900 font-semibold">{detailTask.actual_time || 0} hrs</p>
                  {detailTask.estimated_hours && (
                    <p className="text-xs text-gray-500 mt-1">
                      {detailTask.actual_time && detailTask.estimated_hours ? (
                        <>
                          {detailTask.actual_time > detailTask.estimated_hours ? (
                            <span className="text-red-600">
                              {((detailTask.actual_time / detailTask.estimated_hours - 1) * 100).toFixed(0)}% over estimate
                            </span>
                          ) : (
                            <span className="text-green-600">
                              {((1 - detailTask.actual_time / detailTask.estimated_hours) * 100).toFixed(0)}% under estimate
                            </span>
                          )}
                        </>
                      ) : null}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <Calendar className="w-5 h-5 text-indigo-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Task Type</p>
                  <p className="text-gray-900 font-semibold">
                    {detailTask.task_type || 'Not specified'}
                  </p>
                </div>
              </div>
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

            {/* Complete Time Log Section */}
            {detailTask.timers && detailTask.timers.length > 0 && (
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-orange-600" />
                  Complete Time Log ({detailTask.timers.length} session{detailTask.timers.length !== 1 ? 's' : ''})
                </h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {detailTask.timers
                    .sort((a: any, b: any) => {
                      const dateA = new Date(b.started_at || b.created_at || 0).getTime();
                      const dateB = new Date(a.started_at || a.created_at || 0).getTime();
                      return dateA - dateB;
                    })
                    .map((timer: any) => {
                      // Timer is paused if paused_at exists but no resumed_at (resumed_at is set when resuming)
                      const isPaused = timer.paused_at && !timer.resumed_at && !timer.stopped_at;
                      const isActive = !timer.stopped_at && !isPaused;
                      const isCompleted = !!timer.stopped_at;
                      
                      // Calculate current time if active
                      let currentSeconds = timer.total_seconds || 0;
                      if (isActive && timer.started_at) {
                        const now = new Date().getTime();
                        const start = new Date(timer.started_at).getTime();
                        currentSeconds = currentSeconds + Math.floor((now - start) / 1000);
                      }
                      const currentHours = round(currentSeconds / 3600, 2);
                      
                      const formatTime = (dateString: string | undefined) => {
                        if (!dateString) return null;
                        return new Date(dateString).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        });
                      };

                      return (
                        <div key={timer.id} className={`p-4 rounded-lg border ${
                          isActive ? 'bg-green-50 border-green-200' : 
                          isPaused ? 'bg-yellow-50 border-yellow-200' : 
                          'bg-orange-50 border-orange-100'
                        }`}>
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Clock className={`w-4 h-4 ${
                                isActive ? 'text-green-600' : 
                                isPaused ? 'text-yellow-600' : 
                                'text-orange-600'
                              }`} />
                              <span className="font-semibold text-gray-900">
                                {isActive ? currentHours : timer.total_hours || 0} hrs
                              </span>
                            </div>
                            <Badge variant={
                              isActive ? 'success' : 
                              isPaused ? 'warning' : 
                              'default'
                            }>
                              {isActive ? 'Running' : isPaused ? 'Paused' : 'Completed'}
                            </Badge>
                          </div>
                          
                          <div className="space-y-1.5 text-sm">
                            {timer.original_started_at && (
                              <div className="flex items-start gap-2">
                                <span className="text-green-600 font-medium min-w-[80px]">First Started:</span>
                                <span className="text-gray-700">{formatTime(timer.original_started_at)}</span>
                              </div>
                            )}
                            
                            {timer.started_at && timer.original_started_at !== timer.started_at && (
                              <div className="flex items-start gap-2">
                                <span className="text-blue-600 font-medium min-w-[80px]">Last Resumed:</span>
                                <span className="text-gray-700">{formatTime(timer.started_at)}</span>
                              </div>
                            )}
                            
                            {timer.paused_at && (
                              <div className="flex items-start gap-2">
                                <span className="text-yellow-600 font-medium min-w-[80px]">Paused:</span>
                                <span className="text-gray-700">{formatTime(timer.paused_at)}</span>
                                {timer.started_at && (
                                  <span className="text-gray-500 text-xs ml-2">
                                    (Worked {round((new Date(timer.paused_at).getTime() - new Date(timer.started_at).getTime()) / 3600000, 2)} hrs in this session)
                                  </span>
                                )}
                              </div>
                            )}
                            
                            {timer.resumed_at && (
                              <div className="flex items-start gap-2">
                                <span className="text-green-600 font-medium min-w-[80px]">Resumed:</span>
                                <span className="text-gray-700">{formatTime(timer.resumed_at)}</span>
                                {timer.paused_at && (
                                  <span className="text-gray-500 text-xs ml-2">
                                    (Paused for {round((new Date(timer.resumed_at).getTime() - new Date(timer.paused_at).getTime()) / 3600, 2)} hrs)
                                  </span>
                                )}
                              </div>
                            )}
                            
                            {isPaused && timer.paused_at && timer.started_at && (
                              <div className="flex items-start gap-2">
                                <span className="text-blue-600 font-medium min-w-[80px]">Session Duration:</span>
                                <span className="text-gray-700">
                                  {round((new Date(timer.paused_at).getTime() - new Date(timer.started_at).getTime()) / 3600000, 2)} hrs
                                </span>
                              </div>
                            )}
                            
                            {isActive && timer.started_at && (
                              <div className="flex items-start gap-2">
                                <span className="text-blue-600 font-medium min-w-[80px]">Running:</span>
                                <span className="text-gray-700">
                                  Since {formatTime(timer.started_at)}
                                </span>
                                <span className="text-gray-500 text-xs ml-2">
                                  ({currentHours} hrs so far)
                                </span>
                              </div>
                            )}
                            
                            {timer.stopped_at && (
                              <div className="flex items-start gap-2">
                                <span className="text-red-600 font-medium min-w-[80px]">Ended:</span>
                                <span className="text-gray-700">{formatTime(timer.stopped_at)}</span>
                              </div>
                            )}
                            
                            {/* Pause History */}
                            {timer.pause_history && Array.isArray(timer.pause_history) && timer.pause_history.length > 0 && (
                              <div className="mt-3 pt-3 border-t border-gray-200">
                                <div className="text-xs font-semibold text-gray-600 mb-2">Pause/Resume History:</div>
                                <div className="space-y-1">
                                  {timer.pause_history.map((event: any, idx: number) => (
                                    <div key={idx} className="text-xs text-gray-600 flex items-center gap-2">
                                      <span className={`w-2 h-2 rounded-full ${event.type === 'pause' ? 'bg-yellow-500' : 'bg-green-500'}`}></span>
                                      <span className="capitalize">{event.type}</span>
                                      <span className="text-gray-400">at</span>
                                      <span>{formatTime(event.at)}</span>
                                      {event.type === 'pause' && event.seconds_before_pause && (
                                        <span className="text-gray-500">
                                          (worked {round(event.seconds_before_pause / 3600, 2)} hrs)
                                        </span>
                                      )}
                                      {event.type === 'resume' && event.pause_duration_seconds && (
                                        <span className="text-gray-500">
                                          (paused for {round(event.pause_duration_seconds / 3600, 2)} hrs)
                                        </span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {isCompleted && timer.total_hours > 0 && (
                              <div className="flex items-start gap-2 mt-2 pt-2 border-t border-gray-200">
                                <span className="text-indigo-600 font-semibold min-w-[80px]">Total:</span>
                                <span className="text-gray-900 font-semibold">
                                  {timer.total_hours} hrs worked
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
                {detailTask.timers.length === 0 && (
                  <div className="text-center py-4">
                    <Clock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">
                      No timer sessions yet
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t flex-wrap">
              {/* Timer buttons for assigned users */}
              {detailTask.assigned_to === user?.id && detailTask.status !== 'Completed' && detailTask.status !== 'Review' && (
                <div className="flex gap-2 w-full mb-2">
                  {!activeTimers[detailTask.id] ? (
                    <Button
                      variant="primary"
                      onClick={() => handleStartTimer(detailTask.id)}
                      className="flex-1"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Start Timer
                    </Button>
                  ) : isTimerPaused(activeTimers[detailTask.id]) ? (
                    <>
                      <Button
                        variant="primary"
                        onClick={() => handleResumeTimer(activeTimers[detailTask.id].id, detailTask.id)}
                        className="flex-1"
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Resume Timer
                      </Button>
                      <Button
                        variant="danger"
                        onClick={() => handleEndTimer(activeTimers[detailTask.id].id, detailTask.id)}
                        className="flex-1"
                      >
                        <Square className="w-4 h-4 mr-2" />
                        End Task
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="warning"
                        onClick={() => handlePauseTimer(activeTimers[detailTask.id].id, detailTask.id)}
                        className="flex-1"
                      >
                        <Pause className="w-4 h-4 mr-2" />
                        Pause Timer
                      </Button>
                      <Button
                        variant="danger"
                        onClick={() => handleEndTimer(activeTimers[detailTask.id].id, detailTask.id)}
                        className="flex-1"
                      >
                        <Square className="w-4 h-4 mr-2" />
                        End Task
                      </Button>
                    </>
                  )}
                </div>
              )}
              {/* Edit button - only for Admin and PM */}
              {!isDeveloper && (
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
              )}
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
