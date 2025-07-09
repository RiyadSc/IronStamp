import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Bell, Clock, Mail, AlertTriangle, CheckCircle, Users } from "@/lib/icons";
import { CertificationDetails } from "@/lib/data-service";
import { supabase } from "@/lib/supabase";
import { formatDateToAmerican, formatDateTimeToAmerican } from "@/lib/utils";

interface NotifyCertificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  certification: CertificationDetails | null;
  managers: string[]; // List of manager email addresses
}

export const NotifyCertificationModal: React.FC<NotifyCertificationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  certification,
  managers = []
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    timing: "now" as "now" | "scheduled",
    scheduledDate: "",
    scheduledTime: "",
    customMessage: "",
    includeManager: false,
    selectedManagers: [] as string[],
    notificationType: "renewal" as "renewal" | "expired" | "custom",
    includeCompliance: true
  });

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen && certification) {
      const defaultMessage = generateDefaultMessage(certification);
      setFormData({
        timing: "now",
        scheduledDate: "",
        scheduledTime: "",
        customMessage: defaultMessage,
        includeManager: false,
        selectedManagers: [],
        notificationType: certification.status === "Expired" ? "expired" : "renewal",
        includeCompliance: true
      });
    }
  }, [isOpen, certification]);

  const generateDefaultMessage = (cert: CertificationDetails): string => {
    const isExpired = cert.status === "Expired";
    const daysText = Math.abs(cert.daysLeft) === 1 ? "day" : "days";
    
    if (isExpired) {
      return `Your ${cert.type} certification expired ${Math.abs(cert.daysLeft)} ${daysText} ago. Please renew immediately to maintain compliance.`;
    } else {
      return `Your ${cert.type} certification expires in ${cert.daysLeft} ${daysText}. Please begin the renewal process to avoid any compliance issues.`;
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleManagerToggle = (managerEmail: string) => {
    setFormData(prev => ({
      ...prev,
      selectedManagers: prev.selectedManagers.includes(managerEmail)
        ? prev.selectedManagers.filter(email => email !== managerEmail)
        : [...prev.selectedManagers, managerEmail]
    }));
  };

  const handleSubmit = async () => {
    if (!certification || !isFormValid) return;

    setLoading(true);
    try {
      // Get current user session for authentication
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.access_token) {
        throw new Error('Authentication required. Please sign in again.');
      }

      const notificationData = {
        certificationId: certification.id,
        employeeName: certification.employee,
        certificationType: certification.type,
        timing: formData.timing,
        scheduledDateTime: formData.timing === "scheduled" 
          ? `${formData.scheduledDate}T${formData.scheduledTime}:00`
          : null,
        customMessage: formData.customMessage,
        includeManager: formData.includeManager,
        selectedManagers: formData.selectedManagers,
        notificationType: formData.notificationType,
        includeCompliance: formData.includeCompliance,
        certificationStatus: certification.status,
        daysLeft: certification.daysLeft,
        expirationDate: certification.expirationDate
      };

      const response = await fetch('/api/notifications/send-individual', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(notificationData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || 'Failed to send notification');
      }

      const result = await response.json();
      console.log('Notification sent:', result);
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error sending notification:', error);
      alert(`Error sending notification: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Active":
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Active</Badge>;
      case "Expiring Soon":
        return <Badge className="bg-orange-100 text-orange-800"><AlertTriangle className="w-3 h-3 mr-1" />Expiring</Badge>;
      case "Expired":
        return <Badge className="bg-red-100 text-red-800"><AlertTriangle className="w-3 h-3 mr-1" />Expired</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const isFormValid = formData.customMessage.trim() !== "" &&
                     (formData.timing === "now" || 
                      (formData.scheduledDate && formData.scheduledTime));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Bell className="h-5 w-5 text-blue-600" />
            <span>Send Certification Notification</span>
          </DialogTitle>
          <DialogDescription>
            Send a renewal reminder for {certification?.employee}'s certification
          </DialogDescription>
        </DialogHeader>

        {certification && (
          <div className="space-y-6 py-4">
            {/* Certification Overview */}
            <div className="p-4 bg-gray-50 rounded-lg border">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-gray-900">{certification.type}</h4>
                {getStatusBadge(certification.status)}
              </div>
              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>Employee:</strong> {certification.employee}</p>
                <p><strong>Expires:</strong> {formatDateToAmerican(certification.expirationDate)}</p>
                <p><strong>Status:</strong> {certification.daysLeft > 0 
                  ? `${certification.daysLeft} days remaining` 
                  : `Expired ${Math.abs(certification.daysLeft)} days ago`}
                </p>
              </div>
            </div>

            {/* Notification Timing */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">Notification Timing</Label>
              <Select value={formData.timing} onValueChange={(value: "now" | "scheduled") => handleInputChange('timing', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="now">
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4 h-4" />
                      <span>Send Now</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="scheduled">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4" />
                      <span>Schedule for Later</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>

              {formData.timing === "scheduled" && (
                <div className="grid grid-cols-2 gap-4 pl-4">
                  <div className="space-y-2">
                    <Label htmlFor="scheduledDate">Date</Label>
                    <Input
                      id="scheduledDate"
                      type="date"
                      value={formData.scheduledDate}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => handleInputChange('scheduledDate', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="scheduledTime">Time</Label>
                    <Input
                      id="scheduledTime"
                      type="time"
                      value={formData.scheduledTime}
                      onChange={(e) => handleInputChange('scheduledTime', e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Notification Type */}
            <div className="space-y-2">
              <Label>Notification Type</Label>
              <Select value={formData.notificationType} onValueChange={(value: "renewal" | "expired" | "custom") => handleInputChange('notificationType', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="renewal">Renewal Reminder</SelectItem>
                  <SelectItem value="expired">Expired Notice</SelectItem>
                  <SelectItem value="custom">Custom Message</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Custom Message */}
            <div className="space-y-2">
              <Label htmlFor="customMessage">Message Content *</Label>
              <Textarea
                id="customMessage"
                value={formData.customMessage}
                onChange={(e) => handleInputChange('customMessage', e.target.value)}
                placeholder="Enter your notification message..."
                className="min-h-[120px]"
              />
              <p className="text-xs text-gray-500">
                This message will be sent to {certification.employee}
              </p>
            </div>

            {/* Massachusetts Compliance Warning */}
            <div className="flex items-center space-x-3">
              <Switch
                id="includeCompliance"
                checked={formData.includeCompliance}
                onCheckedChange={(checked) => handleInputChange('includeCompliance', checked)}
              />
              <Label htmlFor="includeCompliance" className="text-sm">
                Include Massachusetts compliance warnings
              </Label>
            </div>

            {/* Include Manager */}
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Switch
                  id="includeManager"
                  checked={formData.includeManager}
                  onCheckedChange={(checked) => handleInputChange('includeManager', checked)}
                />
                <Label htmlFor="includeManager" className="text-sm">
                  Notify managers/supervisors
                </Label>
              </div>

              {formData.includeManager && managers.length > 0 && (
                <div className="pl-6 space-y-2">
                  <Label className="text-sm text-gray-600">Select managers to notify:</Label>
                  <div className="space-y-2">
                    {managers.map((manager) => (
                      <div key={manager} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`manager-${manager}`}
                          checked={formData.selectedManagers.includes(manager)}
                          onChange={() => handleManagerToggle(manager)}
                          className="rounded border-gray-300"
                        />
                        <Label htmlFor={`manager-${manager}`} className="text-sm">
                          {manager}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Preview */}
            {formData.timing === "scheduled" && formData.scheduledDate && formData.scheduledTime && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center space-x-2 text-blue-700">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm">
                    Scheduled for {formatDateTimeToAmerican(new Date(`${formData.scheduledDate}T${formData.scheduledTime}`))}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={loading || !isFormValid}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? (
              formData.timing === "now" ? 'Sending...' : 'Scheduling...'
            ) : (
              formData.timing === "now" ? 'Send Notification' : 'Schedule Notification'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 