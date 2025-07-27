import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import formidable from 'formidable';
import fs from 'fs';
import csv from 'csv-parser';
import { csrfMiddleware } from '@/lib/csrf';

// Disable default body parser to handle multipart/form-data
export const config = {
  api: {
    bodyParser: false,
  },
};

interface CSVRow {
  employee_name: string;
  certification_name: string;
  issue_date?: string;
  expiration_date: string;
  priority?: string;
  notes?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Apply CSRF protection
  csrfMiddleware(req, res, async () => {
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

      // Parse form data
      const form = formidable({
        maxFileSize: 5 * 1024 * 1024, // 5MB limit
        uploadDir: './tmp',
        keepExtensions: true,
      });

      const [fields, files] = await form.parse(req);
      
      const file = Array.isArray(files.file) ? files.file[0] : files.file;
      if (!file) {
        return res.status(400).json({ error: 'No CSV file uploaded' });
      }

      // Validate file type
      if (!file.mimetype?.includes('csv') && !file.originalFilename?.endsWith('.csv')) {
        return res.status(400).json({ error: 'Invalid file type. Only CSV files are allowed.' });
      }

      // Read and parse CSV file
      const results: any[] = [];
      const errors: string[] = [];
      let rowNumber = 0;

      return new Promise((resolve, reject) => {
        fs.createReadStream(file.filepath)
          .pipe(csv())
          .on('data', (data: CSVRow) => {
            rowNumber++;
            
            // Validate required fields
            if (!data.employee_name || !data.certification_name || !data.expiration_date) {
              errors.push(`Row ${rowNumber}: Missing required fields (employee_name, certification_name, expiration_date)`);
              return;
            }

            // Validate date format
            const expirationDate = new Date(data.expiration_date);
            if (isNaN(expirationDate.getTime())) {
              errors.push(`Row ${rowNumber}: Invalid expiration_date format`);
              return;
            }

            results.push({
              employee_name: data.employee_name.trim(),
              certification_name: data.certification_name.trim(),
              issue_date: data.issue_date ? new Date(data.issue_date).toISOString().split('T')[0] : null,
              expiration_date: expirationDate.toISOString().split('T')[0],
              priority: data.priority?.toLowerCase() || 'medium',
              notes: data.notes?.trim() || null,
              user_id: user.id,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
          })
          .on('end', async () => {
            try {
              // Clean up temporary file
              fs.unlinkSync(file.filepath);

              if (errors.length > 0) {
                return resolve(res.status(400).json({ 
                  error: 'CSV validation failed', 
                  errors,
                  validRows: results.length 
                }));
              }

              if (results.length === 0) {
                return resolve(res.status(400).json({ error: 'No valid data found in CSV file' }));
              }

              // Insert certifications into database
              const { data: insertedCerts, error: insertError } = await supabase
                .from('certifications')
                .insert(results)
                .select();

              if (insertError) {
                console.error('Database insert error:', insertError);
                return resolve(res.status(500).json({ 
                  error: 'Failed to insert certifications',
                  details: insertError.message 
                }));
              }

              return resolve(res.status(200).json({
                success: true,
                message: `Successfully imported ${insertedCerts?.length || 0} certifications`,
                count: insertedCerts?.length || 0,
                certifications: insertedCerts
              }));

            } catch (error) {
              console.error('CSV processing error:', error);
              return resolve(res.status(500).json({ error: 'Internal server error' }));
            }
          })
          .on('error', (error: Error) => {
            console.error('CSV parsing error:', error);
            return resolve(res.status(500).json({ error: 'Failed to parse CSV file' }));
          });
      });

    } catch (error) {
      console.error('CSV upload error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });
} 