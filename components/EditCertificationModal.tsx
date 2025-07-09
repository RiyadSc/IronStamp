import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Upload, AlertTriangle } from "@/lib/icons";
import { CertificationDetails } from "@/lib/data-service";
import { supabase } from "@/lib/supabase";

interface EditCertificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  certification: CertificationDetails | null;
  employees: string[]; // List of all employee names for reassignment
}

export const EditCertificationModal: React.FC<EditCertificationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  certification,
  employees = []
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    certificationName: "",
    employeeName: "",
    issueDate: "",
    expirationDate: "",
    priority: "medium" as "low" | "medium" | "high",
    notes: "",
    certificateFile: null as File | null
  });

  // Populate form when certification changes
  useEffect(() => {
    if (certification) {
      setFormData({
        certificationName: certification.type || "",
        employeeName: certification.employee || "",
        issueDate: certification.issueDate || "",
        expirationDate: certification.expirationDate || "",
        priority: certification.priority || "medium",
        notes: certification.notes || "",
        certificateFile: null
      });
    }
  }, [certification]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData(prev => ({
      ...prev,
      certificateFile: file
    }));
  };

  const handleSubmit = async () => {
    if (!certification) return;

    setLoading(true);
    try {
      // Get current user session for authentication
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.access_token) {
        throw new Error('Authentication required. Please sign in again.');
      }

      const updateData = new FormData();
      updateData.append('certificationId', certification.id);
      updateData.append('certificationName', formData.certificationName);
      updateData.append('employeeName', formData.employeeName);
      updateData.append('issueDate', formData.issueDate);
      updateData.append('expirationDate', formData.expirationDate);
      updateData.append('priority', formData.priority);
      updateData.append('notes', formData.notes);
      
      if (formData.certificateFile) {
        updateData.append('certificateFile', formData.certificateFile);
      }

      console.log('Sending update request for certification:', certification.id);
      console.log('Form data:', {
        certificationName: formData.certificationName,
        employeeName: formData.employeeName,
        issueDate: formData.issueDate,
        expirationDate: formData.expirationDate,
        priority: formData.priority,
        notes: formData.notes,
        hasFile: !!formData.certificateFile
      });

      const response = await fetch('/api/certifications/update', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        },
        body: updateData
      });

      console.log('Response status:', response.status);
      
      const responseData = await response.json();
      console.log('Response data:', responseData);

      if (!response.ok) {
        throw new Error(responseData.details || responseData.error || 'Failed to update certification');
      }

      console.log('Update successful!');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error updating certification:', error);
      alert(`Error updating certification: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = formData.certificationName && 
                     formData.employeeName && 
                     formData.issueDate && 
                     formData.expirationDate &&
                     new Date(formData.expirationDate) > new Date(formData.issueDate);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            <span>Edit Certification</span>
          </DialogTitle>
          <DialogDescription>
            Update certification details for {certification?.employee}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Certification Name */}
          <div className="space-y-2">
            <Label htmlFor="certificationName">Certification Name *</Label>
            <Input
              id="certificationName"
              value={formData.certificationName}
              onChange={(e) => handleInputChange('certificationName', e.target.value)}
              placeholder="e.g., EPA 608 Certification"
              className="w-full"
            />
          </div>

          {/* Employee Assignment */}
          <div className="space-y-2">
            <Label htmlFor="employeeName">Assign to Employee *</Label>
            <Select value={formData.employeeName} onValueChange={(value) => handleInputChange('employeeName', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select employee" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((employee) => (
                  <SelectItem key={employee} value={employee}>
                    {employee}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="issueDate">Issue Date *</Label>
              <Input
                id="issueDate"
                type="date"
                value={formData.issueDate}
                onChange={(e) => handleInputChange('issueDate', e.target.value)}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expirationDate">Expiration Date *</Label>
              <Input
                id="expirationDate"
                type="date"
                value={formData.expirationDate}
                onChange={(e) => handleInputChange('expirationDate', e.target.value)}
                className="w-full"
              />
            </div>
          </div>

          {/* Priority Level */}
          <div className="space-y-2">
            <Label htmlFor="priority">Priority Level</Label>
            <Select value={formData.priority} onValueChange={(value: "low" | "medium" | "high") => handleInputChange('priority', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low Priority</SelectItem>
                <SelectItem value="medium">Medium Priority</SelectItem>
                <SelectItem value="high">High Priority</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes/Comments</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Add any additional notes about this certification..."
              className="min-h-[80px]"
            />
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="certificateFile">Upload New Certificate (Optional)</Label>
            <div className="flex items-center space-x-3">
              <Input
                id="certificateFile"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                className="flex-1"
              />
              <Upload className="h-4 w-4 text-gray-400" />
            </div>
            <p className="text-xs text-gray-500">
              Accepted formats: PDF, JPG, PNG (Max 10MB)
            </p>
          </div>

          {/* Date Validation Warning */}
          {formData.issueDate && formData.expirationDate && 
           new Date(formData.expirationDate) <= new Date(formData.issueDate) && (
            <div className="flex items-center space-x-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <span className="text-sm text-orange-700">
                Expiration date must be after issue date
              </span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={loading || !isFormValid}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? 'Updating...' : 'Update Certification'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 