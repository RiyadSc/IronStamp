import { NextApiRequest, NextApiResponse } from 'next'
import { generateFrontendCSRFToken } from '@/lib/csrf'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Get session ID from authorization header
    const authHeader = req.headers.authorization
    let sessionId = 'anonymous'
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      // Use a hash of the token as session ID
      const crypto = require('crypto')
      sessionId = crypto.createHash('sha256').update(authHeader.slice(7)).digest('hex')
    }
    
    // Generate CSRF token
    const csrfToken = generateFrontendCSRFToken(sessionId)
    
    // Set CSRF token in response headers for additional security
    res.setHeader('X-CSRF-Token', csrfToken)
    
    return res.status(200).json({ 
      csrfToken,
      expiresIn: 24 * 60 * 60 * 1000 // 24 hours in milliseconds
    })
    
  } catch (error) {
    console.error('CSRF token generation error:', error)
    return res.status(500).json({ error: 'Failed to generate CSRF token' })
  }
} 