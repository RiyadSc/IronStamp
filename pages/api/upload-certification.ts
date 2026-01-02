import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import formidable from 'formidable';
import fs from 'fs';
import { validateCSRFRequest } from '@/lib/csrf';

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
  issueDate?: string;
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

/**
 * Normalize certification name for matching
 * Removes state prefixes, standardizes formatting
 */
function normalizeCertificationName(name: string): string {
  if (!name) return '';
  
  // Convert to lowercase and trim
  let normalized = name.toLowerCase().trim();
  
  // Remove common state prefixes
  const statePrefixes = [
    'massachusetts', 'mass', 'ma',
    'california', 'calif', 'ca',
    'new york', 'ny',
    'texas', 'tx',
    'florida', 'fl',
    // Add more states as needed
  ];
  
  for (const prefix of statePrefixes) {
    // Remove state prefix at the beginning
    const regex = new RegExp(`^${prefix}\\s+`, 'i');
    normalized = normalized.replace(regex, '');
  }
  
  // Remove extra whitespace
  normalized = normalized.replace(/\s+/g, ' ').trim();
  
  // Remove common suffixes that don't affect matching
  normalized = normalized.replace(/\s*(license|lic|certification|cert|certificate)$/i, '').trim();
  
  return normalized;
}

/**
 * Check if two certification names are similar enough to be considered the same
 */
function areCertificationNamesSimilar(name1: string, name2: string): boolean {
  const normalized1 = normalizeCertificationName(name1);
  const normalized2 = normalizeCertificationName(name2);
  
  // Exact match after normalization
  if (normalized1 === normalized2) return true;
  
  // Check if one contains the other (for cases like "Refrigeration Technician License" vs "Refrigeration Technician")
  if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) {
    // Only consider it a match if the shorter one is at least 70% of the longer one
    const shorter = normalized1.length < normalized2.length ? normalized1 : normalized2;
    const longer = normalized1.length >= normalized2.length ? normalized1 : normalized2;
    return shorter.length / longer.length >= 0.7;
  }
  
  return false;
}

/**
 * Find existing certification that matches the new one
 */
async function findExistingCertification(
  employeeName: string,
  certificationName: string,
  userId: string
): Promise<any | null> {
  try {
    // Get all certifications for this user
    const { data: existingCerts, error } = await supabaseAdmin
      .from('certifications')
      .select('id, employee_name, certification_name, file_url, expiration_date')
      .eq('user_id', userId)
      .neq('status', 'suspended');
    
    if (error) {
      console.error('Error fetching existing certifications:', error);
      return null;
    }
    
    if (!existingCerts || existingCerts.length === 0) {
      return null;
    }
    
    // Normalize employee name for comparison (case-insensitive)
    const normalizedEmployeeName = employeeName.toLowerCase().trim();
    
    // Find matching certification
    for (const cert of existingCerts) {
      // Check if employee name matches (case-insensitive)
      const existingEmployeeName = (cert.employee_name || '').toLowerCase().trim();
      if (existingEmployeeName !== normalizedEmployeeName) {
        continue;
      }
      
      // Check if certification names are similar
      if (areCertificationNamesSimilar(cert.certification_name || '', certificationName)) {
        return cert;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error finding existing certification:', error);
    return null;
  }
}

// Helper function to extract JSON from OpenAI response that might be wrapped in markdown
function extractJsonFromResponse(content: string): any {
  try {
    // First try direct JSON parsing
    return JSON.parse(content.trim());
  } catch {
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
Analyze this certification document carefully, paying attention to BOTH text content AND visual elements (logos, seals, watermarks, design patterns). Extract the following information in JSON format:

{
  "employeeName": "Full name of the certificate holder",
  "certificationName": "Complete name/type of the certification including state if mentioned (e.g., 'Massachusetts Refrigeration Technician License' or 'EPA 608 Universal')",
  "issueDate": "Issue date in YYYY-MM-DD format (if available, use null if not found)",
  "expirationDate": "Expiration date in YYYY-MM-DD format",
  "confidence": "Your confidence level (0.0 to 1.0) in the extracted data"
}

CRITICAL EXTRACTION INSTRUCTIONS:

1. VISUAL IDENTIFICATION - Look for visual indicators to identify certification type:
   - State seals/logos (e.g., Massachusetts state seal, California state seal)
   - Agency logos (e.g., EPA logo, OSHA logo, NATE logo)
   - Department names in headers (e.g., "Massachusetts Department of Public Safety", "Bureau of Pipefitters")
   - Watermarks or background designs that indicate the issuing authority
   - Color schemes and design patterns typical of specific certifications
   - License number prefixes (e.g., "RT-" for Refrigeration Technician, "EPA-" for EPA certifications)
   
   If you see a Massachusetts state seal or "Massachusetts Department" text, include "Massachusetts" in the certification name.
   If you see EPA logos or branding, include "EPA" in the certification name.
   If you see OSHA logos, include "OSHA" in the certification name.

2. Employee Name: Look for the certificate holder's name, often labeled as:
   - "Name:", "Holder:", "Licensee:", "Certificate Holder:"
   - May appear prominently near the top or center of the document
   - Could be near a photo area or license number

3. Certification Name: Extract the complete certification type including:
   - State name if visual elements indicate a state license (e.g., state seal, state department name)
   - Full certification designation from text (e.g., "REFRIGERATION TECHNICIAN LICENSE", "EPA 608 Universal")
   - Combine visual clues with text to form the complete name
   - Examples: "Massachusetts Refrigeration Technician License", "EPA 608 Universal Certification", "OSHA 30-Hour Construction Safety"

4. Issue Date: Look VERY carefully for dates labeled as:
   - "Issue Date:", "Issued:", "Date Issued:", "Effective Date:", "Date of Issue:"
   - "Issued On:", "License Date:", "Certification Date:", "Date Certified:"
   - May appear in smaller text, near the license number, or in a dedicated section
   - Often appears on the same line or near the expiration date
   - Convert any date format to YYYY-MM-DD:
     * "December 31, 2025" → "2025-12-31"
     * "12/31/2025" → "2025-12-31"
     * "31-12-2025" → "2025-12-31"
     * "Dec 31, 2025" → "2025-12-31"
   - If no issue date is visible anywhere on the document after thorough examination, use null (not an empty string)

5. Expiration Date: Look for dates labeled as:
   - "Expiration Date:", "Expires:", "Expiry Date:", "Valid Until:", "Renewal Date:"
   - "Expires On:", "Valid Through:", "Renewal Required By:", "Valid Until:"
   - Convert any date format to YYYY-MM-DD

6. Date Format Conversion Examples:
   - "01/15/2024" → "2024-01-15"
   - "January 15, 2024" → "2024-01-15"
   - "15-01-2024" → "2024-01-15"
   - "01/15/24" → "2024-01-15" (assume 20xx for 2-digit years)
   - "Dec 31, 2025" → "2025-12-31"
   - "December 31, 2025" → "2025-12-31"

7. License/Certification Numbers: These can help identify the type:
   - "RT-" prefix often indicates Refrigeration Technician
   - "EPA-" or numbers with EPA context indicate EPA certifications
   - State-specific prefixes indicate state licenses

IMPORTANT: 
- Examine the ENTIRE document including headers, footers, watermarks, seals, and all visual elements
- Use visual clues (logos, seals, design) combined with text to accurately identify certification type
- Issue dates are often present but may be in smaller text - look carefully near license numbers or expiration dates
- If you see "Issue Date:" or similar label, there is almost always a date following it - extract it carefully
- Return only valid JSON without any additional text or markdown formatting
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
        max_tokens: 800,
        temperature: 0.1
      });
      content = response.choices[0]?.message?.content;
    } else {
      // Use Vision API for images with HIGH detail for better text recognition
      // High detail is essential for reading small text like issue dates, license numbers, and seals
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
                  url: `data:${fileType};base64,${base64File}`,
                  detail: "high" // Use high detail for certification documents to read small text, seals, and logos
                }
              }
            ]
          }
        ],
        max_tokens: 800,
        temperature: 0.1
      });
      content = response.choices[0]?.message?.content;
    }

    if (!content) {
      throw new Error('No response from AI service');
    }


    // Use robust JSON extraction instead of direct JSON.parse
    const extractedData = extractJsonFromResponse(content);
    
    // Validate required fields
    if (!extractedData.employeeName || !extractedData.certificationName || !extractedData.expirationDate) {
      throw new Error('Could not extract required certification data');
    }

    // Normalize issue date - handle null, empty string, or invalid dates
    let issueDate = extractedData.issueDate;
    
    if (issueDate === null || issueDate === 'null' || issueDate === '' || issueDate === undefined) {
      issueDate = undefined;
    } else {
      // Validate date format
      const dateObj = new Date(issueDate);
      if (isNaN(dateObj.getTime())) {
        issueDate = undefined;
      } else {
        // Ensure YYYY-MM-DD format
        issueDate = dateObj.toISOString().split('T')[0];
      }
    }

    // Calculate priority
    const priority = calculatePriority(extractedData.expirationDate);

    return {
      employeeName: extractedData.employeeName,
      certificationName: extractedData.certificationName,
      issueDate: issueDate,
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

    const { data: _data, error } = await supabaseAdmin.storage
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

    // Return the file path instead of public URL (bucket is private)
    // This path will be stored in the database and used to generate signed URLs later
    return filePath;
  } catch (error) {
    console.error('File upload error:', error);
    throw new Error('Failed to upload file');
  }
}

async function saveCertificationToDatabase(
  data: CertificationData,
  filePath: string,
  fileName: string,
  fileSize: number,
  userId: string
): Promise<{ id: string; isUpdate: boolean }> {
  try {
    // Check if an existing certification matches
    const existingCert = await findExistingCertification(
      data.employeeName,
      data.certificationName,
      userId
    );
    
    if (existingCert) {
      // Update existing certification
      console.log(`Updating existing certification ${existingCert.id} instead of creating new one`);
      
      // Delete old file from storage if it exists
      if (existingCert.file_url) {
        try {
          // Extract file path from stored file_url
          // Handle both old public URLs and new path format
          let oldFilePath = existingCert.file_url;
          
          // If it's a full URL, extract the path
          if (oldFilePath.startsWith('http')) {
            // Try to extract path from URL
            const urlMatch = oldFilePath.match(/certifications\/(certifications\/)?(.+)$/);
            if (urlMatch) {
              oldFilePath = `certifications/${urlMatch[2] || urlMatch[1]}`;
            } else {
              // Fallback: try to get last two parts
              const parts = oldFilePath.split('/').filter((p: string) => p);
              if (parts.length >= 2) {
                oldFilePath = `${parts[parts.length - 2]}/${parts[parts.length - 1]}`;
              }
            }
          }
          
          // Ensure it starts with 'certifications/'
          if (!oldFilePath.startsWith('certifications/')) {
            oldFilePath = `certifications/${oldFilePath}`;
          }
          
          await supabaseAdmin.storage.from('certifications').remove([oldFilePath]);
        } catch (storageError) {
          console.warn('Failed to delete old file from storage:', storageError);
          // Continue with update even if old file deletion fails
        }
      }
      
      // Update the existing record
      const updateData: any = {
        certification_name: data.certificationName, // Update with the new name (might have state prefix now)
        expiration_date: data.expirationDate,
        issue_date: data.issueDate || null,
        priority: data.priority,
        file_url: filePath, // Store file path instead of public URL
        file_name: fileName,
        file_size: fileSize,
        extraction_confidence: data.confidence,
        updated_at: new Date().toISOString()
      };
      
      const { data: updatedData, error: updateError } = await supabaseAdmin
        .from('certifications')
        .update(updateData)
        .eq('id', existingCert.id)
        .select()
        .single();
      
      if (updateError) {
        console.error('Database update error:', updateError);
        throw new Error('Failed to update certification in database');
      }
      
      return { id: updatedData.id, isUpdate: true };
    } else {
      // Create new certification
      const certificationRecord = {
        user_id: userId,
        employee_name: data.employeeName,
        certification_name: data.certificationName,
        issue_date: data.issueDate || null,
        expiration_date: data.expirationDate,
        priority: data.priority,
        file_url: filePath, // Store file path instead of public URL
        file_name: fileName,
        file_size: fileSize,
        extraction_confidence: data.confidence
      };

      const { data: insertedData, error: insertError } = await supabaseAdmin
        .from('certifications')
        .insert([certificationRecord])
        .select()
        .single();

      if (insertError) {
        console.error('Database insert error:', insertError);
        throw new Error('Failed to save certification to database');
      }

      return { id: insertedData.id, isUpdate: false };
    }
  } catch (error) {
    console.error('Database save error:', error);
    throw new Error('Failed to save certification data');
  }
}

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

    const [_fields, files] = await form.parse(req);
    
    const file = Array.isArray(files.file) ? files.file[0] : files.file;

    if (!file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    // Step 1: Extract data using AI
    const extractedData = await extractDataWithAI(file);

    // Step 2: Upload file to storage
    const filePath = await uploadFileToStorage(file);

    try {
      // Step 3: Save to database using authenticated user's ID (or update if exists)
      const result = await saveCertificationToDatabase(
        extractedData,
        filePath,
        file.originalFilename || 'certification',
        file.size,
        user.id
      );

      // Clean up temporary file
      fs.unlinkSync(file.filepath);

      return res.status(200).json({
        id: result.id,
        filePath, // Return file path instead of URL
        isUpdate: result.isUpdate,
        message: result.isUpdate 
          ? 'Certification updated successfully' 
          : 'Certification created successfully',
        ...extractedData
      });

    } catch (dbError) {
      // If database save fails, clean up uploaded file
      try {
        // filePath is already in the correct format (certifications/filename)
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
}
