import React, { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { 
  Upload, 
  AlertCircle, 
  CheckCircle, 
  Loader2, 
  User, 
  Award,
  Sparkles
} from '@/lib/icons'
import { cn } from '@/lib/utils'
import { uploadCertification } from '@/lib/certification-service'

interface IndividualUploadStepProps {
  onComplete: (data: any) => void
  onBack: () => void
  onSkip: () => void
}

interface UploadState {
  status: 'idle' | 'uploading' | 'processing' | 'success' | 'error'
  progress: number
  error?: string
  extractedData?: {
    employeeName: string
    certificationName: string
    expirationDate: string
    priority: 'low' | 'medium' | 'high'
    confidence: number
  }
}

interface FormData {
  employeeName: string
  employeeEmail: string
  certificationName: string
  issueDate: string
  expirationDate: string
}

const MAX_FILE_SIZE = parseInt(process.env.NEXT_PUBLIC_MAX_FILE_SIZE || '20971520') // 20MB
const ACCEPTED_TYPES = {
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png']
}

export function IndividualUploadStep({ onComplete, onBack, onSkip }: IndividualUploadStepProps) {
  const [uploadMode, setUploadMode] = useState<'manual' | 'upload'>('manual')
  const [formData, setFormData] = useState<FormData>({
    employeeName: '',
    employeeEmail: '',
    certificationName: '',
    issueDate: '',
    expirationDate: ''
  })
  const [uploadState, setUploadState] = useState<UploadState>({
    status: 'idle',
    progress: 0
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  // File upload handlers
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    // Validate file
    if (file.size > MAX_FILE_SIZE) {
      setUploadState({
        status: 'error',
        progress: 0,
        error: `File size exceeds 20MB limit. Current size: ${(file.size / 1024 / 1024).toFixed(1)}MB`
      })
      return
    }

    try {
      setUploadState({ status: 'uploading', progress: 10 })
      
      // Update progress during processing
      setUploadState({ status: 'processing', progress: 50 })
      
      const result = await uploadCertification(file)
      
      setUploadState({
        status: 'success',
        progress: 100,
        extractedData: {
          employeeName: result.employeeName,
          certificationName: result.certificationName,
          expirationDate: result.expirationDate ?? '',
          priority: result.priority,
          confidence: result.confidence
        }
      })

      // Auto-populate form with extracted data
      setFormData({
        employeeName: result.employeeName || '',
        employeeEmail: '', // User will need to enter this
        certificationName: result.certificationName || '',
        issueDate: '', // Usually not extracted
        expirationDate: result.expirationDate || ''
      })

    } catch (error) {
      setUploadState({
        status: 'error',
        progress: 0,
        error: error instanceof Error ? error.message : 'Upload failed. Please try again.'
      })
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxFiles: 1,
    disabled: uploadState.status === 'uploading' || uploadState.status === 'processing'
  })

  // Form validation
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}
    
    if (!formData.employeeName.trim()) {
      errors.employeeName = 'Employee name is required'
    }
    
    if (!formData.employeeEmail.trim()) {
      errors.employeeEmail = 'Employee email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.employeeEmail)) {
      errors.employeeEmail = 'Please enter a valid email address'
    }
    
    if (!formData.certificationName.trim()) {
      errors.certificationName = 'Certification name is required'
    }
    
    if (!formData.expirationDate) {
      errors.expirationDate = 'Expiration date is required'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) return

    try {
      // Save to database via existing certification system
      // This will create both employee and certification records
      await onComplete({
        method: 'individual',
        data: formData,
        extractedFromFile: uploadState.status === 'success'
      })
    } catch (error) {
      console.error('Failed to save certification:', error)
      setFormErrors({ submit: 'Failed to save certification. Please try again.' })
    }
  }

  const handleRetry = () => {
    setUploadState({ status: 'idle', progress: 0 })
  }

  const getStatusIcon = () => {
    switch (uploadState.status) {
      case 'uploading':
      case 'processing':
        return <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
      case 'success':
        return <CheckCircle className="h-8 w-8 text-green-500" />
      case 'error':
        return <AlertCircle className="h-8 w-8 text-red-500" />
      default:
        return <Upload className="h-8 w-8 text-gray-400" />
    }
  }

  const getStatusText = () => {
    switch (uploadState.status) {
      case 'uploading':
        return 'Uploading file...'
      case 'processing':
        return 'Processing with AI...'
      case 'success':
        return 'Information extracted successfully!'
      case 'error':
        return 'Upload failed'
      default:
        return 'Upload PDF Certificate'
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-2xl lg:max-w-4xl">
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 text-lg">📝</span>
              </div>
              <div>
                <CardTitle className="text-lg sm:text-xl">Add Your First Certification</CardTitle>
                <p className="text-xs sm:text-sm text-gray-600 mt-1">
                  Enter details manually or upload a PDF for automatic extraction
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-4 sm:p-8">
            {/* Progress Bar */}
            <div className="mb-6 sm:mb-8">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Progress</span>
                <span className="text-sm text-gray-500">3/4</span>
              </div>
              <Progress value={75} className="h-2" />
              <div className="flex justify-between mt-2">
                <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
              </div>
            </div>

            {/* Upload Mode Toggle */}
            <div className="mb-6 sm:mb-8">
              <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                <Button
                  variant={uploadMode === 'manual' ? 'default' : 'ghost'}
                  className="flex-1 h-10"
                  onClick={() => setUploadMode('manual')}
                >
                  <User className="h-4 w-4 mr-2" />
                  Manual Entry
                </Button>
                <Button
                  variant={uploadMode === 'upload' ? 'default' : 'ghost'}
                  className="flex-1 h-10"
                  onClick={() => setUploadMode('upload')}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  AI Extract from PDF
                </Button>
              </div>
            </div>

            {/* Manual Entry Mode */}
            {uploadMode === 'manual' && (
              <div className="space-y-6">
                {/* Employee Information */}
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <User className="h-5 w-5 mr-2 text-blue-600" />
                    Employee Information
                  </h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="employeeName">Employee Name *</Label>
                      <Input
                        id="employeeName"
                        value={formData.employeeName}
                        onChange={(e) => setFormData({ ...formData, employeeName: e.target.value })}
                        placeholder="John Smith"
                        className={cn(formErrors.employeeName && "border-red-500")}
                      />
                      {formErrors.employeeName && (
                        <p className="text-sm text-red-600 mt-1">{formErrors.employeeName}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="employeeEmail">Employee Email *</Label>
                      <Input
                        id="employeeEmail"
                        type="email"
                        value={formData.employeeEmail}
                        onChange={(e) => setFormData({ ...formData, employeeEmail: e.target.value })}
                        placeholder="john@company.com"
                        className={cn(formErrors.employeeEmail && "border-red-500")}
                      />
                      {formErrors.employeeEmail && (
                        <p className="text-sm text-red-600 mt-1">{formErrors.employeeEmail}</p>
                      )}
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Certification Information */}
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Award className="h-5 w-5 mr-2 text-blue-600" />
                    Certification Details
                  </h3>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="lg:col-span-3">
                      <Label htmlFor="certificationName">Certification Name *</Label>
                      <Input
                        id="certificationName"
                        value={formData.certificationName}
                        onChange={(e) => setFormData({ ...formData, certificationName: e.target.value })}
                        placeholder="EPA 608 Universal Certification"
                        className={cn(formErrors.certificationName && "border-red-500")}
                      />
                      {formErrors.certificationName && (
                        <p className="text-sm text-red-600 mt-1">{formErrors.certificationName}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="issueDate">Issue Date</Label>
                      <Input
                        id="issueDate"
                        type="date"
                        value={formData.issueDate}
                        onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="expirationDate">Expiration Date *</Label>
                      <Input
                        id="expirationDate"
                        type="date"
                        value={formData.expirationDate}
                        onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
                        className={cn(formErrors.expirationDate && "border-red-500")}
                      />
                      {formErrors.expirationDate && (
                        <p className="text-sm text-red-600 mt-1">{formErrors.expirationDate}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Show extracted data confidence if from AI */}
                {uploadState.status === 'success' && uploadState.extractedData && (
                  <Alert className="bg-green-50 border-green-200">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      <strong>AI Extracted Data</strong> - Confidence: {Math.round(uploadState.extractedData.confidence * 100)}%
                      <br />Please review and correct any information if needed.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            {/* Upload Mode */}
            {uploadMode === 'upload' && (
              <div className="space-y-6">
                {/* File Format Info */}
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Supported formats:</strong> PDF, DOC, DOCX, JPG, PNG<br />
                    <strong>Maximum file size:</strong> 20MB
                  </AlertDescription>
                </Alert>

                {/* Upload Area */}
                <Card className="border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors">
                  <CardContent className="p-6 sm:p-8">
                    <div
                      {...getRootProps()}
                      className={cn(
                        "flex flex-col items-center justify-center space-y-4 cursor-pointer min-h-[150px] sm:min-h-[200px]",
                        isDragActive && "bg-blue-50",
                        (uploadState.status === 'uploading' || uploadState.status === 'processing') && "cursor-not-allowed opacity-50"
                      )}
                    >
                      <input {...getInputProps()} />
                      
                      {getStatusIcon()}
                      
                      <div className="text-center">
                        <p className="text-base sm:text-lg font-medium text-gray-900">
                          {getStatusText()}
                        </p>
                        {uploadState.status === 'idle' && (
                          <>
                            <p className="text-xs sm:text-sm text-gray-500 mt-1">
                              Drag and drop your certificate here, or click to browse
                            </p>
                            <p className="text-xs text-gray-400 mt-2">
                              We&apos;ll automatically extract certification details
                            </p>
                          </>
                        )}
                      </div>

                      {/* Progress Bar */}
                      {(uploadState.status === 'uploading' || uploadState.status === 'processing') && (
                        <div className="w-full max-w-xs">
                          <Progress value={uploadState.progress} className="h-2" />
                          <p className="text-xs text-gray-500 mt-1 text-center">
                            {uploadState.progress}% complete
                          </p>
                        </div>
                      )}

                      {/* Success Display */}
                      {uploadState.status === 'success' && uploadState.extractedData && (
                        <div className="w-full bg-green-50 rounded-lg p-4">
                          <h4 className="font-semibold text-green-800 mb-2">✅ Information Extracted</h4>
                          <div className="space-y-1 text-sm text-green-700">
                            <p><strong>Employee:</strong> {uploadState.extractedData.employeeName}</p>
                            <p><strong>Certification:</strong> {uploadState.extractedData.certificationName}</p>
                            <p><strong>Expires:</strong> {uploadState.extractedData.expirationDate}</p>
                            <p><strong>Confidence:</strong> {Math.round(uploadState.extractedData.confidence * 100)}%</p>
                          </div>
                          
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={(e) => {
                              e.stopPropagation()
                              setUploadMode('manual')
                            }}
                            className="mt-2"
                          >
                            Review & Edit Details →
                          </Button>
                        </div>
                      )}

                      {/* Error Display */}
                      {uploadState.status === 'error' && (
                        <div className="w-full bg-red-50 rounded-lg p-4">
                          <p className="text-red-800 text-sm">{uploadState.error}</p>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={handleRetry}
                            className="mt-2"
                          >
                            Try Again
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {uploadState.status === 'success' && (
                  <Alert className="bg-blue-50 border-blue-200">
                    <AlertCircle className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800">
                      Great! Now switch to <strong>Manual Entry</strong> to review the extracted information and add the employee&apos;s email address.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            {/* Submit Errors */}
            {formErrors.submit && (
              <Alert variant="destructive" className="mt-6">
                <AlertDescription>{formErrors.submit}</AlertDescription>
              </Alert>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 mt-8">
              <Button
                type="button"
                variant="outline"
                onClick={onBack}
                className="h-12 px-6 text-gray-600 hover:text-gray-700"
              >
                ← Back
              </Button>
              
              <Button
                type="button"
                variant="ghost"
                onClick={onSkip}
                className="h-12 px-6 text-gray-500 hover:text-gray-600"
              >
                Skip for Now
              </Button>

              <div className="flex-1" />

              <Button
                onClick={handleSubmit}
                disabled={uploadMode === 'manual' && (!formData.employeeName || !formData.employeeEmail || !formData.certificationName || !formData.expirationDate)}
                className="h-12 px-8 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
              >
                {uploadMode === 'manual' ? 'Add Certification →' : 'Continue Setup →'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 