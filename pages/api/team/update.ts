import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { csrfMiddleware } from '@/lib/csrf';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Apply CSRF protection
  csrfMiddleware(req, res, async () => {
    try {
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
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.error('Authentication error:', authError);
        return res.status(401).json({ error: 'Invalid authentication token' });
      }

      const { id, name, email, role, department, phone, notes } = req.body;

      if (!id || !name || !email) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Verify the team member belongs to the authenticated user
      const { data: existingMember, error: findError } = await supabase
        .from('team_members')
        .select('user_id')
        .eq('id', id)
        .single();

      if (findError || !existingMember) {
        return res.status(404).json({ error: 'Team member not found' });
      }

      if (existingMember.user_id !== user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Update the team member
      const { data: updatedMember, error: updateError } = await supabase
        .from('team_members')
        .update({
          name,
          email,
          role: role || null,
          department: department || null,
          phone: phone || null,
          notes: notes || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        console.error('Update error:', updateError);
        return res.status(500).json({ error: 'Failed to update team member' });
      }

      return res.status(200).json({
        success: true,
        message: 'Team member updated successfully',
        teamMember: updatedMember
      });

    } catch (error) {
      console.error('Update team member error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });
} 