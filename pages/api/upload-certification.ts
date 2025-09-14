import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import formidable from 'formidable';
import fs from 'fs';
import { csrfMiddleware } from '@/lib/csrf';

// Initialize OpenAI (server-side only)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// Initialize Supabase admin client with service role for server-side operations
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

export const config = {
  api: {
    bodyParser: false, // Disable built-in body parser for file uploads
  },
};

interface CertificationData {
  employeeName: string;
  certificationName: string;
  expirationDate: string;
  priority: 'low' | 'medium' | 'high';
  confidence: number;
}

function calculatePriority(expirationDate: string): 'low' | 'medium' | 'high' {
  const expDate = new Date(expirationDate);
  const today = new Date();
  const diffTime = expDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays <= 30) return 'high';
  if (diffDays <= 90) return 'medium';
  return 'low';
}

// Helper function to extract JSON from OpenAI response that might be wrapped in markdown
function extractJsonFromResponse(content: string): any {
  try {
    // First try direct JSON parsing
    return JSON.parse(content.trim());
  } catch (error) {
    // If direct parsing fails, try to extract JSON from markdown code blocks
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1].trim());
      } catch (nestedError) {
        console.error('Failed to parse extracted JSON:', nestedError);
        throw new Error('Invalid JSON format in AI response');
      }
    }
    
    // Try to find JSON-like content without markdown
    const jsonRegex = /\{[\s\S]*\}/;
    const jsonContent = content.match(jsonRegex);
    if (jsonContent) {
      try {
        return JSON.parse(jsonContent[0]);
      } catch (nestedError) {
        console.error('Failed to parse JSON content:', nestedError);
        throw new Error('Invalid JSON format in AI response');
      }
    }
    
    console.error('No valid JSON found in response:', content);
    throw new Error('No valid JSON found in AI response');
  }
}

async function extractDataWithAI(file: formidable.File): Promise<CertificationData> {
  try {
    // Read file and convert to base64
    const fileBuffer = fs.readFileSync(file.filepath);
    const base64File = fileBuffer.toString('base64');
    
    const fileType = file.mimetype || 'application/pdf';

    const prompt = `
Analyze this certification document and extract the following information in JSON format:

{
  "employeeName": "Full name of the certificate holder",
  "certificationName": "Name/type of the certification",
  "issueDate": "Issue date in YYYY-MM-DD format (if available)",
  "expirationDate": "Expiration date in YYYY-MM-DD format",
  "confidence": "Your confidence level (0.0 to 1.0) in the extracted data"
}

Look for:
- Employee/Certificate holder name
- Certification type (EPA, OSHA, NATE, etc.)
- Expiration date or renewal date
- Issue date (if visible)

If any information is unclear or not found, use your best judgment and adjust confidence accordingly.
Return only valid JSON without any additional text or markdown formatting.
`;

    // Use OpenAI's new native PDF support for PDFs, Vision API for images
    const isPDF = fileType === 'application/pdf' || fileType === 'application/msword' || 
                  fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    
    let content;
    
    if (isPDF) {
      // Use native PDF support with the correct format
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: prompt
              },
              {
                type: "file",
                file: {
                  file_data: `data:${fileType};base64,${base64File}`,
                  filename: file.originalFilename || "certification.pdf"
                }
              }
            ]
          }
        ],
        max_tokens: 500,
        temperature: 0.1
      });
      content = response.choices[0]?.message?.content;
    } else {
      // Use Vision API for images
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: prompt
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${fileType};base64,${base64File}`
                }
              }
            ]
          }
        ],
        max_tokens: 500,
        temperature: 0.1
      });
      content = response.choices[0]?.message?.content;
    }

    if (!content) {
      throw new Error('No response from AI service');
    }

    console.log('AI Response content:', content); // Debug log to see the actual response

    // Use robust JSON extraction instead of direct JSON.parse
    const extractedData = extractJsonFromResponse(content);
    
    // Validate required fields
    if (!extractedData.employeeName || !extractedData.certificationName || !extractedData.expirationDate) {
      throw new Error('Could not extract required certification data');
    }

    // Calculate priority
    const priority = calculatePriority(extractedData.expirationDate);

    return {
      employeeName: extractedData.employeeName,
      certificationName: extractedData.certificationName,
      expirationDate: extractedData.expirationDate,
      priority,
      confidence: extractedData.confidence || 0.8
    };

  } catch (error) {
    console.error('AI extraction error:', error);
    throw new Error('Failed to extract data from document. Please try again or enter data manually.');
  }
}

async function uploadFileToStorage(file: formidable.File): Promise<string> {
  try {
    const fileExt = file.originalFilename?.split('.').pop() || 'pdf';
    const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
    const filePath = `certifications/${fileName}`;

    // Read file buffer
    const fileBuffer = fs.readFileSync(file.filepath);

    const { data, error } = await supabaseAdmin.storage
      .from('certifications')
      .upload(filePath, fileBuffer, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.mimetype || 'application/pdf'
      });

    if (error) {
      console.error('Storage upload error:', error);
      throw new Error('Failed to upload file to storage');
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('certifications')
      .getPublicUrl(filePath);

    return publicUrl;
  } catch (error) {
    console.error('File upload error:', error);
    throw new Error('Failed to upload file');
  }
}

async function saveCertificationToDatabase(
  data: CertificationData,
  fileUrl: string,
  fileName: string,
  fileSize: number,
  userId: string
): Promise<string> {
  try {
    const certificationRecord = {
      user_id: userId,
      employee_name: data.employeeName,
      certification_name: data.certificationName,
      expiration_date: data.expirationDate,
      priority: data.priority,
      file_url: fileUrl,
      file_name: fileName,
      file_size: fileSize,
      extraction_confidence: data.confidence
    };

    const { data: insertedData, error } = await supabaseAdmin
      .from('certifications')
      .insert([certificationRecord])
      .select()
      .single();

    if (error) {
      console.error('Database insert error:', error);
      throw new Error('Failed to save certification to database');
    }

    return insertedData.id;
  } catch (error) {
    console.error('Database save error:', error);
    throw new Error('Failed to save certification data');
  }
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

      // Parse the form data
      const form = formidable({
        maxFileSize: parseInt(process.env.NEXT_PUBLIC_MAX_FILE_SIZE || '20971520'),
        filter: (part) => {
          const { mimetype } = part;
          const allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'image/jpeg',
            'image/png'
          ];
          return allowedTypes.includes(mimetype || '');
        }
      });

      const [fields, files] = await form.parse(req);
      
      const file = Array.isArray(files.file) ? files.file[0] : files.file;

      if (!file) {
        return res.status(400).json({ error: 'No file provided' });
      }

      // Step 1: Extract data using AI
      const extractedData = await extractDataWithAI(file);

      // Step 2: Upload file to storage
      const fileUrl = await uploadFileToStorage(file);

      try {
        // Step 3: Save to database using authenticated user's ID
        const certificationId = await saveCertificationToDatabase(
          extractedData,
          fileUrl,
          file.originalFilename || 'certification',
          file.size,
          user.id
        );

        // Clean up temporary file
        fs.unlinkSync(file.filepath);

        return res.status(200).json({
          id: certificationId,
          fileUrl,
          ...extractedData
        });

      } catch (dbError) {
        // If database save fails, clean up uploaded file
        try {
          const filePath = fileUrl.split('/').slice(-2).join('/');
          await supabaseAdmin.storage.from('certifications').remove([filePath]);
        } catch (cleanupError) {
          console.error('Cleanup failed:', cleanupError);
        }
        
        // Clean up temporary file
        fs.unlinkSync(file.filepath);
        throw dbError;
      }

    } catch (error) {
      console.error('Upload certification error:', error);
      return res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Upload failed. Please try again.' 
      });
    }
  });
} 