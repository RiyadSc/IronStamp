import type { NextApiRequest, NextApiResponse } from 'next';
import { NotificationService } from '@/lib/notification-service';
import { supabase } from '@/lib/supabase';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get all active users (companies) to process notifications for
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, company_name')
      .not('company_name', 'is', null);

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return res.status(500).json({ error: 'Failed to fetch users' });
    }

    if (!users || users.length === 0) {
      return res.status(200).json({ 
        message: 'No users found to process notifications',
        results: []
      });
    }

    const results = [];

    // Process notifications for each user
    for (const user of users) {
      try {
        const result = await NotificationService.processNotifications(
          user.id,
          user.company_name || 'Your Company'
        );

        results.push({
          userId: user.id,
          companyName: user.company_name,
          userEmail: user.email,
          ...result
        });

        console.log(`Processed notifications for ${user.company_name}: ${result.processed} total, ${result.successful} sent, ${result.failed} failed`);
      } catch (error) {
        console.error(`Error processing notifications for user ${user.id}:`, error);
        results.push({
          userId: user.id,
          companyName: user.company_name,
          userEmail: user.email,
          processed: 0,
          successful: 0,
          failed: 1,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    const totalStats = results.reduce(
      (acc, result) => ({
        processed: acc.processed + (result.processed || 0),
        successful: acc.successful + (result.successful || 0),
        failed: acc.failed + (result.failed || 0),
      }),
      { processed: 0, successful: 0, failed: 0 }
    );

    return res.status(200).json({
      message: 'Notification processing completed',
      totalStats,
      userResults: results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Notification processing error:', error);
    return res.status(500).json({ 
      error: 'Failed to process notifications',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 