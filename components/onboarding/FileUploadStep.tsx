import React, { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface FileUploadStepProps {
  onComplete: (fileData: any) => void
  onBack: () => void
  onSkip: () => void
}

export function FileUploadStep({ onComplete, onBack, onSkip: _onSkip }: FileUploadStepProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return

    const file = acceptedFiles[0]
    setError(null)
    setUploading(true)
    setUploadProgress(0)

    try {
      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('File size must be less than 10MB')
      }

      // Validate file type
      const validTypes = [
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ]
      
      const validExtensions = ['.csv', '.xls', '.xlsx']
      const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))
      
      if (!validTypes.includes(file.type) && !validExtensions.includes(fileExtension)) {
        throw new Error('Only CSV, XLS, and XLSX files are supported')
      }

      // Create form data
      const formData = new FormData()
      formData.append('file', file)

      // Upload with progress tracking
      const xhr = new XMLHttpRequest()
      
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100)
          setUploadProgress(progress)
        }
      })

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText)
          onComplete({
            fileName: file.name,
            fileSize: file.size,
            columns: response.columns,
            preview: response.preview,
            totalRows: response.totalRows,
            uploadId: response.uploadId
          })
        } else {
          const errorResponse = JSON.parse(xhr.responseText)
          throw new Error(errorResponse.error || 'Upload failed')
        }
      })

      xhr.addEventListener('error', () => {
        throw new Error('Network error during upload')
      })

      xhr.open('POST', '/api/csv/upload')
      xhr.send(formData)

    } catch (error) {
      console.error('Upload error:', error)
      setError(error instanceof Error ? error.message : 'Upload failed')
      setUploading(false)
      setUploadProgress(0)
    }
  }, [onComplete])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    maxFiles: 1,
    disabled: uploading
  })

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                Upload Your Certification Spreadsheet
              </h1>
            </div>

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

            {/* File Upload Area */}
            <div className="mb-8">
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 cursor-pointer ${
                  isDragActive
                    ? 'border-blue-500 bg-blue-50'
                    : uploading
                    ? 'border-gray-300 bg-gray-50 cursor-not-allowed'
                    : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
                }`}
              >
                <input {...getInputProps()} />
                
                {uploading ? (
                  <div className="space-y-4">
                    <div className="text-4xl">⏳</div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Uploading and Processing...
                    </h3>
                    <Progress value={uploadProgress} className="h-2 w-full max-w-xs mx-auto" />
                    <p className="text-sm text-gray-600">{uploadProgress}% complete</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="text-4xl">📁</div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {isDragActive ? 'Drop your file here' : 'Drag & Drop Your File Here'}
                      </h3>
                      <p className="text-gray-600 mb-3">or</p>
                      <Button
                        type="button"
                        variant="outline"
                        className="mb-4"
                        disabled={uploading}
                      >
                        Browse Files
                      </Button>
                    </div>
                    <p className="text-sm text-gray-500">
                      Supported: .csv, .xlsx, .xls (max 10MB)
                    </p>
                  </div>
                )}
              </div>

              {/* Tip */}
              <div className="mt-4 flex items-center justify-center space-x-2 text-sm text-blue-600">
                <span>💡</span>
                <span>Tip: We&apos;ll automatically detect your columns</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onBack}
                disabled={uploading}
                className="h-12 px-6 text-gray-600 hover:text-gray-700"
              >
                ← Back
              </Button>
              <div className="flex-1" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 