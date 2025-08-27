
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { taskService } from '@/services/taskService';

export const useTaskMutations = (taskId: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const invalidateQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['task', taskId] });
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
  };

  const addSubtaskMutation = useMutation({
    mutationFn: ({ taskId, data, subtaskGroupId }: { taskId: string; data: any; subtaskGroupId?: string }) => 
      taskService.addSubtask(taskId, data, subtaskGroupId),
    onSuccess: invalidateQueries,
  });

  const updateSubtaskMutation = useMutation({
    mutationFn: ({ subtaskId, data }: { subtaskId: string; data: any }) => 
      taskService.updateSubtask(subtaskId, data),
    onSuccess: invalidateQueries,
  });

  const deleteSubtaskMutation = useMutation({
    mutationFn: (subtaskId: string) => 
      taskService.deleteSubtask(subtaskId),
    onSuccess: invalidateQueries,
  });

  const completeSubtaskMutation = useMutation({
    mutationFn: (subtaskId: string) => 
      taskService.toggleSubtaskComplete(subtaskId),
    onSuccess: invalidateQueries,
  });

  const skipSubtaskMutation = useMutation({
    mutationFn: (subtaskId: string) => 
      taskService.toggleSubtaskSkip(subtaskId),
    onSuccess: invalidateQueries,
  });

  const skipAllSubtasksInGroupMutation = useMutation({
    mutationFn: (groupId: string) => 
      taskService.skipAllSubtasksInGroup(groupId),
    onSuccess: invalidateQueries,
  });

  const addSubtaskGroupMutation = useMutation({
    mutationFn: ({ taskId, groupName }: { taskId: string; groupName: string }) => 
      taskService.addSubtaskGroup(taskId, groupName),
    onSuccess: invalidateQueries,
  });

  const updateSubtaskGroupMutation = useMutation({
    mutationFn: ({ groupId, groupName }: { groupId: string; groupName: string }) => 
      taskService.updateSubtaskGroup(groupId, groupName),
    onSuccess: () => {
      invalidateQueries();
      toast({
        title: 'Success',
        description: 'Group updated successfully',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update group',
        variant: 'destructive',
      });
    },
  });

  const deleteSubtaskGroupMutation = useMutation({
    mutationFn: (groupId: string) => 
      taskService.deleteSubtaskGroup(groupId),
    onSuccess: invalidateQueries,
  });

  const completeTaskMutation = useMutation({
    mutationFn: (taskId: string) => taskService.toggleTaskComplete(taskId),
    onSuccess: invalidateQueries,
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ taskId, data }: { taskId: string; data: any }) => 
      taskService.updateTask(taskId, data),
    onSuccess: () => {
      invalidateQueries();
      toast({
        title: 'Success',
        description: 'Task updated successfully',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update task',
        variant: 'destructive',
      });
    },
  });

  const reorderSubtasksMutation = useMutation({
    mutationFn: ({ subtaskIds, groupId }: { subtaskIds: string[]; groupId?: string }) => 
      taskService.reorderSubtasks(subtaskIds, groupId),
    onSuccess: invalidateQueries,
  });

  const reorderSubtaskGroupsMutation = useMutation({
    mutationFn: ({ taskId, groupIds }: { taskId: string; groupIds: string[] }) => 
      taskService.reorderSubtaskGroups(taskId, groupIds),
    onSuccess: invalidateQueries,
  });

  return {
    addSubtaskMutation,
    updateSubtaskMutation,
    deleteSubtaskMutation,
    completeSubtaskMutation,
    skipSubtaskMutation,
    skipAllSubtasksInGroupMutation,
    addSubtaskGroupMutation,
    updateSubtaskGroupMutation,
    deleteSubtaskGroupMutation,
    completeTaskMutation,
    updateTaskMutation,
    reorderSubtasksMutation,
    reorderSubtaskGroupsMutation,
  };
};
