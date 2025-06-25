import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, FileText, AlertCircle, CheckCircle, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { uploadCertification } from '../lib/certification-service';

interface AddCertificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface UploadState {
  status: 'idle' | 'uploading' | 'processing' | 'success' | 'error';
  progress: number;
  error?: string;
  extractedData?: {
    employeeName: string;
    certificationName: string;
    expirationDate: string;
    priority: 'low' | 'medium' | 'high';
    confidence: number;
  };
}

const MAX_FILE_SIZE = parseInt(process.env.NEXT_PUBLIC_MAX_FILE_SIZE || '20971520'); // 20MB
const ACCEPTED_TYPES = {
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
};

export const AddCertificationModal: React.FC<AddCertificationModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [uploadState, setUploadState] = useState<UploadState>({
    status: 'idle',
    progress: 0
  });

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // Validate file
    if (file.size > MAX_FILE_SIZE) {
      setUploadState({
        status: 'error',
        progress: 0,
        error: `File size exceeds 20MB limit. Current size: ${(file.size / 1024 / 1024).toFixed(1)}MB`
      });
      return;
    }

    try {
      setUploadState({ status: 'uploading', progress: 10 });
      
      // Update progress during processing
      setUploadState({ status: 'processing', progress: 50 });
      
      const result = await uploadCertification(file);
      
      setUploadState({
        status: 'success',
        progress: 100,
        extractedData: result
      });

      // Auto-close after success
      setTimeout(() => {
        onSuccess?.();
        handleClose();
      }, 2000);

    } catch (error) {
      setUploadState({
        status: 'error',
        progress: 0,
        error: error instanceof Error ? error.message : 'Upload failed. Please try again.'
      });
    }
  }, [onSuccess]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxFiles: 1,
    disabled: uploadState.status === 'uploading' || uploadState.status === 'processing'
  });

  const handleClose = () => {
    setUploadState({ status: 'idle', progress: 0 });
    onClose();
  };

  const handleRetry = () => {
    setUploadState({ status: 'idle', progress: 0 });
  };

  const getStatusIcon = () => {
    switch (uploadState.status) {
      case 'uploading':
      case 'processing':
        return <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />;
      case 'success':
        return <CheckCircle className="h-8 w-8 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-8 w-8 text-red-500" />;
      default:
        return <Upload className="h-8 w-8 text-gray-400" />;
    }
  };

  const getStatusText = () => {
    switch (uploadState.status) {
      case 'uploading':
        return 'Uploading file...';
      case 'processing':
        return 'Processing with AI...';
      case 'success':
        return 'Certification added successfully!';
      case 'error':
        return 'Upload failed';
      default:
        return 'Drag and drop your certification file here';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Add New Certification</span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleClose}
              className="ml-auto"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* File Format Info */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Supported formats:</strong> PDF, DOC, DOCX<br />
              <strong>Maximum file size:</strong> 20MB
            </AlertDescription>
          </Alert>

          {/* Upload Area */}
          <Card className="border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors">
            <CardContent className="p-6">
              <div
                {...getRootProps()}
                className={cn(
                  "flex flex-col items-center justify-center space-y-4 cursor-pointer",
                  isDragActive && "bg-blue-50",
                  (uploadState.status === 'uploading' || uploadState.status === 'processing') && "cursor-not-allowed opacity-50"
                )}
              >
                <input {...getInputProps()} />
                
                {getStatusIcon()}
                
                <div className="text-center">
                  <p className="text-lg font-medium text-gray-900">
                    {getStatusText()}
                  </p>
                  {uploadState.status === 'idle' && (
                    <p className="text-sm text-gray-500 mt-1">
                      or click to browse files
                    </p>
                  )}
                </div>

                {/* Progress Bar */}
                {(uploadState.status === 'uploading' || uploadState.status === 'processing') && (
                  <div className="w-full max-w-xs">
                    <Progress value={uploadState.progress} className="w-full" />
                    <p className="text-xs text-gray-500 mt-1 text-center">
                      {uploadState.progress}% complete
                    </p>
                  </div>
                )}

                {/* Success Data */}
                {uploadState.status === 'success' && uploadState.extractedData && (
                  <div className="w-full bg-green-50 rounded-lg p-4 space-y-2">
                    <h4 className="font-semibold text-green-800">Extracted Information:</h4>
                    <div className="text-sm space-y-1">
                      <p><strong>Employee:</strong> {uploadState.extractedData.employeeName}</p>
                      <p><strong>Certification:</strong> {uploadState.extractedData.certificationName}</p>
                      <p><strong>Expires:</strong> {uploadState.extractedData.expirationDate}</p>
                      <p><strong>Priority:</strong> 
                        <span className={cn(
                          "ml-1 px-2 py-0.5 rounded-full text-xs font-medium",
                          uploadState.extractedData.priority === 'high' && "bg-red-100 text-red-800",
                          uploadState.extractedData.priority === 'medium' && "bg-orange-100 text-orange-800",
                          uploadState.extractedData.priority === 'low' && "bg-green-100 text-green-800"
                        )}>
                          {uploadState.extractedData.priority.toUpperCase()}
                        </span>
                      </p>
                      <p><strong>Confidence:</strong> {Math.round(uploadState.extractedData.confidence * 100)}%</p>
                    </div>
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

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            {uploadState.status === 'success' && (
              <Button onClick={() => { onSuccess?.(); handleClose(); }}>
                Done
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 