import { supabase } from './supabase';
import { getCSRFToken } from './csrf-client';

export interface CertificationData {
  employeeName: string;
  certificationName: string;
  licenseNumber?: string | null;
  expirationDate: string | null;
  issueDate?: string | null;
  priority: 'low' | 'medium' | 'high';
  confidence: number;
  isLifetime: boolean;
}

export interface UploadResult extends CertificationData {
  id: string;
  filePath?: string;
  fileUrl?: string;
  isUpdate?: boolean;
  message?: string;
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

export interface UploadOptions {
  /** If true, uses higher rate limits suitable for bulk onboarding uploads */
  isOnboarding?: boolean;
}

/**
 * Main upload function that calls the API route
 */
export async function uploadCertification(file: File, options?: UploadOptions): Promise<UploadResult> {
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

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new Error(`File size exceeds 5MB limit`);
    }

    // Get current user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      throw new Error('User not authenticated');
    }

    // Get CSRF token
    const csrfToken = await getCSRFToken();

    // Create form data
    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', session.user.id);
    
    // Pass onboarding flag if set (for higher rate limits)
    if (options?.isOnboarding) {
      formData.append('isOnboarding', 'true');
    }

    // Call the API route with CSRF token and authorization
    const response = await fetch('/api/upload-certification', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'X-CSRF-Token': csrfToken,
      },
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
 * Delete only the file from a certification (keeps the certification record)
 */
export async function deleteCertificationFile(id: string): Promise<void> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    // Get current session for authentication
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.access_token) {
      throw new Error('Authentication required. Please sign in again.');
    }

    // Get CSRF token
    const csrfToken = await getCSRFToken();

    // Call the API endpoint to delete the file
    const response = await fetch('/api/certifications/delete-file', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'X-CSRF-Token': csrfToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ certificationId: id })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `Failed to delete file (${response.status})`);
    }

  } catch (error) {
    console.error('Delete certification file error:', error);
    throw error;
  }
}

/**
 * Delete a certification (entire record)
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

    // Delete file from storage first (before database deletion)
    if (certification.file_url) {
      try {
        // Extract file path from URL
        // URL format: https://...supabase.co/storage/v1/object/public/certifications/path/to/file.pdf
        const urlParts = certification.file_url.split('/');
        const storageIndex = urlParts.findIndex((part: string) => part === 'certifications');
        
        if (storageIndex !== -1 && storageIndex < urlParts.length - 1) {
          // Get everything after 'certifications' in the path
          const filePath = urlParts.slice(storageIndex + 1).join('/');
          const { error: storageError } = await supabase.storage
            .from('certifications')
            .remove([filePath]);
          
          if (storageError) {
            console.warn('Failed to delete file from storage:', storageError);
            // Continue with database deletion even if storage deletion fails
          }
        } else {
          console.warn('Could not parse file URL for deletion:', certification.file_url);
        }
      } catch (storageError) {
        console.error('Error deleting file from storage:', storageError);
        // Continue with database deletion even if storage deletion fails
      }
    }

    // Delete from database
    const { error: deleteError } = await supabase
      .from('certifications')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Database delete error:', deleteError);
      throw new Error(`Failed to delete certification: ${deleteError.message}`);
    }

  } catch (error) {
    console.error('Delete certification error:', error);
    throw error;
  }
} 