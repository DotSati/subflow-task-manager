import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, X, File, Image } from 'lucide-react';
import { fileUploadService, UploadedFile } from '@/services/fileUploadService';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface FileUploadProps {
  onFileUploaded: (file: UploadedFile) => void;
  accept?: string;
  maxSize?: number; // in MB
  disabled?: boolean;
}

export const FileUpload = ({ 
  onFileUploaded, 
  accept = "image/*,.pdf,.doc,.docx,.txt", 
  maxSize = 10,
  disabled = false 
}: FileUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (file: File) => {
    if (file.size > maxSize * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: `File size must be less than ${maxSize}MB`,
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const uploadedFile = await fileUploadService.uploadSubtaskAttachment(file, user.id);
      onFileUploaded(uploadedFile);
      
      toast({
        title: 'File uploaded',
        description: `${file.name} uploaded successfully`,
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'Failed to upload file',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
        dragOver 
          ? 'border-primary bg-primary/5' 
          : 'border-gray-300 hover:border-gray-400'
      } ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
      onDrop={handleDrop}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
    >
      <Input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileInput}
        className="hidden"
        disabled={disabled || isUploading}
      />
      
      <div className="flex flex-col items-center gap-2">
        <Upload className="h-8 w-8 text-gray-400" />
        <div className="text-sm text-gray-600">
          {isUploading ? (
            'Uploading...'
          ) : (
            <>
              Drop files here or{' '}
              <Button
                type="button"
                variant="link"
                className="p-0 h-auto text-primary"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled || isUploading}
              >
                browse
              </Button>
            </>
          )}
        </div>
        <div className="text-xs text-gray-500">
          Max size: {maxSize}MB
        </div>
      </div>
    </div>
  );
};

interface AttachedFileProps {
  file: UploadedFile;
  onRemove: (file: UploadedFile) => void;
  canRemove?: boolean;
}

export const AttachedFile = ({ file, onRemove, canRemove = true }: AttachedFileProps) => {
  const isImage = file.type.startsWith('image/');

  return (
    <div className="flex items-center gap-2 p-2 border border-gray-200 rounded bg-gray-50">
      {isImage ? (
        <Image className="h-4 w-4 text-blue-500" />
      ) : (
        <File className="h-4 w-4 text-gray-500" />
      )}
      <a
        href={file.url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-blue-600 hover:underline flex-1 truncate"
      >
        {file.name}
      </a>
      <span className="text-xs text-gray-500">
        {(file.size / 1024).toFixed(1)}KB
      </span>
      {canRemove && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onRemove(file)}
          className="h-6 w-6 p-0"
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
};