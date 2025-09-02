import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

export interface UploadedFile {
  url: string;
  name: string;
  size: number;
  type: string;
}

class FileUploadService {
  async uploadSubtaskAttachment(file: File, userId: string): Promise<UploadedFile> {
    try {
      const fileId = uuidv4();
      let fileName = file.name;
      
      // If it's a generic clipboard file name, generate a better one
      if (fileName === 'image.png' || fileName === 'blob' || !fileName || fileName.startsWith('image')) {
        const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
        const extension = file.type.split('/')[1] || 'png';
        fileName = `screenshot-${timestamp}.${extension}`;
      }
      
      const fileExtension = fileName.split('.').pop();
      const storagePath = `${userId}/${fileId}.${fileExtension}`;

      const { data, error } = await supabase.storage
        .from('subtask-attachments')
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        console.error('Upload error:', error);
        throw new Error(`Failed to upload file: ${error.message}`);
      }

      const { data: publicUrlData } = supabase.storage
        .from('subtask-attachments')
        .getPublicUrl(storagePath);

      return {
        url: publicUrlData.publicUrl,
        name: fileName,
        size: file.size,
        type: file.type,
      };
    } catch (error) {
      console.error('File upload service error:', error);
      throw error;
    }
  }

  async deleteSubtaskAttachment(url: string, userId: string): Promise<void> {
    try {
      // Extract file path from URL
      const urlParts = url.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const filePath = `${userId}/${fileName}`;

      const { error } = await supabase.storage
        .from('subtask-attachments')
        .remove([filePath]);

      if (error) {
        console.error('Delete error:', error);
        throw new Error(`Failed to delete file: ${error.message}`);
      }
    } catch (error) {
      console.error('File delete service error:', error);
      throw error;
    }
  }

  // Extract file URLs from HTML comments and markdown images
  extractFileUrls(content: string): string[] {
    const fileUrlRegex = /https:\/\/[^\s\)]+\/subtask-attachments\/[^\s\)]+/g;
    const commentRegex = /<!-- attachment: (https:\/\/[^\s]+) -->/g;
    
    const urls: string[] = [];
    
    // Extract from HTML comments
    let match;
    while ((match = commentRegex.exec(content)) !== null) {
      urls.push(match[1]);
    }
    
    // Extract from markdown images (for backward compatibility)
    const markdownMatches = content.match(fileUrlRegex) || [];
    urls.push(...markdownMatches);
    
    return [...new Set(urls)]; // Remove duplicates
  }

  // Check if URL is a subtask attachment
  isSubtaskAttachment(url: string): boolean {
    return url.includes('/subtask-attachments/');
  }
}

export const fileUploadService = new FileUploadService();