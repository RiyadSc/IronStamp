import { NextApiRequest, NextApiResponse } from 'next'
import formidable from 'formidable'
import { promises as fs } from 'fs'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

// Disable body parser for file uploads
export const config = {
  api: {
    bodyParser: false,
  },
}

interface ParsedData {
  columns: string[]
  preview: any[]
  totalRows: number
  uploadId: string
}

// Simple CSV parser function
function parseCSV(content: string): { headers: string[], rows: any[] } {
  const lines = content.split('\n').filter(line => line.trim())
  if (lines.length === 0) throw new Error('Empty file')
  
  const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''))
  const rows = lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim().replace(/^["']|["']$/g, ''))
    const row: any = {}
    headers.forEach((header, index) => {
      row[header] = values[index] || ''
    })
    return row
  })
  
  return { headers, rows }
}

// Basic Excel parsing (for .xlsx files)
function parseExcel(content: Buffer): { headers: string[], rows: any[] } {
  // For now, we'll throw an error and ask the user to convert to CSV
  // In a real implementation, you'd use a library like 'xlsx'
  throw new Error('Excel files not yet supported. Please convert to CSV format.')
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ParsedData | { error: string }>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Ensure upload directories exist
    const uploadDir = path.join(process.cwd(), 'tmp')
    const dataDir = path.join(process.cwd(), 'tmp', 'uploads')
    
    await fs.mkdir(uploadDir, { recursive: true })
    await fs.mkdir(dataDir, { recursive: true })

    // Parse the uploaded file
    const form = formidable({
      uploadDir: uploadDir,
      keepExtensions: true,
      maxFileSize: 10 * 1024 * 1024, // 10MB limit
    })

    const [fields, files] = await form.parse(req)
    const file = Array.isArray(files.file) ? files.file[0] : files.file

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    // Validate file type
    const fileName = file.originalFilename || ''
    const fileExtension = path.extname(fileName).toLowerCase()
    
    if (!['.csv', '.xlsx', '.xls'].includes(fileExtension)) {
      return res.status(400).json({ error: 'Only CSV and Excel files are supported' })
    }

    // Read file content using the actual file path from formidable
    let fileContent: Buffer
    try {
      fileContent = await fs.readFile(file.filepath)
    } catch (readError) {
      console.error('Error reading uploaded file:', readError)
      throw new Error(`Failed to read uploaded file: ${readError instanceof Error ? readError.message : 'Unknown error'}`)
    }
    
    let parsedData: { headers: string[], rows: any[] }

    // Parse based on file type
    if (fileExtension === '.csv') {
      parsedData = parseCSV(fileContent.toString('utf-8'))
    } else {
      // For Excel files, we'd use a proper library like 'xlsx'
      parsedData = parseExcel(fileContent)
    }

    // Generate unique upload ID
    const uploadId = uuidv4()
    
    // Store the parsed data temporarily
    const dataFilePath = path.join(dataDir, `${uploadId}.json`)
    await fs.writeFile(dataFilePath, JSON.stringify({
      originalFileName: fileName,
      headers: parsedData.headers,
      rows: parsedData.rows,
      uploadedAt: new Date().toISOString()
    }))

    // Clean up original uploaded file
    try {
      await fs.unlink(file.filepath)
    } catch (unlinkError) {
      console.warn('Failed to clean up uploaded file:', unlinkError)
      // Don't fail the request if we can't clean up
    }

    // Return preview data
    const preview = parsedData.rows.slice(0, 5) // First 5 rows for preview
    
    res.status(200).json({
      columns: parsedData.headers,
      preview,
      totalRows: parsedData.rows.length,
      uploadId
    })

  } catch (error) {
    console.error('Upload error:', error)
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Upload failed' 
    })
  }
} 