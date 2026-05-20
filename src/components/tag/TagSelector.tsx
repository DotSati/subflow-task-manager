
import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Pencil, Check, X } from 'lucide-react';
import { taskService } from '@/services/taskService';
import { TagBadge } from './TagBadge';
import { useToast } from '@/hooks/use-toast';
import { Tag } from '@/types/tag';

interface TagSelectorProps {
  selectedTagIds: string[];
  onTagsChange: (tagIds: string[]) => void;
}

const DEFAULT_COLORS = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B',
  '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'
];

export const TagSelector = ({ selectedTagIds, onTagsChange }: TagSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState(DEFAULT_COLORS[0]);
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [editTagName, setEditTagName] = useState('');
  const [editTagColor, setEditTagColor] = useState(DEFAULT_COLORS[0]);
  const containerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: tags = [] } = useQuery({
    queryKey: ['tags'],
    queryFn: taskService.getTags,
  });

  const createTagMutation = useMutation({
    mutationFn: taskService.createTag,
    onSuccess: (newTag) => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      onTagsChange([...selectedTagIds, newTag.id]);
      setNewTagName('');
      setNewTagColor(DEFAULT_COLORS[0]);
      toast({ title: 'Success', description: 'Tag created successfully' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to create tag', variant: 'destructive' });
    },
  });

  const deleteTagMutation = useMutation({
    mutationFn: (tagId: string) => taskService.deleteTag(tagId),
    onSuccess: (_, tagId) => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      onTagsChange(selectedTagIds.filter((id) => id !== tagId));
      toast({ title: 'Success', description: 'Tag deleted' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to delete tag', variant: 'destructive' });
    },
  });

  const updateTagMutation = useMutation({
    mutationFn: ({ tagId, name, color }: { tagId: string; name: string; color: string }) =>
      taskService.updateTag(tagId, { name, color }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setEditingTagId(null);
      toast({ title: 'Success', description: 'Tag updated' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to update tag', variant: 'destructive' });
    },
  });

  const selectedTags = tags.filter((tag) => selectedTagIds.includes(tag.id));

  const handleTagToggle = (tagId: string) => {
    if (selectedTagIds.includes(tagId)) {
      onTagsChange(selectedTagIds.filter((id) => id !== tagId));
    } else {
      onTagsChange([...selectedTagIds, tagId]);
    }
  };

  const handleCreateTag = () => {
    if (newTagName.trim()) {
      createTagMutation.mutate({ name: newTagName.trim(), color: newTagColor });
    }
  };

  const handleDeleteTag = (e: React.MouseEvent, tagId: string, tagName: string) => {
    e.stopPropagation();
    if (confirm(`Delete tag "${tagName}"? It will be removed from all tasks.`)) {
      deleteTagMutation.mutate(tagId);
    }
  };

  const handleStartEdit = (e: React.MouseEvent, tag: Tag) => {
    e.stopPropagation();
    setEditingTagId(tag.id);
    setEditTagName(tag.name);
    setEditTagColor(tag.color);
  };

  const handleSaveEdit = () => {
    if (editingTagId && editTagName.trim()) {
      updateTagMutation.mutate({ tagId: editingTagId, name: editTagName.trim(), color: editTagColor });
    }
  };

  const handleCancelEdit = () => {
    setEditingTagId(null);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setEditingTagId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <div className="space-y-2">
        {selectedTags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {selectedTags.map((tag) => (
              <TagBadge
                key={tag.id}
                tag={tag}
                removable
                clickable={false}
                onRemove={() => handleTagToggle(tag.id)}
              />
            ))}
          </div>
        )}

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="text-xs"
        >
          <Plus className="h-3 w-3 mr-1" />
          Manage Tags
        </Button>
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-popover text-popover-foreground border border-border rounded-md shadow-lg p-3 space-y-3">
          {tags.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-2">All Tags:</p>
              <div className="space-y-2 max-h-64 overflow-auto">
                {tags.map((tag) => {
                  const isSelected = selectedTagIds.includes(tag.id);
                  const isEditing = editingTagId === tag.id;

                  if (isEditing) {
                    return (
                      <div key={tag.id} className="border border-border rounded-md p-2 space-y-2 bg-accent/30">
                        <Input
                          value={editTagName}
                          onChange={(e) => setEditTagName(e.target.value)}
                          className="text-sm h-8"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveEdit();
                            if (e.key === 'Escape') handleCancelEdit();
                          }}
                        />
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex gap-1 flex-wrap">
                            {DEFAULT_COLORS.map((color) => (
                              <button
                                key={color}
                                type="button"
                                className={`w-6 h-6 rounded border-2 ${
                                  editTagColor === color ? 'border-foreground' : 'border-border'
                                }`}
                                style={{ backgroundColor: color }}
                                onClick={() => setEditTagColor(color)}
                              />
                            ))}
                            <input
                              type="color"
                              value={editTagColor}
                              onChange={(e) => setEditTagColor(e.target.value)}
                              className="w-6 h-6 rounded border-2 border-border cursor-pointer p-0"
                              title="Custom color"
                            />
                          </div>
                          <div className="flex gap-1">
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0"
                              onClick={handleSaveEdit}
                              disabled={!editTagName.trim() || updateTagMutation.isPending}
                              title="Save"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0"
                              onClick={handleCancelEdit}
                              title="Cancel"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={tag.id} className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0 flex items-center gap-2">
                        <TagBadge
                          tag={tag}
                          onClick={() => handleTagToggle(tag.id)}
                          clickable
                        />
                        {isSelected && (
                          <span className="text-xs text-muted-foreground">selected</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={(e) => handleStartEdit(e, tag)}
                          title="Edit tag"
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                          onClick={(e) => handleDeleteTag(e, tag.id, tag.name)}
                          title="Delete tag"
                          disabled={deleteTagMutation.isPending}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="border-t border-border pt-3">
            <p className="text-xs text-muted-foreground mb-2">Create New Tag:</p>
            <div className="flex gap-2">
              <Input
                placeholder="Tag name"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                className="flex-1 text-sm"
                onKeyPress={(e) => e.key === 'Enter' && handleCreateTag()}
              />
              <div className="flex gap-1 items-center">
                {DEFAULT_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`w-6 h-6 rounded border-2 ${
                      newTagColor === color ? 'border-foreground' : 'border-border'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setNewTagColor(color)}
                  />
                ))}
                <input
                  type="color"
                  value={newTagColor}
                  onChange={(e) => setNewTagColor(e.target.value)}
                  className="w-6 h-6 rounded border-2 border-border cursor-pointer p-0"
                  title="Custom color"
                />
              </div>
              <Button
                type="button"
                size="sm"
                onClick={handleCreateTag}
                disabled={!newTagName.trim() || createTagMutation.isPending}
              >
                Add
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
