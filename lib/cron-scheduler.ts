// Cron job scheduler for notification emails
// This should be set up to run daily, preferably in the morning (e.g., 8 AM)

import { NotificationService } from './notification-service';
import { supabase } from './supabase';

export class CronScheduler {
  
  // Main function to run daily notification check
  static async runDailyNotificationCheck() {
    console.log('🔄 Starting daily notification check...');
    const startTime = Date.now();
    
    try {
      // Get all active users (companies)
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, email, company_name')
        .not('company_name', 'is', null);

      if (usersError) {
        console.error('❌ Error fetching users:', usersError);
        return false;
      }

      if (!users || users.length === 0) {
        console.log('ℹ️ No users found to process notifications');
        return true;
      }

      console.log(`📋 Found ${users.length} companies to process`);

      let totalProcessed = 0;
      let totalSent = 0;
      let totalFailed = 0;

      // Process notifications for each company
      for (const user of users) {
        try {
          console.log(`📧 Processing notifications for ${user.company_name}...`);
          
          const result = await NotificationService.processNotifications(
            user.id,
            user.company_name || 'Your Company'
          );

          totalProcessed += result.processed;
          totalSent += result.successful;
          totalFailed += result.failed;

          if (result.processed > 0) {
            console.log(`✅ ${user.company_name}: ${result.successful}/${result.processed} notifications sent successfully`);
          } else {
            console.log(`ℹ️ ${user.company_name}: No notifications needed today`);
          }

          // Small delay between companies to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 200));

        } catch (error) {
          console.error(`❌ Error processing notifications for ${user.company_name}:`, error);
          totalFailed++;
        }
      }

      const duration = (Date.now() - startTime) / 1000;
      
      console.log('\n📊 Daily notification summary:');
      console.log(`   Companies processed: ${users.length}`);
      console.log(`   Total notifications processed: ${totalProcessed}`);
      console.log(`   Successfully sent: ${totalSent}`);
      console.log(`   Failed: ${totalFailed}`);
      console.log(`   Duration: ${duration.toFixed(2)}s`);
      
      // Log summary to database for monitoring
      await this.logCronRun({
        companiesProcessed: users.length,
        notificationsProcessed: totalProcessed,
        notificationsSent: totalSent,
        notificationsFailed: totalFailed,
        durationSeconds: duration,
        status: 'completed',
        runAt: new Date().toISOString()
      });

      return true;

    } catch (error) {
      console.error('❌ Critical error in daily notification check:', error);
      
      await this.logCronRun({
        companiesProcessed: 0,
        notificationsProcessed: 0,
        notificationsSent: 0,
        notificationsFailed: 0,
        durationSeconds: (Date.now() - startTime) / 1000,
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        runAt: new Date().toISOString()
      });

      return false;
    }
  }

  // Log cron job runs for monitoring
  static async logCronRun(log: {
    companiesProcessed: number;
    notificationsProcessed: number;
    notificationsSent: number;
    notificationsFailed: number;
    durationSeconds: number;
    status: 'completed' | 'failed';
    errorMessage?: string;
    runAt: string;
  }) {
    try {
      const { error } = await supabase
        .from('cron_logs')
        .insert([{
          job_type: 'daily_notifications',
          companies_processed: log.companiesProcessed,
          notifications_processed: log.notificationsProcessed,
          notifications_sent: log.notificationsSent,
          notifications_failed: log.notificationsFailed,
          duration_seconds: log.durationSeconds,
          status: log.status,
          error_message: log.errorMessage,
          run_at: log.runAt
        }]);

      if (error) {
        console.error('Failed to log cron run:', error);
      }
    } catch (error) {
      console.error('Database logging error:', error);
    }
  }

  // Test function for manual runs
  static async testNotificationSystem(userId?: string, companyName?: string) {
    console.log('🧪 Testing notification system...');
    
    if (userId && companyName) {
      // Test for specific user
      const result = await NotificationService.processNotifications(userId, companyName);
      console.log('Test result:', result);
      return result;
    } else {
      // Test for all users
      return await this.runDailyNotificationCheck();
    }
  }
}

// Example of how to set up the cron job (for reference)
// You would typically set this up in your hosting platform (Vercel, Railway, etc.)
export const cronConfig = {
  // Run every day at 8:00 AM UTC
  schedule: '0 8 * * *',
  timezone: 'America/New_York', // Eastern Time (Massachusetts timezone)
  
  // For development/testing, you might want to run more frequently:
  // schedule: '*/5 * * * *', // Every 5 minutes (for testing)
  
  handler: async () => {
    return await CronScheduler.runDailyNotificationCheck();
  }
}; 