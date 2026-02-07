import { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { TaskCard } from '@/components/TaskCard';
import { Task } from '@/types/task';

interface TaskListProps {
  tasks: Task[];
  filteredTasks: Task[];
  selectedTagIds: string[];
  completionFilter: 'uncompleted' | 'completed' | 'all';
  onToggleComplete: (taskId: string) => void;
  onOpenTask: (taskId: string) => void;
  onCopyTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onEditTask: (task: Task) => void;
  onTagClick: (tagId: string) => void;
  onCreateTask: () => void;
}

const ESTIMATED_TASK_HEIGHT = 80;

export const TaskList = ({
  tasks,
  filteredTasks,
  selectedTagIds,
  completionFilter,
  onToggleComplete,
  onOpenTask,
  onCopyTask,
  onDeleteTask,
  onEditTask,
  onTagClick,
  onCreateTask,
}: TaskListProps) => {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: filteredTasks.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ESTIMATED_TASK_HEIGHT,
    overscan: 5,
  });

  if (filteredTasks.length === 0) {
    return (
      <div className="text-center py-12">
        {selectedTagIds.length > 0 || completionFilter !== 'all' ? (
          <p className="text-gray-500 mb-4">No tasks found with the current filters.</p>
        ) : tasks.length === 0 ? (
          <>
            <p className="text-gray-500 mb-4">No tasks yet. Create your first task to get started!</p>
            <Button onClick={onCreateTask}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Task
            </Button>
          </>
        ) : (
          <p className="text-gray-500 mb-4">No tasks match the current filters.</p>
        )}
      </div>
    );
  }

  const items = virtualizer.getVirtualItems();

  return (
    <div
      ref={parentRef}
      className="bg-white rounded-lg border border-gray-200 overflow-auto"
      style={{ maxHeight: '70vh' }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {items.map((virtualItem) => {
          const task = filteredTasks[virtualItem.index];
          return (
            <div
              key={virtualItem.key}
              data-index={virtualItem.index}
              ref={virtualizer.measureElement}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              <TaskCard
                task={task}
                onComplete={onToggleComplete}
                onClick={(task) => onOpenTask(task.id)}
                onCopy={onCopyTask}
                onDelete={onDeleteTask}
                onEdit={onEditTask}
                onTagClick={onTagClick}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
