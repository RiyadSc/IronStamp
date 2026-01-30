import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { validateCSRFRequest } from '@/lib/csrf';
import {
  validateStep1Payload,
  validateStep2Payload,
  type Step1Payload,
  type Step2Payload,
} from '@/lib/onboarding-profile-validation';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const csrfResult = validateCSRFRequest(req);
  if (!csrfResult.valid) {
    return res.status(403).json({
      error: csrfResult.error || 'CSRF validation failed',
    });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }

  const token = authHeader.split(' ')[1];
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: { Authorization: `Bearer ${token}` },
      },
    }
  );

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return res.status(401).json({ error: 'Invalid authentication token' });
  }

  let body: unknown;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  const raw = body as Record<string, unknown>;
  const step = raw.step as unknown;
  if (step !== 1 && step !== 2) {
    return res.status(400).json({ error: 'Invalid or missing step (must be 1 or 2)' });
  }

  if (step === 1) {
    const result = validateStep1Payload(body);
    if (!result.valid) {
      return res.status(400).json({ error: result.error || 'Validation failed' });
    }
    const data = result.data as Step1Payload;
    const { error } = await supabase
      .from('profiles')
      .update({
        company_name: data.company_name,
        city: data.city,
        team_size: data.team_size,
        work_types: data.work_types,
        services: data.services,
        onboarding_step: 1,
      })
      .eq('id', user.id);

    if (error) {
      console.error('Profile update error (step 1):', error);
      return res.status(500).json({ error: 'Failed to save profile' });
    }
    return res.status(200).json({ ok: true });
  }

  const result = validateStep2Payload(body);
  if (!result.valid) {
    return res.status(400).json({ error: result.error || 'Validation failed' });
  }
  const data = result.data as Step2Payload;
  const { error } = await supabase
    .from('profiles')
    .update({
      required_certifications: data.required_certifications,
      onboarding_step: 2,
    })
    .eq('id', user.id);

  if (error) {
    console.error('Profile update error (step 2):', error);
    return res.status(500).json({ error: 'Failed to save profile' });
  }
  return res.status(200).json({ ok: true });
}
