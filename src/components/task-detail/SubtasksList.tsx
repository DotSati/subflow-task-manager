
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Plus } from 'lucide-react';
import { DragDropContext, Droppable } from 'react-beautiful-dnd';
import { Task, SubtaskFormData } from '@/types/task';
import { SubtaskForm } from './SubtaskForm';
import { SubtaskGroupForm } from './SubtaskGroupForm';
import { SubtaskGroup } from './SubtaskGroup';
import { EnhancedSubtaskItem } from './EnhancedSubtaskItem';

interface SubtasksListProps {
  task: Task;
  highlightSubtaskId?: string;
  onAddSubtask: (data: SubtaskFormData) => void;
  onAddGroup: (groupName: string) => void;
  onAddSubtaskToGroup: (groupId: string, data: SubtaskFormData) => void;
  onUpdateSubtask: (subtaskId: string, data: SubtaskFormData) => void;
  onDeleteSubtask: (subtaskId: string) => void;
  onCompleteSubtask: (subtaskId: string) => void;
  onSkipSubtask: (subtaskId: string) => void;
  onSkipAllSubtasksInGroup: (groupId: string) => void;
  onCompleteAllSubtasksInGroup: (groupId: string) => void;
  onUpdateGroup: (groupId: string, groupName: string) => void;
  onDeleteGroup: (groupId: string) => void;
  onCopySubtaskUrl: (subtaskId: string) => void;
  onDragEnd: (result: any) => void;
}

export const SubtasksList = ({
  task,
  highlightSubtaskId,
  onAddSubtask,
  onAddGroup,
  onAddSubtaskToGroup,
  onUpdateSubtask,
  onDeleteSubtask,
  onCompleteSubtask,
  onSkipSubtask,
  onSkipAllSubtasksInGroup,
  onCompleteAllSubtasksInGroup,
  onUpdateGroup,
  onDeleteGroup,
  onCopySubtaskUrl,
  onDragEnd
}: SubtasksListProps) => {
  const [showAddSubtask, setShowAddSubtask] = useState(false);
  const [showAddGroup, setShowAddGroup] = useState(false);
  const [showAddSubtaskInGroup, setShowAddSubtaskInGroup] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(task.subtaskGroups.map(g => g.id)));
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [groupEditData, setGroupEditData] = useState<{[key: string]: string}>({});
  const [showOnlyIncomplete, setShowOnlyIncomplete] = useState(false);

  // Filter subtasks to only show those that don't belong to any group (sorted by order)
  const ungroupedSubtasks = task.subtasks
    .filter(subtask => 
      !task.subtaskGroups.some(group => 
        group.subtasks.some(groupSubtask => groupSubtask.id === subtask.id)
      )
    )
    .filter(subtask => !showOnlyIncomplete || !subtask.completeDate)
    .sort((a, b) => a.orderIndex - b.orderIndex);

  // Sort subtask groups by order
  const sortedSubtaskGroups = [...task.subtaskGroups].sort((a, b) => a.orderIndex - b.orderIndex);

  const toggleGroupExpansion = (groupId: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  };

  const handleEditGroup = (groupId: string, groupName: string) => {
    setEditingGroupId(groupId);
    setGroupEditData(prev => ({
      ...prev,
      [groupId]: groupName
    }));
  };

  const handleUpdateGroup = (groupId: string) => {
    const editData = groupEditData[groupId];
    if (editData && editData.trim()) {
      onUpdateGroup(groupId, editData);
      setEditingGroupId(null);
      setGroupEditData(prev => {
        const newData = { ...prev };
        delete newData[groupId];
        return newData;
      });
    }
  };

  const handleCancelGroupEdit = (groupId: string) => {
    setEditingGroupId(null);
    setGroupEditData(prev => {
      const newData = { ...prev };
      delete newData[groupId];
      return newData;
    });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Subtasks</CardTitle>
          <div className="flex items-center gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="show-incomplete"
                checked={showOnlyIncomplete}
                onCheckedChange={setShowOnlyIncomplete}
              />
              <Label htmlFor="show-incomplete" className="text-sm">
                Show only incomplete
              </Label>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddGroup(true)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Group
              </Button>
              <Button
                size="sm"
                onClick={() => setShowAddSubtask(true)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Subtask
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {/* Add new subtask form */}
        {showAddSubtask && (
          <SubtaskForm
            onAdd={(data) => {
              onAddSubtask(data);
              setShowAddSubtask(false);
            }}
            onCancel={() => setShowAddSubtask(false)}
          />
        )}

        {/* Add new group form */}
        {showAddGroup && (
          <SubtaskGroupForm
            onAdd={(groupName) => {
              onAddGroup(groupName);
              setShowAddGroup(false);
            }}
            onCancel={() => setShowAddGroup(false)}
          />
        )}

        <DragDropContext onDragEnd={onDragEnd}>
          <div className="space-y-1">
            {/* Individual Subtasks (only ungrouped ones) */}
            {ungroupedSubtasks.length > 0 && (
              <Droppable droppableId="ungrouped" type="subtask">
                {(provided, snapshot) => (
                  <div 
                    ref={provided.innerRef} 
                    {...provided.droppableProps} 
                    className={`space-y-1 min-h-[20px] transition-colors duration-200 ${
                      snapshot.isDraggingOver ? 'bg-blue-50 rounded-lg p-2' : ''
                    }`}
                  >
                    {ungroupedSubtasks.map((subtask, index) => (
                       <EnhancedSubtaskItem
                         key={subtask.id}
                         subtask={subtask}
                         index={index}
                         isGrouped={false}
                         highlightSubtaskId={highlightSubtaskId}
                         onUpdateSubtask={onUpdateSubtask}
                         onDeleteSubtask={onDeleteSubtask}
                         onCompleteSubtask={onCompleteSubtask}
                         onSkipSubtask={onSkipSubtask}
                         onCopySubtaskUrl={onCopySubtaskUrl}
                       />
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            )}

            {/* Subtask Groups */}
            <Droppable droppableId="subtask-groups" type="subtask-group">
              {(provided, snapshot) => (
                <div 
                  ref={provided.innerRef} 
                  {...provided.droppableProps}
                  className={`min-h-[20px] transition-colors duration-200 ${
                    snapshot.isDraggingOver ? 'bg-green-50 rounded-lg p-2' : ''
                  }`}
                >
                  {sortedSubtaskGroups.map((group, groupIndex) => (
                     <SubtaskGroup
                        key={group.id}
                        group={group}
                        index={groupIndex}
                        isExpanded={expandedGroups.has(group.id)}
                        editingGroupId={editingGroupId}
                        showAddSubtaskInGroup={showAddSubtaskInGroup}
                        showOnlyIncomplete={showOnlyIncomplete}
                        onToggleExpansion={toggleGroupExpansion}
                        onEditGroup={handleEditGroup}
                        onUpdateGroup={handleUpdateGroup}
                        onCancelGroupEdit={handleCancelGroupEdit}
                        onDeleteGroup={onDeleteGroup}
                        onSetShowAddSubtask={setShowAddSubtaskInGroup}
                        onAddSubtaskToGroup={onAddSubtaskToGroup}
                        onUpdateSubtask={onUpdateSubtask}
                        onDeleteSubtask={onDeleteSubtask}
                        onCompleteSubtask={onCompleteSubtask}
                        onSkipSubtask={onSkipSubtask}
                        onSkipAllSubtasksInGroup={onSkipAllSubtasksInGroup}
                        onCompleteAllSubtasksInGroup={onCompleteAllSubtasksInGroup}
                        onCopySubtaskUrl={onCopySubtaskUrl}
                        groupEditData={groupEditData}
                        onSetGroupEditData={setGroupEditData}
                        highlightSubtaskId={highlightSubtaskId}
                      />
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        </DragDropContext>

        {ungroupedSubtasks.length === 0 && task.subtaskGroups.length === 0 && !showAddSubtask && !showAddGroup && (
          <div className="text-center py-8 text-muted-foreground">
            <p>No subtasks yet. Add your first subtask to get started!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
