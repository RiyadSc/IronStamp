import { useState, useCallback, useRef } from 'react'
import { useDropzone } from 'react-dropzone'
import * as XLSX from 'xlsx'
import { 
  ArrowLeft, 
  Users, 
  Upload, 
  FileSpreadsheet, 
  ClipboardPaste, 
  UserPlus, 
  AlertCircle, 
  CheckCircle, 
  X, 
  Edit2, 
  Trash2,
  Plus,
  FastForward,
  Mail,
  Phone,
  Briefcase,
  Loader2
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { OnboardingData } from './index'
import { isDevModeEnabled } from '@/lib/dev-mode'

interface TeamRosterStepProps {
  initialData: OnboardingData
  onComplete: (teamMembers: TeamMember[]) => void
  onBack: () => void
  saving: boolean
}

export interface TeamMember {
  id: string
  name: string
  email: string
  phone: string
  role: string // Allow any role (custom or preset)
  isValid: boolean
  issues: string[]
}

type ImportMethod = 'none' | 'spreadsheet' | 'paste' | 'manual'

// Common HVAC roles as suggestions
const rolePresets = [
  'Technician',
  'Lead Technician',
  'Senior Technician',
  'Service Technician',
  'Install Technician',
  'Apprentice',
  'Journeyman',
  'Master Technician',
  'Field Supervisor',
  'Service Manager',
  'Operations Manager',
  'Owner',
  'Office Staff',
  'Dispatcher'
]

// Smart text parser - handles various formats
function parseTeamText(text: string): Partial<TeamMember>[] {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0)
  const results: Partial<TeamMember>[] = []
  
  for (const line of lines) {
    // Skip header-like lines
    if (line.toLowerCase().includes('name') && line.toLowerCase().includes('email')) continue
    if (line.match(/^[-=]+$/)) continue
    
    const member: Partial<TeamMember> = {
      id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: '',
      email: '',
      phone: '',
      role: 'Technician',
      isValid: true,
      issues: []
    }
    
    // Extract email (most reliable pattern)
    const emailMatch = line.match(/[\w.-]+@[\w.-]+\.\w+/)
    if (emailMatch) {
      member.email = emailMatch[0].toLowerCase()
    }
    
    // Extract phone number (various formats)
    const phoneMatch = line.match(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/)
    if (phoneMatch) {
      member.phone = phoneMatch[0]
    }
    
    // Extract name (what's left after removing email and phone)
    let nameCandidate = line
      .replace(emailMatch?.[0] || '', '')
      .replace(phoneMatch?.[0] || '', '')
      .replace(/[<>(),]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
    
    // If name is empty but we have email, use email prefix as name
    if (!nameCandidate && member.email) {
      nameCandidate = member.email.split('@')[0].replace(/[._]/g, ' ')
      nameCandidate = nameCandidate.replace(/\b\w/g, l => l.toUpperCase()) // Capitalize
    }
    
    member.name = nameCandidate
    
    // Validate
    member.issues = []
    if (!member.name) {
      member.issues.push('Name required')
      member.isValid = false
    }
    if (!member.email) {
      member.issues.push('No email (won\'t receive alerts)')
    }
    
    if (member.name || member.email) {
      results.push(member)
    }
  }
  
  return results
}

// Parse CSV/spreadsheet content
function parseSpreadsheetData(data: string[][]): Partial<TeamMember>[] {
  if (data.length === 0) return []
  
  // Try to detect header row
  const firstRow = data[0]
  let nameIdx = -1
  let emailIdx = -1
  let phoneIdx = -1
  let roleIdx = -1
  
  // Check if first row looks like headers
  const hasHeaders = firstRow.some(cell => 
    /^(name|employee|first|last|email|phone|role|title|position)/i.test(cell.trim())
  )
  
  if (hasHeaders) {
    firstRow.forEach((cell, idx) => {
      const lower = cell.toLowerCase().trim()
      if (lower.includes('name') || lower.includes('employee') || lower === 'first' || lower === 'last') {
        if (nameIdx === -1) nameIdx = idx
      }
      if (lower.includes('email') || lower.includes('e-mail')) emailIdx = idx
      if (lower.includes('phone') || lower.includes('mobile') || lower.includes('cell')) phoneIdx = idx
      if (lower.includes('role') || lower.includes('title') || lower.includes('position')) roleIdx = idx
    })
  } else {
    // Guess based on content patterns
    firstRow.forEach((cell, idx) => {
      if (cell.includes('@')) emailIdx = idx
      else if (/\d{3}.*\d{4}/.test(cell)) phoneIdx = idx
      else if (nameIdx === -1) nameIdx = idx
    })
  }
  
  // Default to first column for name if not found
  if (nameIdx === -1) nameIdx = 0
  
  const startRow = hasHeaders ? 1 : 0
  const results: Partial<TeamMember>[] = []
  
  for (let i = startRow; i < data.length; i++) {
    const row = data[i]
    if (row.every(cell => !cell.trim())) continue // Skip empty rows
    
    const member: Partial<TeamMember> = {
      id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: row[nameIdx]?.trim() || '',
      email: row[emailIdx]?.trim()?.toLowerCase() || '',
      phone: row[phoneIdx]?.trim() || '',
      role: 'Technician',
      isValid: true,
      issues: []
    }
    
    // Use role from spreadsheet as-is, or default to Technician
    if (roleIdx !== -1 && row[roleIdx]?.trim()) {
      member.role = row[roleIdx].trim()
    } else {
      member.role = 'Technician'
    }
    
    // Validate
    member.issues = []
    if (!member.name) {
      member.issues.push('Name required')
      member.isValid = false
    }
    if (!member.email) {
      member.issues.push('No email')
    } else if (!/^[\w.-]+@[\w.-]+\.\w+$/.test(member.email)) {
      member.issues.push('Invalid email format')
    }
    
    if (member.name || member.email) {
      results.push(member)
    }
  }
  
  return results
}

export default function TeamRosterStep({ initialData, onComplete, onBack, saving }: TeamRosterStepProps) {
  const [importMethod, setImportMethod] = useState<ImportMethod>('none')
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [pasteText, setPasteText] = useState('')
  const [isParsing, setIsParsing] = useState(false)
  const [editingMember, setEditingMember] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // New member form state
  const [newMember, setNewMember] = useState<Partial<TeamMember>>({
    name: '',
    email: '',
    phone: '',
    role: 'Technician'
  })

  // Handle file upload
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return
    
    setIsParsing(true)
    
    try {
      let rows: string[][] = []
      
      // Check if it's an Excel file (.xlsx, .xls)
      const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || 
                      file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                      file.type === 'application/vnd.ms-excel'
      
      if (isExcel) {
        // Parse Excel files using xlsx library
        const buffer = await file.arrayBuffer()
        const workbook = XLSX.read(buffer, { type: 'array' })
        
        // Get first sheet
        const firstSheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[firstSheetName]
        
        // Convert to array of arrays
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' })
        rows = jsonData.map(row => 
          Array.isArray(row) ? row.map(cell => String(cell || '').trim()) : []
        )
      } else if (file.name.endsWith('.csv') || file.type === 'text/csv') {
        // Parse CSV files
        const text = await file.text()
        rows = text.split('\n').map(line => {
          // Simple CSV parsing (handles basic cases)
          const cells: string[] = []
          let current = ''
          let inQuotes = false
          
          for (const char of line) {
            if (char === '"') {
              inQuotes = !inQuotes
            } else if (char === ',' && !inQuotes) {
              cells.push(current.trim())
              current = ''
            } else {
              current += char
            }
          }
          cells.push(current.trim())
          return cells
        })
      } else {
        // For unknown file types, try text-based parsing
        const text = await file.text()
        rows = text.split('\n').map(line => 
          line.includes('\t') ? line.split('\t') : line.split(',')
        )
      }
      
      const parsed = parseSpreadsheetData(rows)
      setTeamMembers(parsed as TeamMember[])
      setImportMethod('spreadsheet')
    } catch (error) {
      console.error('Error parsing file:', error)
    } finally {
      setIsParsing(false)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    maxFiles: 1,
    disabled: isParsing
  })

  // Handle paste parsing
  const handleParsePaste = () => {
    if (!pasteText.trim()) return
    
    setIsParsing(true)
    
    // Small delay to show loading state
    setTimeout(() => {
      const parsed = parseTeamText(pasteText)
      setTeamMembers(parsed as TeamMember[])
      setImportMethod('paste')
      setIsParsing(false)
    }, 300)
  }

  // Add single member
  const handleAddMember = () => {
    if (!newMember.name?.trim()) return
    
    const member: TeamMember = {
      id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: newMember.name.trim(),
      email: newMember.email?.trim().toLowerCase() || '',
      phone: newMember.phone?.trim() || '',
      role: (newMember.role as TeamMember['role']) || 'Technician',
      isValid: true,
      issues: []
    }
    
    // Validate
    if (!member.email) {
      member.issues.push('No email')
    }
    
    setTeamMembers(prev => [...prev, member])
    setNewMember({ name: '', email: '', phone: '', role: 'Technician' })
    setShowAddForm(false)
    
    if (importMethod === 'none') {
      setImportMethod('manual')
    }
  }

  // Edit member
  const handleUpdateMember = (id: string, updates: Partial<TeamMember>) => {
    setTeamMembers(prev => prev.map(m => {
      if (m.id !== id) return m
      
      const updated = { ...m, ...updates }
      
      // Re-validate
      updated.issues = []
      updated.isValid = true
      
      if (!updated.name) {
        updated.issues.push('Name required')
        updated.isValid = false
      }
      if (!updated.email) {
        updated.issues.push('No email')
      }
      
      return updated
    }))
  }

  // Remove member
  const handleRemoveMember = (id: string) => {
    setTeamMembers(prev => prev.filter(m => m.id !== id))
  }

  // Submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Filter out invalid members (those without names)
    const validMembers = teamMembers.filter(m => m.name.trim())
    
    onComplete(validMembers)
  }

  // Calculate stats
  const totalMembers = teamMembers.length
  const membersWithEmail = teamMembers.filter(m => m.email).length
  const membersWithIssues = teamMembers.filter(m => m.issues.length > 0).length

  // Method selection view
  if (importMethod === 'none') {
    return (
      <div className="min-h-screen bg-[#F0F4F8] flex font-mono">
        {/* Left Side - Summary Panel */}
        <div className="hidden lg:flex lg:w-2/5 bg-[#050505] text-white flex-col justify-between p-12 relative overflow-hidden">
          {/* Grid overlay */}
          <div className="absolute inset-0 opacity-5">
            <div className="w-full h-full" style={{
              backgroundSize: '40px 40px',
              backgroundImage: 'linear-gradient(to right, #0038FF 1px, transparent 1px), linear-gradient(to bottom, #0038FF 1px, transparent 1px)'
            }} />
          </div>

          {/* Decorative corner elements */}
          <div className="absolute top-0 right-0 w-32 h-32">
            <div className="absolute top-8 right-8 w-full h-full border-t-2 border-r-2 border-[#0038FF]/30" />
          </div>
          <div className="absolute bottom-0 left-0 w-32 h-32">
            <div className="absolute bottom-8 left-8 w-full h-full border-b-2 border-l-2 border-[#0038FF]/30" />
          </div>

          {/* Logo */}
          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <img src="/IronStampLogov3.png" alt="IronStamp" className="h-10 w-auto brightness-0 invert" />
              <span className="font-display font-bold text-3xl tracking-tighter">IRONSTAMP</span>
            </div>
          </div>

          {/* Content */}
          <div className="relative z-10 flex-1 flex flex-col justify-center">
            <h2 className="font-display text-3xl font-bold mb-4 uppercase">
              Import Your<br />
              <span className="text-[#0038FF]">Field Team</span>
            </h2>
            
            <p className="text-gray-400 font-mono text-sm mb-8 leading-relaxed">
              Add your technicians now and we&apos;ll set up their certification tracking.
              The more complete the roster, the better your compliance visibility.
            </p>

            {/* Team size context */}
            <div className="bg-white/5 border border-white/10 p-4">
              <div className="font-mono text-xs text-gray-400 uppercase mb-1">Based on your profile</div>
              <div className="font-display font-bold text-xl">{initialData.company_name || 'Your Company'}</div>
              <div className="font-mono text-sm text-gray-400 mt-1">
                Team size: {initialData.team_size === 'just_me' ? 'Solo operator' : `${initialData.team_size} technicians`}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="relative z-10">
            <p className="font-mono text-xs text-gray-500">© 2026 IRONSTAMP SYSTEMS. BOSTON, MA.</p>
          </div>
        </div>

        {/* Right Side - Import Method Selection */}
        <div className="flex-1 flex flex-col bg-tech-grid relative overflow-y-auto">
          {/* Desktop back button (floats over content) */}
          <div className="hidden lg:block absolute top-6 left-6">
            <button 
              onClick={onBack}
              className="flex items-center gap-2 text-xs text-gray-600 hover:text-[#0038FF] transition-colors font-mono uppercase tracking-wider"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          </div>

          {/* Mobile header: back + centered logo */}
          <div className="lg:hidden pt-4 px-4 pb-4">
            <div className="flex items-center justify-between">
              <button 
                onClick={onBack}
                className="flex items-center gap-2 text-xs text-gray-600 hover:text-[#0038FF] transition-colors font-mono uppercase tracking-wider"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
            </div>
            <div className="mt-3 flex justify-center">
              <div className="flex items-center gap-2">
                <img src="/IronStampLogov3.png" alt="IronStamp" className="h-8 w-auto" />
                <span className="font-display font-bold text-xl tracking-tighter text-[#050505]">IRONSTAMP</span>
              </div>
            </div>
          </div>

          {/* Progress indicator */}
          <div className="px-6 md:px-12 pt-8 md:pt-16">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex gap-2">
                  <div className="w-12 h-1.5 bg-[#0038FF] rounded-full"></div>
                  <div className="w-12 h-1.5 bg-[#0038FF] rounded-full"></div>
                  <div className="w-12 h-1.5 bg-gray-200 rounded-full"></div>
                  <div className="w-12 h-1.5 bg-gray-200 rounded-full"></div>
                </div>
                <span className="font-mono text-xs text-gray-500 ml-2">Step 2 of 4</span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 px-6 md:px-12 py-6 md:py-8">
            <div className="max-w-2xl">
              {/* Header */}
              <div className="mb-8">
                <p className="text-[#0038FF] font-mono text-xs mb-1 uppercase tracking-wider">{`/// TEAM ROSTER ///`}</p>
                <h1 className="font-display text-3xl md:text-4xl font-bold uppercase text-[#050505]">
                  Add Your Team
                </h1>
                <p className="text-gray-600 font-mono text-sm mt-2">
                  Choose how you&apos;d like to add your technicians. You can always add more later.
                </p>
              </div>

              {/* Import Methods */}
              <div className="space-y-4">
                {/* Spreadsheet Upload */}
                <div
                  {...getRootProps()}
                  className={`p-6 border-2 transition-all cursor-pointer group ${
                    isDragActive
                      ? 'border-[#0038FF] bg-[#0038FF]/5'
                      : 'border-gray-200 hover:border-[#0038FF] bg-white'
                  }`}
                >
                  <input {...getInputProps()} />
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-[#0038FF]/10 flex items-center justify-center flex-shrink-0 group-hover:bg-[#0038FF] group-hover:text-white transition-colors">
                      <FileSpreadsheet className="w-6 h-6 text-[#0038FF] group-hover:text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-display font-bold text-lg text-[#050505] uppercase">Upload Spreadsheet</h3>
                        <span className="bg-[#0038FF]/10 text-[#0038FF] text-[10px] font-mono font-bold px-2 py-0.5 uppercase">Recommended</span>
                      </div>
                      <p className="font-mono text-sm text-gray-600 mt-1">
                        Upload your existing employee list (Excel, CSV). We&apos;ll extract names, emails, and phone numbers automatically.
                      </p>
                      <p className="font-mono text-[10px] text-gray-400 mt-2 uppercase">
                        Supported: .xlsx, .xls, .csv
                      </p>
                    </div>
                  </div>
                </div>

                {/* Paste from Anywhere */}
                <button
                  type="button"
                  onClick={() => setImportMethod('paste')}
                  className="w-full p-6 border-2 border-gray-200 hover:border-[#0038FF] bg-white text-left transition-all group"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gray-100 flex items-center justify-center flex-shrink-0 group-hover:bg-[#0038FF] transition-colors">
                      <ClipboardPaste className="w-6 h-6 text-gray-600 group-hover:text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-display font-bold text-lg text-[#050505] uppercase">Paste from Anywhere</h3>
                      <p className="font-mono text-sm text-gray-600 mt-1">
                        Copy employee info from any source and paste below. We&apos;ll parse names, emails, and phone numbers automatically.
                      </p>
                      <p className="font-mono text-[10px] text-gray-400 mt-2 uppercase">
                        Works with: Email lists, contact exports, text from any source
                      </p>
                    </div>
                  </div>
                </button>

                {/* Manual Entry */}
                <button
                  type="button"
                  onClick={() => {
                    setImportMethod('manual')
                    setShowAddForm(true)
                  }}
                  className="w-full p-6 border-2 border-gray-200 hover:border-[#0038FF] bg-white text-left transition-all group"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gray-100 flex items-center justify-center flex-shrink-0 group-hover:bg-[#0038FF] transition-colors">
                      <UserPlus className="w-6 h-6 text-gray-600 group-hover:text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-display font-bold text-lg text-[#050505] uppercase">Enter Manually</h3>
                      <p className="font-mono text-sm text-gray-600 mt-1">
                        Add team members one by one. Best for small teams or when you don&apos;t have a list.
                      </p>
                      <p className="font-mono text-[10px] text-gray-400 mt-2 uppercase">
                        Best for: Teams under 10 people
                      </p>
                    </div>
                  </div>
                </button>
              </div>

              {/* Skip option */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => onComplete([])}
                  className="text-gray-500 hover:text-[#0038FF] font-mono text-sm uppercase tracking-wider transition-colors"
                >
                  Skip for now — I&apos;ll add team members from the dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Paste input view
  if (importMethod === 'paste' && teamMembers.length === 0) {
    return (
      <div className="min-h-screen bg-[#F0F4F8] flex font-mono">
        {/* Left Side */}
        <div className="hidden lg:flex lg:w-2/5 bg-[#050505] text-white flex-col justify-between p-12 relative overflow-hidden">
          <div className="absolute inset-0 opacity-5">
            <div className="w-full h-full" style={{
              backgroundSize: '40px 40px',
              backgroundImage: 'linear-gradient(to right, #0038FF 1px, transparent 1px), linear-gradient(to bottom, #0038FF 1px, transparent 1px)'
            }} />
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <img src="/IronStampLogov3.png" alt="IronStamp" className="h-10 w-auto brightness-0 invert" />
              <span className="font-display font-bold text-3xl tracking-tighter">IRONSTAMP</span>
            </div>
          </div>

          <div className="relative z-10 flex-1 flex flex-col justify-center">
            <h2 className="font-display text-2xl font-bold mb-4 uppercase">
              Paste Your Team List
            </h2>
            
            <div className="space-y-4 text-sm text-gray-400">
              <p className="font-bold text-white">We can parse almost any format:</p>
              
              <div className="bg-white/5 border border-white/10 p-3 font-mono text-xs">
                <p>John Smith, john@company.com</p>
                <p>Jane Doe &lt;jane@company.com&gt;</p>
                <p>Mike Johnson 555-123-4567</p>
                <p>sarah.wilson@company.com</p>
              </div>
              
              <p>Names, emails, and phone numbers will be automatically detected.</p>
            </div>
          </div>

          <div className="relative z-10">
            <p className="font-mono text-xs text-gray-500">© 2026 IRONSTAMP SYSTEMS. BOSTON, MA.</p>
          </div>
        </div>

        {/* Right Side */}
        <div className="flex-1 flex flex-col bg-tech-grid relative overflow-y-auto">
          <div className="absolute top-6 left-6">
            <button 
              onClick={() => setImportMethod('none')}
              className="flex items-center gap-2 text-xs text-gray-600 hover:text-[#0038FF] transition-colors font-mono uppercase tracking-wider"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          </div>

          <div className="flex-1 px-6 md:px-12 py-16 md:py-20">
            <div className="max-w-2xl">
              <div className="mb-6">
                <p className="text-[#0038FF] font-mono text-xs mb-1 uppercase tracking-wider">{`/// PASTE IMPORT ///`}</p>
                <h1 className="font-display text-3xl font-bold uppercase text-[#050505]">
                  Paste Your Team List
                </h1>
                <p className="text-gray-600 font-mono text-sm mt-2">
                  Copy from a spreadsheet, email, or any text source.
                </p>
              </div>

              <div className="space-y-4">
                <textarea
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  placeholder={`Paste your team list here...

Example formats we understand:
John Smith, john@company.com, 555-123-4567
Jane Doe <jane@company.com>
mike.johnson@company.com
Sarah Wilson (555) 234-5678`}
                  className="w-full h-64 p-4 font-mono text-sm border-2 border-gray-200 focus:border-[#0038FF] focus:ring-0 bg-white resize-none"
                />

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setImportMethod('none')}
                    className="px-6 py-3 border-2 border-gray-200 font-mono text-sm uppercase font-bold hover:border-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleParsePaste}
                    disabled={!pasteText.trim() || isParsing}
                    className="flex-1 bg-[#050505] text-white px-6 py-3 font-bold font-mono text-sm uppercase tracking-wider hover:bg-[#0038FF] transition-colors shadow-[4px_4px_0px_#0038FF] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isParsing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Parsing...
                      </>
                    ) : (
                      <>
                        Parse List
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Team roster review/edit view
  return (
    <div className="min-h-screen bg-[#F0F4F8] flex font-mono">
      {/* Left Side - Summary Panel */}
      <div className="hidden lg:flex lg:w-2/5 bg-[#050505] text-white flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="w-full h-full" style={{
            backgroundSize: '40px 40px',
            backgroundImage: 'linear-gradient(to right, #0038FF 1px, transparent 1px), linear-gradient(to bottom, #0038FF 1px, transparent 1px)'
          }} />
        </div>

        <div className="absolute top-0 right-0 w-32 h-32">
          <div className="absolute top-8 right-8 w-full h-full border-t-2 border-r-2 border-[#0038FF]/30" />
        </div>
        <div className="absolute bottom-0 left-0 w-32 h-32">
          <div className="absolute bottom-8 left-8 w-full h-full border-b-2 border-l-2 border-[#0038FF]/30" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <img src="/IronStampLogov3.png" alt="IronStamp" className="h-10 w-auto brightness-0 invert" />
            <span className="font-display font-bold text-3xl tracking-tighter">IRONSTAMP</span>
          </div>
        </div>

        <div className="relative z-10 flex-1 flex flex-col justify-center">
          <h2 className="font-display text-2xl font-bold mb-2 uppercase">
            Team Roster Preview
          </h2>
          <p className="text-gray-400 font-mono text-sm mb-8">
            Review and edit before continuing
          </p>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-white/5 border border-white/10 p-4">
              <div className="font-display text-4xl font-bold text-[#0038FF]">{totalMembers}</div>
              <div className="font-mono text-xs text-gray-400 uppercase mt-1">Team Members</div>
            </div>
            <div className="bg-white/5 border border-white/10 p-4">
              <div className="font-display text-4xl font-bold text-green-500">{membersWithEmail}</div>
              <div className="font-mono text-xs text-gray-400 uppercase mt-1">With Email</div>
            </div>
          </div>

          {/* Status indicators */}
          <div className="space-y-3">
            {membersWithEmail === totalMembers ? (
              <div className="flex items-center gap-2 text-green-500">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm">All members have email addresses</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-yellow-500">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">{totalMembers - membersWithEmail} member(s) without email</span>
              </div>
            )}
            
            {membersWithIssues > 0 && (
              <div className="flex items-center gap-2 text-yellow-500">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">{membersWithIssues} member(s) need attention</span>
              </div>
            )}
          </div>
        </div>

        <div className="relative z-10">
          <p className="font-mono text-xs text-gray-500">© 2026 IRONSTAMP SYSTEMS. BOSTON, MA.</p>
        </div>
      </div>

      {/* Right Side - Team List */}
      <div className="flex-1 flex flex-col bg-tech-grid relative overflow-y-auto">
        <div className="absolute top-6 left-6">
          <button 
            onClick={() => {
              setTeamMembers([])
              setImportMethod('none')
              setPasteText('')
            }}
            className="flex items-center gap-2 text-xs text-gray-600 hover:text-[#0038FF] transition-colors font-mono uppercase tracking-wider"
          >
            <ArrowLeft className="w-4 h-4" />
            Start Over
          </button>
        </div>

        {/* Progress indicator */}
        <div className="px-6 md:px-12 pt-16 md:pt-20">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex gap-2">
                <div className="w-12 h-1.5 bg-[#0038FF] rounded-full"></div>
                <div className="w-12 h-1.5 bg-[#0038FF] rounded-full"></div>
                <div className="w-12 h-1.5 bg-gray-200 rounded-full"></div>
                <div className="w-12 h-1.5 bg-gray-200 rounded-full"></div>
              </div>
              <span className="font-mono text-xs text-gray-500 ml-2">Step 2 of 4</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 px-6 md:px-12 py-6 md:py-8">
          <div className="max-w-3xl">
            {/* Header */}
            <div className="mb-6 flex items-end justify-between">
              <div>
                <p className="text-[#0038FF] font-mono text-xs mb-1 uppercase tracking-wider">{`/// TEAM ROSTER ///`}</p>
                <h1 className="font-display text-3xl font-bold uppercase text-[#050505]">
                  Review Your Team
                </h1>
              </div>
              
              <button
                type="button"
                onClick={() => setShowAddForm(true)}
                className="flex items-center gap-2 text-[#0038FF] hover:text-[#050505] font-mono text-sm uppercase font-bold transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Member
              </button>
            </div>

            {/* Add Member Form */}
            {showAddForm && (
              <div className="mb-6 p-4 border-2 border-[#0038FF] bg-[#0038FF]/5">
                <div className="flex items-center gap-2 mb-4">
                  <UserPlus className="w-4 h-4 text-[#0038FF]" />
                  <span className="font-mono text-xs font-bold text-[#0038FF] uppercase">Add New Team Member</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <Label className="text-[10px] font-mono font-bold text-gray-700 uppercase">Name *</Label>
                    <Input
                      value={newMember.name || ''}
                      onChange={(e) => setNewMember(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="John Smith"
                      className="h-10 font-mono text-sm border-2 border-gray-200 focus:border-[#0038FF]"
                    />
                  </div>
                  <div>
                    <Label className="text-[10px] font-mono font-bold text-gray-700 uppercase">Email</Label>
                    <Input
                      type="email"
                      value={newMember.email || ''}
                      onChange={(e) => setNewMember(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="john@company.com"
                      className="h-10 font-mono text-sm border-2 border-gray-200 focus:border-[#0038FF]"
                    />
                  </div>
                  <div>
                    <Label className="text-[10px] font-mono font-bold text-gray-700 uppercase">Phone</Label>
                    <Input
                      value={newMember.phone || ''}
                      onChange={(e) => setNewMember(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="(555) 123-4567"
                      className="h-10 font-mono text-sm border-2 border-gray-200 focus:border-[#0038FF]"
                    />
                  </div>
                  <div>
                    <Label className="text-[10px] font-mono font-bold text-gray-700 uppercase">Role</Label>
                    <div className="relative">
                      <Input
                        value={newMember.role || ''}
                        onChange={(e) => setNewMember(prev => ({ ...prev, role: e.target.value }))}
                        placeholder="e.g., Technician, Lead, Apprentice"
                        list="role-suggestions-new"
                        className="h-10 font-mono text-sm border-2 border-gray-200 focus:border-[#0038FF]"
                      />
                      <datalist id="role-suggestions-new">
                        {rolePresets.map(role => (
                          <option key={role} value={role} />
                        ))}
                      </datalist>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false)
                      setNewMember({ name: '', email: '', phone: '', role: 'Technician' })
                    }}
                    className="px-4 py-2 border-2 border-gray-200 font-mono text-xs uppercase font-bold hover:border-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleAddMember}
                    disabled={!newMember.name?.trim()}
                    className="px-4 py-2 bg-[#0038FF] text-white font-mono text-xs uppercase font-bold hover:bg-[#050505] disabled:opacity-50"
                  >
                    Add Member
                  </button>
                </div>
              </div>
            )}

            {/* Team Members List */}
            <div className="space-y-3 mb-8">
              {teamMembers.map((member) => (
                <div
                  key={member.id}
                  className={`p-4 border-2 bg-white transition-all ${
                    member.issues.length > 0 ? 'border-yellow-400' : 'border-gray-200'
                  }`}
                >
                  {editingMember === member.id ? (
                    // Edit mode
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-[10px] font-mono font-bold text-gray-700 uppercase">Name *</Label>
                          <Input
                            value={member.name}
                            onChange={(e) => handleUpdateMember(member.id, { name: e.target.value })}
                            className="h-10 font-mono text-sm border-2 border-gray-200 focus:border-[#0038FF]"
                          />
                        </div>
                        <div>
                          <Label className="text-[10px] font-mono font-bold text-gray-700 uppercase">Email</Label>
                          <Input
                            type="email"
                            value={member.email}
                            onChange={(e) => handleUpdateMember(member.id, { email: e.target.value })}
                            className="h-10 font-mono text-sm border-2 border-gray-200 focus:border-[#0038FF]"
                          />
                        </div>
                        <div>
                          <Label className="text-[10px] font-mono font-bold text-gray-700 uppercase">Phone</Label>
                          <Input
                            value={member.phone}
                            onChange={(e) => handleUpdateMember(member.id, { phone: e.target.value })}
                            className="h-10 font-mono text-sm border-2 border-gray-200 focus:border-[#0038FF]"
                          />
                        </div>
                        <div>
                          <Label className="text-[10px] font-mono font-bold text-gray-700 uppercase">Role</Label>
                          <div className="relative">
                            <Input
                              value={member.role}
                              onChange={(e) => handleUpdateMember(member.id, { role: e.target.value })}
                              placeholder="e.g., Technician, Lead, Apprentice"
                              list={`role-suggestions-${member.id}`}
                              className="h-10 font-mono text-sm border-2 border-gray-200 focus:border-[#0038FF]"
                            />
                            <datalist id={`role-suggestions-${member.id}`}>
                              {rolePresets.map(role => (
                                <option key={role} value={role} />
                              ))}
                            </datalist>
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingMember(null)}
                          className="px-4 py-2 bg-[#0038FF] text-white font-mono text-xs uppercase font-bold hover:bg-[#050505]"
                        >
                          Done
                        </button>
                      </div>
                    </div>
                  ) : (
                    // View mode
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <div className="w-10 h-10 bg-gray-200 flex items-center justify-center flex-shrink-0">
                        <span className="font-mono text-xs font-bold text-gray-600">
                          {member.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || '??'}
                        </span>
                      </div>
                      
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="font-display font-bold text-[#050505]">{member.name || 'No name'}</div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                          {member.email && (
                            <span className="flex items-center gap-1 text-xs text-gray-500 font-mono">
                              <Mail className="w-3 h-3" />
                              {member.email}
                            </span>
                          )}
                          {member.phone && (
                            <span className="flex items-center gap-1 text-xs text-gray-500 font-mono">
                              <Phone className="w-3 h-3" />
                              {member.phone}
                            </span>
                          )}
                          <span className="flex items-center gap-1 text-xs text-gray-500 font-mono">
                            <Briefcase className="w-3 h-3" />
                            {member.role}
                          </span>
                        </div>
                        
                        {/* Issues */}
                        {member.issues.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {member.issues.map((issue, idx) => (
                              <span key={idx} className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-800 text-[10px] font-mono font-bold px-2 py-0.5 uppercase">
                                <AlertCircle className="w-3 h-3" />
                                {issue}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingMember(member.id)}
                          className="p-2 text-gray-400 hover:text-[#0038FF] hover:bg-gray-100 transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveMember(member.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Remove"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {teamMembers.length === 0 && (
                <div className="p-8 border-2 border-dashed border-gray-300 text-center">
                  <Users className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="font-mono text-sm text-gray-500">No team members added yet</p>
                  <button
                    type="button"
                    onClick={() => setShowAddForm(true)}
                    className="mt-2 text-[#0038FF] font-mono text-sm font-bold hover:underline"
                  >
                    Add your first team member
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Stats */}
            <div className="lg:hidden bg-[#050505] text-white p-4 -mx-6 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-mono text-xs text-gray-400 uppercase">Team Members</div>
                  <div className="font-display text-2xl font-bold">{totalMembers}</div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-xs text-gray-400">{membersWithEmail} with email</div>
                  {membersWithIssues > 0 && (
                    <div className="font-mono text-xs text-yellow-400">{membersWithIssues} need attention</div>
                  )}
                </div>
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between items-center pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onBack}
                className="text-gray-600 hover:text-[#0038FF] font-mono text-sm uppercase tracking-wider transition-colors flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>

              <div className="flex gap-3">
                {/* DEV MODE: Skip button */}
                {isDevModeEnabled && (
                  <button
                    type="button"
                    onClick={() => onComplete([
                      { id: 'dev-1', name: 'John Smith', email: 'john@test.com', phone: '555-1234', role: 'Lead', isValid: true, issues: [] },
                      { id: 'dev-2', name: 'Jane Doe', email: 'jane@test.com', phone: '555-5678', role: 'Technician', isValid: true, issues: [] },
                      { id: 'dev-3', name: 'Mike Johnson', email: 'mike@test.com', phone: '', role: 'Apprentice', isValid: true, issues: [] }
                    ])}
                    className="bg-yellow-500 text-black px-6 py-3 font-bold font-mono text-sm uppercase tracking-wider hover:bg-yellow-400 transition-colors flex items-center gap-2"
                  >
                    <FastForward className="w-4 h-4" />
                    Skip (Dev)
                  </button>
                )}
                
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-[#050505] text-white px-8 py-3 font-bold font-mono text-sm uppercase tracking-wider hover:bg-[#0038FF] transition-colors shadow-[4px_4px_0px_#0038FF] hover:shadow-[4px_4px_0px_#050505] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      {teamMembers.length === 0 ? 'Skip Team Import' : 'Continue to Cert Assignment'}
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
