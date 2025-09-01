-- Create storage bucket for subtask attachments
INSERT INTO storage.buckets (id, name, public) VALUES ('subtask-attachments', 'subtask-attachments', true);

-- Create RLS policies for subtask attachments
CREATE POLICY "Users can view their own subtask attachments" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'subtask-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own subtask attachments" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'subtask-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own subtask attachments" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'subtask-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own subtask attachments" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'subtask-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);