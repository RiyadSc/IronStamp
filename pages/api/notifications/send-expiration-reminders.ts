import type { NextApiRequest, NextApiResponse } from 'next';
import { Resend } from 'resend';
import { getEmailTemplate } from '@/lib/email-templates';
import { createClient } from '@supabase/supabase-js';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('=== EXPIRATION REMINDERS API CALLED ===');
    console.log('Request headers:', req.headers);
    
    // Get user from session
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('ERROR: No authorization header');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];
    console.log('Token received (first 20 chars):', token.substring(0, 20) + '...');
    
    // Create an authenticated Supabase client with the user's token
    // This ensures RLS policies work correctly
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

    console.log('Created authenticated Supabase client');
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.log('ERROR: Auth error:', authError);
      return res.status(401).json({ error: 'Invalid session' });
    }

    console.log('User authenticated:', user.id, user.email);

    // Get user profile for company name
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_name')
      .eq('id', user.id)
      .single();

    const companyName = profile?.company_name || 'Your Company';
    console.log('Company name:', companyName);

    // Get all employees with certifications expiring in 30 days or less (or already expired)
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    console.log('Today:', today.toISOString().split('T')[0]);
    console.log('30 days from now:', thirtyDaysFromNow.toISOString().split('T')[0]);
    console.log('Querying for user_id:', user.id);

    // Step 1: Get all expiring certifications for this user
    console.log('STEP 1: Fetching certifications...');
    console.log('Query parameters:', {
      user_id: user.id,
      expiration_date_lte: thirtyDaysFromNow.toISOString().split('T')[0],
      has_employee_id: 'not null'
    });
    
    const { data: certs, error: certsError } = await supabase
      .from('certifications')
      .select('id, certification_name, expiration_date, employee_id')
      .eq('user_id', user.id)
      .lte('expiration_date', thirtyDaysFromNow.toISOString().split('T')[0])
      .not('employee_id', 'is', null);

    console.log('Certifications query error:', certsError);
    console.log('Certifications found:', certs?.length || 0);
    if (certs && certs.length > 0) {
      console.log('Sample certification:', JSON.stringify(certs[0], null, 2));
    }

    if (certsError) {
      console.error('ERROR: Error fetching certifications:', certsError);
      return res.status(500).json({ error: 'Failed to fetch certifications', details: certsError });
    }

    if (!certs || certs.length === 0) {
      console.log('ERROR: No certifications found for this user');
      return res.status(200).json({
        message: 'No expiring certifications found',
        successful: 0,
        failed: 0,
        processed: 0,
        debug: {
          user_id: user.id,
          query_date: thirtyDaysFromNow.toISOString().split('T')[0]
        }
      });
    }

    // Step 2: Get unique employee IDs
    console.log('STEP 2: Extracting employee IDs...');
    const employeeIds = [...new Set(certs.map(c => c.employee_id).filter(Boolean))];
    console.log('Unique employee IDs:', employeeIds);
    console.log('Employee IDs count:', employeeIds.length);

    // Step 3: Get employee details
    console.log('STEP 3: Fetching employee details...');
    const { data: employees, error: empError } = await supabase
      .from('employees')
      .select('id, name, email')
      .in('id', employeeIds)
      .not('email', 'is', null);

    console.log('Employees query error:', empError);
    console.log('Employees found:', employees?.length || 0);
    if (employees && employees.length > 0) {
      console.log('Sample employee:', JSON.stringify(employees[0], null, 2));
      console.log('All employees with emails:', employees.map(e => ({ id: e.id, email: e.email })));
    }

    if (empError) {
      console.error('ERROR: Error fetching employees:', empError);
      return res.status(500).json({ error: 'Failed to fetch employees', details: empError });
    }

    if (!employees || employees.length === 0) {
      console.log('ERROR: No employees with email addresses found');
      return res.status(200).json({
        message: 'No employees with email addresses found',
        successful: 0,
        failed: 0,
        processed: 0,
        debug: {
          employee_ids_searched: employeeIds,
          certifications_count: certs.length
        }
      });
    }

    // Step 4: Combine the data
    console.log('STEP 4: Combining certifications with employee data...');
    const certificationsData = certs.map(cert => ({
      ...cert,
      employee: employees.find(emp => emp.id === cert.employee_id)
    })).filter(cert => cert.employee && cert.employee.email);

    console.log(`Summary:`);
    console.log(`- Found ${certs.length} expiring certifications`);
    console.log(`- Found ${employees.length} employees with emails`);
    console.log(`- Combined ${certificationsData.length} certifications with employee data`);
    
    if (certificationsData.length > 0) {
      console.log('Sample combined data:', JSON.stringify(certificationsData[0], null, 2));
    }

    if (certificationsData.length === 0) {
      console.log('ERROR: No certifications matched with employee emails');
      return res.status(200).json({
        message: 'No certifications with valid employee emails found',
        successful: 0,
        failed: 0,
        processed: 0,
        debug: {
          certifications_found: certs.length,
          employees_found: employees.length,
          matched: 0
        }
      });
    }

    // Group certifications by employee
    console.log('STEP 5: Grouping certifications by employee...');
    const employeeCertifications = new Map<string, {
      employee: any;
      certifications: any[];
    }>();

    for (const cert of certificationsData) {
      const employee = (cert as any).employee;
      if (!employee) {
        console.log('WARNING: Certification without employee:', cert.id);
        continue;
      }

      if (!employeeCertifications.has(employee.id)) {
        employeeCertifications.set(employee.id, {
          employee,
          certifications: []
        });
      }

      employeeCertifications.get(employee.id)?.certifications.push(cert);
    }

    console.log(`Grouped into ${employeeCertifications.size} employees`);
    console.log('Employees to notify:', Array.from(employeeCertifications.keys()).map(id => {
      const group = employeeCertifications.get(id);
      return {
        employee_id: id,
        employee_email: group?.employee.email,
        certifications_count: group?.certifications.length
      };
    }));

    let successful = 0;
    let failed = 0;
    const results = [];

    console.log('STEP 6: Sending emails...');
    console.log(`Will attempt to send ${employeeCertifications.size} emails`);

    // Send emails to each employee
    for (const [employeeId, { employee, certifications: empCerts }] of employeeCertifications) {
      console.log(`\n--- Processing employee: ${employee.email} ---`);
      console.log(`Employee has ${empCerts.length} expiring certifications`);
      
      try {
        // Calculate days until expiration for the most urgent certification
        const mostUrgentCert = empCerts.reduce((prev, curr) => {
          const prevDate = new Date(prev.expiration_date);
          const currDate = new Date(curr.expiration_date);
          return currDate < prevDate ? curr : prev;
        });

        const expirationDate = new Date(mostUrgentCert.expiration_date);
        const timeDiff = expirationDate.getTime() - today.getTime();
        const daysUntilExpiry = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

        // Determine notification type based on days until expiry
        let notificationType: '30_days' | '14_days' | '7_days' | 'expired';
        if (daysUntilExpiry <= 0) {
          notificationType = 'expired';
        } else if (daysUntilExpiry <= 7) {
          notificationType = '7_days';
        } else if (daysUntilExpiry <= 14) {
          notificationType = '14_days';
        } else {
          notificationType = '30_days';
        }

        console.log(`Most urgent cert: ${mostUrgentCert.certification_name}, expires: ${mostUrgentCert.expiration_date}`);
        console.log(`Days until expiry: ${daysUntilExpiry}, notification type: ${notificationType}`);

        // Get email template
        console.log('Getting email template...');
        const template = getEmailTemplate(notificationType, {
          employeeName: employee.name,
          certificationName: mostUrgentCert.certification_name,
          expirationDate: mostUrgentCert.expiration_date,
          daysUntilExpiry,
          companyName,
        });
        console.log(`Template subject: ${template.subject}`);

        // Check if Resend API key is available
        if (!process.env.RESEND_API_KEY) {
          console.error('ERROR: RESEND_API_KEY not configured!');
          throw new Error('RESEND_API_KEY not configured');
        }

        // Send email via Resend
        console.log(`Attempting to send email to: ${employee.email}`);
        const response = await resend.emails.send({
          from: 'notifications@ironstamp.app',
          to: employee.email,
          subject: template.subject,
          html: template.html,
        });

        console.log('Resend response:', JSON.stringify(response, null, 2));

        if (response.error) {
          console.error('Resend error:', response.error);
          failed++;
          results.push({
            employeeEmail: employee.email,
            employeeName: employee.name,
            status: 'failed',
            error: response.error.message
          });

          // Log failed notification
          await supabase
            .from('notification_logs')
            .insert([{
              user_id: user.id,
              employee_id: employeeId,
              certification_id: mostUrgentCert.id,
              notification_type: notificationType,
              channel: 'email',
              recipient: employee.email,
              status: 'failed',
              error_message: response.error.message,
              sent_at: new Date().toISOString(),
            }]);
        } else {
          console.log(`✅ Email sent successfully! Message ID: ${response.data?.id}`);
          successful++;
          results.push({
            employeeEmail: employee.email,
            employeeName: employee.name,
            status: 'sent',
            messageId: response.data?.id
          });

          // Log successful notification
          console.log('Logging successful notification to database...');
          await supabase
            .from('notification_logs')
            .insert([{
              user_id: user.id,
              employee_id: employeeId,
              certification_id: mostUrgentCert.id,
              notification_type: notificationType,
              channel: 'email',
              recipient: employee.email,
              message_id: response.data?.id,
              status: 'sent',
              sent_at: new Date().toISOString(),
            }]);
        }

        // Delay to respect Resend rate limit (2 requests per second)
        await new Promise(resolve => setTimeout(resolve, 600));

      } catch (error) {
        console.error(`❌ ERROR sending reminder to ${employee.email}:`, error);
        console.error('Error details:', error);
        failed++;
        results.push({
          employeeEmail: employee.email,
          employeeName: employee.name,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    console.log('\n=== EMAIL SENDING COMPLETE ===');
    console.log(`Successful: ${successful}`);
    console.log(`Failed: ${failed}`);
    console.log(`Total processed: ${employeeCertifications.size}`);

    return res.status(200).json({
      message: 'Reminders sent',
      successful,
      failed,
      processed: employeeCertifications.size,
      results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('=== FATAL ERROR IN API ===');
    console.error('Error sending expiration reminders:', error);
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
    return res.status(500).json({
      error: 'Failed to send reminders',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
  }
}

