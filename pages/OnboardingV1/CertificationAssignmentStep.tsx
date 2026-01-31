import { useState, useMemo, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import ExcelJS from 'exceljs'
import { 
  ArrowLeft, 
  Shield, 
  Users, 
  CheckCircle, 
  AlertCircle, 
  Calendar,
  ChevronDown,
  ChevronUp,
  FastForward,
  Loader2,
  Info,
  Clock,
  Infinity,
  FileImage,
  FileSpreadsheet,
  Grid3X3,
  Send,
  ArrowRight,
  Upload,
  X,
  File,
  Edit2,
  Sparkles
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { OnboardingData } from './index'
import type { TeamMember } from './TeamRosterStep'
import { isDevModeEnabled } from '@/lib/dev-mode'
import { uploadCertification } from '@/lib/certification-service'

type CertImportMethod = 'none' | 'documents' | 'spreadsheet' | 'grid' | 'invite'

// Extracted certification from document
interface ExtractedCert {
  id: string
  fileName: string
  filePreviewUrl?: string // Object URL for preview
  status: 'pending' | 'processing' | 'success' | 'error'
  progress: number
  error?: string
  extractedData?: {
    employeeName: string
    certificationName: string
    licenseNumber?: string | null
    issueDate?: string | null
    expirationDate: string | null
    confidence: number
    isLifetime: boolean
  }
  // User-editable fields (after extraction)
  matchedMemberId?: string
  matchedCertId?: string
  // Editable extracted fields (for corrections)
  editedData?: {
    employeeName?: string
    certificationName?: string
    licenseNumber?: string | null
    issueDate?: string | null
    expirationDate?: string | null
  }
  // Issue flags
  issues?: {
    lowConfidence: boolean
    nameMismatch: boolean
    missingLicenseNumber: boolean
    missingIssueDate: boolean
    missingExpirationDate: boolean
    unmatchedEmployee: boolean
    unmatchedCertType: boolean
  }
}

// Spreadsheet row for cert data
interface SpreadsheetCertRow {
  id: string
  employeeName: string
  certificationName: string
  licenseNumber: string
  issueDate: string
  expirationDate: string
  isLifetime: boolean
  isValid: boolean
  issues: string[]
  matchedMemberId?: string
  matchedCertId?: string
}

interface CertificationAssignmentStepProps {
  initialData: OnboardingData
  onComplete: (assignments: CertificationAssignment[]) => void
  onBack: () => void
  saving: boolean
}

export interface CertificationAssignment {
  memberId: string
  memberName: string
  certificationId: string
  certificationName: string
  hasCert: boolean
  expirationDate?: string // ISO date string, null for lifetime certs
  isLifetime: boolean
}

// Certification metadata (aligned with ComplianceReviewStep)
interface CertInfo {
  id: string
  name: string
  shortName: string
  isLifetime: boolean
  renewalYears?: number
  category: 'federal' | 'state' | 'safety' | 'industry'
}

const certificationInfo: Record<string, CertInfo> = {
  // Federal
  'epa_608': { id: 'epa_608', name: 'EPA Section 608 Certification', shortName: 'EPA 608', isLifetime: true, category: 'federal' },
  'epa_609': { id: 'epa_609', name: 'EPA Section 609 Certification', shortName: 'EPA 609', isLifetime: true, category: 'federal' },
  // State (Massachusetts)
  'ma_refrigeration': { id: 'ma_refrigeration', name: 'Massachusetts Refrigeration License', shortName: 'MA Refrigeration', isLifetime: false, renewalYears: 2, category: 'state' },
  'ma_oil_burner': { id: 'ma_oil_burner', name: 'Massachusetts Oil Burner License', shortName: 'MA Oil Burner', isLifetime: false, renewalYears: 2, category: 'state' },
  'ma_sheet_metal': { id: 'ma_sheet_metal', name: 'Massachusetts Sheet Metal License', shortName: 'MA Sheet Metal', isLifetime: false, renewalYears: 2, category: 'state' },
  'ma_gas_fitter': { id: 'ma_gas_fitter', name: 'Massachusetts Gas Fitter License', shortName: 'MA Gas Fitter', isLifetime: false, renewalYears: 1, category: 'state' },
  // Safety
  'osha_10': { id: 'osha_10', name: 'OSHA 10-Hour Construction', shortName: 'OSHA 10', isLifetime: true, category: 'safety' },
  'osha_30': { id: 'osha_30', name: 'OSHA 30-Hour Construction', shortName: 'OSHA 30', isLifetime: true, category: 'safety' },
  'first_aid_cpr': { id: 'first_aid_cpr', name: 'First Aid/CPR/AED', shortName: 'First Aid/CPR', isLifetime: false, renewalYears: 2, category: 'safety' },
  // Industry
  'nate': { id: 'nate', name: 'NATE Certification', shortName: 'NATE', isLifetime: false, renewalYears: 2, category: 'industry' },
  'bpi': { id: 'bpi', name: 'BPI Building Analyst', shortName: 'BPI', isLifetime: false, renewalYears: 3, category: 'industry' },
}

// Helper to calculate default expiration based on renewal years
function getDefaultExpiration(certId: string): string {
  const info = certificationInfo[certId]
  if (info?.isLifetime) return ''
  
  const yearsToAdd = info?.renewalYears || 2
  const futureDate = new Date()
  futureDate.setFullYear(futureDate.getFullYear() + yearsToAdd)
  return futureDate.toISOString().split('T')[0]
}

export default function CertificationAssignmentStep({ 
  initialData, 
  onComplete, 
  onBack, 
  saving 
}: CertificationAssignmentStepProps) {
  const teamMembers = useMemo(() => initialData.team_members || [], [initialData.team_members])
  const selectedCerts = useMemo(() => initialData.required_certifications || [], [initialData.required_certifications])
  
  // Import method selection
  const [importMethod, setImportMethod] = useState<CertImportMethod>('none')
  
  // Document upload state
  const [extractedCerts, setExtractedCerts] = useState<ExtractedCert[]>([])
  const [isProcessingDocs, setIsProcessingDocs] = useState(false)
  const [editingMatches, setEditingMatches] = useState<Set<string>>(new Set())
  
  // Spreadsheet upload state
  const [spreadsheetRows, setSpreadsheetRows] = useState<SpreadsheetCertRow[]>([])
  const [isParsingSpreadsheet, setIsParsingSpreadsheet] = useState(false)
  
  // Build initial assignments matrix
  const [assignments, setAssignments] = useState<Map<string, CertificationAssignment>>(() => {
    const map = new Map<string, CertificationAssignment>()
    
    teamMembers.forEach(member => {
      selectedCerts.forEach(certId => {
        const info = certificationInfo[certId] || { 
          id: certId, 
          name: certId, 
          shortName: certId, 
          isLifetime: false,
          category: 'industry' as const
        }
        const key = `${member.id}-${certId}`
        map.set(key, {
          memberId: member.id,
          memberName: member.name,
          certificationId: certId,
          certificationName: info.name,
          hasCert: false,
          expirationDate: undefined,
          isLifetime: info.isLifetime
        })
      })
    })
    
    return map
  })
  
  const [expandedMembers, setExpandedMembers] = useState<Set<string>>(new Set())
  const [showBulkActions, setShowBulkActions] = useState(false)

  // Toggle certification for a member
  const toggleCert = useCallback((memberId: string, certId: string) => {
    const key = `${memberId}-${certId}`
    setAssignments(prev => {
      const newMap = new Map(prev)
      const current = newMap.get(key)
      if (current) {
        const hasCert = !current.hasCert
        newMap.set(key, {
          ...current,
          hasCert,
          expirationDate: hasCert && !current.isLifetime 
            ? getDefaultExpiration(certId) 
            : undefined
        })
      }
      return newMap
    })
  }, [])

  // Set expiration date
  const setExpirationDate = useCallback((memberId: string, certId: string, date: string) => {
    const key = `${memberId}-${certId}`
    setAssignments(prev => {
      const newMap = new Map(prev)
      const current = newMap.get(key)
      if (current) {
        newMap.set(key, { ...current, expirationDate: date })
      }
      return newMap
    })
  }, [])

  // Bulk assign certification to everyone
  const bulkAssignCert = useCallback((certId: string, value: boolean) => {
    setAssignments(prev => {
      const newMap = new Map(prev)
      teamMembers.forEach(member => {
        const key = `${member.id}-${certId}`
        const current = newMap.get(key)
        if (current) {
          newMap.set(key, {
            ...current,
            hasCert: value,
            expirationDate: value && !current.isLifetime 
              ? getDefaultExpiration(certId) 
              : undefined
          })
        }
      })
      return newMap
    })
  }, [teamMembers])

  // Toggle member row expansion
  const toggleMemberExpand = (memberId: string) => {
    setExpandedMembers(prev => {
      const newSet = new Set(prev)
      if (newSet.has(memberId)) {
        newSet.delete(memberId)
      } else {
        newSet.add(memberId)
      }
      return newSet
    })
  }

  // ==================== HELPER FUNCTIONS ====================
  
  // Helper: Fuzzy match employee name
  const fuzzyMatchEmployee = (name: string): TeamMember | undefined => {
    const normalizedName = name.toLowerCase().trim()
    
    // Exact match first
    let match = teamMembers.find(m => m.name.toLowerCase().trim() === normalizedName)
    if (match) return match
    
    // Check if name contains employee name or vice versa
    match = teamMembers.find(m => {
      const memberName = m.name.toLowerCase().trim()
      return normalizedName.includes(memberName) || memberName.includes(normalizedName)
    })
    if (match) return match
    
    // Try matching by parts (first name or last name)
    const nameParts = normalizedName.split(/\s+/)
    match = teamMembers.find(m => {
      const memberParts = m.name.toLowerCase().split(/\s+/)
      return nameParts.some(np => memberParts.some(mp => np === mp && np.length > 2))
    })
    
    return match
  }

  // Helper: Match certification type from text. Matches against ALL known cert types
  // so we recognize "MA Refrigeration Technician", "MA Sheet Metal Worker (J-1)", etc.
  const matchCertificationType = (certText: string): string | undefined => {
    const lower = certText.toLowerCase()
    
    // Match patterns for known cert types (order matters: more specific first)
    const patterns: { pattern: RegExp; certId: string }[] = [
      { pattern: /epa\s*(section\s*)?608\s*[-–]?\s*(universal|type\s*[i123])?|epa-?\d{6}/i, certId: 'epa_608' },
      { pattern: /epa\s*(section\s*)?609/i, certId: 'epa_609' },
      { pattern: /ma\s*refrigeration|refrigeration\s*(technician|tech)|refrigeration\s*apprentice/i, certId: 'ma_refrigeration' },
      { pattern: /ma\s*oil\s*burner|oil\s*burner\s*(technician|tech)?/i, certId: 'ma_oil_burner' },
      { pattern: /ma\s*sheet\s*metal|sheet\s*metal\s*(worker|license|tech)?\s*\(j-1\)?/i, certId: 'ma_sheet_metal' },
      { pattern: /ma\s*gas\s*fitter|gas\s*fitter/i, certId: 'ma_gas_fitter' },
      { pattern: /osha\s*10|osha-10/i, certId: 'osha_10' },
      { pattern: /osha\s*30|osha-30/i, certId: 'osha_30' },
      { pattern: /first\s*aid|cpr|aed/i, certId: 'first_aid_cpr' },
      { pattern: /nate/i, certId: 'nate' },
      // R-410A is a refrigerant; handling it requires EPA 608. Map doc text to EPA 608.
      { pattern: /r-?410a/i, certId: 'epa_608' },
      { pattern: /bpi|building\s*analyst/i, certId: 'bpi' },
    ]
    
    for (const { pattern, certId } of patterns) {
      if (pattern.test(certText)) {
        return certId
      }
    }
    
    // Fallback: try matching against certificationInfo names/shortNames
    const matched = Object.keys(certificationInfo).find(cId => {
      const info = certificationInfo[cId]
      if (!info) return false
      return lower.includes(info.shortName.toLowerCase()) ||
             lower.includes(info.name.toLowerCase())
    })
    return matched
  }

  // ==================== DOCUMENT UPLOAD HANDLERS ====================
  
  // Handle document file drop
  const handleDocumentDrop = useCallback(async (acceptedFiles: File[]) => {
    setIsProcessingDocs(true)
    
    // Add files to the list with pending status and create preview URLs
    const newCerts: ExtractedCert[] = acceptedFiles.map(file => {
      const previewUrl = URL.createObjectURL(file)
      return {
        id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        fileName: file.name,
        filePreviewUrl: previewUrl,
        status: 'pending' as const,
        progress: 0
      }
    })
    
    setExtractedCerts(prev => [...prev, ...newCerts])
    
    // Process each file sequentially
    for (let i = 0; i < acceptedFiles.length; i++) {
      const file = acceptedFiles[i]
      const certId = newCerts[i].id
      
      try {
        // Update to processing
        setExtractedCerts(prev => prev.map(c => 
          c.id === certId ? { ...c, status: 'processing' as const, progress: 30 } : c
        ))
        
        // Call the AI extraction API
        const result = await uploadCertification(file)
        
        // Use isLifetime from API response (already calculated there)
        const isLifetime = result.isLifetime || false
        
        // Try to match to team member (fuzzy, same as spreadsheet import)
        const matchedMember = fuzzyMatchEmployee(result.employeeName || '')
        
        // Try to match certification type using the same helper used for spreadsheets
        // This recognizes variants like "Massachusetts Refrigeration Technician License"
        // Allow matching to ANY certification in certificationInfo, not just selectedCerts
        // This handles cases where users upload certs they didn't select in Step 3
        const detectedCertId = matchCertificationType(result.certificationName || '')
        const matchedCert = detectedCertId && certificationInfo[detectedCertId]
          ? detectedCertId
          : undefined
        
        // Detect issues
        const confidence = result.confidence || 0.8
        // unmatchedCertType should only be true if we truly can't match it to any cert in certificationInfo
        // Not if it's just not in selectedCerts (we now allow matching to any cert)
        const trulyUnmatched = !detectedCertId || !certificationInfo[detectedCertId]
        const issues = {
          lowConfidence: confidence < 0.7,
          nameMismatch: !matchedMember && !!result.employeeName,
          missingLicenseNumber: !result.licenseNumber,
          missingIssueDate: !result.issueDate && !isLifetime,
          missingExpirationDate: !result.expirationDate && !isLifetime,
          unmatchedEmployee: !matchedMember,
          unmatchedCertType: trulyUnmatched
        }
        
        // Update with extracted data
        setExtractedCerts(prev => prev.map(c => 
          c.id === certId ? {
            ...c,
            status: 'success' as const,
            progress: 100,
            extractedData: {
              employeeName: result.employeeName || 'Unknown',
              certificationName: result.certificationName || 'Unknown',
              licenseNumber: result.licenseNumber || null,
              issueDate: result.issueDate || null,
              expirationDate: result.expirationDate || null,
              confidence: confidence,
              isLifetime
            },
            matchedMemberId: matchedMember?.id,
            matchedCertId: matchedCert,
            issues
          } : c
        ))
        
      } catch (error) {
        // Update with error
        setExtractedCerts(prev => prev.map(c => 
          c.id === certId ? {
            ...c,
            status: 'error' as const,
            progress: 0,
            error: error instanceof Error ? error.message : 'Failed to process document'
          } : c
        ))
      }
    }
    
    setIsProcessingDocs(false)
  // callback uses teamMembers/selectedCerts; keep in deps for correct behavior
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamMembers, selectedCerts, fuzzyMatchEmployee, matchCertificationType])

  // Remove an extracted cert and cleanup preview URL
  const removeExtractedCert = (id: string) => {
    setExtractedCerts(prev => {
      const cert = prev.find(c => c.id === id)
      if (cert?.filePreviewUrl) {
        URL.revokeObjectURL(cert.filePreviewUrl)
      }
      return prev.filter(c => c.id !== id)
    })
    setEditingMatches(prev => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }

  // Update edited data for an extracted cert
  const updateExtractedCertData = (certId: string, field: string, value: string | null) => {
    setExtractedCerts(prev => prev.map(c => {
      if (c.id === certId) {
        return {
          ...c,
          editedData: {
            ...c.editedData,
            [field]: value
          }
        }
      }
      return c
    }))
  }

  // Save edited data (merge editedData into extractedData)
  const saveEditedCertData = (certId: string) => {
    setExtractedCerts(prev => prev.map(c => {
      if (c.id === certId && c.editedData) {
        return {
          ...c,
          extractedData: {
            ...c.extractedData!,
            ...c.editedData
          },
          editedData: undefined
        }
      }
      return c
    }))
    setEditingMatches(prev => {
      const next = new Set(prev)
      next.delete(certId)
      return next
    })
  }

  // Cancel editing
  const cancelEditingCertData = (certId: string) => {
    setExtractedCerts(prev => prev.map(c => {
      if (c.id === certId) {
        return {
          ...c,
          editedData: undefined
        }
      }
      return c
    }))
    setEditingMatches(prev => {
      const next = new Set(prev)
      next.delete(certId)
      return next
    })
  }

  // Update matched member for extracted cert
  const updateExtractedCertMember = (certId: string, memberId: string) => {
    setExtractedCerts(prev => prev.map(c => 
      c.id === certId ? { ...c, matchedMemberId: memberId } : c
    ))
  }

  // Update matched cert type for extracted cert
  const updateExtractedCertType = (certId: string, certTypeId: string) => {
    setExtractedCerts(prev => prev.map(c => 
      c.id === certId ? { ...c, matchedCertId: certTypeId } : c
    ))
  }

  const toggleMatchEditing = (certId: string) => {
    setEditingMatches(prev => {
      const next = new Set(prev)
      if (next.has(certId)) next.delete(certId)
      else next.add(certId)
      return next
    })
  }

  // Apply extracted certs to assignments
  const applyExtractedCerts = () => {
    setAssignments(prev => {
      const newMap = new Map(prev)
      
      extractedCerts.forEach(ec => {
        if (ec.status === 'success' && ec.matchedMemberId && ec.matchedCertId) {
          // Use edited data if available, otherwise use extracted data
          const finalData = ec.editedData ? { ...ec.extractedData, ...ec.editedData } : ec.extractedData
          
          const key = `${ec.matchedMemberId}-${ec.matchedCertId}`
          const current = newMap.get(key)
          
          // Get member and cert info
          const member = teamMembers.find(m => m.id === ec.matchedMemberId)
          const certInfo = getCertInfo(ec.matchedCertId)
          
          if (finalData && member) {
            if (current) {
              // Update existing assignment
              newMap.set(key, {
                ...current,
                hasCert: true,
                expirationDate: finalData.isLifetime ? undefined : (finalData.expirationDate || undefined),
                isLifetime: finalData.isLifetime || false
              })
            } else {
              // Create new assignment for cert not in selectedCerts
              // This allows users to track certs they uploaded but didn't select in Step 3
              newMap.set(key, {
                memberId: member.id,
                memberName: member.name,
                certificationId: ec.matchedCertId,
                certificationName: certInfo.name,
                hasCert: true,
                expirationDate: finalData.isLifetime ? undefined : (finalData.expirationDate || undefined),
                isLifetime: finalData.isLifetime || false
              })
            }
          }
        }
      })
      
      return newMap
    })
    
    // Switch to grid view to show results
    setImportMethod('grid')
  }

  // ==================== SPREADSHEET UPLOAD HANDLERS ====================
  
  // Handle spreadsheet file drop
  const handleSpreadsheetDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return
    
    setIsParsingSpreadsheet(true)
    
    try {
      let rows: string[][] = []
      
      // Check file type (.xlsx only for ExcelJS; .xls not supported)
      const isXlsx = file.name.endsWith('.xlsx') ||
                      file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      
      if (isXlsx) {
        const buffer = await file.arrayBuffer()
        const workbook = new ExcelJS.Workbook()
        await workbook.xlsx.load(buffer as ArrayBuffer)
        const worksheet = workbook.worksheets[0]
        if (!worksheet) {
          throw new Error('No sheet found in workbook')
        }
        const rowArrays: string[][] = []
        worksheet.eachRow((row, _rowNumber) => {
          const values = row.values as (string | number | Date | null | undefined)[]
          rowArrays.push((values?.slice(1) ?? []).map(v => {
            if (v == null) return ''
            if (v instanceof Date) return v.toISOString().split('T')[0]
            return String(v).trim()
          }))
        })
        rows = rowArrays
      } else if (file.name.endsWith('.xls') || file.type === 'application/vnd.ms-excel') {
        throw new Error('Please use .xlsx or CSV. Legacy .xls format is not supported.')
      } else {
        // CSV
        const text = await file.text()
        rows = text.split('\n').map(line => {
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
      }
      
      // Parse rows into cert data
      const parsed = parseSpreadsheetCerts(rows)
      setSpreadsheetRows(parsed)
      
    } catch (error) {
      console.error('Error parsing spreadsheet:', error)
    } finally {
      setIsParsingSpreadsheet(false)
    }
  // parseSpreadsheetCerts is defined below; omit from deps to avoid reordering
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Helper: Convert Excel serial date or any date string to date-only (YYYY-MM-DD)
  const excelDateToISO = (value: string): string => {
    const trimmed = value?.trim() ?? ''
    if (!trimmed) return trimmed
    // Check if it's a number (Excel serial date)
    const num = parseFloat(trimmed)
    if (!isNaN(num) && num > 10000 && num < 100000) {
      const date = new Date((num - 25569) * 86400 * 1000)
      return date.toISOString().split('T')[0]
    }
    // Check if it looks like a date already (MM/DD/YYYY or YYYY-MM-DD)
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(trimmed)) {
      const [m, d, y] = trimmed.split('/')
      return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
    }
    // Full datetime string (e.g. from Date.toString() or locale string with GMT) → date only
    if (/GMT|T\d{2}:\d{2}|^\w{3}\s+\w{3}\s+\d{1,2}\s+\d{4}/.test(trimmed)) {
      const d = new Date(trimmed)
      if (!isNaN(d.getTime())) return d.toISOString().split('T')[0]
    }
    return trimmed
  }

  // Display date-only (no time/timezone); normalizes any stored datetime string
  const formatDateDisplay = (value: string | null | undefined): string => {
    if (value == null || value === '') return ''
    const d = new Date(value)
    if (isNaN(d.getTime())) return value
    return d.toISOString().split('T')[0]
  }

  // Parse spreadsheet data into cert rows
  const parseSpreadsheetCerts = (data: string[][]): SpreadsheetCertRow[] => {
    if (data.length === 0) return []
    
    const firstRow = data[0]
    let nameIdx = -1
    let certTypeIdx = -1
    let licenseNumIdx = -1
    let issueDateIdx = -1
    let expDateIdx = -1
    
    // Check for headers
    const hasHeaders = firstRow.some(cell => 
      /^(name|employee|tech|first|last|certification|cert|license|expir|date|issue)/i.test(cell.trim())
    )
    
    if (hasHeaders) {
      // First pass: find name column. Prefer columns with actual person name,
      // NOT IDs. "Tech Name" and "Employee Name" are correct; "Tech_ID" is not.
      firstRow.forEach((cell, idx) => {
        const lower = cell.toLowerCase().trim()
        
        // Name column: must look like a person-name column, not an ID column
        // "Tech Name", "Employee Name", "Name" ✓  |  "Tech_ID", "Employee_ID" ✗
        const looksLikeId = /_id$|^id$|_id\b/.test(lower) || lower === 'tech_id'
        const looksLikeName = (lower.includes('name') || lower === 'employee') && 
            !lower.includes('cert') && !lower.includes('license')
        if (looksLikeName && !looksLikeId) {
          if (nameIdx === -1) nameIdx = idx
        }
      })
      
      // If we still didn't find name, try "tech" but only if it's "tech name" style
      if (nameIdx === -1) {
        firstRow.forEach((cell, idx) => {
          const lower = cell.toLowerCase().trim()
          if (lower.includes('tech') && lower.includes('name') && !/_id$/.test(lower)) {
            nameIdx = idx
          }
        })
      }
      
      firstRow.forEach((cell, idx) => {
        const lower = cell.toLowerCase().trim()
        
        // Certification type column: "Certification/License Type", "Certification", "Cert Type"
        // Must contain "cert" or "type" but NOT "license #" (that's license number)
        if ((lower.includes('certification') || lower.includes('cert type') || 
             (lower.includes('type') && lower.includes('license') && !lower.includes('#'))) && 
            !lower.includes('license #') && !lower.includes('license_#')) {
          certTypeIdx = idx
        }
        
        // License number column: "License #", "License Number", "Cert #"
        if ((lower.includes('license #') || lower.includes('license_#') || 
             lower.includes('license number') || lower.includes('cert #') || 
             lower.includes('number')) && 
            !lower.includes('phone')) {
          licenseNumIdx = idx
        }
        
        // Issue date: "Issue Date", "Issued"
        if (lower.includes('issue') && lower.includes('date')) {
          issueDateIdx = idx
        }
        
        // Expiration date: "Expiration Date", "Exp Date", "Expires"
        if (lower.includes('expir') || (lower.includes('exp') && lower.includes('date'))) {
          expDateIdx = idx
        }
      })
      
      // If we didn't find cert type specifically, but found license, check if there's
      // a column before license that looks like cert type
      if (certTypeIdx === -1 && licenseNumIdx > 0) {
        // Look for a column that might be cert type before license number
        for (let i = 0; i < licenseNumIdx; i++) {
          const lower = firstRow[i].toLowerCase().trim()
          if (lower.includes('cert') || lower.includes('license') || lower.includes('type')) {
            certTypeIdx = i
            break
          }
        }
      }
    } else {
      // Guess based on position: name, cert, license#, issue, exp
      nameIdx = 0
      certTypeIdx = 1
      expDateIdx = 2
    }
    
    // Defaults
    if (nameIdx === -1) nameIdx = 0
    if (certTypeIdx === -1) certTypeIdx = 1
    
    const startRow = hasHeaders ? 1 : 0
    const results: SpreadsheetCertRow[] = []
    
    for (let i = startRow; i < data.length; i++) {
      const row = data[i]
      if (row.every(cell => !cell.trim())) continue
      
      const employeeName = row[nameIdx] || ''
      const certName = row[certTypeIdx] || ''
      const licenseNum = licenseNumIdx !== -1 ? row[licenseNumIdx] || '' : ''
      const rawIssueDate = issueDateIdx !== -1 ? row[issueDateIdx] || '' : ''
      const rawExpDate = expDateIdx !== -1 ? row[expDateIdx] || '' : ''
      
      // Parse dates (handle Excel serial dates)
      const issueDate = excelDateToISO(rawIssueDate)
      const expDate = excelDateToISO(rawExpDate)
      
      // Check if lifetime certification
      const isLifetime = /n\/a|lifetime|never|no\s*expir/i.test(rawExpDate) ||
                         /epa\s*608|osha\s*10|osha\s*30|r-?410a/i.test(certName)
      
      // Try to match to team member (fuzzy)
      const matchedMember = fuzzyMatchEmployee(employeeName)
      
      // Try to match certification type
      const matchedCert = matchCertificationType(certName)
      
      // Validate
      const issues: string[] = []
      if (!employeeName) issues.push('Missing name')
      if (!certName) issues.push('Missing certification')
      if (!matchedMember) issues.push('Employee not in roster')
      if (!matchedCert) issues.push('Cert type not recognized')
      
      results.push({
        id: `row-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 5)}`,
        employeeName,
        certificationName: certName,
        licenseNumber: licenseNum,
        issueDate,
        expirationDate: isLifetime ? '' : expDate,
        isLifetime,
        isValid: issues.length === 0,
        issues,
        matchedMemberId: matchedMember?.id,
        matchedCertId: matchedCert
      })
    }
    
    return results
  }

  // Helper: merge spreadsheet rows into an assignment map (used by both apply paths)
  const mergeSpreadsheetIntoMap = (prev: Map<string, CertificationAssignment>): Map<string, CertificationAssignment> => {
    const newMap = new Map(prev)
    spreadsheetRows.forEach(row => {
      if (row.matchedMemberId && row.matchedCertId) {
        const key = `${row.matchedMemberId}-${row.matchedCertId}`
        const info = certificationInfo[row.matchedCertId]
        const member = teamMembers.find(m => m.id === row.matchedMemberId)
        if (!info || !member) return
        
        const current = newMap.get(key)
        const isLifetime = row.isLifetime || info.isLifetime || false
        const assignment: CertificationAssignment = {
          memberId: row.matchedMemberId,
          memberName: member.name,
          certificationId: row.matchedCertId,
          certificationName: info.name,
          hasCert: true,
          expirationDate: isLifetime ? undefined : row.expirationDate,
          isLifetime
        }
        newMap.set(key, current ? { ...current, ...assignment } : assignment)
      }
    })
    return newMap
  }

  // Apply spreadsheet rows and go to grid (for editing/review)
  const _applySpreadsheetRows = () => {
    setAssignments(prev => mergeSpreadsheetIntoMap(prev))
    setImportMethod('grid')
  }

  // Apply spreadsheet rows and go straight to Step 5 (Compliance Review)
  const applySpreadsheetRowsAndContinue = () => {
    const newMap = mergeSpreadsheetIntoMap(assignments)
    setAssignments(newMap)
    const assignmentArray = Array.from(newMap.values()).filter(a => a.hasCert)
    onComplete(assignmentArray)
  }

  // Document dropzone config
  const { getRootProps: getDocRootProps, getInputProps: getDocInputProps, isDragActive: isDocDragActive } = useDropzone({
    onDrop: handleDocumentDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/heic': ['.heic']
    },
    maxFiles: 50,
    disabled: isProcessingDocs
  })

  // Spreadsheet dropzone config  
  const { getRootProps: getSheetRootProps, getInputProps: getSheetInputProps, isDragActive: isSheetDragActive } = useDropzone({
    onDrop: handleSpreadsheetDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    maxFiles: 1,
    disabled: isParsingSpreadsheet
  })

  // Calculate stats
  const stats = useMemo(() => {
    const totalPossible = teamMembers.length * selectedCerts.length
    let assigned = 0
    let withExpiration = 0
    
    assignments.forEach(a => {
      if (a.hasCert) {
        assigned++
        if (a.expirationDate || a.isLifetime) withExpiration++
      }
    })
    
    const memberStats = teamMembers.map(member => {
      let hasCerts = 0
      selectedCerts.forEach(certId => {
        const key = `${member.id}-${certId}`
        if (assignments.get(key)?.hasCert) hasCerts++
      })
      return {
        memberId: member.id,
        memberName: member.name,
        certsHeld: hasCerts,
        totalCerts: selectedCerts.length,
        complete: hasCerts === selectedCerts.length
      }
    })
    
    return {
      totalPossible,
      assigned,
      withExpiration,
      completionPercent: totalPossible > 0 ? Math.round((assigned / totalPossible) * 100) : 0,
      memberStats,
      fullyCompliant: memberStats.filter(m => m.complete).length
    }
  }, [assignments, teamMembers, selectedCerts])

  // Get cert info
  const getCertInfo = (certId: string): CertInfo => {
    return certificationInfo[certId] || { 
      id: certId, 
      name: certId, 
      shortName: certId, 
      isLifetime: false,
      category: 'industry' as const
    }
  }

  // Handle submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Convert map to array, only include assigned certs
    const assignmentArray = Array.from(assignments.values()).filter(a => a.hasCert)
    onComplete(assignmentArray)
  }

  // Empty state - no team members
  if (teamMembers.length === 0) {
    return (
      <div className="min-h-screen bg-[#F0F4F8] flex items-center justify-center font-mono">
        <div className="text-center max-w-md px-6">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-yellow-600" />
          </div>
          <h2 className="font-display text-2xl font-bold text-[#050505] mb-2">No Team Members</h2>
          <p className="text-gray-600 text-sm mb-6">
            You skipped adding team members. You can assign certifications to them later from the dashboard.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={onBack}
              className="px-6 py-3 border-2 border-gray-200 font-mono text-sm uppercase font-bold hover:border-gray-300"
            >
              Go Back
            </button>
            <button
              onClick={() => onComplete([])}
              className="bg-[#050505] text-white px-6 py-3 font-bold font-mono text-sm uppercase tracking-wider hover:bg-[#0038FF] transition-colors"
            >
              Continue →
            </button>
          </div>
        </div>
      </div>
    )
  }

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
              Capture Your<br />
              <span className="text-[#0038FF]">Certifications</span>
            </h2>
            
            <p className="text-gray-400 font-mono text-sm mb-8 leading-relaxed">
              Now let&apos;s record which certifications your team members hold.
              Choose the method that works best for you.
            </p>

            {/* Team context */}
            <div className="bg-white/5 border border-white/10 p-4">
              <div className="font-mono text-xs text-gray-400 uppercase mb-1">Your Team</div>
              <div className="font-display font-bold text-xl">{teamMembers.length} Team Members</div>
              <div className="font-mono text-sm text-gray-400 mt-1">
                Tracking {selectedCerts.length} cert types
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="relative z-10">
            <p className="font-mono text-xs text-gray-500">© 2026 IRONSTAMP SYSTEMS. BOSTON, MA.</p>
          </div>
        </div>

        {/* Right Side - Method Selection */}
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
                  <div className="w-10 h-1.5 bg-[#0038FF] rounded-full"></div>
                  <div className="w-10 h-1.5 bg-[#0038FF] rounded-full"></div>
                  <div className="w-10 h-1.5 bg-[#0038FF] rounded-full"></div>
                  <div className="w-10 h-1.5 bg-gray-200 rounded-full"></div>
                </div>
                <span className="font-mono text-xs text-gray-500 ml-2">Step 3 of 4</span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 px-6 md:px-12 py-6 md:py-8">
            <div className="max-w-2xl">
              {/* Header */}
              <div className="mb-8">
                <p className="text-[#0038FF] font-mono text-xs mb-1 uppercase tracking-wider">{`/// CERTIFICATION DATA ///`}</p>
                <h1 className="font-display text-3xl md:text-4xl font-bold uppercase text-[#050505]">
                  Add Certification Data
                </h1>
                <p className="text-gray-600 font-mono text-sm mt-2">
                  Choose how you&apos;d like to add your team&apos;s certifications.
                </p>
              </div>

              {/* Import Methods */}
              <div className="space-y-4">
                {/* Document Upload - Available with AI */}
                <button
                  type="button"
                  onClick={() => setImportMethod('documents')}
                  className="w-full p-6 border-2 border-gray-200 hover:border-[#0038FF] bg-white text-left transition-all group"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-purple-100 flex items-center justify-center flex-shrink-0 group-hover:bg-[#0038FF] transition-colors">
                      <FileImage className="w-6 h-6 text-purple-600 group-hover:text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-display font-bold text-lg text-[#050505] uppercase">Upload Cert Documents</h3>
                        <span className="bg-purple-100 text-purple-700 text-[10px] font-mono font-bold px-2 py-0.5 uppercase flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          AI Powered
                        </span>
                      </div>
                      <p className="font-mono text-sm text-gray-600 mt-1">
                        Upload PDFs or photos of certification cards. AI extracts names, cert types, and dates automatically.
                      </p>
                      <p className="font-mono text-[10px] text-gray-400 mt-2 uppercase">
                        Supported: PDF, JPG, PNG (up to 50 files)
                      </p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-[#0038FF] flex-shrink-0" />
                  </div>
                </button>

                {/* Spreadsheet Upload - Available */}
                <button
                  type="button"
                  onClick={() => setImportMethod('spreadsheet')}
                  className="w-full p-6 border-2 border-gray-200 hover:border-[#0038FF] bg-white text-left transition-all group"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-green-100 flex items-center justify-center flex-shrink-0 group-hover:bg-[#0038FF] transition-colors">
                      <FileSpreadsheet className="w-6 h-6 text-green-600 group-hover:text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-display font-bold text-lg text-[#050505] uppercase">Upload Cert Spreadsheet</h3>
                      <p className="font-mono text-sm text-gray-600 mt-1">
                        Import from Excel or CSV with employee names, cert types, and expiration dates.
                      </p>
                      <p className="font-mono text-[10px] text-gray-400 mt-2 uppercase">
                        Supported: .xlsx, .csv
                      </p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-[#0038FF] flex-shrink-0" />
                  </div>
                </button>

                {/* Grid Entry - Available */}
                <button
                  type="button"
                  onClick={() => setImportMethod('grid')}
                  className="w-full p-6 border-2 border-gray-200 hover:border-[#0038FF] bg-white text-left transition-all group"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-[#0038FF]/10 flex items-center justify-center flex-shrink-0 group-hover:bg-[#0038FF] transition-colors">
                      <Grid3X3 className="w-6 h-6 text-[#0038FF] group-hover:text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-display font-bold text-lg text-[#050505] uppercase">Mark Who Has What</h3>
                      <p className="font-mono text-sm text-gray-600 mt-1">
                        Use our smart grid to check which certifications each team member holds. Set expiration dates for non-lifetime certs.
                      </p>
                      <p className="font-mono text-[10px] text-gray-400 mt-2 uppercase">
                        Best for: When you know your team&apos;s certs but don&apos;t have digital files ready
                      </p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-[#0038FF] flex-shrink-0" />
                  </div>
                </button>

                {/* Invite Technicians - Coming Soon */}
                <div className="p-6 border-2 border-gray-200 bg-white opacity-70 relative">
                  <div className="absolute top-4 right-4">
                    <span className="bg-gray-100 text-gray-500 text-[10px] font-mono font-bold px-2 py-1 uppercase">Coming Soon</span>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <Send className="w-6 h-6 text-gray-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-display font-bold text-lg text-gray-500 uppercase">Invite Technicians</h3>
                      <p className="font-mono text-sm text-gray-400 mt-1">
                        Send invite links so technicians can upload their own certifications. You verify and approve.
                      </p>
                      <p className="font-mono text-[10px] text-gray-400 mt-2 uppercase">
                        Available from dashboard after onboarding
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Skip option */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => onComplete([])}
                  className="text-gray-500 hover:text-[#0038FF] font-mono text-sm uppercase tracking-wider transition-colors"
                >
                  Skip for now — I&apos;ll add certification data from the dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ==================== DOCUMENT UPLOAD VIEW ====================
  if (importMethod === 'documents') {
    const successCount = extractedCerts.filter(c => c.status === 'success').length
    const matchedCount = extractedCerts.filter(c => c.status === 'success' && c.matchedMemberId && c.matchedCertId).length
    
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

          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <img src="/IronStampLogov3.png" alt="IronStamp" className="h-10 w-auto brightness-0 invert" />
              <span className="font-display font-bold text-3xl tracking-tighter">IRONSTAMP</span>
            </div>
          </div>

          <div className="relative z-10 flex-1 flex flex-col justify-center">
            <h2 className="font-display text-2xl font-bold mb-4 uppercase">
              AI Document<br />
              <span className="text-purple-400">Extraction</span>
            </h2>
            
            <p className="text-gray-400 font-mono text-sm mb-8">
              Upload certification documents and our AI will extract employee names, cert types, and expiration dates.
            </p>

            {extractedCerts.length > 0 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 border border-white/10 p-3">
                    <div className="font-display text-2xl font-bold text-purple-400">{extractedCerts.length}</div>
                    <div className="font-mono text-[10px] text-gray-400 uppercase">Files Uploaded</div>
                  </div>
                  <div className="bg-white/5 border border-white/10 p-3">
                    <div className="font-display text-2xl font-bold text-green-400">{successCount}</div>
                    <div className="font-mono text-[10px] text-gray-400 uppercase">Extracted</div>
                  </div>
                </div>
                <div className="bg-white/5 border border-white/10 p-3">
                  <div className="font-display text-2xl font-bold">{matchedCount}/{successCount}</div>
                  <div className="font-mono text-[10px] text-gray-400 uppercase">Ready to Apply</div>
                </div>
              </div>
            )}
          </div>

          <div className="relative z-10">
            <p className="font-mono text-xs text-gray-500">© 2026 IRONSTAMP SYSTEMS. BOSTON, MA.</p>
          </div>
        </div>

        {/* Right Side - Upload Interface */}
        <div className="flex-1 flex flex-col bg-tech-grid relative overflow-y-auto">
          {/* Desktop back button (floats over content) */}
          <div className="hidden lg:block absolute top-6 left-6">
            <button 
              onClick={() => setImportMethod('none')}
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
                onClick={() => setImportMethod('none')}
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

          <div className="px-6 md:px-12 pt-8 md:pt-16 lg:pt-20">
            <div className="max-w-3xl">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex gap-2">
                  <div className="w-10 h-1.5 bg-[#0038FF] rounded-full"></div>
                  <div className="w-10 h-1.5 bg-[#0038FF] rounded-full"></div>
                  <div className="w-10 h-1.5 bg-[#0038FF] rounded-full"></div>
                  <div className="w-10 h-1.5 bg-gray-200 rounded-full"></div>
                </div>
                <span className="font-mono text-xs text-gray-500 ml-2">Step 3 of 4</span>
              </div>
            </div>
          </div>

          <div className="flex-1 px-6 md:px-12 py-6 md:py-8">
            <div className="max-w-3xl">
              <div className="mb-6">
                <p className="text-purple-600 font-mono text-xs mb-1 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  {`/// AI EXTRACTION ///`}
                </p>
                <h1 className="font-display text-3xl font-bold uppercase text-[#050505]">
                  Upload Cert Documents
                </h1>
                <p className="text-gray-600 font-mono text-sm mt-2">
                  Drop your certification PDFs, photos, or scanned documents below.
                </p>
              </div>

              {/* Drop Zone */}
              <div
                {...getDocRootProps()}
                className={`p-8 border-2 border-dashed transition-all cursor-pointer mb-6 ${
                  isDocDragActive
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-300 hover:border-purple-400 bg-white'
                }`}
              >
                <input {...getDocInputProps()} />
                <div className="text-center">
                  {isProcessingDocs ? (
                    <>
                      <Loader2 className="w-10 h-10 text-purple-500 mx-auto mb-3 animate-spin" />
                      <p className="font-mono text-sm text-gray-600">Processing documents with AI...</p>
                    </>
                  ) : (
                    <>
                      <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                      <p className="font-mono text-sm text-gray-600">
                        Drag & drop certification files here, or click to browse
                      </p>
                      <p className="font-mono text-[10px] text-gray-400 mt-2 uppercase">
                        PDF, JPG, PNG • Up to 50 files • Max 5MB each
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* Extracted Certs List */}
              {extractedCerts.length > 0 && (
                <div className="space-y-4 mb-6">
                  <div className="flex items-center justify-between">
                    <h3 className="font-mono text-xs text-gray-500 uppercase">Extracted Certifications ({extractedCerts.length})</h3>
                    {extractedCerts.some(c => c.issues && Object.values(c.issues).some(v => v)) && (
                      <span className="text-xs text-orange-600 font-mono">
                        {extractedCerts.filter(c => c.issues && Object.values(c.issues).some(v => v)).length} need{extractedCerts.filter(c => c.issues && Object.values(c.issues).some(v => v)).length !== 1 ? '' : 's'} review
                      </span>
                    )}
                  </div>
                  
                  {extractedCerts.map(cert => {
                    const isEditing = editingMatches.has(cert.id)
                    const hasIssues = cert.issues && Object.values(cert.issues).some(v => v)
                    const needsReview = hasIssues || !cert.matchedMemberId || !cert.matchedCertId
                    const data = cert.editedData ? { ...cert.extractedData, ...cert.editedData } : cert.extractedData
                    const isImage = cert.filePreviewUrl && (cert.fileName.toLowerCase().endsWith('.jpg') || cert.fileName.toLowerCase().endsWith('.jpeg') || cert.fileName.toLowerCase().endsWith('.png'))
                    
                    return (
                      <div key={cert.id} className={`border-2 bg-white rounded-lg overflow-hidden ${
                        cert.status === 'success' 
                          ? needsReview ? 'border-orange-300' : 'border-green-300'
                          : cert.status === 'error' ? 'border-red-300' 
                          : cert.status === 'processing' ? 'border-purple-300' 
                          : 'border-gray-200'
                      }`}>
                        {/* Header */}
                        <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {cert.status === 'processing' && <Loader2 className="w-5 h-5 text-purple-500 animate-spin" />}
                            {cert.status === 'success' && <CheckCircle className={`w-5 h-5 ${needsReview ? 'text-orange-500' : 'text-green-500'}`} />}
                            {cert.status === 'error' && <AlertCircle className="w-5 h-5 text-red-500" />}
                            {cert.status === 'pending' && <File className="w-5 h-5 text-gray-400" />}
                            <div>
                              <div className="font-mono text-sm font-bold text-[#050505]">{cert.fileName}</div>
                              {cert.status === 'success' && data && (
                                <div className="flex items-center gap-2 mt-1">
                                  <span className={`text-xs font-mono px-2 py-0.5 rounded ${
                                    (data.confidence ?? 0) >= 0.9 ? 'bg-green-100 text-green-700' :
                                    (data.confidence ?? 0) >= 0.7 ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-red-100 text-red-700'
                                  }`}>
                                    {Math.round((data.confidence ?? 0) * 100)}% confidence
                                  </span>
                                  {hasIssues && (
                                    <span className="text-xs text-orange-600 font-mono">⚠ Review needed</span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeExtractedCert(cert.id)}
                            className="text-gray-400 hover:text-red-500 p-1"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        {cert.status === 'processing' && (
                          <div className="p-4">
                            <p className="font-mono text-xs text-purple-600">Extracting with AI...</p>
                          </div>
                        )}
                        
                        {cert.status === 'error' && (
                          <div className="p-4">
                            <p className="font-mono text-xs text-red-600">{cert.error}</p>
                          </div>
                        )}
                        
                        {cert.status === 'success' && data && (
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-4">
                            {/* File Preview */}
                            <div className="lg:col-span-1">
                              <Label className="text-[10px] font-mono text-gray-500 uppercase mb-2 block">Document Preview</Label>
                              {cert.filePreviewUrl && (
                                <div className="border border-gray-200 rounded bg-gray-50 overflow-hidden">
                                  {isImage ? (
                                    <img 
                                      src={cert.filePreviewUrl} 
                                      alt={cert.fileName}
                                      className="w-full h-auto max-h-64 object-contain"
                                    />
                                  ) : (
                                    <div className="p-8 text-center">
                                      <FileImage className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                                      <p className="text-xs text-gray-500 font-mono">{cert.fileName}</p>
                                      <a 
                                        href={cert.filePreviewUrl} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-xs text-[#0038FF] hover:underline mt-2 inline-block"
                                      >
                                        Open in new tab
                                      </a>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Extracted Data */}
                            <div className="lg:col-span-2 space-y-3">
                              <Label className="text-[10px] font-mono text-gray-500 uppercase block">Extracted Information</Label>
                              
                              {/* Data Grid */}
                              <div className="grid grid-cols-2 gap-3 text-sm">
                                <div>
                                  <Label className="text-[10px] font-mono text-gray-500 uppercase">Employee Name</Label>
                                  {isEditing ? (
                                    <Input
                                      value={cert.editedData?.employeeName ?? data.employeeName}
                                      onChange={(e) => updateExtractedCertData(cert.id, 'employeeName', e.target.value)}
                                      className="h-8 text-xs mt-1"
                                    />
                                  ) : (
                                    <div className={`mt-1 px-2 py-1.5 rounded font-mono text-xs ${
                                      cert.issues?.nameMismatch ? 'bg-orange-50 border border-orange-200' : 'bg-gray-50'
                                    }`}>
                                      {data.employeeName || <span className="text-gray-400">Not found</span>}
                                    </div>
                                  )}
                                </div>

                                <div>
                                  <Label className="text-[10px] font-mono text-gray-500 uppercase">Certification Type</Label>
                                  {isEditing ? (
                                    <Input
                                      value={cert.editedData?.certificationName ?? data.certificationName}
                                      onChange={(e) => updateExtractedCertData(cert.id, 'certificationName', e.target.value)}
                                      className="h-8 text-xs mt-1"
                                    />
                                  ) : (
                                    <div className={`mt-1 px-2 py-1.5 rounded font-mono text-xs ${
                                      cert.issues?.unmatchedCertType ? 'bg-orange-50 border border-orange-200' : 'bg-purple-50'
                                    }`}>
                                      {data.certificationName || <span className="text-gray-400">Not found</span>}
                                    </div>
                                  )}
                                </div>

                                <div>
                                  <Label className="text-[10px] font-mono text-gray-500 uppercase">License Number</Label>
                                  {isEditing ? (
                                    <Input
                                      value={cert.editedData?.licenseNumber ?? data.licenseNumber ?? ''}
                                      onChange={(e) => updateExtractedCertData(cert.id, 'licenseNumber', e.target.value || null)}
                                      className="h-8 text-xs mt-1"
                                      placeholder="Not found"
                                    />
                                  ) : (
                                    <div className={`mt-1 px-2 py-1.5 rounded font-mono text-xs ${
                                      cert.issues?.missingLicenseNumber ? 'bg-orange-50 border border-orange-200' : 'bg-gray-50'
                                    }`}>
                                      {data.licenseNumber || <span className="text-gray-400">Not found</span>}
                                    </div>
                                  )}
                                </div>

                                <div>
                                  <Label className="text-[10px] font-mono text-gray-500 uppercase">Issue Date</Label>
                                  {isEditing ? (
                                    <Input
                                      type="date"
                                      value={cert.editedData?.issueDate ?? data.issueDate ?? ''}
                                      onChange={(e) => updateExtractedCertData(cert.id, 'issueDate', e.target.value || null)}
                                      className="h-8 text-xs mt-1"
                                    />
                                  ) : (
                                    <div className={`mt-1 px-2 py-1.5 rounded font-mono text-xs ${
                                      cert.issues?.missingIssueDate ? 'bg-orange-50 border border-orange-200' : 'bg-gray-50'
                                    }`}>
                                      {formatDateDisplay(data.issueDate) || <span className="text-gray-400">Not found</span>}
                                    </div>
                                  )}
                                </div>

                                <div>
                                  <Label className="text-[10px] font-mono text-gray-500 uppercase">Expiration Date</Label>
                                  {data.isLifetime ? (
                                    <div className="mt-1 px-2 py-1.5 rounded font-mono text-xs bg-green-50 flex items-center gap-1">
                                      <Infinity className="w-3 h-3" /> Lifetime
                                    </div>
                                  ) : isEditing ? (
                                    <Input
                                      type="date"
                                      value={cert.editedData?.expirationDate ?? data.expirationDate ?? ''}
                                      onChange={(e) => updateExtractedCertData(cert.id, 'expirationDate', e.target.value || null)}
                                      className="h-8 text-xs mt-1"
                                    />
                                  ) : (
                                    <div className={`mt-1 px-2 py-1.5 rounded font-mono text-xs ${
                                      cert.issues?.missingExpirationDate ? 'bg-orange-50 border border-orange-200' : 'bg-blue-50'
                                    }`}>
                                      {formatDateDisplay(data.expirationDate) || <span className="text-gray-400">Not found</span>}
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Issue Flags */}
                              {hasIssues && (
                                <div className="bg-orange-50 border border-orange-200 rounded p-3">
                                  <div className="flex items-start gap-2 mb-2">
                                    <AlertCircle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                                    <div className="flex-1">
                                      <div className="text-xs font-mono font-bold text-orange-900 mb-1">Issues Detected:</div>
                                      <ul className="text-xs font-mono text-orange-800 space-y-1">
                                        {cert.issues?.lowConfidence && <li>• Low AI confidence ({Math.round((data.confidence ?? 0) * 100)}%)</li>}
                                        {cert.issues?.nameMismatch && <li>• Employee name not matched to team member</li>}
                                        {cert.issues?.missingLicenseNumber && <li>• License number not found</li>}
                                        {cert.issues?.missingIssueDate && <li>• Issue date not found</li>}
                                        {cert.issues?.missingExpirationDate && <li>• Expiration date not found</li>}
                                        {cert.issues?.unmatchedEmployee && <li>• Could not match to team member</li>}
                                        {cert.issues?.unmatchedCertType && <li>• Could not match certification type</li>}
                                      </ul>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Matching Section */}
                              <div className="border-t border-gray-200 pt-3">
                                {(() => {
                                  const hasMatch = Boolean(cert.matchedMemberId && cert.matchedCertId)
                                  const matchedMemberName = cert.matchedMemberId
                                    ? teamMembers.find(m => m.id === cert.matchedMemberId)?.name
                                    : undefined
                                  const matchedCertShortName = cert.matchedCertId
                                    ? getCertInfo(cert.matchedCertId).shortName
                                    : undefined

                                  if (hasMatch && !isEditing) {
                                    return (
                                      <div className="flex items-center justify-between">
                                        <div>
                                          <Label className="text-[10px] font-mono text-gray-500 uppercase block mb-1">Matched To:</Label>
                                          <div className="flex flex-wrap gap-2">
                                            <span className="bg-green-100 text-green-700 px-2 py-1 rounded font-mono text-xs">
                                              {matchedMemberName}
                                            </span>
                                            <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded font-mono text-xs">
                                              {matchedCertShortName}
                                            </span>
                                          </div>
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() => toggleMatchEditing(cert.id)}
                                          className="text-gray-500 hover:text-[#0038FF] font-mono text-[10px] uppercase tracking-wider flex items-center gap-1"
                                        >
                                          <Edit2 className="w-3 h-3" /> Edit
                                        </button>
                                      </div>
                                    )
                                  }

                                  return (
                                    <div>
                                      <Label className="text-[10px] font-mono text-gray-500 uppercase block mb-2">
                                        {hasMatch ? 'Update Match' : 'Match to Team Member & Cert Type'}
                                      </Label>
                                      <div className="grid grid-cols-2 gap-2">
                                        <div>
                                          <Select
                                            value={cert.matchedMemberId || ''}
                                            onValueChange={(v) => updateExtractedCertMember(cert.id, v)}
                                          >
                                            <SelectTrigger className="h-8 text-xs">
                                              <SelectValue placeholder="Select employee..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                              {teamMembers.map(m => (
                                                <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                                              ))}
                                            </SelectContent>
                                          </Select>
                                        </div>
                                        <div>
                                          <Select
                                            value={cert.matchedCertId || ''}
                                            onValueChange={(v) => updateExtractedCertType(cert.id, v)}
                                          >
                                            <SelectTrigger className="h-8 text-xs">
                                              <SelectValue placeholder="Select cert type..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                              {/* Show all available certifications, not just selectedCerts
                                                  This allows users to match certs they uploaded but didn't select in Step 3 */}
                                              {Object.keys(certificationInfo).map(cId => {
                                                const info = getCertInfo(cId)
                                                const isSelected = selectedCerts.includes(cId)
                                                return (
                                                  <SelectItem key={cId} value={cId}>
                                                    <span className={isSelected ? '' : 'text-gray-500'}>
                                                      {info.shortName}
                                                      {!isSelected && ' (not in requirements)'}
                                                    </span>
                                                  </SelectItem>
                                                )
                                              })}
                                            </SelectContent>
                                          </Select>
                                        </div>
                                      </div>
                                      {isEditing && (
                                        <div className="flex gap-2 mt-2">
                                          <button
                                            type="button"
                                            onClick={() => {
                                              saveEditedCertData(cert.id)
                                              if (cert.matchedMemberId && cert.matchedCertId) {
                                                toggleMatchEditing(cert.id)
                                              }
                                            }}
                                            className="text-xs bg-[#0038FF] text-white px-3 py-1.5 rounded font-mono uppercase hover:bg-[#0028CC]"
                                          >
                                            Save
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => cancelEditingCertData(cert.id)}
                                            className="text-xs bg-gray-200 text-gray-700 px-3 py-1.5 rounded font-mono uppercase hover:bg-gray-300"
                                          >
                                            Cancel
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  )
                                })()}
                              </div>

                              {/* Edit Data Button */}
                              {!isEditing && (
                                <button
                                  type="button"
                                  onClick={() => toggleMatchEditing(cert.id)}
                                  className="w-full text-xs text-gray-600 hover:text-[#0038FF] font-mono uppercase tracking-wider py-2 border border-gray-200 rounded hover:border-[#0038FF] transition-colors"
                                >
                                  Edit Extracted Data
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Navigation */}
              <div className="flex justify-between items-center pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setImportMethod('none')}
                  className="text-gray-600 hover:text-[#0038FF] font-mono text-sm uppercase tracking-wider transition-colors flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>

                <div className="flex gap-3">
                  {matchedCount > 0 && (
                    <button
                      type="button"
                      onClick={applyExtractedCerts}
                      className="bg-[#050505] text-white px-6 py-3 font-bold font-mono text-sm uppercase tracking-wider hover:bg-[#0038FF] transition-colors shadow-[4px_4px_0px_#0038FF]"
                    >
                      Apply {matchedCount} Cert{matchedCount !== 1 ? 's' : ''} →
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setImportMethod('grid')}
                    className="text-gray-600 hover:text-[#0038FF] font-mono text-sm uppercase tracking-wider transition-colors"
                  >
                    Skip to Grid →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ==================== SPREADSHEET UPLOAD VIEW ====================
  if (importMethod === 'spreadsheet') {
    const validRows = spreadsheetRows.filter(r => r.matchedMemberId && r.matchedCertId).length
    
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

          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <img src="/IronStampLogov3.png" alt="IronStamp" className="h-10 w-auto brightness-0 invert" />
              <span className="font-display font-bold text-3xl tracking-tighter">IRONSTAMP</span>
            </div>
          </div>

          <div className="relative z-10 flex-1 flex flex-col justify-center">
            <h2 className="font-display text-2xl font-bold mb-4 uppercase">
              Spreadsheet<br />
              <span className="text-green-400">Import</span>
            </h2>
            
            <p className="text-gray-400 font-mono text-sm mb-8">
              Upload your existing certification tracking spreadsheet and we&apos;ll match entries to your team.
            </p>

            {spreadsheetRows.length > 0 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 border border-white/10 p-3">
                    <div className="font-display text-2xl font-bold text-green-400">{spreadsheetRows.length}</div>
                    <div className="font-mono text-[10px] text-gray-400 uppercase">Rows Found</div>
                  </div>
                  <div className="bg-white/5 border border-white/10 p-3">
                    <div className="font-display text-2xl font-bold">{validRows}</div>
                    <div className="font-mono text-[10px] text-gray-400 uppercase">Ready to Apply</div>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-8 p-4 bg-green-500/10 border border-green-500/30">
              <p className="font-mono text-xs text-green-300">
                <strong>Tip:</strong> Your spreadsheet should have columns for employee name, certification type, and expiration date.
              </p>
            </div>
          </div>

          <div className="relative z-10">
            <p className="font-mono text-xs text-gray-500">© 2026 IRONSTAMP SYSTEMS. BOSTON, MA.</p>
          </div>
        </div>

        {/* Right Side - Upload Interface */}
        <div className="flex-1 flex flex-col bg-tech-grid relative overflow-y-auto">
          {/* Desktop back button (floats over content) */}
          <div className="hidden lg:block absolute top-6 left-6">
            <button 
              onClick={() => setImportMethod('none')}
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
                onClick={() => setImportMethod('none')}
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

          <div className="px-6 md:px-12 pt-8 md:pt-16 lg:pt-20">
            <div className="max-w-3xl">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex gap-2">
                  <div className="w-10 h-1.5 bg-[#0038FF] rounded-full"></div>
                  <div className="w-10 h-1.5 bg-[#0038FF] rounded-full"></div>
                  <div className="w-10 h-1.5 bg-[#0038FF] rounded-full"></div>
                  <div className="w-10 h-1.5 bg-gray-200 rounded-full"></div>
                </div>
                <span className="font-mono text-xs text-gray-500 ml-2">Step 3 of 4</span>
              </div>
            </div>
          </div>

          <div className="flex-1 px-6 md:px-12 py-6 md:py-8">
            <div className="max-w-3xl">
              <div className="mb-6">
                <p className="text-green-600 font-mono text-xs mb-1 uppercase tracking-wider">{`/// SPREADSHEET IMPORT ///`}</p>
                <h1 className="font-display text-3xl font-bold uppercase text-[#050505]">
                  Upload Cert Spreadsheet
                </h1>
                <p className="text-gray-600 font-mono text-sm mt-2">
                  Import from Excel or CSV with employee names, cert types, and expiration dates.
                </p>
              </div>

              {spreadsheetRows.length === 0 ? (
                <>
                  {/* Drop Zone */}
                  <div
                    {...getSheetRootProps()}
                    className={`p-8 border-2 border-dashed transition-all cursor-pointer mb-6 ${
                      isSheetDragActive
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-300 hover:border-green-400 bg-white'
                    }`}
                  >
                    <input {...getSheetInputProps()} />
                    <div className="text-center">
                      {isParsingSpreadsheet ? (
                        <>
                          <Loader2 className="w-10 h-10 text-green-500 mx-auto mb-3 animate-spin" />
                          <p className="font-mono text-sm text-gray-600">Parsing spreadsheet...</p>
                        </>
                      ) : (
                        <>
                          <FileSpreadsheet className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                          <p className="font-mono text-sm text-gray-600">
                            Drag & drop your spreadsheet here, or click to browse
                          </p>
                          <p className="font-mono text-[10px] text-gray-400 mt-2 uppercase">
                            Excel (.xlsx) or CSV
                          </p>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Format Tips */}
                  <div className="p-4 bg-gray-50 border-2 border-gray-200">
                    <h4 className="font-mono text-xs font-bold text-gray-700 uppercase mb-2">Expected Format (columns we look for)</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs font-mono">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-2 px-2 text-gray-500">Tech Name</th>
                            <th className="text-left py-2 px-2 text-gray-500">Certification Type</th>
                            <th className="text-left py-2 px-2 text-gray-500">License #</th>
                            <th className="text-left py-2 px-2 text-gray-500">Issue Date</th>
                            <th className="text-left py-2 px-2 text-gray-500">Expiration</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-gray-100">
                            <td className="py-2 px-2">Leo Sterling</td>
                            <td className="py-2 px-2">MA Refrigeration</td>
                            <td className="py-2 px-2">RT-189234</td>
                            <td className="py-2 px-2">03/15/2024</td>
                            <td className="py-2 px-2">03/15/2026</td>
                          </tr>
                          <tr>
                            <td className="py-2 px-2">Maya Joshi</td>
                            <td className="py-2 px-2">EPA 608 Universal</td>
                            <td className="py-2 px-2">EPA-998122</td>
                            <td className="py-2 px-2">01/20/2018</td>
                            <td className="py-2 px-2">N/A (Lifetime)</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <p className="font-mono text-[10px] text-gray-500 mt-2">
                      Column headers can vary - we detect &quot;name&quot;, &quot;certification type&quot;, &quot;license #&quot;, &quot;issue date&quot;, &quot;expiration&quot;
                    </p>
                  </div>
                </>
              ) : (
                <>
                  {/* Parsed Rows */}
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center justify-between">
                      <h3 className="font-mono text-xs text-gray-500 uppercase">Parsed Rows ({spreadsheetRows.length})</h3>
                      <button
                        type="button"
                        onClick={() => setSpreadsheetRows([])}
                        className="text-xs text-gray-500 hover:text-red-500 font-mono uppercase"
                      >
                        Clear & Re-upload
                      </button>
                    </div>
                    
                    <div className="max-h-96 overflow-y-auto space-y-2">
                      {spreadsheetRows.map(row => (
                        <div key={row.id} className={`p-3 border-2 bg-white ${
                          row.matchedMemberId && row.matchedCertId ? 'border-green-300' :
                          row.issues.length > 0 ? 'border-yellow-300' : 'border-gray-200'
                        }`}>
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 mt-1">
                              {row.matchedMemberId && row.matchedCertId ? (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              ) : (
                                <AlertCircle className="w-4 h-4 text-yellow-500" />
                              )}
                            </div>
                            
                            <div className="flex-1">
                              {/* Row 1: Employee + Certification */}
                              <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                                <div>
                                  <Label className="text-[10px] font-mono text-gray-400 uppercase">Employee</Label>
                                  <p className="font-mono font-bold">{row.employeeName || '-'}</p>
                                </div>
                                <div>
                                  <Label className="text-[10px] font-mono text-gray-400 uppercase">Certification Type</Label>
                                  <p className="font-mono font-bold">{row.certificationName || '-'}</p>
                                </div>
                              </div>
                              
                              {/* Row 2: License #, Issue Date, Expiration */}
                              <div className="grid grid-cols-3 gap-2 text-xs">
                                {row.licenseNumber && (
                                  <div>
                                    <Label className="text-[10px] font-mono text-gray-400 uppercase">License #</Label>
                                    <p className="font-mono text-gray-600">{row.licenseNumber}</p>
                                  </div>
                                )}
                                {row.issueDate && (
                                  <div>
                                    <Label className="text-[10px] font-mono text-gray-400 uppercase">Issue Date</Label>
                                    <p className="font-mono text-gray-600">{formatDateDisplay(row.issueDate)}</p>
                                  </div>
                                )}
                                <div>
                                  <Label className="text-[10px] font-mono text-gray-400 uppercase">Expiration</Label>
                                  <p className={`font-mono ${row.isLifetime ? 'text-green-600' : 'text-gray-600'}`}>
                                    {row.isLifetime ? '∞ Lifetime' : (formatDateDisplay(row.expirationDate) || 'N/A')}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {row.issues.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {row.issues.map((issue, idx) => (
                                <span key={idx} className="text-[10px] font-mono bg-yellow-100 text-yellow-700 px-2 py-0.5">
                                  {issue}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Navigation */}
              <div className="pt-6 border-t border-gray-200">
                {validRows > 0 && (
                  <p className="font-mono text-xs text-gray-500 mb-3">
                    {validRows} certification{validRows !== 1 ? 's' : ''} will be applied to your team. Go straight to the next step or edit in the grid first.
                  </p>
                )}
                <div className="flex justify-between items-center">
                  <button
                    type="button"
                    onClick={() => {
                      setSpreadsheetRows([])
                      setImportMethod('none')
                    }}
                    className="text-gray-600 hover:text-[#0038FF] font-mono text-sm uppercase tracking-wider transition-colors flex items-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </button>

                  <div className="flex flex-col gap-2">
                    <div className="flex flex-wrap gap-3 items-center">
                      {validRows > 0 && (
                        <button
                          type="button"
                          onClick={applySpreadsheetRowsAndContinue}
                          className="bg-[#050505] text-white px-6 py-3 font-bold font-mono text-sm uppercase tracking-wider hover:bg-[#0038FF] transition-colors shadow-[4px_4px_0px_#0038FF]"
                        >
                          Apply & continue →
                        </button>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setImportMethod('grid')}
                      className="text-gray-400 hover:text-[#0038FF] font-mono text-xs uppercase tracking-wider transition-colors text-left"
                    >
                      Skip to grid (start fresh)
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ==================== GRID VIEW (existing) ====================
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
          <h2 className="font-display text-2xl font-bold mb-2 uppercase">
            Assign<br />
            <span className="text-[#0038FF]">Certifications</span>
          </h2>
          
          <p className="text-gray-400 font-mono text-sm mb-8">
            Check which certifications each team member holds. 
            This builds your compliance baseline.
          </p>

          {/* Progress Stats */}
          <div className="space-y-4 mb-8">
            <div className="bg-white/5 border border-white/10 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs text-gray-400 uppercase">Completion</span>
                <span className="font-display text-2xl font-bold text-[#0038FF]">{stats.completionPercent}%</span>
              </div>
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#0038FF] transition-all duration-300"
                  style={{ width: `${stats.completionPercent}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 border border-white/10 p-3">
                <div className="font-display text-2xl font-bold">{stats.assigned}</div>
                <div className="font-mono text-[10px] text-gray-400 uppercase">Certs Assigned</div>
              </div>
              <div className="bg-white/5 border border-white/10 p-3">
                <div className="font-display text-2xl font-bold text-green-500">{stats.fullyCompliant}</div>
                <div className="font-mono text-[10px] text-gray-400 uppercase">Fully Compliant</div>
              </div>
            </div>
          </div>

          {/* Tips */}
          <div className="bg-[#0038FF]/10 border border-[#0038FF]/30 p-4">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-[#0038FF] flex-shrink-0 mt-0.5" />
              <div className="font-mono text-xs text-gray-300">
                <strong className="text-white">Tip:</strong> Use bulk actions to quickly assign certs that everyone has (like EPA 608).
                You can upload actual cert documents later.
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10">
          <p className="font-mono text-xs text-gray-500">© 2026 IRONSTAMP SYSTEMS. BOSTON, MA.</p>
        </div>
      </div>

      {/* Right Side - Assignment Matrix */}
      <div className="flex-1 flex flex-col bg-tech-grid relative overflow-y-auto">
        {/* Desktop back button (floats over content) */}
        <div className="hidden lg:block absolute top-6 left-6">
          <button 
            onClick={() => setImportMethod('none')}
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
              onClick={() => setImportMethod('none')}
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
          <div className="max-w-4xl">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex gap-2">
                <div className="w-10 h-1.5 bg-[#0038FF] rounded-full"></div>
                <div className="w-10 h-1.5 bg-[#0038FF] rounded-full"></div>
                <div className="w-10 h-1.5 bg-[#0038FF] rounded-full"></div>
                <div className="w-10 h-1.5 bg-gray-200 rounded-full"></div>
              </div>
              <span className="font-mono text-xs text-gray-500 ml-2">Step 3 of 4</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 px-6 md:px-12 py-6 md:py-8">
          <div className="max-w-4xl">
            {/* Header */}
            <div className="mb-6">
              <p className="text-[#0038FF] font-mono text-xs mb-1 uppercase tracking-wider">{`/// CERTIFICATION MATRIX ///`}</p>
              <h1 className="font-display text-3xl md:text-4xl font-bold uppercase text-[#050505]">
                Mark Who Has What
              </h1>
              <p className="text-gray-600 font-mono text-sm mt-2">
                Check which certifications each team member currently holds. You can upload actual documents later.
              </p>
            </div>

            {/* Bulk Actions */}
            <div className="mb-6">
              <button
                type="button"
                onClick={() => setShowBulkActions(!showBulkActions)}
                className="flex items-center gap-2 text-[#0038FF] font-mono text-sm font-bold uppercase"
              >
                <Shield className="w-4 h-4" />
                Bulk Actions
                {showBulkActions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              
              {showBulkActions && (
                <div className="mt-3 p-4 bg-white border-2 border-gray-200">
                  <p className="font-mono text-xs text-gray-500 uppercase mb-3">Assign to all team members:</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedCerts.map(certId => {
                      const info = getCertInfo(certId)
                      // Check if all members have this cert
                      const allHave = teamMembers.every(m => assignments.get(`${m.id}-${certId}`)?.hasCert)
                      
                      return (
                        <button
                          key={certId}
                          type="button"
                          onClick={() => bulkAssignCert(certId, !allHave)}
                          className={`px-3 py-1.5 text-xs font-mono font-bold uppercase transition-all border-2 ${
                            allHave
                              ? 'bg-[#0038FF] text-white border-[#0038FF]'
                              : 'bg-white text-gray-600 border-gray-200 hover:border-[#0038FF]'
                          }`}
                        >
                          {allHave ? '✓ ' : ''}{info.shortName}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Team Members with Certifications */}
            <div className="space-y-4 mb-8">
              {teamMembers.map(member => {
                const memberStat = stats.memberStats.find(m => m.memberId === member.id)
                const isExpanded = expandedMembers.has(member.id)
                
                return (
                  <div 
                    key={member.id}
                    className={`border-2 bg-white transition-all ${
                      memberStat?.complete ? 'border-green-400' : 'border-gray-200'
                    }`}
                  >
                    {/* Member Header */}
                    <button
                      type="button"
                      onClick={() => toggleMemberExpand(member.id)}
                      className="w-full p-4 flex items-center justify-between text-left"
                    >
                      <div className="flex items-center gap-3">
                        {/* Avatar */}
                        <div className={`w-10 h-10 flex items-center justify-center flex-shrink-0 ${
                          memberStat?.complete ? 'bg-green-100' : 'bg-gray-100'
                        }`}>
                          {memberStat?.complete ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : (
                            <span className="font-mono text-xs font-bold text-gray-600">
                              {member.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                            </span>
                          )}
                        </div>
                        
                        <div>
                          <div className="font-display font-bold text-[#050505]">{member.name}</div>
                          <div className="font-mono text-xs text-gray-500">{member.role}</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className={`font-mono text-sm font-bold ${
                            memberStat?.complete ? 'text-green-600' : 'text-gray-600'
                          }`}>
                            {memberStat?.certsHeld}/{memberStat?.totalCerts}
                          </div>
                          <div className="font-mono text-[10px] text-gray-400 uppercase">Certs</div>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                    </button>
                    
                    {/* Expanded Certification List */}
                    {isExpanded && (
                      <div className="border-t-2 border-gray-100 p-4 space-y-3">
                        {selectedCerts.map(certId => {
                          const info = getCertInfo(certId)
                          const key = `${member.id}-${certId}`
                          const assignment = assignments.get(key)
                          
                          return (
                            <div 
                              key={certId}
                              className={`p-3 border transition-all ${
                                assignment?.hasCert 
                                  ? 'border-[#0038FF] bg-[#0038FF]/5' 
                                  : 'border-gray-200'
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <Checkbox
                                  id={key}
                                  checked={assignment?.hasCert || false}
                                  onCheckedChange={() => toggleCert(member.id, certId)}
                                  className="mt-0.5"
                                />
                                <div className="flex-1 min-w-0">
                                  <label 
                                    htmlFor={key}
                                    className="font-display font-bold text-sm text-[#050505] cursor-pointer block"
                                  >
                                    {info.shortName}
                                  </label>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className={`text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 ${
                                      info.category === 'federal' ? 'bg-purple-100 text-purple-700' :
                                      info.category === 'state' ? 'bg-blue-100 text-blue-700' :
                                      info.category === 'safety' ? 'bg-orange-100 text-orange-700' :
                                      'bg-gray-100 text-gray-700'
                                    }`}>
                                      {info.category}
                                    </span>
                                    {info.isLifetime ? (
                                      <span className="flex items-center gap-1 text-[10px] font-mono text-gray-500">
                                        <Infinity className="w-3 h-3" />
                                        Lifetime
                                      </span>
                                    ) : (
                                      <span className="flex items-center gap-1 text-[10px] font-mono text-gray-500">
                                        <Clock className="w-3 h-3" />
                                        Renews every {info.renewalYears} years
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              
                              {/* Expiration Date (only for non-lifetime certs when checked) */}
                              {assignment?.hasCert && !info.isLifetime && (
                                <div className="mt-3 ml-7">
                                  <label className="font-mono text-[10px] text-gray-500 uppercase block mb-1">
                                    Expiration Date (optional)
                                  </label>
                                  <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-gray-400" />
                                    <Input
                                      type="date"
                                      value={assignment?.expirationDate || ''}
                                      onChange={(e) => setExpirationDate(member.id, certId, e.target.value)}
                                      className="h-8 w-40 font-mono text-sm border-gray-200"
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Mobile Stats */}
            <div className="lg:hidden bg-[#050505] text-white p-4 -mx-6 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-mono text-xs text-gray-400 uppercase">Progress</div>
                  <div className="font-display text-2xl font-bold">{stats.completionPercent}%</div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-xs text-gray-400">{stats.assigned} certs assigned</div>
                  <div className="font-mono text-xs text-green-400">{stats.fullyCompliant} fully compliant</div>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setImportMethod('none')}
                className="text-gray-600 hover:text-[#0038FF] font-mono text-sm uppercase tracking-wider transition-colors flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Methods
              </button>

              <div className="flex gap-3">
                {/* DEV MODE: Skip button */}
                {isDevModeEnabled && (
                  <button
                    type="button"
                    onClick={() => {
                      // Generate mock assignments
                      const mockAssignments: CertificationAssignment[] = []
                      teamMembers.forEach(member => {
                        selectedCerts.forEach((certId, idx) => {
                          // Randomly assign some certs
                          if (idx < 2 || Math.random() > 0.3) {
                            const info = getCertInfo(certId)
                            mockAssignments.push({
                              memberId: member.id,
                              memberName: member.name,
                              certificationId: certId,
                              certificationName: info.name,
                              hasCert: true,
                              expirationDate: info.isLifetime ? undefined : getDefaultExpiration(certId),
                              isLifetime: info.isLifetime
                            })
                          }
                        })
                      })
                      onComplete(mockAssignments)
                    }}
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
                      Continue to Review
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
