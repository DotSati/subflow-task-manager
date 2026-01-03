
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Calendar, CheckCircle2, Circle, Copy, ExternalLink, Edit, Save, X, RotateCcw, SkipForward } from 'lucide-react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { Task, TaskFormData } from '@/types/task';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface TaskInfoProps {
  task: Task;
  onUpdateTask: (taskId: string, data: TaskFormData) => void;
  onCompleteTask: (taskId: string) => void;
  onResetExecution: (taskId: string) => void;
  onSkipAllSubtasks: (taskId: string) => void;
}

export const TaskInfo = ({ task, onUpdateTask, onCompleteTask, onResetExecution, onSkipAllSubtasks }: TaskInfoProps) => {
  const [isEditingTask, setIsEditingTask] = useState(false);
  const [taskEditData, setTaskEditData] = useState({
    name: task.name,
    content: task.content || ''
  });

  const { toast } = useToast();

  const isCompleted = !!task.completeDate;
  const isOverdue = task.dueDate && !task.completeDate && new Date() > task.dueDate;

  const copyTaskUrl = () => {
    const url = `${window.location.origin}/task/${task.id}`;
    navigator.clipboard.writeText(url);
    toast({
      title: "Link copied",
      description: "Task link has been copied to clipboard",
    });
  };

  const openTaskInNewWindow = () => {
    window.open(`/task/${task.id}`, '_blank');
  };

  const handleUpdateTask = () => {
    if (taskEditData.name.trim()) {
      onUpdateTask(task.id, {
        name: taskEditData.name,
        content: taskEditData.content,
        dueDate: task.dueDate
      });
      setIsEditingTask(false);
    }
  };

  const handleCancelTaskEdit = () => {
    setTaskEditData({
      name: task.name,
      content: task.content || ''
    });
    setIsEditingTask(false);
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {isEditingTask ? (
                  <div className="space-y-3">
                    <Input
                      value={taskEditData.name}
                      onChange={(e) => setTaskEditData(prev => ({ ...prev, name: e.target.value }))}
                      className="text-xl font-semibold"
                    />
                    <Textarea
                      value={taskEditData.content}
                      onChange={(e) => setTaskEditData(prev => ({ ...prev, content: e.target.value }))}
                      placeholder="Task description..."
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <Button onClick={handleUpdateTask}>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </Button>
                      <Button variant="outline" onClick={handleCancelTaskEdit}>
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="group flex-1">
                    <CardTitle className={`text-2xl ${isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                      {task.name}
                    </CardTitle>
                    {task.content && (
                      <p className="text-muted-foreground mt-2 whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{task.content}</p>
                    )}
                    <div className="flex gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsEditingTask(true)}
                        title="Edit task"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onResetExecution(task.id)}
                        title="Reset execution"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onSkipAllSubtasks(task.id)}
                        title="Skip all subtasks"
                      >
                        <SkipForward className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              {!isEditingTask && (
                <Button
                  variant="ghost"
                  onClick={() => onCompleteTask(task.id)}
                  className="h-10 w-10 p-0 shrink-0"
                >
                  {isCompleted ? (
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                  ) : (
                    <Circle className="h-6 w-6" />
                  )}
                </Button>
              )}
            </div>
            
            <div className="flex gap-2 mt-4">
              {task.dueDate && (
                <Badge variant={isOverdue ? "destructive" : "outline"} className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Due {format(task.dueDate, 'MMM d, yyyy')}
                </Badge>
              )}
              {isCompleted && (
                <Badge variant="default" className="bg-green-100 text-green-800">
                  Completed
                </Badge>
              )}
              {isOverdue && (
                <Badge variant="destructive">
                  Overdue
                </Badge>
              )}
            </div>
          </CardHeader>
        </Card>
      </ContextMenuTrigger>
      
      <ContextMenuContent>
        <ContextMenuItem onClick={() => setIsEditingTask(true)}>
          <Edit className="h-4 w-4 mr-2" />
          Edit Task
        </ContextMenuItem>
        <ContextMenuItem onClick={copyTaskUrl}>
          <Copy className="h-4 w-4 mr-2" />
          Copy Task Link
        </ContextMenuItem>
        <ContextMenuItem onClick={openTaskInNewWindow}>
          <ExternalLink className="h-4 w-4 mr-2" />
          Open in New Window
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};
