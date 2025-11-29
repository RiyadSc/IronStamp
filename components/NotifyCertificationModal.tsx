import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Bell, Clock, Mail, AlertTriangle, CheckCircle, Users, X, ShieldAlert, Send, Calendar } from "lucide-react";
import { CertificationDetails } from "@/lib/data-service";
import { apiRequest } from "@/lib/csrf-client";
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
    includeCompliance: true,
    actionRequired: "renew" as "renew" | "stop_work" | "meeting"
  });

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen && certification) {
      const isExpired = certification.status === "Expired";
      const defaultMessage = generateDefaultMessage(certification, isExpired ? "stop_work" : "renew");
      
      setFormData({
        timing: "now",
        scheduledDate: "",
        scheduledTime: "",
        customMessage: defaultMessage,
        includeManager: isExpired, // Auto-notify manager if expired
        selectedManagers: managers.slice(0, 1), // Select first manager by default if needed
        notificationType: isExpired ? "expired" : "renewal",
        includeCompliance: true,
        actionRequired: isExpired ? "stop_work" : "renew"
      });
    }
  }, [isOpen, certification, managers]);

  // Update message when action changes
  useEffect(() => {
    if (certification) {
      setFormData(prev => ({
        ...prev,
        customMessage: generateDefaultMessage(certification, prev.actionRequired)
      }));
    }
  }, [formData.actionRequired, certification]);

  const generateDefaultMessage = (cert: CertificationDetails, action: string): string => {
    const daysText = Math.abs(cert.daysLeft) === 1 ? "day" : "days";
    const isExpired = cert.daysLeft < 0;
    
    const header = `Subject: IMMEDIATE ACTION REQUIRED: ${cert.type} Certification Status\n\n`;
    
    let body = "";
    
    if (action === "stop_work") {
      body = `NOTICE OF NON-COMPLIANCE / STOP WORK ORDER\n\n` +
      `Your ${cert.type} certification EXPIRED ${Math.abs(cert.daysLeft)} ${daysText} ago on ${formatDateToAmerican(cert.expirationDate)}.\n\n` +
      `Under Massachusetts 527 CMR and 266 CMR, you are NOT AUTHORIZED to perform work requiring this licensure until it is renewed. ` +
      `Continuing to work with an expired license puts both you and the company at risk of significant fines and liability.\n\n` +
      `INSTRUCTIONS:\n` +
      `1. Cease all related work immediately.\n` +
      `2. Contact the office to process your renewal.\n` +
      `3. Provide proof of renewal before resuming duties.`;
    } else if (action === "renew") {
      if (isExpired) {
         body = `Your ${cert.type} certification is currently EXPIRED. It expired on ${formatDateToAmerican(cert.expirationDate)}.\n\n` +
         `Please prioritize renewing this certification immediately. While we process this, ensure you are not performing tasks that strictly require this active license under MA state regulations.\n\n` +
         `Please submit your renewal application today.`;
      } else {
        body = `This is a reminder that your ${cert.type} certification will expire in ${cert.daysLeft} ${daysText} on ${formatDateToAmerican(cert.expirationDate)}.\n\n` +
        `To maintain compliance with Massachusetts HVAC regulations and avoid any work stoppage, please initiate your renewal process now.\n\n` +
        `Do not wait until the expiration date.`;
      }
    } else if (action === "meeting") {
      body = `Please report to the office immediately to discuss your ${cert.type} certification status.\n\n` +
      `Your certification expires on ${formatDateToAmerican(cert.expirationDate)} and we need to verify your eligibility for continued field work.\n\n` +
      `This is a mandatory compliance meeting.`;
    }

    return body; // Removed header for the textarea, assuming subject is handled by backend or standard email template
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

      // Use apiRequest which automatically includes CSRF token
      const response = await apiRequest('/api/notifications/send-individual', {
        method: 'POST',
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

  const isFormValid = formData.customMessage.trim() !== "" &&
                     (formData.timing === "now" || 
                      (formData.scheduledDate && formData.scheduledTime));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl p-0 gap-0 border-2 border-[#050505] shadow-[8px_8px_0px_#0038FF] bg-white rounded-none">
        <DialogHeader className="p-6 border-b border-gray-100 bg-gray-50">
          <div>
            <DialogTitle className="font-display text-2xl font-bold uppercase flex items-center gap-2 text-[#050505]">
              <Bell className="h-6 w-6 text-[#0038FF]" />
              Dispatcher // Notify Tech
            </DialogTitle>
            <DialogDescription className="font-mono text-xs text-gray-500 mt-1">
              SYS.MSG.ID: {Math.floor(Math.random() * 10000).toString().padStart(4, '0')} // COMPLIANCE ENFORCEMENT
            </DialogDescription>
          </div>
        </DialogHeader>

        {certification && (
          <div className="flex flex-col md:flex-row h-full max-h-[70vh]">
            {/* Left Panel: Context & Status */}
            <div className="w-full md:w-1/3 bg-[#F8FAFC] border-r border-gray-200 p-6 space-y-6 overflow-y-auto">
              {/* Status Card */}
              <div className={`p-4 border-l-4 ${certification.daysLeft < 0 ? 'bg-red-50 border-l-red-600' : 'bg-yellow-50 border-l-yellow-500'} shadow-sm`}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-mono text-[10px] uppercase text-gray-500 mb-1">CERTIFICATION STATUS</p>
                    <h3 className={`font-display text-xl font-bold uppercase ${certification.daysLeft < 0 ? 'text-red-700' : 'text-yellow-700'}`}>
                      {certification.daysLeft < 0 ? 'NON-COMPLIANT' : 'AT RISK'}
                    </h3>
                  </div>
                  {certification.daysLeft < 0 ? <ShieldAlert className="w-6 h-6 text-red-600" /> : <AlertTriangle className="w-6 h-6 text-yellow-600" />}
                </div>
                <p className="font-mono text-xs mt-2 text-gray-700">
                  {certification.daysLeft < 0 
                    ? `Expired ${Math.abs(certification.daysLeft)} days ago.` 
                    : `Expires in ${certification.daysLeft} days.`}
                </p>
              </div>

              {/* Tech Details */}
              <div>
                <p className="font-mono text-[10px] uppercase text-gray-500 mb-2">/// TECHNICIAN DETAILS</p>
                <div className="bg-white p-3 border border-gray-200 shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-[#050505] text-white flex items-center justify-center font-mono text-xs font-bold">
                      {certification.employee.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-sm">{certification.employee}</p>
                      <p className="text-xs text-gray-500 font-mono">HVAC TECHNICIAN</p>
                    </div>
                  </div>
                  <div className="space-y-1 text-xs font-mono border-t border-gray-100 pt-2 mt-2">
                    <div className="flex justify-between">
                      <span className="text-gray-500">CERT:</span>
                      <span className="font-bold">{certification.type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">EXP:</span>
                      <span>{formatDateToAmerican(certification.expirationDate)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Compliance Note */}
              <div className="bg-blue-50 p-3 border border-blue-100">
                <p className="font-mono text-[10px] text-blue-800 leading-tight">
                  <span className="font-bold">MA REGULATION NOTE:</span><br/>
                  Unlicensed work is subject to fines up to $1,000 per offense under 527 CMR 12.00.
                </p>
              </div>
            </div>

            {/* Right Panel: Action Form */}
            <div className="w-full md:w-2/3 p-6 overflow-y-auto bg-white">
              <div className="space-y-6">
                {/* Quick Actions */}
                <div>
                  <Label className="font-mono text-xs uppercase text-gray-500 mb-3 block">/// SELECT ACTION PROTOCOL</Label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={() => handleInputChange('actionRequired', 'renew')}
                      className={`p-3 text-left border transition-all ${formData.actionRequired === 'renew' ? 'border-[#0038FF] bg-[#0038FF]/5 ring-1 ring-[#0038FF]' : 'border-gray-200 hover:border-gray-300'}`}
                    >
                      <Clock className="w-4 h-4 mb-2 text-[#0038FF]" />
                      <p className="font-bold text-xs uppercase">Standard Renewal</p>
                    </button>
                    <button
                      onClick={() => handleInputChange('actionRequired', 'stop_work')}
                      className={`p-3 text-left border transition-all ${formData.actionRequired === 'stop_work' ? 'border-red-600 bg-red-50 ring-1 ring-red-600' : 'border-gray-200 hover:border-gray-300'}`}
                    >
                      <ShieldAlert className="w-4 h-4 mb-2 text-red-600" />
                      <p className="font-bold text-xs uppercase text-red-700">Stop Work Order</p>
                    </button>
                    <button
                      onClick={() => handleInputChange('actionRequired', 'meeting')}
                      className={`p-3 text-left border transition-all ${formData.actionRequired === 'meeting' ? 'border-gray-400 bg-gray-50 ring-1 ring-gray-400' : 'border-gray-200 hover:border-gray-300'}`}
                    >
                      <Users className="w-4 h-4 mb-2 text-gray-600" />
                      <p className="font-bold text-xs uppercase">Summon to Office</p>
                    </button>
                  </div>
                </div>

                {/* Message Editor */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="customMessage" className="font-mono text-xs uppercase text-gray-500">/// TRANSMISSION CONTENT</Label>
                    <span className="text-[10px] text-gray-400 font-mono">ENCRYPTED // LOGGED</span>
                  </div>
                  <Textarea
                    id="customMessage"
                    value={formData.customMessage}
                    onChange={(e) => handleInputChange('customMessage', e.target.value)}
                    className="min-h-[200px] font-mono text-sm bg-gray-50 border-gray-200 focus:border-[#0038FF] p-4 resize-none"
                  />
                </div>

                {/* Delivery Settings */}
                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100">
                  <div>
                    <Label className="font-mono text-xs uppercase text-gray-500 mb-2 block">TIMING</Label>
                    <Select value={formData.timing} onValueChange={(value: "now" | "scheduled") => handleInputChange('timing', value)}>
                      <SelectTrigger className="font-mono text-xs h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="now">IMMEDIATE</SelectItem>
                        <SelectItem value="scheduled">SCHEDULED</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="font-mono text-xs uppercase text-gray-500 mb-2 block">CC: MANAGEMENT</Label>
                    <div className="flex items-center h-9 px-3 border border-gray-200 bg-gray-50">
                      <Switch
                        id="includeManager"
                        checked={formData.includeManager}
                        onCheckedChange={(checked) => handleInputChange('includeManager', checked)}
                        className="scale-75 mr-2"
                      />
                      <span className="font-mono text-xs text-gray-600">{formData.includeManager ? 'ENABLED' : 'DISABLED'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="p-4 border-t border-gray-100 bg-gray-50 flex justify-between items-center sm:justify-between">
          <div className="text-[10px] font-mono text-gray-400 hidden sm:block">
            SECURE TRANSMISSION PROTOCOL V2.1
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={onClose} disabled={loading} className="font-mono text-xs hover:bg-gray-200">
              CANCEL
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={loading || !isFormValid}
              className="bg-[#0038FF] hover:bg-[#002db3] text-white font-mono text-xs font-bold px-6 rounded-none shadow-[4px_4px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_#000000] transition-all"
            >
              {loading ? (
                <>
                  <span className="animate-pulse mr-2">///</span> TRANSMITTING...
                </>
              ) : (
                <>
                  <Send className="w-3 h-3 mr-2" />
                  TRANSMIT ORDER
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
