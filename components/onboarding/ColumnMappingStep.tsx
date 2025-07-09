import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface ColumnMapping {
  csvColumn: string
  mappedTo: string | null
  isRequired: boolean
  confidence: number
}

interface ColumnMappingStepProps {
  fileData: {
    fileName: string
    columns: string[]
    preview: any[]
    totalRows: number
    uploadId: string
  }
  onComplete: (mappings: ColumnMapping[]) => void
  onBack: () => void
}

// Define target schema fields
const TARGET_FIELDS = {
  'employee_name': { label: 'Employee Name', required: true, aliases: ['name', 'employee', 'person', 'full name', 'worker'] },
  'employee_email': { label: 'Employee Email', required: true, aliases: ['email', 'mail', 'email address', 'e-mail'] },
  'certification_name': { label: 'Certification Name', required: true, aliases: ['cert', 'certification', 'cert type', 'certificate', 'license'] },
  'expiration_date': { label: 'Expiration Date', required: true, aliases: ['expires', 'expiry', 'exp date', 'expiration', 'due date'] },
  'certification_number': { label: 'Certification Number', required: false, aliases: ['cert number', 'cert #', 'license number', 'id', 'badge'] },
  'issue_date': { label: 'Issue Date', required: false, aliases: ['issued', 'date issued', 'start date', 'cert date'] },
  'issuing_authority': { label: 'Issuing Authority', required: false, aliases: ['issuer', 'authority', 'organization', 'org', 'agency'] },
  'department': { label: 'Department', required: false, aliases: ['dept', 'division', 'team', 'unit'] },
  'notes': { label: 'Notes', required: false, aliases: ['note', 'comment', 'remarks', 'description'] }
}

export function ColumnMappingStep({ fileData, onComplete, onBack }: ColumnMappingStepProps) {
  const [mappings, setMappings] = useState<ColumnMapping[]>([])
  const [error, setError] = useState<string | null>(null)

  // Auto-detect column mappings
  useEffect(() => {
    const autoDetectMappings = () => {
      const detectedMappings: ColumnMapping[] = fileData.columns.map(csvColumn => {
        let bestMatch: string | null = null
        let bestConfidence = 0

        // Check against all target fields
        Object.entries(TARGET_FIELDS).forEach(([fieldKey, fieldData]) => {
          let confidence = 0

          // Exact match with label (case insensitive)
          if (csvColumn.toLowerCase() === fieldData.label.toLowerCase()) {
            confidence = 1.0
          }

          // Check aliases
          fieldData.aliases.forEach(alias => {
            const csvLower = csvColumn.toLowerCase()
            const aliasLower = alias.toLowerCase()

            if (csvLower === aliasLower) {
              confidence = Math.max(confidence, 0.9)
            } else if (csvLower.includes(aliasLower) || aliasLower.includes(csvLower)) {
              confidence = Math.max(confidence, 0.7)
            }
          })

          // Partial string matching
          if (confidence === 0) {
            const csvWords = csvColumn.toLowerCase().split(/[\s_-]+/)
            const labelWords = fieldData.label.toLowerCase().split(/[\s_-]+/)

            const matchingWords = csvWords.filter(word => 
              labelWords.some(labelWord => labelWord.includes(word) || word.includes(labelWord))
            )

            if (matchingWords.length > 0) {
              confidence = Math.min(0.6, matchingWords.length / Math.max(csvWords.length, labelWords.length))
            }
          }

          if (confidence > bestConfidence) {
            bestMatch = fieldKey
            bestConfidence = confidence
          }
        })

        return {
          csvColumn,
          mappedTo: bestConfidence > 0.5 ? bestMatch : null,
          isRequired: false,
          confidence: bestConfidence
        }
      })

      setMappings(detectedMappings)
    }

    autoDetectMappings()
  }, [fileData.columns])

  const updateMapping = (csvColumn: string, mappedTo: string | null) => {
    setMappings(prev => prev.map(mapping => 
      mapping.csvColumn === csvColumn 
        ? { ...mapping, mappedTo }
        : mapping
    ))
    setError(null)
  }

  const handleContinue = () => {
    // Validate required fields are mapped
    const requiredFields = Object.entries(TARGET_FIELDS)
      .filter(([_, field]) => field.required)
      .map(([key, _]) => key)

    const mappedRequiredFields = mappings
      .filter(m => m.mappedTo && requiredFields.includes(m.mappedTo))
      .map(m => m.mappedTo)

    const missingRequiredFields = requiredFields.filter(field => 
      !mappedRequiredFields.includes(field)
    )

    if (missingRequiredFields.length > 0) {
      const missingLabels = missingRequiredFields.map(field => TARGET_FIELDS[field as keyof typeof TARGET_FIELDS].label)
      setError(`Please map the following required fields: ${missingLabels.join(', ')}`)
      return
    }

    // Check for duplicate mappings
    const mappedFields = mappings.filter(m => m.mappedTo).map(m => m.mappedTo)
    const duplicates = mappedFields.filter((field, index) => mappedFields.indexOf(field) !== index)

    if (duplicates.length > 0) {
      setError('Each field can only be mapped once. Please check for duplicate mappings.')
      return
    }

    onComplete(mappings)
  }

  const getFieldOptions = (currentMapping: string | null) => {
    const usedFields = mappings
      .filter(m => m.mappedTo && m.mappedTo !== currentMapping)
      .map(m => m.mappedTo)

    return Object.entries(TARGET_FIELDS).filter(([key, _]) => 
      !usedFields.includes(key)
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 text-lg">✅</span>
              </div>
              <div>
                <CardTitle className="text-xl">File uploaded! Please confirm column mapping</CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  {fileData.fileName} • {fileData.totalRows.toLocaleString()} rows
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-8">
            {/* Progress Bar */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Progress</span>
                <span className="text-sm text-gray-500">3/4</span>
              </div>
              <Progress value={75} className="h-2" />
              <div className="flex justify-between mt-2">
                <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                <div className="w-3 h-3 bg-gray-200 rounded-full"></div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Column Mappings */}
            <div className="space-y-4 mb-8">
              <div className="grid grid-cols-3 gap-4 text-sm font-medium text-gray-700 mb-4">
                <div>Your Column</div>
                <div className="text-center">→</div>
                <div>Maps To</div>
              </div>

              {mappings.map((mapping, index) => (
                <div key={index} className="grid grid-cols-3 gap-4 items-center">
                  {/* CSV Column */}
                  <div className="bg-gray-50 border rounded-lg p-3">
                    <div className="font-medium text-gray-900">{mapping.csvColumn}</div>
                    {fileData.preview[0] && (
                      <div className="text-xs text-gray-500 mt-1">
                        e.g. "{fileData.preview[0][mapping.csvColumn]}"
                      </div>
                    )}
                  </div>

                  {/* Arrow */}
                  <div className="text-center text-gray-400 text-lg">→</div>

                  {/* Target Field */}
                  <div className="relative">
                    <Select
                      value={mapping.mappedTo || 'skip'}
                      onValueChange={(value) => updateMapping(mapping.csvColumn, value === 'skip' ? null : value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select field..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="skip">
                          <span className="text-gray-500">[Skip this column]</span>
                        </SelectItem>
                        {getFieldOptions(mapping.mappedTo).map(([key, field]) => (
                          <SelectItem key={key} value={key}>
                            <div className="flex items-center space-x-2">
                              <span>{field.label}</span>
                              {field.required && (
                                <Badge variant="destructive" className="text-xs">Required</Badge>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* Confidence Badge */}
                    {mapping.mappedTo && mapping.confidence > 0.7 && (
                      <div className="absolute -top-2 -right-2">
                        <Badge variant="default" className="text-xs bg-green-100 text-green-700">
                          Auto-detected
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Required Fields Summary */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
              <h4 className="font-semibold text-blue-900 mb-2">Required Fields</h4>
              <div className="space-y-1">
                {Object.entries(TARGET_FIELDS)
                  .filter(([_, field]) => field.required)
                  .map(([key, field]) => {
                    const isMapped = mappings.some(m => m.mappedTo === key)
                    return (
                      <div key={key} className="flex items-center space-x-2 text-sm">
                        <span className={isMapped ? 'text-green-600' : 'text-red-600'}>
                          {isMapped ? '✓' : '❌'}
                        </span>
                        <span className={isMapped ? 'text-gray-700' : 'text-red-700'}>
                          {field.label}
                        </span>
                      </div>
                    )
                  })}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onBack}
                className="h-12 px-6 text-gray-600 hover:text-gray-700"
              >
                ← Back
              </Button>
              <div className="flex-1" />
              <Button
                type="button"
                onClick={handleContinue}
                className="h-12 px-8 bg-blue-600 hover:bg-blue-700 text-white"
              >
                Continue to Preview →
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 