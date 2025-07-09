import { NextApiRequest, NextApiResponse } from 'next'
import { promises as fs } from 'fs'
import path from 'path'
import { createClient } from '@supabase/supabase-js'

interface ImportResult {
  success: boolean
  employeesCreated: number
  certificationsCreated: number
  errors: string[]
  message: string
}

// Date validation and parsing function
function parseDate(dateString: string): string | null {
  if (!dateString || dateString.trim() === '') return null
  
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return null
  
  return date.toISOString().split('T')[0] // Return YYYY-MM-DD format
}

// Email validation function
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Transform and validate row for database insertion
function transformRowForDatabase(row: any, mappings: any[]): any {
  const transformedRow: any = {}
  
  mappings.forEach(mapping => {
    if (mapping.mappedTo) {
      let value = row[mapping.csvColumn] || ''
      
      // Special handling for dates
      if (mapping.mappedTo === 'expiration_date' || mapping.mappedTo === 'issue_date') {
        value = parseDate(value)
      }
      
      // Clean up strings
      if (typeof value === 'string') {
        value = value.trim()
      }
      
      transformedRow[mapping.mappedTo] = value
    }
  })
  
  return transformedRow
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ImportResult | { error: string }>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { uploadId, mappings, importOnlyValid = true } = req.body

    if (!uploadId || !mappings) {
      return res.status(400).json({ error: 'Missing uploadId or mappings' })
    }

    // Create Supabase client for server-side operations
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
    
    // Get user ID from request body (passed from frontend)
    const { userId } = req.body
    
    if (!userId) {
      return res.status(401).json({ error: 'User ID required' })
    }
    
    // Verify user exists (using service role to bypass RLS)
    const { data: userProfile, error: userError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single()
    
    if (userError || !userProfile) {
      return res.status(401).json({ error: 'Invalid user' })
    }
    
    // Create user object for consistency with existing code
    const user = { id: userId }

    // Load the uploaded data
    const tempDir = './tmp/uploads'
    const dataFilePath = path.join(tempDir, `${uploadId}.json`)
    
    let uploadData
    try {
      const fileContent = await fs.readFile(dataFilePath, 'utf-8')
      uploadData = JSON.parse(fileContent)
    } catch (error) {
      return res.status(404).json({ error: 'Upload data not found' })
    }

    const { rows } = uploadData
    const importResult: ImportResult = {
      success: false,
      employeesCreated: 0,
      certificationsCreated: 0,
      errors: [],
      message: ''
    }

    // Required field mapping
    const requiredFields = ['employee_name', 'employee_email', 'certification_name', 'expiration_date']
    
    // Validate and transform data
    const validRows: any[] = []
    const employeeMap = new Map<string, any>()
    
    rows.forEach((row: any, index: number) => {
      const transformedRow = transformRowForDatabase(row, mappings)
      
      // Validate required fields
      let isValid = true
      requiredFields.forEach(field => {
        if (!transformedRow[field] || transformedRow[field].trim() === '') {
          isValid = false
        }
      })
      
      // Validate email
      if (transformedRow.employee_email && !isValidEmail(transformedRow.employee_email)) {
        isValid = false
      }
      
      // Only process valid rows if importOnlyValid is true
      if (isValid || !importOnlyValid) {
        validRows.push({
          ...transformedRow,
          row_index: index + 1,
          user_id: user.id
        })
        
        // Track unique employees
        if (transformedRow.employee_email) {
          const emailKey = transformedRow.employee_email.toLowerCase()
          if (!employeeMap.has(emailKey)) {
            employeeMap.set(emailKey, {
              name: transformedRow.employee_name,
              email: transformedRow.employee_email,
              department: transformedRow.department || null,
              user_id: user.id
            })
          }
        }
      }
    })

    if (validRows.length === 0) {
      return res.status(400).json({ error: 'No valid rows to import' })
    }

    // Start database transaction
    try {
      // 1. Insert employees first
      const employees = Array.from(employeeMap.values())
      let employeesInserted = 0
      
      if (employees.length > 0) {
        const { data: insertedEmployees, error: employeeError } = await supabase
          .from('employees')
          .upsert(employees, { 
            onConflict: 'email,user_id',
            ignoreDuplicates: false 
          })
          .select('id, email')
        
        if (employeeError) {
          throw new Error(`Employee insert failed: ${employeeError.message}`)
        }
        
        employeesInserted = employees.length
        importResult.employeesCreated = employeesInserted
        
        // Create email to ID mapping
        const emailToIdMap = new Map<string, string>()
        if (insertedEmployees) {
          insertedEmployees.forEach((emp: any) => {
            emailToIdMap.set(emp.email.toLowerCase(), emp.id)
          })
        }
        
        // 2. Insert certifications
        const certifications = validRows.map(row => ({
          employee_id: emailToIdMap.get(row.employee_email.toLowerCase()),
          employee_name: row.employee_name, // Keep for backward compatibility
          certification_name: row.certification_name, // Use existing field name
          certification_number: row.certification_number || null,
          issue_date: row.issue_date || null,
          expiration_date: row.expiration_date,
          issuing_authority: row.issuing_authority || null,
          notes: row.notes || null,
          status: row.status || 'active',
          priority: 'medium', // Default priority for bulk imports
          file_url: '', // Empty for bulk imports
          file_name: '', // Empty for bulk imports  
          file_size: 0, // Zero for bulk imports
          extraction_confidence: null, // Not applicable for manual imports
          user_id: user.id
        })).filter(cert => cert.employee_id) // Only include certs with valid employee IDs
        
        if (certifications.length > 0) {
          const { data: insertedCerts, error: certError } = await supabase
            .from('certifications')
            .insert(certifications)
            .select('id')
          
          if (certError) {
            throw new Error(`Certification insert failed: ${certError.message}`)
          }
          
          importResult.certificationsCreated = certifications.length
        }
      }
      
      // Clean up temporary file
      try {
        await fs.unlink(dataFilePath)
      } catch (cleanupError) {
        console.warn('Failed to clean up temp file:', cleanupError)
      }
      
      importResult.success = true
      importResult.message = `Successfully imported ${importResult.employeesCreated} employees and ${importResult.certificationsCreated} certifications`
      
      res.status(200).json(importResult)
      
    } catch (dbError) {
      console.error('Database import error:', dbError)
      importResult.errors.push(dbError instanceof Error ? dbError.message : 'Database error')
      res.status(500).json({ error: 'Database import failed' })
    }

  } catch (error) {
    console.error('Import error:', error)
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Import failed' 
    })
  }
} 