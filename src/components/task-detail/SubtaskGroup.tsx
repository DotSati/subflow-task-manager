import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, ChevronDown, ChevronRight, Edit, Save, X } from 'lucide-react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Droppable, Draggable } from 'react-beautiful-dnd';
import { SubtaskFormData } from '@/types/task';
import { EnhancedSubtaskItem } from './EnhancedSubtaskItem';
import { DragHandle } from './DragHandle';
import { MarkdownEditor } from '@/components/ui/markdown-editor';

interface SubtaskGroupProps {
  group: any;
  index: number;
  isExpanded: boolean;
  editingGroupId: string | null;
  showAddSubtaskInGroup: string | null;
  onToggleExpansion: (groupId: string) => void;
  onEditGroup: (groupId: string, groupName: string) => void;
  onUpdateGroup: (groupId: string) => void;
  onCancelGroupEdit: (groupId: string) => void;
  onDeleteGroup: (groupId: string) => void;
  onSetShowAddSubtask: (groupId: string | null) => void;
  onAddSubtaskToGroup: (groupId: string, data: SubtaskFormData) => void;
  onUpdateSubtask: (subtaskId: string, data: SubtaskFormData) => void;
  onDeleteSubtask: (subtaskId: string) => void;
  onCompleteSubtask: (subtaskId: string) => void;
  onSkipSubtask: (subtaskId: string) => void;
  onSkipAllSubtasksInGroup: (groupId: string) => void;
  onCopySubtaskUrl: (subtaskId: string) => void;
  groupEditData: {[key: string]: string};
  onSetGroupEditData: (data: {[key: string]: string}) => void;
  highlightSubtaskId?: string;
  isDragging?: boolean;
}

export const SubtaskGroup = ({
  group,
  index,
  isExpanded,
  editingGroupId,
  showAddSubtaskInGroup,
  onToggleExpansion,
  onEditGroup,
  onUpdateGroup,
  onCancelGroupEdit,
  onDeleteGroup,
  onSetShowAddSubtask,
  onAddSubtaskToGroup,
  onUpdateSubtask,
  onDeleteSubtask,
  onCompleteSubtask,
  onSkipSubtask,
  onSkipAllSubtasksInGroup,
  onCopySubtaskUrl,
  groupEditData,
  onSetGroupEditData,
  highlightSubtaskId,
  isDragging = false
}: SubtaskGroupProps) => {
  const [newGroupSubtask, setNewGroupSubtask] = useState({ name: '', content: '' });

  const handleAddSubtaskToGroup = () => {
    if (newGroupSubtask.name.trim()) {
      onAddSubtaskToGroup(group.id, newGroupSubtask);
      setNewGroupSubtask({ name: '', content: '' });
      onSetShowAddSubtask(null);
    }
  };

  return (
    <Draggable key={group.id} draggableId={group.id} index={index}>
      {(provided, snapshot) => (
        <div 
          ref={provided.innerRef} 
          {...provided.draggableProps}
          className={`mt-3 ${snapshot.isDragging ? 'shadow-lg' : ''}`}
        >
          <ContextMenu>
            <ContextMenuTrigger asChild>
              <div className="flex items-center justify-between py-2 px-2 hover:bg-gray-50 rounded group">
                <div className="flex items-center gap-2 flex-1">
                  <div {...provided.dragHandleProps} className="flex-shrink-0">
                    <DragHandle isDragging={snapshot.isDragging} isGroup={true} />
                  </div>
                  <button
                    onClick={() => onToggleExpansion(group.id)}
                    className="flex items-center gap-2 flex-1 text-left"
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    )}
                    
                    {editingGroupId === group.id ? (
                      <div className="flex items-center gap-2 flex-1">
                        <Input
                          value={groupEditData[group.id] || ''}
                          onChange={(e) => onSetGroupEditData({
                            ...groupEditData,
                            [group.id]: e.target.value
                          })}
                          className="text-sm h-6 font-semibold"
                          autoFocus
                        />
                        <Button size="sm" onClick={() => onUpdateGroup(group.id)} className="h-6 px-2 text-xs">
                          <Save className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => onCancelGroupEdit(group.id)} className="h-6 px-2 text-xs">
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <span className="font-bold text-gray-900 text-sm uppercase">
                          {group.name}
                        </span>
                        <span className="text-xs text-gray-500 ml-2">
                          ({group.subtasks.filter((s: any) => s.completeDate).length}/{group.subtasks.length})
                        </span>
                      </>
                    )}
                  </button>
                </div>
                
                {editingGroupId !== group.id && (
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEditGroup(group.id, group.name)}
                      className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0 transition-opacity"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onSetShowAddSubtask(group.id)}
                      className="h-6 px-2 text-xs"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onSkipAllSubtasksInGroup(group.id)}
                      className="h-6 px-2 text-xs text-orange-600 hover:text-orange-700"
                      disabled={group.subtasks.length === 0}
                    >
                      Skip All
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs text-red-600 hover:text-red-700"
                        >
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Group</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete the group "{group.name}"? This will also delete all {group.subtasks.length} subtasks in this group. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => onDeleteGroup(group.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete Group
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}
              </div>
            </ContextMenuTrigger>
            
            <ContextMenuContent>
              <ContextMenuItem onClick={() => onEditGroup(group.id, group.name)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Group Name
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>

          {/* Add subtask to group form */}
          {showAddSubtaskInGroup === group.id && (
            <div className="ml-6 mb-2 p-3 border border-dashed border-gray-300 rounded bg-gray-50">
              <div className="space-y-3">
                <Input
                  placeholder="Subtask name..."
                  value={newGroupSubtask.name}
                  onChange={(e) => setNewGroupSubtask(prev => ({ ...prev, name: e.target.value }))}
                  className="text-sm h-8"
                />
                <MarkdownEditor
                  value={newGroupSubtask.content}
                  onChange={(content) => setNewGroupSubtask(prev => ({ ...prev, content }))}
                  placeholder="Subtask description (Markdown supported)..."
                  rows={3}
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleAddSubtaskToGroup} className="h-7 text-xs">
                    Add
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => onSetShowAddSubtask(null)}
                    className="h-7 text-xs"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Group Subtasks */}
          {isExpanded && (
            <Droppable droppableId={group.id} type="subtask">
              {(provided) => (
                <div 
                  ref={provided.innerRef} 
                  {...provided.droppableProps}
                  className="ml-6 space-y-1 border-l-2 border-gray-100 pl-3"
                >
                  {group.subtasks.map((subtask: any, index: number) => (
                     <EnhancedSubtaskItem
                       key={subtask.id}
                       subtask={subtask}
                       index={index}
                       isGrouped={true}
                       highlightSubtaskId={highlightSubtaskId}
                       onUpdateSubtask={onUpdateSubtask}
                       onDeleteSubtask={onDeleteSubtask}
                       onCompleteSubtask={onCompleteSubtask}
                       onSkipSubtask={onSkipSubtask}
                       onCopySubtaskUrl={onCopySubtaskUrl}
                     />
                  ))}
                  {provided.placeholder}
                  {group.subtasks.length === 0 && (
                    <div className="text-center text-gray-400 text-xs py-2">
                      No subtasks in this group yet
                    </div>
                  )}
                </div>
              )}
            </Droppable>
          )}
        </div>
      )}
    </Draggable>
  );
};
