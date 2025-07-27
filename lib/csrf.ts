import { NextApiRequest, NextApiResponse } from 'next'
import crypto from 'crypto'

// CSRF token configuration
const CSRF_TOKEN_LENGTH = 32
const CSRF_TOKEN_EXPIRY = 24 * 60 * 60 * 1000 // 24 hours

// In-memory token store (in production, use Redis or database)
const csrfTokens = new Map<string, { token: string; expires: number }>()

/**
 * Generate a new CSRF token
 */
export function generateCSRFToken(): string {
  return crypto.randomBytes(CSRF_TOKEN_LENGTH).toString('hex')
}

/**
 * Store a CSRF token for a session
 */
export function storeCSRFToken(sessionId: string, token: string): void {
  const expires = Date.now() + CSRF_TOKEN_EXPIRY
  csrfTokens.set(sessionId, { token, expires })
  
  // Clean up expired tokens
  cleanupExpiredTokens()
}

/**
 * Validate a CSRF token
 */
export function validateCSRFToken(sessionId: string, token: string): boolean {
  const stored = csrfTokens.get(sessionId)
  if (!stored) return false
  
  if (Date.now() > stored.expires) {
    csrfTokens.delete(sessionId)
    return false
  }
  
  return stored.token === token
}

/**
 * Get CSRF token for a session (creates new one if doesn't exist)
 */
export function getCSRFToken(sessionId: string): string {
  const stored = csrfTokens.get(sessionId)
  if (stored && Date.now() <= stored.expires) {
    return stored.token
  }
  
  const newToken = generateCSRFToken()
  storeCSRFToken(sessionId, newToken)
  return newToken
}

/**
 * Clean up expired tokens
 */
function cleanupExpiredTokens(): void {
  const now = Date.now()
  Array.from(csrfTokens.entries()).forEach(([sessionId, data]) => {
    if (now > data.expires) {
      csrfTokens.delete(sessionId)
    }
  })
}

/**
 * CSRF middleware for API routes
 */
export function csrfMiddleware(req: NextApiRequest, res: NextApiResponse, next: () => void) {
  // Only apply CSRF protection to state-changing methods
  const stateChangingMethods = ['POST', 'PUT', 'PATCH', 'DELETE']
  
  if (!stateChangingMethods.includes(req.method || '')) {
    return next()
  }
  
  // Skip CSRF for authentication endpoints (they have their own protection)
  const authEndpoints = ['/api/auth/signin', '/api/auth/signup', '/api/auth/callback']
  if (authEndpoints.some(endpoint => req.url?.includes(endpoint))) {
    return next()
  }
  
  // Get session ID from authorization header or user ID
  const authHeader = req.headers.authorization
  let sessionId = 'anonymous'
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    // Use a hash of the token as session ID
    sessionId = crypto.createHash('sha256').update(authHeader.slice(7)).digest('hex')
  }
  
  // Get CSRF token from headers
  const csrfToken = req.headers['x-csrf-token'] as string
  
  if (!csrfToken) {
    return res.status(403).json({ 
      error: 'CSRF token required',
      message: 'Missing CSRF token in X-CSRF-Token header'
    })
  }
  
  if (!validateCSRFToken(sessionId, csrfToken)) {
    return res.status(403).json({ 
      error: 'Invalid CSRF token',
      message: 'CSRF token validation failed'
    })
  }
  
  next()
}

/**
 * Generate CSRF token for frontend
 */
export function generateFrontendCSRFToken(sessionId: string): string {
  return getCSRFToken(sessionId)
} 