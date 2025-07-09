import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('=== Team Update API Called ===');
    console.log('Request body:', req.body);

    const { employeeId, name, email, phone, role, status } = req.body;

    // Validate required fields
    if (!employeeId || !name || !email || !role || !status) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        details: 'employeeId, name, email, role, and status are required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        error: 'Invalid email format',
        details: 'Please provide a valid email address'
      });
    }

    console.log('Validation passed');

    // Get user from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Missing authorization token',
        details: 'Authorization header is required'
      });
    }

    const accessToken = authHeader.split(' ')[1];
    console.log('Access token received');

    // Create authenticated Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get user from access token
    const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken);
    
    if (userError || !user) {
      console.error('Auth error:', userError);
      return res.status(401).json({ 
        error: 'Invalid authentication',
        details: userError?.message || 'Failed to authenticate user'
      });
    }

    console.log('User authenticated:', user.id);

    // Verify employee belongs to this user
    const { data: existingEmployee, error: checkError } = await supabase
      .from('employees')
      .select('id, user_id, name')
      .eq('id', employeeId)
      .eq('user_id', user.id)
      .single();

    if (checkError || !existingEmployee) {
      console.error('Employee check error:', checkError);
      return res.status(404).json({ 
        error: 'Employee not found',
        details: 'Employee not found or you do not have permission to edit this employee'
      });
    }

    console.log('Employee ownership verified');

    // Update employee information
    const { data: updatedEmployee, error: updateError } = await supabase
      .from('employees')
      .update({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone?.trim() || null,
        role: role.trim(),
        status: status.trim(),
        updated_at: new Date().toISOString()
      })
      .eq('id', employeeId)
      .eq('user_id', user.id)
      .select('*')
      .single();

    if (updateError) {
      console.error('Update error:', updateError);
      return res.status(500).json({ 
        error: 'Failed to update employee',
        details: updateError.message
      });
    }

    console.log('Employee updated successfully:', updatedEmployee);

    // Also update any certification records that reference this employee by name
    // This ensures consistency across the system
    if (name !== existingEmployee.name) {
      console.log('Updating certification employee names...');
      const { error: certUpdateError } = await supabase
        .from('certifications')
        .update({ employee_name: name.trim() })
        .eq('user_id', user.id)
        .eq('employee_name', existingEmployee.name); // Find by old name

      if (certUpdateError) {
        console.warn('Warning: Failed to update certification employee names:', certUpdateError);
        // Don't fail the request for this, but log it
      }
    }

    return res.status(200).json({
      success: true,
      employee: updatedEmployee,
      message: 'Team member updated successfully'
    });

  } catch (error) {
    console.error('Unexpected error in team update API:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
} 