
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckCircle2, Circle, Edit, Save, X, Copy, FileText, Trash2, SkipForward, Send, Paperclip } from 'lucide-react';
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
import { Draggable } from 'react-beautiful-dnd';
import { SubtaskFormData } from '@/types/task';
import { DragHandle } from './DragHandle';
import { MarkdownRenderer } from '@/components/ui/markdown-renderer';
import { MarkdownEditor } from '@/components/ui/markdown-editor';
import { FileUpload, AttachedFile } from '@/components/ui/file-upload';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { fileUploadService, UploadedFile } from '@/services/fileUploadService';

interface EnhancedSubtaskItemProps {
  subtask: any;
  index: number;
  isGrouped: boolean;
  highlightSubtaskId?: string;
  onUpdateSubtask: (subtaskId: string, data: SubtaskFormData) => void;
  onDeleteSubtask: (subtaskId: string) => void;
  onCompleteSubtask: (subtaskId: string) => void;
  onSkipSubtask: (subtaskId: string) => void;
  onCopySubtaskUrl: (subtaskId: string) => void;
  isDragging?: boolean;
}

export const EnhancedSubtaskItem = ({
  subtask,
  index,
  isGrouped,
  highlightSubtaskId,
  onUpdateSubtask,
  onDeleteSubtask,
  onCompleteSubtask,
  onSkipSubtask,
  onCopySubtaskUrl,
  isDragging = false
}: EnhancedSubtaskItemProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: subtask.name,
    content: subtask.content || ''
  });
  const [attachedFiles, setAttachedFiles] = useState<UploadedFile[]>([]);
  const { toast } = useToast();
  const [isSending, setIsSending] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);

  // Extract existing file URLs from content
  const existingFiles = fileUploadService.extractFileUrls(subtask.content || '');

  // Convert URLs to UploadedFile objects for display
  const existingFileObjects: UploadedFile[] = existingFiles.map(url => {
    const fileName = url.split('/').pop()?.split('?')[0] || 'attachment';
    const extension = fileName.split('.').pop()?.toLowerCase() || '';
    const mimeType = extension.startsWith('image') || ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension) 
      ? `image/${extension}` 
      : 'application/octet-stream';
    
    return {
      url,
      name: fileName,
      size: 0, // Size unknown for existing files
      type: mimeType
    };
  });

  const handleEdit = () => {
    setIsEditing(true);
    setEditData({
      name: subtask.name,
      content: subtask.content || ''
    });
  };

  const handleSave = () => {
    if (editData.name.trim()) {
      // Add file links to content
      let contentWithFiles = editData.content;
      if (attachedFiles.length > 0) {
        const fileLinks = attachedFiles.map(file => 
          `![${file.name}](${file.url})`
        ).join('\n');
        contentWithFiles = contentWithFiles 
          ? `${contentWithFiles}\n\n${fileLinks}` 
          : fileLinks;
      }
      
      onUpdateSubtask(subtask.id, { ...editData, content: contentWithFiles });
      setIsEditing(false);
      setAttachedFiles([]);
    }
  };

  const handleFileUploaded = (file: UploadedFile) => {
    setAttachedFiles(prev => [...prev, file]);
  };

  const handleRemoveFile = (fileToRemove: UploadedFile) => {
    setAttachedFiles(prev => prev.filter(file => file.url !== fileToRemove.url));
  };

  const handleCancel = () => {
    setEditData({
      name: subtask.name,
      content: subtask.content || ''
    });
    setAttachedFiles([]);
    setIsEditing(false);
  };

  const handleCopyDescription = async () => {
    if (!subtask.content?.trim()) {
      toast({
        title: "No description to copy",
        description: "This subtask doesn't have a description.",
        variant: "destructive",
      });
      return;
    }

    try {
      const firstLine = subtask.content.split(/\r?\n/)[0];
      await navigator.clipboard.writeText(firstLine);
      toast({
        title: "First line copied!",
        description: "The first line of the subtask description has been copied to your clipboard.",
      });
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Could not copy the description to clipboard.",
        variant: "destructive",
      });
    }
  };

  const handleCopyTitle = async () => {
    try {
      await navigator.clipboard.writeText(subtask.name);
      toast({
        title: "Title copied!",
        description: "The subtask title has been copied to your clipboard.",
      });
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Could not copy the title to clipboard.",
        variant: "destructive",
      });
    }
  };

  const handleSendToKanboard = async () => {
    try {
      setIsSending(true);

      const { data, error } = await supabase.functions.invoke('kanboard-proxy', {
        body: {
          title: subtask.name,
          description: subtask.content || '',
          project_id: 1,
        },
      });

      setIsSending(false);

      if (error) {
        toast({ title: 'Failed to send to Kanboard', description: error.message || 'Unknown error', variant: 'destructive' });
        return;
      }

      toast({ title: 'Sent to Kanboard', description: 'Task created successfully in Kanboard.' });
    } catch (error: any) {
      setIsSending(false);
      toast({ title: 'Error', description: error?.message || 'Could not send to Kanboard.', variant: 'destructive' });
    }
  };

  return (
    <Draggable key={subtask.id} draggableId={subtask.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`flex items-start gap-2 py-2 px-2 rounded hover:bg-gray-50 transition-colors ${
            highlightSubtaskId === subtask.id ? 'bg-blue-50 border border-blue-200' : ''
          } ${snapshot.isDragging ? 'shadow-lg' : ''}`}
          id={`subtask-${subtask.id}`}
        >
          <div {...provided.dragHandleProps} className="flex-shrink-0 mt-1">
            <DragHandle isDragging={snapshot.isDragging} />
          </div>
          
          {isGrouped && <span className="text-gray-400 text-sm mt-0.5">•</span>}
          <button
            onClick={() => onCompleteSubtask(subtask.id)}
            className="flex-shrink-0 mt-0.5 hover:scale-110 transition-transform"
          >
            {subtask.completeDate && !subtask.skipped ? (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            ) : (
              <Circle className="h-4 w-4 text-gray-400 hover:text-gray-600" />
            )}
          </button>
          
          {isEditing ? (
            <div className="flex-1 space-y-3">
              <Input
                value={editData.name}
                onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
                className="text-sm h-7"
                placeholder="Subtask name..."
              />
              <MarkdownEditor
                value={editData.content}
                onChange={(content) => setEditData(prev => ({ ...prev, content }))}
                placeholder="Subtask description (Markdown supported)..."
                rows={3}
              />
              
              <div className="space-y-3">
                <FileUpload onFileUploaded={handleFileUploaded} />
                {attachedFiles.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-sm font-medium text-gray-700">
                      New Attached Files:
                    </span>
                    {attachedFiles.map((file, index) => (
                      <AttachedFile
                        key={index}
                        file={file}
                        onRemove={handleRemoveFile}
                      />
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-1">
                <Button size="sm" onClick={handleSave} className="h-6 text-xs">
                  <Save className="h-3 w-3 mr-1" />
                  Save
                </Button>
                <Button size="sm" variant="outline" onClick={handleCancel} className="h-6 text-xs">
                  <X className="h-3 w-3 mr-1" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <ContextMenu>
              <ContextMenuTrigger asChild>
                <div className="flex-1 min-w-0 group">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <span className={`text-sm block ${
                        subtask.skipped ? 'line-through text-muted-foreground' :
                        subtask.completeDate ? 'text-gray-500' : 
                        isGrouped ? 'text-gray-600' : 'text-gray-700'
                      }`}>
                        {subtask.name}
                      </span>
                      {subtask.content && (
                        <div className={`mt-1 ${
                          subtask.skipped ? 'text-muted-foreground line-through' :
                          isGrouped ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          <MarkdownRenderer 
                            content={subtask.content} 
                            compact={false}
                            className="text-xs"
                          />
                        </div>
                      )}
                      {showAttachments && existingFileObjects.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {existingFileObjects.map((file, index) => (
                            <AttachedFile
                              key={index}
                              file={file}
                              onRemove={() => {}}
                              canRemove={false}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {existingFiles.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowAttachments(!showAttachments)}
                          className="h-6 w-6 p-0 text-blue-600"
                          title={`${existingFiles.length} attachment(s)`}
                        >
                          <Paperclip className="h-3 w-3" />
                          <span className="text-xs ml-1">{existingFiles.length}</span>
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleEdit}
                        className="h-6 w-6 p-0"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onSkipSubtask(subtask.id)}
                        className={`h-6 w-6 p-0 ${subtask.skipped ? 'text-orange-600 hover:text-orange-700' : 'text-gray-400 hover:text-orange-600'}`}
                        title={subtask.skipped ? "Unskip Subtask" : "Skip Subtask"}
                      >
                        <SkipForward className="h-3 w-3" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                            title="Delete Subtask"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Subtask</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{subtask.name}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => onDeleteSubtask(subtask.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete Subtask
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                      {subtask.content?.trim() && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleCopyDescription}
                          className="h-6 w-6 p-0"
                          title="Copy Description"
                        >
                          <FileText className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </ContextMenuTrigger>
              
              <ContextMenuContent>
                <ContextMenuItem onClick={handleEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Subtask
                </ContextMenuItem>
                <ContextMenuItem onClick={handleCopyTitle}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Title
                </ContextMenuItem>
                <ContextMenuItem 
                  onClick={handleCopyDescription}
                  disabled={!subtask.content?.trim()}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Copy Description
                </ContextMenuItem>
                <ContextMenuItem onClick={() => onCopySubtaskUrl(subtask.id)}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Subtask Link
                </ContextMenuItem>
                <ContextMenuItem onClick={handleSendToKanboard} disabled={isSending}>
                  <Send className="h-4 w-4 mr-2" />
                  Send to Kanboard
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
          )}
        </div>
      )}
    </Draggable>
  );
};
