import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Archive, ArchiveRestore, Trash2, X, Loader2 } from 'lucide-react';

interface ConfirmActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<boolean>;
  title: string;
  message: string;
  confirmLabel: string;
  type: 'archive' | 'delete' | 'reinstate';
  technicianName?: string;
}

export const ConfirmActionModal: React.FC<ConfirmActionModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel,
  type,
  technicianName
}) => {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const ok = await onConfirm();
      // Only close modal on success
      if (ok) {
        onClose();
      }
    } catch (error) {
      console.error('Action failed:', error);
      // Don't close modal on error - let user see the error and manually close
    } finally {
      setLoading(false);
    }
  };

  const isDelete = type === 'delete';
  const isReinstate = type === 'reinstate';
  const Icon = isDelete ? Trash2 : isReinstate ? ArchiveRestore : Archive;
  const iconColor = isDelete ? 'text-red-500' : isReinstate ? 'text-green-600' : 'text-yellow-600';
  const bgColor = isDelete ? 'bg-red-50' : isReinstate ? 'bg-green-50' : 'bg-yellow-50';
  const borderColor = isDelete ? 'border-red-200' : isReinstate ? 'border-green-200' : 'border-yellow-200';
  const buttonClass = isDelete 
    ? 'bg-red-600 hover:bg-red-700 shadow-[4px_4px_0px_#991b1b]' 
    : isReinstate 
    ? 'bg-green-600 hover:bg-green-700 shadow-[4px_4px_0px_#166534]' 
    : 'bg-yellow-600 hover:bg-yellow-700 shadow-[4px_4px_0px_#854d0e]';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !loading && !open && onClose()}>
      <DialogContent className="max-w-md p-0 gap-0 bg-white border-2 border-[#050505] shadow-[8px_8px_0px_#0038FF] sm:rounded-none [&>button]:hidden">
        {/* Header */}
        <DialogHeader className={`p-6 border-b ${borderColor} ${bgColor} flex flex-row items-center justify-between`}>
          <DialogTitle className="font-display text-xl font-bold uppercase flex items-center gap-2">
            <AlertTriangle className={`w-5 h-5 ${iconColor}`} /> {title}
          </DialogTitle>
          <DialogClose className="text-gray-400 hover:text-[#050505] transition-colors" disabled={loading}>
            <X className="w-6 h-6" />
          </DialogClose>
        </DialogHeader>

        <div className="p-6 space-y-6">
          {/* Warning Icon & Message */}
          <div className="flex flex-col items-center text-center">
            <div className={`w-16 h-16 ${bgColor} border-2 ${borderColor} flex items-center justify-center mb-4`}>
              <Icon className={`w-8 h-8 ${iconColor}`} />
            </div>
            
            {technicianName && (
              <div className="font-display text-lg font-bold text-gray-900 mb-2">
                {technicianName}
              </div>
            )}
            
            <p className="font-mono text-sm text-gray-600 max-w-sm">
              {message}
            </p>
          </div>

          {/* Warning Note */}
          <div className={`p-3 ${bgColor} border ${borderColor}`}>
            <div className="flex items-start gap-2">
              <AlertTriangle className={`w-4 h-4 ${iconColor} mt-0.5 flex-shrink-0`} />
              <p className="font-mono text-xs text-gray-700">
                {isDelete 
                  ? 'This action is permanent and cannot be undone. All associated data will be removed.'
                  : isReinstate
                  ? 'The technician will appear in the active crew list again.'
                  : 'Archived technicians can be restored later from the crew page (Show Archived).'
                }
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button 
              type="button" 
              variant="outline" 
              className="flex-1 font-mono rounded-none border-gray-200 hover:bg-gray-50"
              onClick={onClose}
              disabled={loading}
            >
              CANCEL
            </Button>
            <Button 
              type="button" 
              className={`flex-1 text-white font-mono font-bold rounded-none transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-70 disabled:cursor-not-allowed ${buttonClass}`}
              onClick={handleConfirm}
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  PROCESSING...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Icon className="w-4 h-4" />
                  {confirmLabel}
                </span>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

