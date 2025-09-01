
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MarkdownEditor } from '@/components/ui/markdown-editor';
import { FileUpload, AttachedFile } from '@/components/ui/file-upload';
import { UploadedFile } from '@/services/fileUploadService';

interface SubtaskFormProps {
  onAdd: (data: { name: string; content: string }) => void;
  onCancel: () => void;
}

export const SubtaskForm = ({ onAdd, onCancel }: SubtaskFormProps) => {
  const [formData, setFormData] = useState({ name: '', content: '' });
  const [attachedFiles, setAttachedFiles] = useState<UploadedFile[]>([]);

  const handleSubmit = () => {
    if (formData.name.trim()) {
      // Add file links to content
      let contentWithFiles = formData.content;
      if (attachedFiles.length > 0) {
        const fileLinks = attachedFiles.map(file => 
          `![${file.name}](${file.url})`
        ).join('\n');
        contentWithFiles = contentWithFiles 
          ? `${contentWithFiles}\n\n${fileLinks}` 
          : fileLinks;
      }
      
      onAdd({ ...formData, content: contentWithFiles });
      setFormData({ name: '', content: '' });
      setAttachedFiles([]);
    }
  };

  const handleFileUploaded = (file: UploadedFile) => {
    setAttachedFiles(prev => [...prev, file]);
  };

  const handleRemoveFile = (fileToRemove: UploadedFile) => {
    setAttachedFiles(prev => prev.filter(file => file.url !== fileToRemove.url));
  };

  return (
    <div className="mb-4 p-3 border border-dashed border-gray-300 rounded-lg bg-gray-50">
      <div className="space-y-3">
        <Input
          placeholder="Subtask name..."
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          className="text-sm"
        />
        <MarkdownEditor
          value={formData.content}
          onChange={(content) => setFormData(prev => ({ ...prev, content }))}
          placeholder="Subtask description (Markdown supported)..."
          rows={3}
        />
        
        <div className="space-y-3">
          <FileUpload onFileUploaded={handleFileUploaded} />
          {attachedFiles.length > 0 && (
            <div className="space-y-2">
              <span className="text-sm font-medium text-gray-700">
                Attached Files:
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
        <div className="flex gap-2">
          <Button size="sm" onClick={handleSubmit}>
            Add Subtask
          </Button>
          <Button size="sm" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};
