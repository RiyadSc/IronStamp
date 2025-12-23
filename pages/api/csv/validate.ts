import { NextApiRequest, NextApiResponse } from 'next'
import { promises as fs } from 'fs'
import path from 'path'
import { createClient } from '@supabase/supabase-js'
import { validateCSRFRequest } from '@/lib/csrf'

interface ValidationError {
  row: number
  field: string
  value: string
  error: string
}

interface ValidationResult {
  validRows: number
  invalidRows: number
  totalEmployees: number
  totalCertifications: number
  errors: ValidationError[]
  preview: any[]
}

// Date validation function
function isValidDate(dateString: string): boolean {
  if (!dateString || dateString.trim() === '') return false
  
  // Try parsing common date formats
  const date = new Date(dateString)
  return !isNaN(date.getTime()) && date.getFullYear() > 1900 && date.getFullYear() < 2100
}

// Email validation function
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Validate a single row of data
function validateRow(row: any, mappings: any[], rowIndex: number): { isValid: boolean, errors: ValidationError[] } {
  const errors: ValidationError[] = []
  let isValid = true

  // Required field mapping
  const requiredFields = ['employee_name', 'employee_email', 'certification_name', 'expiration_date']
  
  mappings.forEach(mapping => {
    if (!mapping.mappedTo) return
    
    const value = row[mapping.csvColumn] || ''
    const fieldName = mapping.mappedTo

    // Check required fields
    if (requiredFields.includes(fieldName) && !value.trim()) {
      errors.push({
        row: rowIndex + 1,
        field: fieldName,
        value: value,
        error: 'Required field is empty'
      })
      isValid = false
    }

    // Validate email format
    if (fieldName === 'employee_email' && value.trim() && !isValidEmail(value)) {
      errors.push({
        row: rowIndex + 1,
        field: fieldName,
        value: value,
        error: 'Invalid email format'
      })
      isValid = false
    }

    // Validate expiration date
    if (fieldName === 'expiration_date' && value.trim() && !isValidDate(value)) {
      errors.push({
        row: rowIndex + 1,
        field: fieldName,
        value: value,
        error: 'Invalid date format'
      })
      isValid = false
    }

    // Validate issue date if provided
    if (fieldName === 'issue_date' && value.trim() && !isValidDate(value)) {
      errors.push({
        row: rowIndex + 1,
        field: fieldName,
        value: value,
        error: 'Invalid date format'
      })
      isValid = false
    }
  })

  return { isValid, errors }
}

// Transform row data based on mappings
function transformRow(row: any, mappings: any[]): any {
  const transformedRow: any = {}
  
  mappings.forEach(mapping => {
    if (mapping.mappedTo) {
      transformedRow[mapping.mappedTo] = row[mapping.csvColumn] || ''
    }
  })

  return transformedRow
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ValidationResult | { error: string }>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Validate CSRF token
  const csrfResult = validateCSRFRequest(req)
  if (!csrfResult.valid) {
    return res.status(403).json({ 
      error: csrfResult.error || 'CSRF validation failed'
    })
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

    const { uploadId, mappings } = req.body

    if (!uploadId || !mappings) {
      return res.status(400).json({ error: 'Missing uploadId or mappings' })
    }

    // Load the uploaded data
    const tempDir = './tmp/uploads'
    const dataFilePath = path.join(tempDir, `${uploadId}.json`)
    
    let uploadData
    try {
      const fileContent = await fs.readFile(dataFilePath, 'utf-8')
      uploadData = JSON.parse(fileContent)
    } catch {
      return res.status(404).json({ error: 'Upload data not found' })
    }

    const { rows } = uploadData
    const validationResults: ValidationResult = {
      validRows: 0,
      invalidRows: 0,
      totalEmployees: 0,
      totalCertifications: 0,
      errors: [],
      preview: []
    }

    const uniqueEmployees = new Set<string>()
    const processedRows: any[] = []

    // Validate each row
    rows.forEach((row: any, index: number) => {
      const { isValid, errors } = validateRow(row, mappings, index)
      const transformedRow = transformRow(row, mappings)
      
      // Add status to row
      transformedRow.status = isValid ? 'valid' : 'error'
      transformedRow.row_index = index + 1

      if (isValid) {
        validationResults.validRows++
        
        // Count unique employees
        if (transformedRow.employee_email) {
          uniqueEmployees.add(transformedRow.employee_email.toLowerCase())
        }
        
        // Count certifications
        if (transformedRow.certification_name) {
          validationResults.totalCertifications++
        }
      } else {
        validationResults.invalidRows++
        validationResults.errors.push(...errors)
      }

      processedRows.push(transformedRow)
    })

    validationResults.totalEmployees = uniqueEmployees.size
    validationResults.preview = processedRows.slice(0, 5) // First 5 rows for preview

    res.status(200).json(validationResults)

  } catch (error) {
    console.error('Validation error:', error)
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Validation failed' 
    })
  }
}
