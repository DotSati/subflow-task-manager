
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
} from '@/components/ui/context-menu';
import { ExternalLink, Edit, Copy, Trash2, Tag as TagIcon, Check, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Task } from '@/types/task';
import { taskService } from '@/services/taskService';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface TaskCardContextMenuProps {
  task: Task;
  onEdit?: (task: Task) => void;
  onCopy?: (taskId: string) => void;
  onDelete?: (taskId: string) => void;
}

export const TaskCardContextMenu = ({ task, onEdit, onCopy, onDelete }: TaskCardContextMenuProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newTagName, setNewTagName] = useState('');

  const { data: tags = [] } = useQuery({
    queryKey: ['tags'],
    queryFn: taskService.getTags,
  });

  const assignedIds = new Set((task.tags || []).map((t) => t.id));

  const refreshTasks = () => {
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
    queryClient.invalidateQueries({ queryKey: ['task', task.id] });
  };

  const toggleTagMutation = useMutation({
    mutationFn: async (tagId: string) => {
      const newIds = assignedIds.has(tagId)
        ? [...assignedIds].filter((id) => id !== tagId)
        : [...assignedIds, tagId];
      await taskService.updateTaskTags(task.id, newIds);
    },
    onSuccess: refreshTasks,
    onError: () => toast({ title: 'Error', description: 'Failed to update tags', variant: 'destructive' }),
  });

  const createTagMutation = useMutation({
    mutationFn: async (name: string) => {
      const tag = await taskService.createTag({ name, color: '#3B82F6' });
      await taskService.updateTaskTags(task.id, [...assignedIds, tag.id]);
      return tag;
    },
    onSuccess: () => {
      setNewTagName('');
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      refreshTasks();
      toast({ title: 'Success', description: 'Tag created and assigned' });
    },
    onError: () => toast({ title: 'Error', description: 'Failed to create tag', variant: 'destructive' }),
  });

  const deleteTagMutation = useMutation({
    mutationFn: (tagId: string) => taskService.deleteTag(tagId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      refreshTasks();
      toast({ title: 'Success', description: 'Tag deleted' });
    },
    onError: () => toast({ title: 'Error', description: 'Failed to delete tag', variant: 'destructive' }),
  });

  const handleOpenInNewWindow = () => {
    window.open(`/task/${task.id}`, '_blank');
  };

  const handleDeleteTag = (e: React.MouseEvent, tagId: string, tagName: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm(`Delete tag "${tagName}"? It will be removed from all tasks.`)) {
      deleteTagMutation.mutate(tagId);
    }
  };

  return (
    <ContextMenuContent className="w-56">
      {onEdit && (
        <ContextMenuItem onClick={() => onEdit(task)}>
          <Edit className="h-4 w-4 mr-2" />
          Edit Task
        </ContextMenuItem>
      )}
      <ContextMenuItem onClick={handleOpenInNewWindow}>
        <ExternalLink className="h-4 w-4 mr-2" />
        Open in New Window
      </ContextMenuItem>
      <ContextMenuItem asChild>
        <Link to={`/task/${task.id}`} target="_blank" rel="noopener noreferrer">
          <ExternalLink className="h-4 w-4 mr-2" />
          Open in New Tab
        </Link>
      </ContextMenuItem>

      <ContextMenuSeparator />

      <ContextMenuSub>
        <ContextMenuSubTrigger>
          <TagIcon className="h-4 w-4 mr-2" />
          Tags
        </ContextMenuSubTrigger>
        <ContextMenuSubContent className="w-64">
          {tags.length === 0 && (
            <div className="px-2 py-1.5 text-xs text-muted-foreground">No tags yet</div>
          )}
          {tags.map((tag) => {
            const isAssigned = assignedIds.has(tag.id);
            return (
              <div
                key={tag.id}
                className="flex items-center justify-between gap-1 px-2 py-1 rounded-sm hover:bg-accent cursor-pointer"
                onClick={(e) => {
                  e.preventDefault();
                  toggleTagMutation.mutate(tag.id);
                }}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <Check
                    className={`h-3.5 w-3.5 flex-shrink-0 ${isAssigned ? 'opacity-100' : 'opacity-0'}`}
                  />
                  <span
                    className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: tag.color }}
                  />
                  <span className="text-sm truncate">{tag.name}</span>
                </div>
                <button
                  type="button"
                  className="p-1 rounded text-red-500 hover:bg-red-50"
                  onClick={(e) => handleDeleteTag(e, tag.id, tag.name)}
                  title="Delete tag"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            );
          })}

          <ContextMenuSeparator />

          <div
            className="px-2 py-1.5 flex gap-1"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <Input
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              placeholder="New tag"
              className="h-7 text-xs"
              onKeyDown={(e) => {
                e.stopPropagation();
                if (e.key === 'Enter' && newTagName.trim()) {
                  createTagMutation.mutate(newTagName.trim());
                }
              }}
            />
            <Button
              type="button"
              size="sm"
              className="h-7 px-2"
              disabled={!newTagName.trim() || createTagMutation.isPending}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (newTagName.trim()) createTagMutation.mutate(newTagName.trim());
              }}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </ContextMenuSubContent>
      </ContextMenuSub>

      <ContextMenuSeparator />

      {onCopy && (
        <ContextMenuItem onClick={() => onCopy(task.id)}>
          <Copy className="h-4 w-4 mr-2" />
          Copy Task
        </ContextMenuItem>
      )}
      {onDelete && (
        <ContextMenuItem onClick={() => onDelete(task.id)}>
          <Trash2 className="h-4 w-4 mr-2" />
          Delete Task
        </ContextMenuItem>
      )}
    </ContextMenuContent>
  );
};
