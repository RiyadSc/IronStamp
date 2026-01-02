import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase admin client with service role for generating signed URLs
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
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get certification ID from query parameters
    const { id } = req.query;
    
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Certification ID is required' });
    }

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

    // Fetch the certification and verify ownership
    const { data: certification, error: certError } = await supabase
      .from('certifications')
      .select('id, file_url, user_id, file_name')
      .eq('id', id)
      .single();

    if (certError || !certification) {
      console.error('Certification fetch error:', certError);
      return res.status(404).json({ error: 'Certification not found' });
    }

    // Verify the certification belongs to the authenticated user
    if (certification.user_id !== user.id) {
      return res.status(403).json({ 
        error: 'Access denied',
        details: 'This certification does not belong to your account'
      });
    }

    // Check if file exists
    if (!certification.file_url || certification.file_url.trim().length === 0) {
      return res.status(404).json({ error: 'No file attached to this certification' });
    }

    // Extract file path from the stored file_url
    // Can be either:
    // 1. A path: "certifications/filename.pdf" (new format)
    // 2. A full URL: "https://[project].supabase.co/storage/v1/object/public/certifications/certifications/[filename]" (old format)
    let filePath = '';
    
    // First check if it's already a path (new format)
    if (certification.file_url.startsWith('certifications/')) {
      filePath = certification.file_url;
    } else {
      // It's a full URL (old format), extract the path
      try {
        const url = new URL(certification.file_url);
        const pathParts = url.pathname.split('/').filter((part: string) => part.length > 0);
        
        // Find the index of 'certifications' in the path
        const certIndex = pathParts.indexOf('certifications');
        
        if (certIndex !== -1 && certIndex < pathParts.length - 1) {
          // Get everything after 'certifications' (including nested certifications folder)
          const remainingPath = pathParts.slice(certIndex + 1).join('/');
          filePath = `certifications/${remainingPath}`;
        } else {
          // Fallback: try regex match
          const urlMatch = certification.file_url.match(/certifications\/(certifications\/)?(.+)$/);
          if (urlMatch) {
            // Handle both cases: certifications/filename or certifications/certifications/filename
            const actualPath = urlMatch[2] || urlMatch[1];
            filePath = `certifications/${actualPath}`;
          } else {
            throw new Error('Unable to extract file path from URL');
          }
        }
      } catch (error) {
        // URL parsing failed - file_url is malformed
        // Don't use file_name as fallback since it may not match the actual stored file
        console.error('Failed to parse file_url as URL:', error);
        console.error('Malformed file_url:', certification.file_url);
        return res.status(400).json({ 
          error: 'Invalid file path format',
          details: 'The file path stored in the database is not in a recognized format. Please contact support or re-upload the file.'
        });
      }
    }
    
    // Ensure filePath is properly formatted
    if (!filePath.startsWith('certifications/')) {
      filePath = `certifications/${filePath}`;
    }

    // Check if file exists in storage before generating signed URL
    // Extract directory and filename from path
    const pathParts = filePath.split('/');
    const fileName = pathParts.pop() || '';
    const directory = pathParts.join('/') || 'certifications';
    
    // List files in the directory to verify existence
    const { data: fileList, error: listError } = await supabaseAdmin
      .storage
      .from('certifications')
      .list(directory, {
        limit: 1000
      });

    // Verify file exists by checking if filename matches
    const fileExists = fileList?.some(file => file.name === fileName);
    
    if (listError) {
      // If listing fails, log but continue - might be a permissions issue
      console.error('Error listing files in storage:', {
        directory,
        error: listError?.message,
        filePath
      });
      // Continue to attempt signed URL generation - it will fail with a clearer error if file doesn't exist
    } else if (!fileExists) {
      console.error('File not found in storage:', {
        filePath,
        directory,
        fileName,
        originalFileUrl: certification.file_url,
        filesInDirectory: fileList?.map(f => f.name).slice(0, 10) // Log first 10 for debugging
      });
      return res.status(404).json({ 
        error: 'File not found',
        details: 'The certification file could not be found in storage. The file may have been deleted or the path is incorrect. Please contact support or re-upload the file.'
      });
    }

    // Generate signed URL (expires in 1 hour = 3600 seconds)
    const { data: signedUrlData, error: signedUrlError } = await supabaseAdmin
      .storage
      .from('certifications')
      .createSignedUrl(filePath, 3600);

    if (signedUrlError || !signedUrlData) {
      console.error('Signed URL generation error:', {
        error: signedUrlError?.message,
        filePath,
        originalFileUrl: certification.file_url,
        fileName: certification.file_name
      });
      return res.status(500).json({ 
        error: 'Failed to generate secure file URL',
        details: 'Unable to create a secure link to view the file. Please try again or contact support if the issue persists.'
      });
    }

    // Return the signed URL
    return res.status(200).json({
      signedUrl: signedUrlData.signedUrl,
      expiresIn: 3600, // 1 hour in seconds
      fileName: certification.file_name || 'certification'
    });

  } catch (error) {
    console.error('View certification file error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

