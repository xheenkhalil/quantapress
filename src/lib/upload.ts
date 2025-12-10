// src/lib/upload.ts
import { supabase } from './supabase';
import { MediaAsset } from '@/types/cms';

export async function uploadMedia(
  file: File, 
  projectId: string, 
  uploaderId: string
): Promise<MediaAsset | null> {
  
  // 1. Sanitize filename (remove spaces, special chars)
  const fileExt = file.name.split('.').pop();
  const cleanName = file.name.replace(/[^a-zA-Z0-9]/g, '_');
  const filePath = `${projectId}/${Date.now()}_${cleanName}.${fileExt}`;

  // 2. Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from('quanta-assets')
    .upload(filePath, file);

  if (uploadError) {
    console.error('Upload failed:', uploadError);
    return null;
  }

  // 3. Get Public URL
  const { data: { publicUrl } } = supabase.storage
    .from('quanta-assets')
    .getPublicUrl(filePath);

  // 4. Create Database Record (The "Asset")
  // We mock dimensions (0,0) for now. In a real app, we'd load the image to read dimensions.
  const { data: asset, error: dbError } = await supabase
    .from('media_assets')
    .insert({
      project_id: projectId,
      uploader_id: uploaderId,
      file_url: publicUrl,
      file_name: file.name,
      mime_type: file.type,
      size_bytes: file.size,
      width: 0, 
      height: 0 
    })
    .select() // Return the created row
    .single();

  if (dbError) {
    console.error('DB Insert failed:', dbError);
    return null;
  }

  return asset as MediaAsset;
}