import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Upload, FileText, AlertCircle, CheckCircle, Loader2, Trash2, X } from 'lucide-react';
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

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_FILES = 1; // Single file upload
const ACCEPTED_TYPES = {
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png']
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
    // Only accept the first file for single upload
    if (acceptedFiles.length > 1) {
      onError?.('Only one file can be uploaded at a time.');
    }

    const file = acceptedFiles[0];
    if (!file) return;

    // Check if a file is already staged
    if (stagedFiles.length > 0) {
      onError?.('Please remove the current file before uploading a new one.');
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      onError?.(
        `File "${file.name}" exceeds 5MB limit (${(file.size / 1024 / 1024).toFixed(1)}MB)`
      );
      return;
    }

    const validFile: StagedFile = {
      id: `${file.name}-${Date.now()}-${Math.random()}`,
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'staging',
      stagingProgress: 0
    };

    setStagedFiles([validFile]);

    // Simulate staging progress
    simulateFileStaging(validFile.id);
  }, [stagedFiles.length, onError, simulateFileStaging]);

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
          extractedData: {
            employeeName: result.employeeName,
            certificationName: result.certificationName,
            expirationDate: result.expirationDate ?? '',
            priority: result.priority,
            confidence: result.confidence
          }
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
                stroke="#E2E8F0"
                strokeWidth="2"
              />
              <circle
                cx="8"
                cy="8"
                r="6"
                fill="none"
                stroke="#0038FF"
                strokeWidth="2"
                strokeDasharray={`${2 * Math.PI * 6}`}
                strokeDashoffset={`${2 * Math.PI * 6 * (1 - file.stagingProgress / 100)}`}
                className="transition-all duration-200 ease-out"
              />
            </svg>
          </div>
        );
      case 'staged':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'processing':
        return <Loader2 className="h-4 w-4 text-[#0038FF] animate-spin" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
    }
  };

  const allFilesFullyStaged = stagedFiles.length > 0 && stagedFiles.every(f => f.status === 'staged');
  const canSubmit = allFilesFullyStaged && !processingState.isProcessing;
  const canAddMore = stagedFiles.length === 0 && !processingState.isProcessing;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto bg-white border-2 border-[#050505] shadow-[8px_8px_0px_#0038FF] rounded-none p-0 gap-0 font-mono">
        <style>{`
          .font-mono { font-family: 'JetBrains Mono', monospace; }
          .font-display { font-family: 'Oswald', sans-serif; }
          
          .border-tech {
            border: 1px solid #E2E8F0;
            position: relative;
          }
          .border-tech::after {
            content: '';
            position: absolute;
            top: -1px;
            left: -1px;
            width: 10px;
            height: 10px;
            border-top: 2px solid #0038FF;
            border-left: 2px solid #0038FF;
          }
        `}</style>
        <DialogHeader className="p-6 border-b border-gray-200 bg-gray-50 sticky top-0 z-10 flex flex-row items-center justify-between">
          <DialogTitle className="font-display text-2xl font-bold uppercase flex items-center gap-2 text-[#050505]">
            <FileText className="h-5 w-5 text-[#0038FF]" />
            <span>UPLOAD CERTIFICATION</span>
          </DialogTitle>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-[#050505] transition-colors p-1"
            disabled={processingState.isProcessing}
          >
            <X className="w-5 h-5" />
          </button>
        </DialogHeader>

        <div className="p-6 space-y-6 bg-white">
          {/* File Format Info */}
          <div className="bg-[#0038FF]/5 border border-[#0038FF]/30 p-4 font-mono text-xs">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-[#0038FF] mt-0.5 flex-shrink-0" />
              <div className="text-[#050505]">
                <p className="font-bold uppercase mb-1">{'///'} SUPPORTED FORMATS {'///'}</p>
                <p className="text-gray-600">PDF, DOC, DOCX, JPEG, JPG, PNG</p>
                <p className="text-gray-600 mt-1">MAX: 5MB</p>
              </div>
            </div>
          </div>

          {/* Upload Area */}
          {canAddMore && (
            <div
              {...getRootProps()}
              className={cn(
                "border-tech border-2 border-dashed p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-white",
                isDragActive 
                  ? "border-[#0038FF] bg-[#0038FF]/5" 
                  : "border-[#0038FF]/30 hover:border-[#0038FF] hover:bg-[#0038FF]/5"
              )}
            >
              <input {...getInputProps()} />
              
              <div className="w-16 h-16 bg-[#0038FF]/10 rounded-full flex items-center justify-center mb-4">
                <Upload className="h-8 w-8 text-[#0038FF]" />
              </div>
              
              <p className="font-display text-lg font-bold uppercase text-[#050505] mb-2">
                {stagedFiles.length === 0 
                  ? "DROP CERT FILE HERE"
                  : "FILE READY"
                }
              </p>
              <p className="font-mono text-xs text-gray-500">
                OR CLICK TO BROWSE
              </p>
            </div>
          )}

          {/* Staged File */}
          {stagedFiles.length > 0 && (
            <div className="space-y-3">
              <p className="font-mono text-xs text-gray-500 font-bold uppercase">
                {'///'} SELECTED FILE {'///'}
              </p>
              <div className="border-tech bg-white">
                {stagedFiles.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors group"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <FileText className="h-5 w-5 text-[#0038FF] flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-mono text-sm font-bold text-[#050505] truncate">
                          {file.name}
                        </p>
                        <p className="font-mono text-[10px] text-gray-500 mt-1">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                        {file.status === 'error' && file.error && (
                          <p className="font-mono text-[10px] text-red-600 mt-1">{file.error}</p>
                        )}
                        {file.status === 'staging' && (
                          <div className="mt-2">
                            <div className="w-full bg-gray-200 h-1.5">
                              <div 
                                className="bg-[#0038FF] h-1.5 transition-all duration-200"
                                style={{ width: `${file.stagingProgress}%` }}
                              />
                            </div>
                            <p className="font-mono text-[10px] text-gray-500 mt-1">
                              PREPARING... {Math.round(file.stagingProgress)}%
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {getFileStatusIcon(file)}
                      {(file.status === 'staged' || file.status === 'staging') && (
                        <button 
                          onClick={() => removeFile(file.id)}
                          className="text-gray-400 hover:text-red-600 transition-colors p-1"
                          title="Remove file"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Processing Status */}
          {processingState.isProcessing && (
            <div className="border-tech bg-white p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 text-[#0038FF] animate-spin" />
                <span className="font-mono text-xs font-bold text-[#050505] uppercase">PROCESSING FILES...</span>
              </div>
              
              <div className="w-full bg-gray-200 h-2">
                <div 
                  className="bg-[#0038FF] h-2 transition-all duration-300"
                  style={{ width: `${processingState.progress}%` }}
                />
              </div>
              
              <div className="font-mono text-xs text-gray-600">
                <span>
                  {processingState.currentFile ? `PROCESSING: ${processingState.currentFile}` : 'EXTRACTING DATA...'}
                </span>
              </div>
            </div>
          )}

          {/* Success Summary */}
          {processingState.completedCount > 0 && !processingState.isProcessing && (
            <div className="border-tech bg-white p-4">
              <p className="font-mono text-xs font-bold uppercase text-[#050505] mb-2">{'///'} PROCESSING COMPLETE {'///'}</p>
              <div className="font-mono text-xs">
                {stagedFiles.filter(f => f.status === 'success').length > 0 ? (
                  <p className="text-green-600 font-bold">
                    ✓ CERTIFICATION UPLOADED SUCCESSFULLY
                  </p>
                ) : (
                  <p className="text-red-600 font-bold">
                    ✗ UPLOAD FAILED
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between pt-4 border-t border-gray-200">
            <button
              onClick={handleClose}
              disabled={processingState.isProcessing}
              className="font-mono text-xs font-bold px-6 py-3 border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processingState.completedCount > 0 && !processingState.isProcessing ? 'CLOSE' : 'CANCEL'}
            </button>
            
            {stagedFiles.length > 0 && (
              <button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className={cn(
                  "font-mono text-xs font-bold px-6 py-3 flex items-center gap-2 transition-colors border shadow-[4px_4px_0px_#0038FF]",
                  canSubmit 
                    ? "bg-[#050505] text-white hover:bg-[#0038FF] border-[#050505]" 
                    : "bg-gray-300 text-gray-500 cursor-not-allowed border-gray-300 shadow-none"
                )}
              >
                <Upload className="h-4 w-4" />
                {canSubmit 
                  ? 'UPLOAD & PROCESS'
                  : 'PREPARING FILE...'
                }
              </button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 