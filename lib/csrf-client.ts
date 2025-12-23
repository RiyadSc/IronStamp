import { supabase } from './supabase';

// CSRF token cache - shorter expiry to ensure fresh tokens
let csrfToken: string | null = null;
let tokenExpiry: number = 0;

// Cache tokens for 1 hour (tokens are valid for 24 hours, but refresh more frequently)
const TOKEN_CACHE_DURATION = 60 * 60 * 1000; // 1 hour

/**
 * Get CSRF token for API requests
 */
export async function getCSRFToken(): Promise<string> {
  // Check if we have a valid cached token
  if (csrfToken && Date.now() < tokenExpiry) {
    return csrfToken;
  }

  try {
    // Get current session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('No active session');
    }

    // Fetch new CSRF token from API
    const response = await fetch('/api/csrf-token', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      // Clear cache on error
      csrfToken = null;
      tokenExpiry = 0;
      throw new Error('Failed to fetch CSRF token');
    }

    const data = await response.json();
    if (typeof data.csrfToken === 'string') {
      const newToken = data.csrfToken;
      csrfToken = newToken;
      // Use shorter cache duration for reliability
      tokenExpiry = Date.now() + TOKEN_CACHE_DURATION;
      return newToken;
    } else {
      throw new Error('Invalid CSRF token received');
    }
  } catch (error) {
    console.error('Error fetching CSRF token:', error);
    throw error;
  }
}

/**
 * Make authenticated API request with CSRF protection
 */
export async function apiRequest(
  url: string,
  options: RequestInit = {},
  retryOnCSRFError: boolean = true
): Promise<Response> {
  try {
    // Get CSRF token
    const token = await getCSRFToken();

    // Add CSRF token to headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-CSRF-Token': token,
      ...(options.headers as Record<string, string> || {}),
    };

    // Get current session for authorization
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }

    // Make the request
    const response = await fetch(url, {
      ...options,
      headers,
    });

    // If CSRF error and we haven't retried yet, clear cache and retry
    if (response.status === 403 && retryOnCSRFError) {
      const data = await response.clone().json().catch(() => ({}));
      if (data.error === 'Invalid CSRF token' || data.error === 'CSRF token required') {
        console.log('CSRF token invalid, refreshing and retrying...');
        clearCSRFToken();
        return apiRequest(url, options, false); // Retry without further retries
      }
    }

    return response;
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
}

/**
 * Clear CSRF token cache (useful for logout)
 */
export function clearCSRFToken(): void {
  csrfToken = null;
  tokenExpiry = 0;
} 