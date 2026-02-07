
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Plus, Blocks } from 'lucide-react';
import { taskService } from '@/services/taskService';
import { TaskForm } from '@/components/TaskForm';
import { TaskDetail } from '@/components/TaskDetail';
import { TaskFilters } from '@/components/task-dashboard/TaskFilters';
import { TaskList } from '@/components/task-dashboard/TaskList';
import { TaskListSkeleton } from '@/components/task-dashboard/TaskListSkeleton';
import { useTaskMutations } from '@/components/task-dashboard/useTaskMutations';
import { Task, TaskFormData } from '@/types/task';

type CompletionFilter = 'uncompleted' | 'completed' | 'all';

export const TaskDashboard = ({ onOpenIntegrations }: { onOpenIntegrations?: () => void }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [completionFilter, setCompletionFilter] = useState<CompletionFilter>('uncompleted');

  const {
    createTaskMutation,
    updateTaskMutation,
    deleteTaskMutation,
    toggleCompleteMutation,
    copyTaskMutation,
  } = useTaskMutations();

  // Fetch tasks
  const { data: tasks = [], isLoading, error } = useQuery({
    queryKey: ['tasks'],
    queryFn: taskService.getTasks,
  });

  // Fetch tags
  const { data: tags = [] } = useQuery({
    queryKey: ['tags'],
    queryFn: taskService.getTags,
  });

  // Filter tasks by completion status and selected tags
  const filteredTasks = tasks.filter(task => {
    // Filter by completion status
    const isCompleted = !!task.completeDate;
    let passesCompletionFilter = true;
    
    if (completionFilter === 'completed') {
      passesCompletionFilter = isCompleted;
    } else if (completionFilter === 'uncompleted') {
      passesCompletionFilter = !isCompleted;
    }
    // For 'all', passesCompletionFilter remains true
    
    // Filter by selected tags
    const passesTagFilter = selectedTagIds.length === 0 || 
      task.tags.some(tag => selectedTagIds.includes(tag.id));
    
    return passesCompletionFilter && passesTagFilter;
  });

  const handleCreateTask = (taskData: TaskFormData) => {
    createTaskMutation.mutate(taskData, {
      onSuccess: () => {
        setIsFormOpen(false);
      },
    });
  };

  const handleUpdateTask = (taskData: TaskFormData) => {
    if (editingTask) {
      updateTaskMutation.mutate({ taskId: editingTask.id, taskData }, {
        onSuccess: () => {
          setEditingTask(null);
          setIsFormOpen(false);
        },
      });
    }
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsFormOpen(true);
  };

  const handleDeleteTask = (taskId: string) => {
    deleteTaskMutation.mutate(taskId);
  };

  const handleToggleComplete = (taskId: string) => {
    toggleCompleteMutation.mutate(taskId);
  };

  const handleCopyTask = (taskId: string) => {
    copyTaskMutation.mutate(taskId);
  };

  const handleOpenTask = (taskId: string) => {
    setSelectedTaskId(taskId);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingTask(null);
  };

  const handleTagClick = (tagId: string) => {
    if (selectedTagIds.includes(tagId)) {
      setSelectedTagIds(selectedTagIds.filter(id => id !== tagId));
    } else {
      setSelectedTagIds([tagId]);
    }
  };

  const selectedTask = tasks.find(task => task.id === selectedTaskId);

  if (selectedTask) {
    return (
      <TaskDetail
        task={selectedTask}
        onBack={() => setSelectedTaskId(null)}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Your Tasks</h2>
          <Button disabled>
            <Plus className="h-4 w-4 mr-2" />
            Add Task
          </Button>
        </div>
        <TaskListSkeleton count={8} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <p className="text-red-600">Error loading tasks. Please try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Your Tasks</h2>
        <div className="flex items-center gap-2">
          {onOpenIntegrations && (
            <Button 
              variant="outline" 
              size="icon"
              onClick={onOpenIntegrations}
              title="Configure Integrations"
            >
              <Blocks className="h-4 w-4" />
            </Button>
          )}
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Task
          </Button>
        </div>
      </div>

      <TaskFilters
        completionFilter={completionFilter}
        onCompletionFilterChange={setCompletionFilter}
        tags={tags}
        selectedTagIds={selectedTagIds}
        onTagFilterChange={setSelectedTagIds}
      />

      <TaskList
        tasks={tasks}
        filteredTasks={filteredTasks}
        selectedTagIds={selectedTagIds}
        completionFilter={completionFilter}
        onToggleComplete={handleToggleComplete}
        onOpenTask={handleOpenTask}
        onCopyTask={handleCopyTask}
        onDeleteTask={handleDeleteTask}
        onEditTask={handleEditTask}
        onTagClick={handleTagClick}
        onCreateTask={() => setIsFormOpen(true)}
      />

      <TaskForm
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        onSubmit={editingTask ? handleUpdateTask : handleCreateTask}
        task={editingTask}
      />
    </div>
  );
};
