import { Resend } from 'resend';
import { getEmailTemplate } from './email-templates';
import { supabase } from './supabase';

const resend = new Resend(process.env.RESEND_API_KEY);

interface NotificationData {
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  certificationId: string;
  certificationName: string;
  expirationDate: string;
  daysUntilExpiry: number;
  companyName: string;
  userId: string;
  customMessage?: string;
}

export type NotificationType = '60_days' | '30_days' | '14_days' | '7_days' | 'expired' | 'renewal' | 'custom';

export class NotificationService {
  
  // Send email notification
  static async sendEmailNotification(
    type: NotificationType,
    data: NotificationData
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    console.log('=== NOTIFICATION SERVICE CALLED ===');
    console.log('Type:', type);
    console.log('Data:', data);
    
    try {
      console.log('Checking RESEND_API_KEY...');
      if (!process.env.RESEND_API_KEY) {
        console.error('RESEND_API_KEY is not configured');
        throw new Error('RESEND_API_KEY is not configured');
      }
      console.log('RESEND_API_KEY is configured');

      // Get email template
      console.log('Getting email template...');
      // Cast type to match getEmailTemplate signature if needed, or update getEmailTemplate to accept all NotificationTypes
      // For now, we'll map 'renewal' to a default or handle it in getEmailTemplate
      const templateType = (type === 'renewal' ? '30_days' : type) as any;
      
      const template = getEmailTemplate(templateType, {
        employeeName: data.employeeName,
        certificationName: data.certificationName,
        expirationDate: data.expirationDate,
        daysUntilExpiry: data.daysUntilExpiry,
        companyName: data.companyName,
        customMessage: data.customMessage
      });
      console.log('Email template created:', { subject: template.subject, htmlLength: template.html.length });

      // Send email via Resend
      console.log('Sending email via Resend...');
      console.log('Email details:', {
        from: 'notifications@ironstamp.app',
        to: data.employeeEmail,
        subject: template.subject
      });
      
      const response = await resend.emails.send({
        from: 'notifications@ironstamp.app', // Updated to your domain
        to: data.employeeEmail,
        subject: template.subject,
        html: template.html,
      });
      console.log('Resend response:', response);

      if (response.error) {
        console.error('Resend error:', response.error);
        console.error('Resend error details:', {
          message: response.error.message
        });
        return { success: false, error: response.error.message };
      }
      console.log('Email sent successfully, message ID:', response.data?.id);

      // Log successful notification to database
      await this.logNotification({
        userId: data.userId,
        employeeId: data.employeeId,
        certificationId: data.certificationId,
        notificationType: type,
        channel: 'email',
        recipient: data.employeeEmail,
        messageId: response.data?.id,
        status: 'sent',
        sentAt: new Date().toISOString(),
      });

      return { success: true, messageId: response.data?.id };

    } catch (error) {
      console.error('Email notification error:', error);
      
      // Log failed notification
      await this.logNotification({
        userId: data.userId,
        employeeId: data.employeeId,
        certificationId: data.certificationId,
        notificationType: type,
        channel: 'email',
        recipient: data.employeeEmail,
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        sentAt: new Date().toISOString(),
      });

      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Log notification to database for tracking
  static async logNotification(log: {
    userId: string;
    employeeId: string;
    certificationId: string;
    notificationType: NotificationType;
    channel: 'email' | 'sms';
    recipient: string;
    messageId?: string;
    status: 'sent' | 'failed';
    errorMessage?: string;
    sentAt: string;
  }) {
    try {
      const { error } = await supabase
        .from('notification_logs')
        .insert([{
          user_id: log.userId,
          employee_id: log.employeeId,
          certification_id: log.certificationId,
          notification_type: log.notificationType,
          channel: log.channel,
          recipient: log.recipient,
          message_id: log.messageId,
          status: log.status,
          error_message: log.errorMessage,
          sent_at: log.sentAt
        }]);

      if (error) {
        console.error('Failed to log notification:', error);
      }
    } catch (error) {
      console.error('Database logging error:', error);
    }
  }

  // Check if notification was already sent to prevent duplicates
  static async wasNotificationSent(
    userId: string,
    employeeId: string,
    certificationId: string,
    notificationType: NotificationType,
    dateToCheck: string // Format: YYYY-MM-DD
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('notification_logs')
        .select('id')
        .eq('user_id', userId)
        .eq('employee_id', employeeId)
        .eq('certification_id', certificationId)
        .eq('notification_type', notificationType)
        .eq('status', 'sent')
        .gte('sent_at', `${dateToCheck}T00:00:00`)
        .lt('sent_at', `${dateToCheck}T23:59:59`)
        .limit(1);

      if (error) {
        console.error('Error checking notification history:', error);
        return false;
      }

      return data && data.length > 0;
    } catch (error) {
      console.error('Database check error:', error);
      return false;
    }
  }

  // Get certifications that need notifications
  static async getCertificationsForNotification(userId: string) {
    try {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];

      const { data: certifications, error } = await supabase
        .from('certifications')
        .select(`
          id,
          employee_name,
          employee_email,
          certification_name,
          expiration_date,
          user_id,
          employee_id
        `)
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching certifications:', error);
        return [];
      }

      if (!certifications) return [];

      // Calculate which certifications need notifications
      const notificationsNeeded = [];

      for (const cert of certifications) {
        const expirationDate = new Date(cert.expiration_date);
        const timeDiff = expirationDate.getTime() - today.getTime();
        const daysUntilExpiry = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

        // Define notification triggers
        const notificationTriggers = [
          { type: '60_days' as NotificationType, days: 60 },
          { type: '30_days' as NotificationType, days: 30 },
          { type: '14_days' as NotificationType, days: 14 },
          { type: '7_days' as NotificationType, days: 7 },
          { type: 'expired' as NotificationType, days: 0 },
        ];

        for (const trigger of notificationTriggers) {
          // Check if we should send this notification
          if (
            (trigger.days > 0 && daysUntilExpiry === trigger.days) ||
            (trigger.days === 0 && daysUntilExpiry <= 0)
          ) {
            // Check if notification wasn't already sent today
            const alreadySent = await this.wasNotificationSent(
              userId,
              cert.employee_id || cert.id, // Use employee_id if available, fallback to cert id
              cert.id,
              trigger.type,
              todayStr
            );

            if (!alreadySent) {
              notificationsNeeded.push({
                employeeId: cert.employee_id || cert.id,
                employeeName: cert.employee_name,
                employeeEmail: cert.employee_email,
                certificationId: cert.id,
                certificationName: cert.certification_name,
                expirationDate: cert.expiration_date,
                daysUntilExpiry,
                notificationType: trigger.type,
                userId: cert.user_id,
              });
            }
          }
        }
      }

      return notificationsNeeded;
    } catch (error) {
      console.error('Error getting certifications for notification:', error);
      return [];
    }
  }

  // Process all pending notifications for a user
  static async processNotifications(userId: string, companyName: string) {
    try {
      const notificationsNeeded = await this.getCertificationsForNotification(userId);
      
      if (notificationsNeeded.length === 0) {
        console.log(`No notifications needed for user ${userId}`);
        return { processed: 0, successful: 0, failed: 0 };
      }

      let successful = 0;
      let failed = 0;

      for (const notification of notificationsNeeded) {
        const result = await this.sendEmailNotification(
          notification.notificationType,
          {
            ...notification,
            companyName,
          }
        );

        if (result.success) {
          successful++;
          console.log(`Sent ${notification.notificationType} notification to ${notification.employeeEmail}`);
        } else {
          failed++;
          console.error(`Failed to send notification to ${notification.employeeEmail}:`, result.error);
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      return {
        processed: notificationsNeeded.length,
        successful,
        failed,
      };
    } catch (error) {
      console.error('Error processing notifications:', error);
      return { processed: 0, successful: 0, failed: 0 };
    }
  }
} 