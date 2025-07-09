import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Bell, Mail, AlertTriangle, Clock, User, Send } from "@/lib/icons";
import { PriorityItem } from "@/lib/data-service";
import { supabase } from "@/lib/supabase";

interface NotifyPriorityActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  priorityItem: PriorityItem | null;
}

export const NotifyPriorityActionModal: React.FC<NotifyPriorityActionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  priorityItem
}) => {
  const [loading, setLoading] = useState(false);
  const [customMessage, setCustomMessage] = useState("");

  // Generate default message when modal opens
  useEffect(() => {
    if (isOpen && priorityItem) {
      const defaultMessage = generateDefaultMessage(priorityItem);
      setCustomMessage(defaultMessage);
    }
  }, [isOpen, priorityItem]);

  const generateDefaultMessage = (item: PriorityItem): string => {
    const isExpired = item.type === "expired";
    const daysText = Math.abs(item.daysLeft || 0) === 1 ? "day" : "days";
    
    if (isExpired) {
      return `🚨 URGENT: Your ${item.certification} certification has EXPIRED ${Math.abs(item.daysLeft || 0)} ${daysText} ago.

Please renew immediately to maintain compliance and avoid work stoppages.

📅 Expired: ${item.expirationDate}
⚠️ Priority: ${item.priority.toUpperCase()}

Contact management if you need assistance with renewal process.`;
    } else {
      return `⏰ REMINDER: Your ${item.certification} certification expires in ${item.daysLeft} ${daysText}.

Please begin the renewal process now to avoid compliance issues.

📅 Expires: ${item.expirationDate}
⚠️ Priority: ${item.priority.toUpperCase()}

Don't wait until the last minute - start your renewal today!`;
    }
  };

  const handleSubmit = async () => {
    if (!priorityItem || !customMessage.trim()) return;

    setLoading(true);
    try {
      // Get current user session for authentication
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.access_token) {
        throw new Error('Authentication required. Please sign in again.');
      }

      const notificationData = {
        employeeName: priorityItem.employee,
        certificationType: priorityItem.certification,
        certificationStatus: priorityItem.type === "expired" ? "Expired" : "Expiring Soon",
        daysLeft: priorityItem.daysLeft || 0,
        expirationDate: priorityItem.expirationDate,
        customMessage: customMessage.trim(),
        notificationType: priorityItem.type === "expired" ? "expired" : "renewal",
        priority: priorityItem.priority,
        timing: "now",
        includeCompliance: true
      };

      console.log('Sending priority notification:', notificationData);

      const response = await fetch('/api/notifications/send-individual', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(notificationData)
      });

      const responseData = await response.json();
      console.log('Response:', responseData);

      if (!response.ok) {
        throw new Error(responseData.details || responseData.error || 'Failed to send notification');
      }

      console.log('Priority notification sent successfully');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error sending priority notification:', error);
      alert(`Error sending notification: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">🔥 High Priority</Badge>;
      case 'medium':
        return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">⚠️ Medium Priority</Badge>;
      case 'low':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">📋 Low Priority</Badge>;
      default:
        return <Badge variant="secondary">{priority}</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'expired':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'expiring':
        return <Clock className="h-5 w-5 text-orange-500" />;
      case 'missing':
        return <User className="h-5 w-5 text-blue-500" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getTypeText = (item: PriorityItem) => {
    switch (item.type) {
      case 'expired':
        return `Expired ${Math.abs(item.daysLeft || 0)} days ago`;
      case 'expiring':
        return `Expires in ${item.daysLeft} days`;
      case 'missing':
        return 'Missing required certification';
      default:
        return 'Unknown status';
    }
  };

  const isFormValid = customMessage.trim() !== "";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Bell className="h-5 w-5 text-blue-600" />
            <span>Send Priority Notification</span>
          </DialogTitle>
          <DialogDescription>
            Send an urgent notification to {priorityItem?.employee} about their certification
          </DialogDescription>
        </DialogHeader>

        {priorityItem && (
          <div className="space-y-6 py-4">
            {/* Priority Item Overview */}
            <div className="p-4 bg-gradient-to-r from-gray-50 to-white rounded-lg border-l-4 border-l-red-500">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  {getTypeIcon(priorityItem.type)}
                  <h4 className="font-semibold text-gray-900">{priorityItem.certification}</h4>
                </div>
                {getPriorityBadge(priorityItem.priority)}
              </div>
              <div className="text-sm text-gray-600 space-y-2">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span><strong>Employee:</strong> {priorityItem.employee}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span><strong>Status:</strong> {getTypeText(priorityItem)}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-gray-500" />
                  <span><strong>Expires:</strong> {priorityItem.expirationDate}</span>
                </div>
              </div>
            </div>

            {/* Email Message */}
            <div className="space-y-3">
              <Label htmlFor="message" className="text-base font-semibold flex items-center space-x-2">
                <Mail className="h-4 w-4" />
                <span>Email Message</span>
              </Label>
              <Textarea
                id="message"
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="Enter your notification message..."
                className="min-h-[150px] resize-y"
                rows={6}
              />
              <p className="text-xs text-gray-500">
                💡 Tip: The default message includes Massachusetts compliance warnings and urgency indicators
              </p>
            </div>

            {/* Delivery Info */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center space-x-2 mb-2">
                <Send className="h-4 w-4 text-blue-600" />
                <span className="font-semibold text-blue-900">Delivery Information</span>
              </div>
              <div className="text-sm text-blue-800 space-y-1">
                <p>✉️ Email will be sent immediately</p>
                <p>📋 Includes Massachusetts HVAC compliance warnings</p>
                <p>🔒 Delivery tracking and logging enabled</p>
                <p className="text-blue-600 mt-2">📱 SMS notifications coming soon!</p>
              </div>
            </div>
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
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Send Notification
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 