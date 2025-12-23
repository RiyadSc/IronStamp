import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, UploadCloud, X, FileText, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { uploadCertification } from '@/lib/certification-service';
import { useToast } from '@/hooks/use-toast';

interface AddCrewMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddCrewMemberModal: React.FC<AddCrewMemberModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    role: '',
    email: '',
    phone: ''
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName || !formData.role || !formData.email || !formData.phone) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`;

    try {
      // 1. Get User
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('User not authenticated');

      // 2. Create Employee
      const { error: empError } = await supabase
        .from('employees')
        .insert([
          {
            user_id: user.id,
            name: fullName,
            email: formData.email.trim().toLowerCase(),
            phone: formData.phone.trim(),
            role: formData.role,
            status: 'Active'
          }
        ]);

      if (empError) throw empError;

      // Track whether certification upload actually succeeded so we don't show contradictory messaging.
      let certUploadSucceeded = false;

      // 3. Upload Certification (if selected)
      if (selectedFile) {
        setUploadProgress(10); // Started
        
        try {
          // Use existing service to upload and extract data
          const certResult = await uploadCertification(selectedFile);
          setUploadProgress(80); // Uploaded & Extracted
          certUploadSucceeded = true;
          
          // CRITICAL: Update the certification to match the exact employee name we just created
          // This ensures the "Massachusetts Special" requirement of staging it for THIS tech
          const { error: updateError } = await supabase
            .from('certifications')
            .update({ employee_name: fullName })
            .eq('id', certResult.id);
            
          if (updateError) {
            console.warn('Failed to link certification to exact name:', updateError);
            // We don't throw here because the cert IS created, just might have a slightly different name from AI
          }
          
        } catch (uploadError) {
          console.error('Certification upload failed:', uploadError);
          toast({
            title: "Employee Added, but Certification Failed",
            description: "The employee was created, but the certification upload failed. Please try uploading it again from the dashboard.",
            variant: "destructive"
          });
          // We continue to success because the employee WAS created
        }
      }

      setUploadProgress(100);
      toast({
        title: "Technician Onboarded",
        description: `${fullName} has been added to the crew${
          selectedFile && certUploadSucceeded ? ' and certification staged' : ''
        }.`,
      });

      // Reset and Close
      setFormData({
        firstName: '',
        lastName: '',
        role: '',
        email: '',
        phone: ''
      });
      setSelectedFile(null);
      onSuccess();
      onClose();

    } catch (error: any) {
      console.error('Error adding crew member:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add team member.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !loading && !open && onClose()}>
      <DialogContent className="max-w-2xl p-0 gap-0 bg-white border-2 border-[#050505] shadow-[8px_8px_0px_#0038FF] sm:rounded-none [&>button]:hidden">
        {/* Header */}
        <DialogHeader className="p-6 border-b border-gray-100 bg-gray-50 flex flex-row items-center justify-between">
          <DialogTitle className="font-display text-2xl font-bold uppercase flex items-center gap-2">
            <Plus className="w-5 h-5 text-[#0038FF]" /> Add Technician
          </DialogTitle>
          <DialogClose className="text-gray-400 hover:text-[#050505] transition-colors" disabled={loading}>
            <X className="w-6 h-6" />
          </DialogClose>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Personal Info Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-[#0038FF] font-mono text-xs font-bold uppercase mb-2">
              <span>01 // Identification</span>
              <div className="h-[1px] flex-1 bg-[#0038FF]/20"></div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="font-mono text-xs uppercase text-gray-500">First Name</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  className="font-mono border-gray-200 focus:border-[#0038FF] focus:ring-[#0038FF] rounded-none"
                  placeholder="MIKE"
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName" className="font-mono text-xs uppercase text-gray-500">Last Name</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  className="font-mono border-gray-200 focus:border-[#0038FF] focus:ring-[#0038FF] rounded-none"
                  placeholder="SMITH"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="role" className="font-mono text-xs uppercase text-gray-500">Role / Title</Label>
                <Select 
                  value={formData.role} 
                  onValueChange={(value) => handleInputChange('role', value)}
                  disabled={loading}
                >
                  <SelectTrigger className="font-mono border-gray-200 focus:border-[#0038FF] focus:ring-[#0038FF] rounded-none">
                    <SelectValue placeholder="SELECT ROLE" />
                  </SelectTrigger>
                  <SelectContent className="font-mono rounded-none border-2 border-[#050505]">
                    <SelectItem value="Apprentice">APPRENTICE</SelectItem>
                    <SelectItem value="Technician">TECHNICIAN</SelectItem>
                    <SelectItem value="Lead">LEAD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="font-mono text-xs uppercase text-gray-500">Phone (For Alerts)</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="font-mono border-gray-200 focus:border-[#0038FF] focus:ring-[#0038FF] rounded-none"
                  placeholder="555-0123"
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="font-mono text-xs uppercase text-gray-500">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="font-mono border-gray-200 focus:border-[#0038FF] focus:ring-[#0038FF] rounded-none"
                  placeholder="MIKE@HVAC.COM"
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* Certification Section - The "Massachusetts Special" */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-[#0038FF] font-mono text-xs font-bold uppercase mb-2">
              <span>02 // Quick Cert Stage</span>
              <div className="h-[1px] flex-1 bg-[#0038FF]/20"></div>
            </div>

            <div 
              className={`border-2 border-dashed transition-colors relative group cursor-pointer
                ${selectedFile ? 'border-[#0038FF] bg-[#0038FF]/5' : 'border-gray-200 hover:border-[#0038FF] hover:bg-gray-50'}
                p-6 flex flex-col items-center justify-center text-center min-h-[120px]
              `}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => !selectedFile && fileInputRef.current?.click()}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                onChange={handleFileSelect}
                disabled={loading}
              />
              
              {selectedFile ? (
                <div className="flex items-center justify-between w-full max-w-md bg-white p-3 border border-[#0038FF] shadow-sm">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-8 h-8 bg-[#0038FF]/10 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-4 h-4 text-[#0038FF]" />
                    </div>
                    <div className="text-left overflow-hidden">
                      <p className="font-mono text-xs font-bold truncate">{selectedFile.name}</p>
                      <p className="font-mono text-[10px] text-gray-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                  <button 
                    type="button"
                    onClick={(e) => { e.stopPropagation(); removeFile(); }}
                    className="p-1 hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                    disabled={loading}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                    <UploadCloud className="w-5 h-5 text-gray-500 group-hover:text-[#0038FF]" />
                  </div>
                  <p className="font-mono text-sm text-gray-600 font-bold">DROP CERTIFICATE HERE</p>
                  <p className="font-mono text-xs text-gray-400 mt-1">OR CLICK TO BROWSE FILES</p>
                </>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
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
              type="submit" 
              className="flex-[2] bg-[#050505] hover:bg-[#0038FF] text-white font-mono font-bold rounded-none shadow-[4px_4px_0px_#0038FF] transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-70 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {uploadProgress > 0 ? `UPLOADING... ${uploadProgress}%` : 'SAVING...'}
                </span>
              ) : (
                'SAVE TECHNICIAN'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

