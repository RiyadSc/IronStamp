import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useAuth } from '@/hooks/useAuth'

interface ValidationError {
  row: number
  field: string
  value: string
  error: string
}

interface PreviewData {
  validRows: number
  invalidRows: number
  totalEmployees: number
  totalCertifications: number
  errors: ValidationError[]
  preview: any[]
}

interface DataPreviewStepProps {
  fileData: {
    fileName: string
    uploadId: string
    totalRows: number
  }
  mappings: any[]
  onComplete: () => void
  onBack: () => void
}

export function DataPreviewStep({ fileData, mappings, onComplete, onBack }: DataPreviewStepProps) {
  const { user } = useAuth()
  const [previewData, setPreviewData] = useState<PreviewData | null>(null)
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Process and validate data on component mount
  useEffect(() => {
    const processData = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch('/api/csv/validate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            uploadId: fileData.uploadId,
            mappings: mappings
          })
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Validation failed')
        }

        const data = await response.json()
        setPreviewData(data)
      } catch (error) {
        console.error('Validation error:', error)
        setError(error instanceof Error ? error.message : 'Validation failed')
      } finally {
        setLoading(false)
      }
    }

    processData()
  }, [fileData.uploadId, mappings])

  const handleImport = async () => {
    if (!previewData || !user) return

    try {
      setImporting(true)
      setError(null)

      const response = await fetch('/api/csv/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uploadId: fileData.uploadId,
          mappings: mappings,
          importOnlyValid: true,
          userId: user.id
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Import failed')
      }

      const result = await response.json()
      console.log('Import successful:', result)
      onComplete()
    } catch (error) {
      console.error('Import error:', error)
      setError(error instanceof Error ? error.message : 'Import failed')
    } finally {
      setImporting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-4xl">
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="p-8">
              <div className="text-center space-y-4">
                <div className="text-4xl">⏳</div>
                <h2 className="text-xl font-semibold">Validating your data...</h2>
                <p className="text-gray-600">This may take a moment for large files</p>
                <Progress value={50} className="h-2 w-full max-w-xs mx-auto" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-6xl">
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 text-lg">🎯</span>
              </div>
              <div>
                <CardTitle className="text-xl">Ready to Import</CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Review your data before importing
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-8">
            {/* Progress Bar */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Progress</span>
                <span className="text-sm text-gray-500">4/4</span>
              </div>
              <Progress value={100} className="h-2" />
              <div className="flex justify-between mt-2">
                <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {previewData && (
              <>
                {/* Summary Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-green-600">✅</span>
                      <div>
                        <div className="text-2xl font-bold text-green-700">
                          {previewData.totalEmployees}
                        </div>
                        <div className="text-sm text-green-600">employees found</div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-blue-600">✅</span>
                      <div>
                        <div className="text-2xl font-bold text-blue-700">
                          {previewData.totalCertifications}
                        </div>
                        <div className="text-sm text-blue-600">certifications ready</div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-600">📊</span>
                      <div>
                        <div className="text-2xl font-bold text-gray-700">
                          {previewData.validRows}
                        </div>
                        <div className="text-sm text-gray-600">valid rows</div>
                      </div>
                    </div>
                  </div>

                  {previewData.invalidRows > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-red-600">⚠️</span>
                        <div>
                          <div className="text-2xl font-bold text-red-700">
                            {previewData.invalidRows}
                          </div>
                          <div className="text-sm text-red-600">rows need attention</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Errors Section */}
                {previewData.errors.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Issues Found ({previewData.errors.length})
                    </h3>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-h-32 overflow-y-auto">
                      <div className="space-y-2">
                        {previewData.errors.slice(0, 10).map((error, index) => (
                          <div key={index} className="text-sm">
                            <span className="font-medium text-red-700">Row {error.row}:</span>
                            <span className="text-red-600 ml-2">
                              {error.field} - {error.error}
                            </span>
                            <span className="text-gray-500 ml-2">
                              (value: "{error.value}")
                            </span>
                          </div>
                        ))}
                        {previewData.errors.length > 10 && (
                          <div className="text-sm text-gray-500 italic">
                            ... and {previewData.errors.length - 10} more issues
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Preview Table */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Preview (first 5 rows)
                  </h3>
                  <div className="border rounded-lg overflow-hidden">
                    <div className="max-h-64 overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-12">Status</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Certification</TableHead>
                            <TableHead>Expires</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Cert #</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {previewData.preview.map((row, index) => (
                            <TableRow key={index}>
                              <TableCell>
                                {row.status === 'valid' && <span className="text-green-600">✓</span>}
                                {row.status === 'warning' && <span className="text-yellow-600">⚠️</span>}
                                {row.status === 'error' && <span className="text-red-600">❌</span>}
                              </TableCell>
                              <TableCell className="font-medium">
                                {row.employee_name || '-'}
                              </TableCell>
                              <TableCell>{row.certification_name || '-'}</TableCell>
                              <TableCell>
                                <div className="flex items-center space-x-2">
                                  <span>{row.expiration_date || '-'}</span>
                                  {row.status === 'valid' && <Badge variant="default" className="bg-green-100 text-green-700">Valid</Badge>}
                                  {row.status === 'warning' && <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">Warning</Badge>}
                                  {row.status === 'error' && <Badge variant="destructive">Error</Badge>}
                                </div>
                              </TableCell>
                              <TableCell>{row.employee_email || '-'}</TableCell>
                              <TableCell>{row.certification_number || '-'}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onBack}
                    disabled={importing}
                    className="h-12 px-6 text-gray-600 hover:text-gray-700"
                  >
                    ← Back
                  </Button>
                  
                  {previewData.invalidRows > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={onBack}
                      disabled={importing}
                      className="h-12 px-6 text-yellow-600 hover:text-yellow-700 border-yellow-300"
                    >
                      ← Fix Issues First
                    </Button>
                  )}

                  <div className="flex-1" />

                  <Button
                    type="button"
                    onClick={handleImport}
                    disabled={importing || previewData.validRows === 0 || !user}
                    className="h-12 px-8 bg-green-600 hover:bg-green-700 text-white"
                  >
                    {importing ? (
                      <>
                        <span className="animate-spin mr-2">⏳</span>
                        Importing...
                      </>
                    ) : (
                      'Import Valid Records →'
                    )}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 