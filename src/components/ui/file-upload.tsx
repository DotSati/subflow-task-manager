import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, X, File, Image, Expand } from 'lucide-react';
import { fileUploadService, UploadedFile } from '@/services/fileUploadService';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from '@/components/ui/dialog';

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
  const [showPasteHint, setShowPasteHint] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
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

  const handlePaste = async (e: ClipboardEvent) => {
    e.preventDefault();
    
    const items = Array.from(e.clipboardData?.items || []);
    const imageItem = items.find(item => item.type.startsWith('image/'));
    
    if (imageItem) {
      const file = imageItem.getAsFile();
      if (file) {
        // Use the file directly - the backend will generate a proper filename
        await handleFileSelect(file);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
      setShowPasteHint(true);
      setTimeout(() => setShowPasteHint(false), 2000);
    }
  };

  // Add paste event listener
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('paste', handlePaste);
      return () => container.removeEventListener('paste', handlePaste);
    }
  }, []);

  // Focus container to enable paste events
  const handleContainerClick = () => {
    containerRef.current?.focus();
  };

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20 ${
        dragOver 
          ? 'border-primary bg-primary/5' 
          : showPasteHint
          ? 'border-blue-400 bg-blue-50'
          : 'border-gray-300 hover:border-gray-400'
      } ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
      onDrop={handleDrop}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onKeyDown={handleKeyDown}
      onClick={handleContainerClick}
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
          ) : showPasteHint ? (
            <span className="text-blue-600 font-medium">Ready to paste! Press Ctrl+V (Cmd+V on Mac)</span>
          ) : (
            <>
              Drop files here, paste screenshots (Ctrl+V), or{' '}
              <Button
                type="button"
                variant="link"
                className="p-0 h-auto text-primary"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
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
  showPreview?: boolean;
}

export const AttachedFile = ({ file, onRemove, canRemove = true, showPreview = false }: AttachedFileProps) => {
  const isImage = file.type.startsWith('image/') || file.url.match(/\.(jpg|jpeg|png|gif|webp)(\?|$)/i);

  if (showPreview && isImage) {
    return <ImagePreview file={file} onRemove={canRemove ? onRemove : undefined} />;
  }

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
        {file.size > 0 ? `${(file.size / 1024).toFixed(1)}KB` : ''}
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

interface ImagePreviewProps {
  file: UploadedFile;
  onRemove?: (file: UploadedFile) => void;
}

const ImagePreview = ({ file, onRemove }: ImagePreviewProps) => {
  return (
    <div className="relative group">
      <Dialog>
        <DialogTrigger asChild>
          <div className="relative cursor-pointer rounded-lg overflow-hidden border border-gray-200 hover:border-gray-300 transition-colors">
            <img
              src={file.url}
              alt={file.name}
              className="w-20 h-20 object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
              <Expand className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          <div className="relative">
            <img
              src={file.url}
              alt={file.name}
              className="w-full h-auto max-h-[80vh] object-contain"
            />
            <div className="absolute top-2 right-2 flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => window.open(file.url, '_blank')}
                className="bg-black bg-opacity-50 text-white hover:bg-opacity-70"
              >
                Open Original
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {onRemove && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onRemove(file)}
          className="absolute -top-1 -right-1 h-5 w-5 p-0 bg-red-500 text-white hover:bg-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
};