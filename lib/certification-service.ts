import { supabase } from './supabase';

export interface CertificationData {
  employeeName: string;
  certificationName: string;
  expirationDate: string;
  priority: 'low' | 'medium' | 'high';
  confidence: number;
}

export interface UploadResult extends CertificationData {
  id: string;
  fileUrl: string;
}

/**
 * Calculate priority based on expiration date
 */
export function calculatePriority(expirationDate: string): 'low' | 'medium' | 'high' {
  const expDate = new Date(expirationDate);
  const today = new Date();
  const diffTime = expDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays <= 30) return 'high';
  if (diffDays <= 90) return 'medium';
  return 'low';
}

/**
 * Main upload function that calls the API route
 */
export async function uploadCertification(file: File): Promise<UploadResult> {
  try {
    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png'
    ];

    if (!allowedTypes.includes(file.type)) {
      throw new Error('Unsupported file type. Please upload PDF, DOC, DOCX, JPG, or PNG files.');
    }

    // Validate file size (20MB limit)
    const maxSize = parseInt(process.env.NEXT_PUBLIC_MAX_FILE_SIZE || '20971520');
    if (file.size > maxSize) {
      throw new Error(`File size exceeds ${maxSize / 1024 / 1024}MB limit`);
    }

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    // Create form data
    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', user.id);

    // Call the API route
    const response = await fetch('/api/upload-certification', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      let errorMessage = 'Upload failed';
      
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || 'Upload failed';
      } catch {
        // If response isn't valid JSON, provide a meaningful error based on status code
        switch (response.status) {
          case 413:
            errorMessage = 'File is too large. Please compress your document or try a smaller file.';
            break;
          case 415:
            errorMessage = 'Unsupported file format. Please upload a PDF, DOC, or DOCX file.';
            break;
          case 422:
            errorMessage = 'Unable to extract certification data from this file. Please ensure it contains clear certification information.';
            break;
          case 500:
            errorMessage = 'Server error occurred while processing your file. Please try again.';
            break;
          default:
            errorMessage = `Upload failed with status ${response.status}. Please try again.`;
        }
      }
      
      throw new Error(errorMessage);
    }

    const result = await response.json();
    return result;

  } catch (error) {
    console.error('Upload certification error:', error);
    throw error;
  }
}

/**
 * Get all certifications for the current user
 */
export async function getUserCertifications() {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('certifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error('Failed to fetch certifications');
    }

    return data;
  } catch (error) {
    console.error('Fetch certifications error:', error);
    throw error;
  }
}

/**
 * Delete a certification
 */
export async function deleteCertification(id: string): Promise<void> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    // Get the certification to delete the file
    const { data: certification, error: fetchError } = await supabase
      .from('certifications')
      .select('file_url, user_id')
      .eq('id', id)
      .single();

    if (fetchError || !certification) {
      throw new Error('Certification not found');
    }

    // Verify ownership
    if (certification.user_id !== user.id) {
      throw new Error('Unauthorized to delete this certification');
    }

    // Delete from database
    const { error: deleteError } = await supabase
      .from('certifications')
      .delete()
      .eq('id', id);

    if (deleteError) {
      throw new Error('Failed to delete certification');
    }

    // Delete file from storage
    try {
      const filePath = certification.file_url.split('/').slice(-2).join('/');
      await supabase.storage.from('certifications').remove([filePath]);
    } catch (storageError) {
      console.error('Failed to delete file from storage:', storageError);
      // Don't throw here as the database record is already deleted
    }

  } catch (error) {
    console.error('Delete certification error:', error);
    throw error;
  }
} 