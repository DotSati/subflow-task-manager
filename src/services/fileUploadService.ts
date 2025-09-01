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
      const fileExtension = file.name.split('.').pop();
      const fileName = `${fileId}.${fileExtension}`;
      const filePath = `${userId}/${fileName}`;

      const { data, error } = await supabase.storage
        .from('subtask-attachments')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        console.error('Upload error:', error);
        throw new Error(`Failed to upload file: ${error.message}`);
      }

      const { data: publicUrlData } = supabase.storage
        .from('subtask-attachments')
        .getPublicUrl(filePath);

      return {
        url: publicUrlData.publicUrl,
        name: file.name,
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

  // Extract file URLs from markdown content
  extractFileUrls(content: string): string[] {
    const fileUrlRegex = /https:\/\/[^\s\)]+\/subtask-attachments\/[^\s\)]+/g;
    return content.match(fileUrlRegex) || [];
  }

  // Check if URL is a subtask attachment
  isSubtaskAttachment(url: string): boolean {
    return url.includes('/subtask-attachments/');
  }
}

export const fileUploadService = new FileUploadService();