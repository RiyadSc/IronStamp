import { NextApiRequest } from 'next'
import crypto from 'crypto'

// CSRF token configuration
const CSRF_TOKEN_EXPIRY = 24 * 60 * 60 * 1000 // 24 hours in ms

// Secret key for HMAC signing (use env variable in production)
const CSRF_SECRET = process.env.CSRF_SECRET || process.env.NEXTAUTH_SECRET || 'ironstamp-csrf-secret-key-change-in-production'

/**
 * Generate a stateless CSRF token using HMAC
 * Token format: timestamp.signature
 */
export function generateCSRFToken(sessionId: string): string {
  const timestamp = Date.now().toString()
  const data = `${sessionId}:${timestamp}`
  const signature = crypto
    .createHmac('sha256', CSRF_SECRET)
    .update(data)
    .digest('hex')
  
  return `${timestamp}.${signature}`
}

/**
 * Validate a stateless CSRF token
 */
export function validateCSRFToken(sessionId: string, token: string): boolean {
  if (!token || typeof token !== 'string') {
    return false
  }

  const parts = token.split('.')
  if (parts.length !== 2) {
    return false
  }

  const [timestamp, signature] = parts
  
  // Check if token has expired
  const tokenTime = parseInt(timestamp, 10)
  if (isNaN(tokenTime) || Date.now() - tokenTime > CSRF_TOKEN_EXPIRY) {
    return false
  }

  // Verify signature
  const data = `${sessionId}:${timestamp}`
  const expectedSignature = crypto
    .createHmac('sha256', CSRF_SECRET)
    .update(data)
    .digest('hex')

  // Use timing-safe comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  )
}

/**
 * Validate CSRF token from request
 * Returns true if valid, false otherwise
 */
export function validateCSRFRequest(req: NextApiRequest): { valid: boolean; error?: string } {
  // Only apply CSRF protection to state-changing methods
  const stateChangingMethods = ['POST', 'PUT', 'PATCH', 'DELETE']
  
  if (!stateChangingMethods.includes(req.method || '')) {
    return { valid: true }
  }
  
  // Skip CSRF for authentication endpoints (they have their own protection)
  const authEndpoints = ['/api/auth/signin', '/api/auth/signup', '/api/auth/callback']
  if (authEndpoints.some(endpoint => req.url?.includes(endpoint))) {
    return { valid: true }
  }
  
  // Get session ID from authorization header
  const authHeader = req.headers.authorization
  let sessionId = 'anonymous'
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    // Use a hash of the token as session ID
    sessionId = crypto.createHash('sha256').update(authHeader.slice(7)).digest('hex')
  }
  
  // Get CSRF token from headers
  const csrfToken = req.headers['x-csrf-token'] as string
  
  if (!csrfToken) {
    return { valid: false, error: 'CSRF token required' }
  }
  
  if (!validateCSRFToken(sessionId, csrfToken)) {
    return { valid: false, error: 'Invalid CSRF token' }
  }
  
  return { valid: true }
}

/**
 * Generate CSRF token for frontend
 */
export function generateFrontendCSRFToken(sessionId: string): string {
  return generateCSRFToken(sessionId)
} 