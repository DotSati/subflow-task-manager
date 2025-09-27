
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Task } from '../types/task';
import { TaskDetailHeader } from './task-detail/TaskDetailHeader';
import { TaskInfo } from './task-detail/TaskInfo';
import { SubtasksList } from './task-detail/SubtasksList';
import { useToast } from '@/hooks/use-toast';
import { useTaskMutations } from '@/hooks/useTaskMutations';
import { createDragEndHandler, createCopySubtaskUrl } from '@/utils/dragHandlers';

interface TaskDetailProps {
  task: Task;
  onBack: () => void;
  highlightSubtaskId?: string;
}

export const TaskDetail = ({ task, onBack, highlightSubtaskId }: TaskDetailProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const {
    addSubtaskMutation,
    updateSubtaskMutation,
    deleteSubtaskMutation,
    completeSubtaskMutation,
    skipSubtaskMutation,
    skipAllSubtasksInGroupMutation,
    completeAllSubtasksInGroupMutation,
    addSubtaskGroupMutation,
    updateSubtaskGroupMutation,
    deleteSubtaskGroupMutation,
    completeTaskMutation,
    resetExecutionMutation,
    skipAllSubtasksMutation,
    updateTaskMutation,
    reorderSubtasksMutation,
    reorderSubtaskGroupsMutation,
  } = useTaskMutations(task.id);

  const handleDragEnd = createDragEndHandler(
    task,
    reorderSubtasksMutation,
    reorderSubtaskGroupsMutation,
    queryClient,
    toast
  );

  const copySubtaskUrl = createCopySubtaskUrl(task.id, toast);

  useEffect(() => {
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ['task', task.id] });
    }, 30000);

    return () => clearInterval(interval);
  }, [task.id, queryClient]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <TaskDetailHeader taskId={task.id} onBack={onBack} />
      
      <TaskInfo 
        task={task}
        onUpdateTask={(taskId, data) => updateTaskMutation.mutate({ taskId, data })}
        onCompleteTask={(taskId) => completeTaskMutation.mutate(taskId)}
        onResetExecution={(taskId) => resetExecutionMutation.mutate(taskId)}
        onSkipAllSubtasks={(taskId) => skipAllSubtasksMutation.mutate(taskId)}
      />

      <SubtasksList
        task={task}
        highlightSubtaskId={highlightSubtaskId}
        onAddSubtask={(data) => addSubtaskMutation.mutate({ taskId: task.id, data })}
        onAddGroup={(groupName) => addSubtaskGroupMutation.mutate({ taskId: task.id, groupName })}
        onAddSubtaskToGroup={(groupId, data) => addSubtaskMutation.mutate({ taskId: task.id, data, subtaskGroupId: groupId })}
        onUpdateSubtask={(subtaskId, data) => updateSubtaskMutation.mutate({ subtaskId, data })}
        onDeleteSubtask={(subtaskId) => deleteSubtaskMutation.mutate(subtaskId)}
        onCompleteSubtask={(subtaskId) => completeSubtaskMutation.mutate(subtaskId)}
        onSkipSubtask={(subtaskId) => skipSubtaskMutation.mutate(subtaskId)}
        onSkipAllSubtasksInGroup={(groupId) => skipAllSubtasksInGroupMutation.mutate(groupId)}
        onCompleteAllSubtasksInGroup={(groupId) => completeAllSubtasksInGroupMutation.mutate(groupId)}
        onUpdateGroup={(groupId, groupName) => updateSubtaskGroupMutation.mutate({ groupId, groupName })}
        onDeleteGroup={(groupId) => deleteSubtaskGroupMutation.mutate(groupId)}
        onCopySubtaskUrl={copySubtaskUrl}
        onDragEnd={handleDragEnd}
      />
    </div>
  );
};
