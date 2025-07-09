import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { NotificationService, NotificationType } from '@/lib/notification-service';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      certificationId,
      employeeName,
      certificationType,
      timing,
      scheduledDateTime,
      customMessage,
      includeManager,
      selectedManagers,
      notificationType: requestedNotificationType,
      includeCompliance,
      certificationStatus,
      daysLeft,
      expirationDate
    } = req.body;

    // Get user session from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    const token = authHeader.split(' ')[1];

    // Create server-side Supabase client with user token
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      }
    );

    // Verify the user is authenticated
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('Authentication error:', userError);
      return res.status(401).json({ error: 'Invalid authentication token' });
    }

    // Validate required fields - certificationId is now optional
    if (!employeeName || !certificationType || !customMessage) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    let certData = null;
    let employeeEmail = null;

    if (certificationId) {
      // If we have a certification ID, look it up specifically (from Certifications page)
      const { data: specificCertData, error: certError } = await supabase
        .from('certifications')
        .select('employee_name')
        .eq('id', certificationId)
        .eq('user_id', user.id)
        .single();

      if (certError || !specificCertData) {
        console.error('Certification lookup failed:', certError);
        return res.status(404).json({ error: 'Certification not found' });
      }
      
      certData = specificCertData;
      employeeEmail = null; // Will be looked up from employees table
    } else {
      // If no certification ID, find by employee name and type (from Dashboard Priority Actions)
      const { data: foundCerts, error: searchError } = await supabase
        .from('certifications')
        .select('employee_name, certification_name')
        .eq('employee_name', employeeName)
        .eq('certification_name', certificationType)
        .eq('user_id', user.id)
        .limit(1);

      if (searchError) {
        console.error('Error searching for certification:', searchError);
        // Continue anyway - we'll use a placeholder email
      }

      if (foundCerts && foundCerts.length > 0) {
        certData = foundCerts[0];
        employeeEmail = null; // Will be looked up from employees table
      }
    }

    // If we still don't have an email, try to get it from employees table
    if (!employeeEmail) {
      const { data: employeeData, error: empError } = await supabase
        .from('employees')
        .select('email')
        .eq('name', employeeName)
        .eq('user_id', user.id)
        .single();

      if (!empError && employeeData) {
        employeeEmail = employeeData.email;
      }
    }

    // If we still don't have an email, create a placeholder
    if (!employeeEmail) {
      employeeEmail = `${employeeName.toLowerCase().replace(/\s+/g, '.')}@placeholder.com`;
    }

    // Build notification template based on status and type
    let notificationTemplate = 'renewal-reminder';
    if (certificationStatus === 'Expired') {
      notificationTemplate = 'expired-notice';
    } else if (daysLeft <= 7) {
      notificationTemplate = 'urgent-renewal';
    } else if (daysLeft <= 14) {
      notificationTemplate = 'two-week-reminder';
    }

    // Construct notification data
    const notificationData = {
      employeeName,
      employeeEmail,
      certificationType,
      expirationDate,
      daysLeft,
      customMessage,
      includeCompliance,
      template: notificationTemplate
    };

    // If scheduled, save to database for later processing
    if (timing === 'scheduled' && scheduledDateTime) {
      const { error: scheduleError } = await supabase
        .from('scheduled_notifications')
        .insert({
          user_id: user.id,
          certification_id: certificationId || null, // Allow null for priority actions
          employee_name: employeeName,
          employee_email: employeeEmail,
          certification_type: certificationType,
          scheduled_for: scheduledDateTime,
          message: customMessage,
          notification_type: requestedNotificationType,
          include_compliance: includeCompliance,
          include_manager: includeManager,
          manager_emails: selectedManagers,
          status: 'scheduled',
          created_at: new Date().toISOString()
        });

      if (scheduleError) {
        console.error('Failed to schedule notification:', scheduleError);
        return res.status(500).json({ error: 'Failed to schedule notification' });
      }

      // Log the scheduled notification
      await supabase
        .from('notification_logs')
        .insert({
          user_id: user.id,
          employee_name: employeeName,
          certification_type: certificationType,
          notification_type: 'scheduled',
          status: 'scheduled',
          scheduled_for: scheduledDateTime,
          message: customMessage,
          created_at: new Date().toISOString()
        });

      return res.status(200).json({ 
        success: true, 
        message: `Notification scheduled for ${new Date(scheduledDateTime).toLocaleString()}`,
        scheduled: true
      });
    }

    // Determine notification type
    let notificationType: NotificationType = 'expired';
    if (daysLeft > 0) {
      if (daysLeft <= 7) notificationType = '7_days';
      else if (daysLeft <= 14) notificationType = '14_days';
      else if (daysLeft <= 30) notificationType = '30_days';
      else notificationType = '60_days';
    }

    // Send immediate notification
    const result = await NotificationService.sendEmailNotification(
      notificationType,
      {
        employeeId: certificationId || `${employeeName}-${certificationType}`, // Use combination as fallback
        employeeName,
        employeeEmail,
        certificationId: certificationId || null,
        certificationName: certificationType,
        expirationDate,
        daysUntilExpiry: daysLeft,
        companyName: 'Your Company', // This should come from user data
        userId: user.id
      }
    );

    if (!result.success) {
      return res.status(500).json({ error: result.error || 'Failed to send notification' });
    }

    // Send to managers if requested
    if (includeManager && selectedManagers.length > 0) {
      for (const managerEmail of selectedManagers) {
        try {
          await NotificationService.sendEmailNotification(
            notificationType,
            {
              employeeId: certificationId || `${employeeName}-${certificationType}`,
              employeeName: `Manager (${employeeName})`,
              employeeEmail: managerEmail,
              certificationId: certificationId || null,
              certificationName: certificationType,
              expirationDate,
              daysUntilExpiry: daysLeft,
              companyName: 'Your Company',
              userId: user.id
            }
          );
        } catch (managerError) {
          console.error(`Failed to notify manager ${managerEmail}:`, managerError);
        }
      }
    }

    // Log the notification
    await supabase
      .from('notification_logs')
      .insert({
        user_id: user.id,
        employee_name: employeeName,
        certification_type: certificationType,
        notification_type: requestedNotificationType,
        status: 'sent',
        message: customMessage,
        manager_notified: includeManager && selectedManagers.length > 0,
        created_at: new Date().toISOString()
      });

    // Log activity
    await supabase
      .from('activity_logs')
      .insert({
        user_id: user.id,
        action: 'send_notification',
        details: {
          certification_id: certificationId || null, // Allow null for priority actions
          employee_name: employeeName,
          certification_type: certificationType,
          notification_type: requestedNotificationType,
          timing,
          managers_notified: selectedManagers.length
        },
        created_at: new Date().toISOString()
      });

    return res.status(200).json({ 
      success: true, 
      message: `Notification sent successfully to ${employeeName}${
        includeManager && selectedManagers.length > 0 
          ? ` and ${selectedManagers.length} manager(s)` 
          : ''
      }`,
      sent: true
    });

  } catch (error) {
    console.error('Send individual notification error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 