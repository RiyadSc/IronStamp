import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pencil, X, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/csrf-client';
import type { TeamMember } from '@/lib/data-service';

interface EditCrewMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  member: TeamMember | null;
}

export const EditCrewMemberModal: React.FC<EditCrewMemberModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  member
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    email: '',
    phone: '',
    status: 'Active'
  });

  // Populate form when member changes
  useEffect(() => {
    if (member) {
      setFormData({
        name: member.name || '',
        role: member.role || 'Technician',
        email: member.email || '',
        phone: member.phone || '',
        status: member.status || 'Active'
      });
    }
  }, [member]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!member) return;
    
    if (!formData.name || !formData.role || !formData.email) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      // apiRequest handles Authorization header automatically via supabase session
      const response = await apiRequest('/api/team/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: member.id,
          ...formData
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || 'Failed to update team member');
      }

      toast({
        title: "Technician Updated",
        description: `${formData.name}'s profile has been updated.`,
      });

      onSuccess();
      onClose();

    } catch (error: any) {
      console.error('Error updating crew member:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update team member.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !loading && !open && onClose()}>
      <DialogContent className="max-w-2xl p-0 gap-0 bg-white border-2 border-[#050505] shadow-[8px_8px_0px_#0038FF] sm:rounded-none [&>button]:hidden">
        {/* Header */}
        <DialogHeader className="p-6 border-b border-gray-100 bg-gray-50 flex flex-row items-center justify-between">
          <DialogTitle className="font-display text-2xl font-bold uppercase flex items-center gap-2">
            <Pencil className="w-5 h-5 text-[#0038FF]" /> Edit Technician
          </DialogTitle>
          <DialogClose className="text-gray-400 hover:text-[#050505] transition-colors" disabled={loading}>
            <X className="w-6 h-6" />
          </DialogClose>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Personal Info Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-[#0038FF] font-mono text-xs font-bold uppercase mb-2">
              <span>01 // Profile Information</span>
              <div className="h-[1px] flex-1 bg-[#0038FF]/20"></div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="name" className="font-mono text-xs uppercase text-gray-500">Full Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="font-mono border-gray-200 focus:border-[#0038FF] focus:ring-[#0038FF] rounded-none"
                placeholder="JOHN SMITH"
                disabled={loading}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="role" className="font-mono text-xs uppercase text-gray-500">Role / Title *</Label>
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
                    <SelectItem value="Senior Technician">SENIOR TECHNICIAN</SelectItem>
                    <SelectItem value="Lead Technician">LEAD TECHNICIAN</SelectItem>
                    <SelectItem value="Supervisor">SUPERVISOR</SelectItem>
                    <SelectItem value="Manager">MANAGER</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status" className="font-mono text-xs uppercase text-gray-500">Status *</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value) => handleInputChange('status', value)}
                  disabled={loading}
                >
                  <SelectTrigger className="font-mono border-gray-200 focus:border-[#0038FF] focus:ring-[#0038FF] rounded-none">
                    <SelectValue placeholder="SELECT STATUS" />
                  </SelectTrigger>
                  <SelectContent className="font-mono rounded-none border-2 border-[#050505]">
                    <SelectItem value="Active">ACTIVE</SelectItem>
                    <SelectItem value="On Leave">ON LEAVE</SelectItem>
                    <SelectItem value="Training">IN TRAINING</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Contact Info Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-[#0038FF] font-mono text-xs font-bold uppercase mb-2">
              <span>02 // Contact Details</span>
              <div className="h-[1px] flex-1 bg-[#0038FF]/20"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <Label htmlFor="email" className="font-mono text-xs uppercase text-gray-500">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="font-mono border-gray-200 focus:border-[#0038FF] focus:ring-[#0038FF] rounded-none"
                  placeholder="JOHN@HVAC.COM"
                  disabled={loading}
                />
              </div>
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
                  SAVING...
                </span>
              ) : (
                'SAVE CHANGES'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

