import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { validateCSRFRequest } from '@/lib/csrf';

// Initialize Supabase admin client with service role for storage operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Validate CSRF token
  const csrfResult = validateCSRFRequest(req);
  if (!csrfResult.valid) {
    return res.status(403).json({ 
      error: csrfResult.error || 'CSRF validation failed'
    });
  }

  try {
    // Get user session from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    const token = authHeader.split(' ')[1];

    // Create server-side Supabase client with user token
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      }
    );

    // Verify the user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('Authentication error:', authError);
      return res.status(401).json({ error: 'Invalid authentication token' });
    }

    const { certificationId } = req.body;

    if (!certificationId) {
      return res.status(400).json({ error: 'Certification ID is required' });
    }

    // Get the certification to verify ownership and get file path
    const { data: certification, error: fetchError } = await supabase
      .from('certifications')
      .select('file_url, user_id')
      .eq('id', certificationId)
      .single();

    if (fetchError || !certification) {
      return res.status(404).json({ error: 'Certification not found' });
    }

    // Verify the certification belongs to the authenticated user
    if (certification.user_id !== user.id) {
      return res.status(403).json({ 
        error: 'Access denied',
        details: 'This certification does not belong to your account'
      });
    }

    // Delete file from storage if it exists
    if (certification.file_url) {
      try {
        // Extract file path from stored file_url
        // Handle both old public URLs and new path format
        let filePath = certification.file_url;
        
        // If it's a full URL, extract the path
        if (filePath.startsWith('http')) {
          // Try to extract path from URL
          const urlMatch = filePath.match(/certifications\/(certifications\/)?(.+)$/);
          if (urlMatch) {
            filePath = `certifications/${urlMatch[2] || urlMatch[1]}`;
          } else {
            // Fallback: try to get last two parts
            const parts = filePath.split('/').filter((p: string) => p);
            if (parts.length >= 2) {
              filePath = `${parts[parts.length - 2]}/${parts[parts.length - 1]}`;
            }
          }
        }
        
        // Ensure it starts with 'certifications/'
        if (!filePath.startsWith('certifications/')) {
          filePath = `certifications/${filePath}`;
        }

        // Use admin client for storage operations to bypass RLS policies
        const { error: storageError } = await supabaseAdmin.storage
          .from('certifications')
          .remove([filePath]);
        
        if (storageError) {
          console.warn('Failed to delete file from storage:', storageError);
          // Continue with database update even if storage deletion fails
        }
      } catch (storageError) {
        console.error('Error deleting file from storage:', storageError);
        // Continue with database update even if storage deletion fails
      }
    }

    // Update certification to remove file references (keep the certification record)
    const { data: updatedCert, error: updateError } = await supabase
      .from('certifications')
      .update({
        file_url: null,
        file_name: null,
        file_size: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', certificationId)
      .select()
      .single();

    if (updateError) {
      console.error('Database update error:', updateError);
      return res.status(500).json({ 
        error: 'Failed to remove file',
        details: updateError.message
      });
    }

    return res.status(200).json({
      success: true,
      message: 'File deleted successfully',
      certification: updatedCert
    });

  } catch (error) {
    console.error('Delete file error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

