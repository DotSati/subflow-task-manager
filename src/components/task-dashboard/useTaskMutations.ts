
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { taskService } from '@/services/taskService';
import { TaskFormData, SubtaskFormData, Task } from '@/types/task';
import { useToast } from '@/hooks/use-toast';

export const useTaskMutations = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: taskService.createTask,
    onSuccess: (newTask) => {
      queryClient.setQueryData<Task[]>(['tasks'], (old = []) => [newTask, ...old]);
      toast({
        title: 'Success',
        description: 'Task created successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to create task',
        variant: 'destructive',
      });
      console.error('Create task error:', error);
    },
  });

  // Update task mutation
  const updateTaskMutation = useMutation({
    mutationFn: ({ taskId, taskData }: { taskId: string; taskData: TaskFormData }) =>
      taskService.updateTask(taskId, taskData),
    onMutate: async ({ taskId, taskData }) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] });
      const previousTasks = queryClient.getQueryData<Task[]>(['tasks']);
      queryClient.setQueryData<Task[]>(['tasks'], (old = []) =>
        old.map((task) =>
          task.id === taskId
            ? { ...task, name: taskData.name, content: taskData.content, dueDate: taskData.dueDate }
            : task
        )
      );
      return { previousTasks };
    },
    onError: (error, _, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(['tasks'], context.previousTasks);
      }
      toast({
        title: 'Error',
        description: 'Failed to update task',
        variant: 'destructive',
      });
      console.error('Update task error:', error);
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Task updated successfully',
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: taskService.deleteTask,
    onMutate: async (taskId) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] });
      const previousTasks = queryClient.getQueryData<Task[]>(['tasks']);
      queryClient.setQueryData<Task[]>(['tasks'], (old = []) =>
        old.filter((task) => task.id !== taskId)
      );
      return { previousTasks };
    },
    onError: (error, _, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(['tasks'], context.previousTasks);
      }
      toast({
        title: 'Error',
        description: 'Failed to delete task',
        variant: 'destructive',
      });
      console.error('Delete task error:', error);
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Task deleted successfully',
      });
    },
  });

  // Toggle task completion mutation
  const toggleCompleteMutation = useMutation({
    mutationFn: taskService.toggleTaskComplete,
    onMutate: async (taskId) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] });
      const previousTasks = queryClient.getQueryData<Task[]>(['tasks']);
      queryClient.setQueryData<Task[]>(['tasks'], (old = []) =>
        old.map((task) =>
          task.id === taskId
            ? { ...task, completeDate: task.completeDate ? null : new Date() }
            : task
        )
      );
      return { previousTasks };
    },
    onError: (error, _, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(['tasks'], context.previousTasks);
      }
      toast({
        title: 'Error',
        description: 'Failed to update task status',
        variant: 'destructive',
      });
      console.error('Toggle complete error:', error);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  // Copy task mutation
  const copyTaskMutation = useMutation({
    mutationFn: taskService.copyTask,
    onSuccess: (newTask) => {
      queryClient.setQueryData<Task[]>(['tasks'], (old = []) => [newTask, ...old]);
      toast({
        title: 'Success',
        description: 'Task copied successfully',
      });
      navigate(`/task/${newTask.id}`);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to copy task',
        variant: 'destructive',
      });
      console.error('Copy task error:', error);
    },
  });

  // Add subtask mutation
  const addSubtaskMutation = useMutation({
    mutationFn: ({ taskId, subtaskData, subtaskGroupId }: { 
      taskId: string; 
      subtaskData: SubtaskFormData; 
      subtaskGroupId?: string 
    }) => taskService.addSubtask(taskId, subtaskData, subtaskGroupId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast({
        title: 'Success',
        description: 'Subtask added successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to add subtask',
        variant: 'destructive',
      });
      console.error('Add subtask error:', error);
    },
  });

  // Update subtask mutation
  const updateSubtaskMutation = useMutation({
    mutationFn: ({ subtaskId, subtaskData }: { subtaskId: string; subtaskData: SubtaskFormData }) =>
      taskService.updateSubtask(subtaskId, subtaskData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast({
        title: 'Success',
        description: 'Subtask updated successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to update subtask',
        variant: 'destructive',
      });
      console.error('Update subtask error:', error);
    },
  });

  // Delete subtask mutation
  const deleteSubtaskMutation = useMutation({
    mutationFn: (subtaskId: string) => taskService.deleteSubtask(subtaskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast({
        title: 'Success',
        description: 'Subtask deleted successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to delete subtask',
        variant: 'destructive',
      });
      console.error('Delete subtask error:', error);
    },
  });

  // Toggle subtask completion mutation
  const toggleSubtaskCompleteMutation = useMutation({
    mutationFn: (subtaskId: string) => taskService.toggleSubtaskComplete(subtaskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to update subtask status',
        variant: 'destructive',
      });
      console.error('Toggle subtask complete error:', error);
    },
  });

  // Add subtask group mutation
  const addSubtaskGroupMutation = useMutation({
    mutationFn: ({ taskId, groupName }: { taskId: string; groupName: string }) =>
      taskService.addSubtaskGroup(taskId, groupName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast({
        title: 'Success',
        description: 'Subtask group added successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to add subtask group',
        variant: 'destructive',
      });
      console.error('Add subtask group error:', error);
    },
  });

  // Delete subtask group mutation
  const deleteSubtaskGroupMutation = useMutation({
    mutationFn: (groupId: string) => taskService.deleteSubtaskGroup(groupId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast({
        title: 'Success',
        description: 'Subtask group deleted successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to delete subtask group',
        variant: 'destructive',
      });
      console.error('Delete subtask group error:', error);
    },
  });

  // Move subtask mutation
  const moveSubtaskMutation = useMutation({
    mutationFn: ({ subtaskId, targetGroupId }: { subtaskId: string; targetGroupId: string | null }) =>
      taskService.moveSubtask(subtaskId, targetGroupId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast({
        title: 'Success',
        description: 'Subtask moved successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to move subtask',
        variant: 'destructive',
      });
      console.error('Move subtask error:', error);
    },
  });

  return {
    createTaskMutation,
    updateTaskMutation,
    deleteTaskMutation,
    toggleCompleteMutation,
    copyTaskMutation,
    addSubtaskMutation,
    updateSubtaskMutation,
    deleteSubtaskMutation,
    toggleSubtaskCompleteMutation,
    addSubtaskGroupMutation,
    deleteSubtaskGroupMutation,
    moveSubtaskMutation,
  };
};
