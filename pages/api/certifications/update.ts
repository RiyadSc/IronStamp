import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import formidable from 'formidable';
import fs from 'fs';
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

// Disable default body parser to handle multipart/form-data
export const config = {
  api: {
    bodyParser: false,
  },
};

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
    console.log('Update certification API called');

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

    console.log('Authenticated user:', user.id);

    // Parse form data
    const form = formidable({
      maxFileSize: 10 * 1024 * 1024, // 10MB limit
      uploadDir: './tmp', // temporary directory
      keepExtensions: true,
    });

    const [fields, files] = await form.parse(req);
    console.log('Parsed form fields:', fields);
    
    // Extract form data
    const certificationId = Array.isArray(fields.certificationId) ? fields.certificationId[0] : fields.certificationId;
    const certificationName = Array.isArray(fields.certificationName) ? fields.certificationName[0] : fields.certificationName;
    const employeeName = Array.isArray(fields.employeeName) ? fields.employeeName[0] : fields.employeeName;
    const issueDate = Array.isArray(fields.issueDate) ? fields.issueDate[0] : fields.issueDate;
    const expirationDate = Array.isArray(fields.expirationDate) ? fields.expirationDate[0] : fields.expirationDate;
    const priority = Array.isArray(fields.priority) ? fields.priority[0] : fields.priority;
    const notes = Array.isArray(fields.notes) ? fields.notes[0] : fields.notes;

    console.log('Extracted fields:', {
      certificationId,
      certificationName,
      employeeName,
      issueDate,
      expirationDate,
      priority,
      notes
    });

    if (!certificationId || !certificationName || !employeeName || !issueDate || !expirationDate) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Debug: Check what certifications the authenticated user can see
    const { data: debugCerts, error: _debugError } = await supabase
      .from('certifications')
      .select('id, employee_name, certification_name, user_id')
      .limit(5);
    
    console.log('Sample certifications visible to user:', debugCerts);

    // Find the specific certification to verify it exists and belongs to the user
    const { data: targetCert, error: findError } = await supabase
      .from('certifications')
      .select('user_id, id, employee_name, certification_name')
      .eq('id', certificationId)
      .single();

    if (findError) {
      console.error('Error finding certification:', findError);
      return res.status(404).json({ 
        error: 'Certification not found',
        details: `No certification found with ID: ${certificationId}. Error: ${findError.message}`
      });
    }

    console.log('Found certification:', targetCert);

    // Verify the certification belongs to the authenticated user
    if (targetCert.user_id !== user.id) {
      return res.status(403).json({ 
        error: 'Access denied',
        details: 'This certification does not belong to your account'
      });
    }

    // Update the certification
    const updateData: any = {
      certification_name: certificationName,
      employee_name: employeeName,
      issue_date: issueDate,
      expiration_date: expirationDate,
      priority: priority || 'medium',
      notes: notes || null,
      updated_at: new Date().toISOString()
    };

    // Handle file upload if provided
    const file = Array.isArray(files.file) ? files.file[0] : files.file;
    if (file) {
      try {
        // Upload file to Supabase storage
        const fileExt = file.originalFilename?.split('.').pop() || 'pdf';
        const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
        const filePath = `certifications/${fileName}`;

        const fileBuffer = fs.readFileSync(file.filepath);
        
        // Use admin client for storage operations to bypass RLS policies
        const { data: _uploadData, error: uploadError } = await supabaseAdmin.storage
          .from('certifications')
          .upload(filePath, fileBuffer, {
            cacheControl: '3600',
            upsert: false,
            contentType: file.mimetype || 'application/pdf'
          });

        if (uploadError) {
          console.error('File upload error:', uploadError);
          return res.status(500).json({ error: 'Failed to upload file' });
        }

        // Store file path instead of public URL (bucket is private)
        // This path will be used to generate signed URLs when viewing files
        updateData.file_url = filePath;
        updateData.file_name = file.originalFilename || fileName;
        updateData.file_size = file.size;

        // Clean up temporary file
        try {
          fs.unlinkSync(file.filepath);
        } catch (unlinkError) {
          console.warn('Failed to clean up temporary file:', unlinkError);
        }

      } catch (fileError) {
        console.error('File processing error:', fileError);
        return res.status(500).json({ error: 'Failed to process uploaded file' });
      }
    }

    // Update the certification in the database
    const { data: updatedCert, error: updateError } = await supabase
      .from('certifications')
      .update(updateData)
      .eq('id', certificationId)
      .select()
      .single();

    if (updateError) {
      console.error('Database update error:', updateError);
      return res.status(500).json({ 
        error: 'Failed to update certification',
        details: updateError.message
      });
    }

    console.log('Certification updated successfully:', updatedCert);

    return res.status(200).json({
      success: true,
      message: 'Certification updated successfully',
      certification: updatedCert
    });

  } catch (error) {
    console.error('Update certification error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
