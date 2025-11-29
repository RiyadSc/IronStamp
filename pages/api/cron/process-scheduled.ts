import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { getEmailTemplate } from '@/lib/email-templates';

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// Initialize Supabase with service role key for server-side operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface ScheduledNotification {
  id: string;
  user_id: string;
  certification_id: string | null;
  employee_name: string;
  employee_email: string;
  certification_type: string;
  scheduled_for: string;
  message: string;
  notification_type: string;
  include_compliance: boolean;
  include_manager: boolean;
  manager_emails: string[] | null;
  status: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify cron secret to prevent unauthorized calls
  const cronSecret = req.headers.authorization;
  if (process.env.CRON_SECRET && cronSecret !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const startTime = Date.now();
  let processed = 0;
  let successful = 0;
  let failed = 0;

  try {
    console.log('🕐 Cron job triggered: process-scheduled-notifications');

    // Query for scheduled notifications that are due (scheduled_for <= now)
    const now = new Date().toISOString();
    
    const { data: dueNotifications, error: fetchError } = await supabaseAdmin
      .from('scheduled_notifications')
      .select('*')
      .eq('status', 'scheduled')
      .lte('scheduled_for', now)
      .order('scheduled_for', { ascending: true })
      .limit(50); // Process in batches to avoid timeouts

    if (fetchError) {
      console.error('Error fetching scheduled notifications:', fetchError);
      throw new Error(`Database fetch error: ${fetchError.message}`);
    }

    if (!dueNotifications || dueNotifications.length === 0) {
      console.log('No scheduled notifications due at this time.');
      return res.status(200).json({
        success: true,
        message: 'No scheduled notifications to process',
        processed: 0,
        successful: 0,
        failed: 0,
        timestamp: new Date().toISOString()
      });
    }

    console.log(`Found ${dueNotifications.length} scheduled notification(s) to process.`);

    // Process each due notification
    for (const notification of dueNotifications as ScheduledNotification[]) {
      processed++;
      
      try {
        // Get user's company name for the email template
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('company_name')
          .eq('id', notification.user_id)
          .single();

        const companyName = profile?.company_name || 'Your Company';

        // Calculate days until expiry for template (fetch from certification if available)
        let daysUntilExpiry = 0;
        let expirationDate = '';
        
        if (notification.certification_id) {
          const { data: cert } = await supabaseAdmin
            .from('certifications')
            .select('expiration_date')
            .eq('id', notification.certification_id)
            .single();
          
          if (cert?.expiration_date) {
            expirationDate = cert.expiration_date;
            const expDate = new Date(cert.expiration_date);
            const today = new Date();
            daysUntilExpiry = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          }
        }

        // Get email template
        const templateType = notification.notification_type === 'renewal' ? '30_days' : notification.notification_type;
        const template = getEmailTemplate(templateType as any, {
          employeeName: notification.employee_name,
          certificationName: notification.certification_type,
          expirationDate: expirationDate,
          daysUntilExpiry: daysUntilExpiry,
          companyName: companyName,
          customMessage: notification.message
        });

        // Send email via Resend
        const emailResponse = await resend.emails.send({
          from: 'notifications@ironstamp.app',
          to: notification.employee_email,
          subject: template.subject,
          html: template.html,
        });

        if (emailResponse.error) {
          throw new Error(emailResponse.error.message);
        }

        // Send to managers if requested
        if (notification.include_manager && notification.manager_emails && notification.manager_emails.length > 0) {
          for (const managerEmail of notification.manager_emails) {
            try {
              await resend.emails.send({
                from: 'notifications@ironstamp.app',
                to: managerEmail,
                subject: `[MANAGER COPY] ${template.subject}`,
                html: `<p style="background:#f0f0f0;padding:10px;margin-bottom:20px;"><strong>Manager Copy:</strong> This notification was sent to ${notification.employee_name} (${notification.employee_email})</p>${template.html}`,
              });
            } catch (managerError) {
              console.error(`Failed to send to manager ${managerEmail}:`, managerError);
              // Continue processing - don't fail the whole notification
            }
          }
        }

        // Update status to 'sent'
        const { error: updateError } = await supabaseAdmin
          .from('scheduled_notifications')
          .update({
            status: 'sent',
            sent_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', notification.id);

        if (updateError) {
          console.error(`Failed to update notification ${notification.id} status:`, updateError);
        }

        // Log the sent notification
        await supabaseAdmin
          .from('notification_logs')
          .insert({
            user_id: notification.user_id,
            employee_id: notification.employee_name,
            certification_id: notification.certification_id,
            notification_type: notification.notification_type,
            channel: 'email',
            recipient: notification.employee_email,
            message_id: emailResponse.data?.id,
            status: 'sent',
            sent_at: new Date().toISOString()
          });

        successful++;
        console.log(`✅ Sent scheduled notification to ${notification.employee_email}`);

      } catch (sendError) {
        failed++;
        const errorMessage = sendError instanceof Error ? sendError.message : 'Unknown error';
        console.error(`❌ Failed to send notification ${notification.id}:`, errorMessage);

        // Update status to 'failed' with error message
        await supabaseAdmin
          .from('scheduled_notifications')
          .update({
            status: 'failed',
            error_message: errorMessage,
            updated_at: new Date().toISOString()
          })
          .eq('id', notification.id);

        // Log the failed notification
        await supabaseAdmin
          .from('notification_logs')
          .insert({
            user_id: notification.user_id,
            employee_id: notification.employee_name,
            certification_id: notification.certification_id,
            notification_type: notification.notification_type,
            channel: 'email',
            recipient: notification.employee_email,
            status: 'failed',
            error_message: errorMessage,
            sent_at: new Date().toISOString()
          });
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    const durationSeconds = (Date.now() - startTime) / 1000;

    // Log cron job execution
    await supabaseAdmin
      .from('cron_logs')
      .insert({
        job_type: 'process_scheduled_notifications',
        status: failed === processed ? 'failed' : 'completed',
        duration_seconds: durationSeconds,
        notifications_processed: processed,
        notifications_sent: successful,
        notifications_failed: failed,
        run_at: new Date().toISOString()
      });

    console.log(`🏁 Scheduled notifications processing complete: ${successful}/${processed} sent, ${failed} failed`);

    return res.status(200).json({
      success: true,
      message: 'Scheduled notifications processed',
      processed,
      successful,
      failed,
      duration_seconds: durationSeconds,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    const durationSeconds = (Date.now() - startTime) / 1000;
    console.error('Cron job critical error:', error);

    // Log failed cron job
    await supabaseAdmin
      .from('cron_logs')
      .insert({
        job_type: 'process_scheduled_notifications',
        status: 'failed',
        duration_seconds: durationSeconds,
        error_message: error instanceof Error ? error.message : 'Unknown error',
        notifications_processed: processed,
        notifications_sent: successful,
        notifications_failed: failed,
        run_at: new Date().toISOString()
      });

    return res.status(500).json({
      success: false,
      message: 'Critical error processing scheduled notifications',
      error: error instanceof Error ? error.message : 'Unknown error',
      processed,
      successful,
      failed,
      timestamp: new Date().toISOString()
    });
  }
}

