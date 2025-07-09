import type { NextApiRequest, NextApiResponse } from 'next';
import { CronScheduler } from '@/lib/cron-scheduler';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Optional: Add basic security to prevent unauthorized calls
  const cronSecret = req.headers.authorization;
  if (process.env.CRON_SECRET && cronSecret !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    console.log('🕐 Cron job triggered: daily-notifications');
    
    const success = await CronScheduler.runDailyNotificationCheck();
    
    if (success) {
      return res.status(200).json({
        success: true,
        message: 'Daily notification check completed successfully',
        timestamp: new Date().toISOString()
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'Daily notification check failed',
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('Cron job error:', error);
    return res.status(500).json({
      success: false,
      message: 'Critical error in cron job',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
} 