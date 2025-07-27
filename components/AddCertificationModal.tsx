import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, FileText, AlertCircle, CheckCircle, X, Loader2, Circle, Trash2 } from '@/lib/icons';
import { cn } from '@/lib/utils';
import { uploadCertification } from '../lib/certification-service';
import { trackCertificationAction } from '@/lib/posthog';

interface AddCertificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

interface StagedFile {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  status: 'staging' | 'staged' | 'processing' | 'success' | 'error';
  stagingProgress: number; // 0-100
  error?: string;
  extractedData?: {
    employeeName: string;
    certificationName: string;
    expirationDate: string;
    priority: 'low' | 'medium' | 'high';
    confidence: number;
  };
}

interface ProcessingState {
  isProcessing: boolean;
  progress: number;
  currentFile?: string;
  completedCount: number;
  totalCount: number;
}

const MAX_FILE_SIZE = parseInt(process.env.NEXT_PUBLIC_MAX_FILE_SIZE || '20971520'); // 20MB
const MAX_FILES = 4;
const ACCEPTED_TYPES = {
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'text/csv': ['.csv'],
  'application/vnd.ms-excel': ['.xls'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
};

export const AddCertificationModal: React.FC<AddCertificationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onError
}) => {
  const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([]);
  const [processingState, setProcessingState] = useState<ProcessingState>({
    isProcessing: false,
    progress: 0,
    completedCount: 0,
    totalCount: 0
  });
  const [stagingIntervals, setStagingIntervals] = useState<Map<string, NodeJS.Timeout>>(new Map());

  const simulateFileStaging = useCallback((fileId: string) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15 + 5; // Random progress between 5-20%
      
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        
        // Remove from tracking
        setStagingIntervals(prev => {
          const newMap = new Map(prev);
          newMap.delete(fileId);
          return newMap;
        });
        
        // Mark file as fully staged
        setStagedFiles(prev => 
          prev.map(f => 
            f.id === fileId 
              ? { ...f, status: 'staged', stagingProgress: 100 }
              : f
          )
        );
      } else {
        // Update progress
        setStagedFiles(prev => 
          prev.map(f => 
            f.id === fileId 
              ? { ...f, stagingProgress: progress }
              : f
          )
        );
      }
    }, 200); // Update every 200ms
    
    // Track the interval
    setStagingIntervals(prev => new Map(prev).set(fileId, interval));
  }, []);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    // Check if adding these files would exceed the limit
    const remainingSlots = MAX_FILES - stagedFiles.length;
    const filesToAdd = acceptedFiles.slice(0, remainingSlots);
    
    if (filesToAdd.length < acceptedFiles.length) {
      onError?.(`Only ${remainingSlots} more files can be added. Maximum ${MAX_FILES} files allowed.`);
    }

    // Validate each file
    const validFiles: StagedFile[] = [];
    for (const file of filesToAdd) {
      if (file.size > MAX_FILE_SIZE) {
        onError?.(
          `File "${file.name}" exceeds 20MB limit (${(file.size / 1024 / 1024).toFixed(1)}MB)`
        );
        continue;
      }

      validFiles.push({
        id: `${file.name}-${Date.now()}-${Math.random()}`,
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        status: 'staging',
        stagingProgress: 0
      });
    }

    setStagedFiles(prev => [...prev, ...validFiles]);

    // Simulate staging progress for each file
    validFiles.forEach((file) => {
      simulateFileStaging(file.id);
    });
  }, [stagedFiles.length, onError]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxFiles: MAX_FILES,
    disabled: processingState.isProcessing || stagedFiles.length >= MAX_FILES
  });

  const removeFile = (fileId: string) => {
    // Clear any staging interval for this file
    const interval = stagingIntervals.get(fileId);
    if (interval) {
      clearInterval(interval);
      setStagingIntervals(prev => {
        const newMap = new Map(prev);
        newMap.delete(fileId);
        return newMap;
      });
    }
    
    setStagedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const handleSubmit = async () => {
    if (stagedFiles.length === 0) return;

    setProcessingState({
      isProcessing: true,
      progress: 0,
      completedCount: 0,
      totalCount: stagedFiles.length
    });

    const results: StagedFile[] = [];
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < stagedFiles.length; i++) {
      const file = stagedFiles[i];
      
      // Update processing state
      setProcessingState(prev => ({
        ...prev,
        progress: (i / stagedFiles.length) * 100,
        currentFile: file.name
      }));

      // Update file status to processing
      setStagedFiles(prev => 
        prev.map(f => f.id === file.id ? { ...f, status: 'processing' } : f)
      );

      try {
        const result = await uploadCertification(file.file);
        
        const updatedFile: StagedFile = {
          ...file,
          status: 'success',
          extractedData: result
        };
        
        results.push(updatedFile);
        successCount++;

        // Update file status to success
        setStagedFiles(prev => 
          prev.map(f => f.id === file.id ? updatedFile : f)
        );

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Processing failed';
        
        const updatedFile: StagedFile = {
          ...file,
          status: 'error',
          error: errorMessage
        };
        
        results.push(updatedFile);
        errorCount++;

        // Update file status to error
        setStagedFiles(prev => 
          prev.map(f => f.id === file.id ? updatedFile : f)
        );
      }

      // Update completed count
      setProcessingState(prev => ({
        ...prev,
        completedCount: i + 1
      }));
    }

    // Final processing state
    setProcessingState(prev => ({
      ...prev,
      progress: 100,
      currentFile: undefined
    }));

    // Show results
    if (successCount > 0) {
      // Track successful certification uploads
      trackCertificationAction('upload', {
        files_count: stagedFiles.length,
        success_count: successCount,
        error_count: errorCount,
        file_types: stagedFiles.map(f => f.type)
      });
      
      onSuccess?.();
      
      setTimeout(() => {
        if (errorCount === 0) {
          handleClose(); // Auto-close if all successful
        }
      }, 2000);
    }

    if (errorCount > 0) {
      onError?.(`${errorCount} of ${stagedFiles.length} files failed to process. Check individual file errors below.`);
    }
  };

  const handleClose = () => {
    // Clear all staging intervals
    stagingIntervals.forEach(interval => clearInterval(interval));
    setStagingIntervals(new Map());
    
    setStagedFiles([]);
    setProcessingState({
      isProcessing: false,
      progress: 0,
      completedCount: 0,
      totalCount: 0
    });
    onClose();
  };

  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) return '📄';
    if (type.includes('word') || type.includes('document')) return '📝';
    if (type.includes('csv') || type.includes('excel') || type.includes('sheet')) return '📊';
    return '📎';
  };

  const getFileStatusIcon = (file: StagedFile) => {
    switch (file.status) {
      case 'staging':
        return (
          <div className="relative h-4 w-4">
            <svg className="h-4 w-4 transform -rotate-90" viewBox="0 0 16 16">
              <circle
                cx="8"
                cy="8"
                r="6"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="2"
              />
              <circle
                cx="8"
                cy="8"
                r="6"
                fill="none"
                stroke="#10b981"
                strokeWidth="2"
                strokeDasharray={`${2 * Math.PI * 6}`}
                strokeDashoffset={`${2 * Math.PI * 6 * (1 - file.stagingProgress / 100)}`}
                className="transition-all duration-200 ease-out"
              />
            </svg>
          </div>
        );
      case 'staged':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'processing':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const allFilesFullyStaged = stagedFiles.length > 0 && stagedFiles.every(f => f.status === 'staged');
  const canSubmit = allFilesFullyStaged && !processingState.isProcessing;
  const canAddMore = stagedFiles.length < MAX_FILES && !processingState.isProcessing;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Add Certifications (Batch Upload)</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* File Format Info */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Supported formats:</strong> PDF, DOC, DOCX, CSV, XLS, XLSX<br />
              <strong>Maximum:</strong> {MAX_FILES} files, 20MB each
            </AlertDescription>
          </Alert>

          {/* Upload Area */}
          {canAddMore && (
            <Card className={cn(
              "border-2 border-dashed transition-colors",
              isDragActive ? "border-blue-400 bg-blue-50" : "border-gray-300 hover:border-gray-400"
            )}>
            <CardContent className="p-6">
              <div
                {...getRootProps()}
                  className="flex flex-col items-center justify-center space-y-4 cursor-pointer"
              >
                <input {...getInputProps()} />
                
                  <Upload className="h-8 w-8 text-gray-400" />
                
                <div className="text-center">
                  <p className="text-lg font-medium text-gray-900">
                      {stagedFiles.length === 0 
                        ? "Drag and drop certification files here"
                        : `Add more files (${stagedFiles.length}/${MAX_FILES})`
                      }
                  </p>
                    <p className="text-sm text-gray-500 mt-1">
                      or click to browse files
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Staged Files List */}
          {stagedFiles.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-semibold text-sm text-gray-700">
                Staged Files ({stagedFiles.length}/{MAX_FILES})
              </h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {stagedFiles.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
                  >
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <span className="text-lg">{getFileIcon(file.type)}</span>
                      <div className="flex-1 min-w-0">
                                                 <p className="text-sm font-medium text-gray-900 truncate">
                           {file.name}
                         </p>
                        {file.status === 'error' && file.error && (
                          <p className="text-xs text-red-600 mt-1">{file.error}</p>
                        )}
                      </div>
                    </div>
                    
                                         <div className="flex items-center space-x-2">
                       {getFileStatusIcon(file)}
                       {(file.status === 'staged' || file.status === 'staging') && (
                    <Button 
                          variant="ghost"
                      size="sm" 
                          onClick={() => removeFile(file.id)}
                          className="h-6 w-6 p-0"
                    >
                          <Trash2 className="h-3 w-3" />
                    </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Processing Status */}
          {processingState.isProcessing && (
            <div className="bg-blue-50 rounded-lg p-4 space-y-3">
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
                <span className="font-medium text-blue-900">Processing Files...</span>
              </div>
              
              <Progress value={processingState.progress} className="w-full" />
              
              <div className="flex justify-between text-sm text-blue-700">
                <span>
                  {processingState.currentFile ? `Processing: ${processingState.currentFile}` : 'Finalizing...'}
                </span>
                <span>
                  {processingState.completedCount}/{processingState.totalCount} completed
                </span>
              </div>
            </div>
          )}

          {/* Success Summary */}
          {processingState.completedCount > 0 && !processingState.isProcessing && (
            <div className="bg-green-50 rounded-lg p-4">
              <h4 className="font-semibold text-green-800 mb-2">Processing Complete!</h4>
              <div className="text-sm text-green-700">
                <p>✅ {stagedFiles.filter(f => f.status === 'success').length} files processed successfully</p>
                {stagedFiles.filter(f => f.status === 'error').length > 0 && (
                  <p>❌ {stagedFiles.filter(f => f.status === 'error').length} files failed</p>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between pt-4">
            <Button 
              variant="outline" 
              onClick={handleClose}
              disabled={processingState.isProcessing}
            >
              {processingState.completedCount > 0 && !processingState.isProcessing ? 'Close' : 'Cancel'}
            </Button>
            
            <div className="space-x-2">
              {stagedFiles.length > 0 && (
                <Button
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  className={cn(
                    "transition-all duration-200",
                    canSubmit 
                      ? "bg-blue-600 hover:bg-blue-700" 
                      : "bg-gray-300 cursor-not-allowed"
                  )}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {canSubmit 
                    ? `Process ${stagedFiles.length} File${stagedFiles.length > 1 ? 's' : ''}`
                    : `Loading Files... (${stagedFiles.filter(f => f.status === 'staged').length}/${stagedFiles.length} ready)`
                  }
              </Button>
            )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 