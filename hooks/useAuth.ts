import { useState, useEffect, useCallback } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { trackEvent, identifyUser, setUserProperties, POSTHOG_EVENTS } from '@/lib/posthog'

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Function to refresh session
  const refreshSession = useCallback(async () => {
    try {
      const { data: { session }, error } = await supabase.auth.refreshSession()
      if (error) {
        console.error('Session refresh error:', error)
        setError(error.message)
        return false
      }
      
      if (session) {
        setSession(session)
        setUser(session.user)
        setError(null)
        return true
      }
      
      return false
    } catch (error) {
      console.error('Session refresh failed:', error)
      setError(error instanceof Error ? error.message : 'Session refresh failed')
      return false
    }
  }, [])

  // Function to check and validate current session (for manual checks only)
  const validateSession = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      // First try to get existing session
      const { data: { session: existingSession }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        console.error('Get session error:', sessionError)
        setError(sessionError.message)
        setSession(null)
        setUser(null)
        return false
      }

      if (existingSession) {
        // Check if session is valid and not expired
        const now = Math.floor(Date.now() / 1000)
        const expiresAt = existingSession.expires_at || 0
        
        if (expiresAt > now + 60) { // Session expires in more than 1 minute
          setSession(existingSession)
          setUser(existingSession.user)
          setError(null)
          return true
        } else {
          // Session is expiring soon, try to refresh
          console.log('Session expiring, attempting refresh...')
          return await refreshSession()
        }
      } else {
        // No session found
        setSession(null)
        setUser(null)
        return false
      }
    } catch (error) {
      console.error('Session validation failed:', error)
      setError(error instanceof Error ? error.message : 'Session validation failed')
      setSession(null)
      setUser(null)
      return false
    } finally {
      setLoading(false)
    }
  }, [refreshSession])

  useEffect(() => {
    let mounted = true

    // Set a safety timeout to prevent infinite loading
    const safetyTimeout = setTimeout(() => {
      if (mounted) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('Auth check timeout - forcing loading to false')
        }
        setLoading(false)
      }
    }, 5000) // 5 second timeout

    // Get initial session without using validateSession to avoid conflicts
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (mounted) {
          if (error) {
            console.error('Initial session error:', error)
            setError(error.message)
            setSession(null)
            setUser(null)
          } else if (session) {
            if (process.env.NODE_ENV === 'development') {
              console.log('Initial session found:', session.user.id)
            }
            setSession(session)
            setUser(session.user)
            setError(null)
          } else {
            setSession(null)
            setUser(null)
          }
          setLoading(false)
        }
      } catch (error) {
        if (mounted) {
          console.error('Failed to get initial session:', error)
          setError(error instanceof Error ? error.message : 'Authentication failed')
          setSession(null)
          setUser(null)
      setLoading(false)
        }
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (process.env.NODE_ENV === 'development') {
          console.log('Auth state change:', event, session?.user?.id)
        }
        
        if (!mounted) return

        // Clear any existing timeout
        clearTimeout(safetyTimeout)
        
        setSession(session)
        setUser(session?.user ?? null)
        setError(null)
        
        // Handle different auth events
        switch (event) {
          case 'SIGNED_IN':
            if (session?.user) {
              // Track sign in event
              trackEvent(POSTHOG_EVENTS.USER_SIGNED_IN, {
                user_id: session.user.id,
                email: session.user.email,
                signup_method: session.user.app_metadata?.provider || 'email'
              })
              
              // Identify user for PostHog
              identifyUser(session.user.id, {
                email: session.user.email,
                signup_method: session.user.app_metadata?.provider || 'email'
              })
            }
            setLoading(false)
            break

          case 'SIGNED_OUT':
            trackEvent(POSTHOG_EVENTS.USER_SIGNED_OUT)
            setUser(null)
            setSession(null)
            setError(null)
            setLoading(false)
            break
            
          case 'TOKEN_REFRESHED':
            setLoading(false)
            break
            
          case 'USER_UPDATED':
            setLoading(false)
            break
            
          default:
            setLoading(false)
        }
      }
    )

    // Remove periodic session validation - Supabase handles this automatically
    // Session refresh happens automatically when needed via onAuthStateChange

    return () => {
      mounted = false
      clearTimeout(safetyTimeout)
      subscription.unsubscribe()
    }
  }, []) // Remove dependencies to prevent loops

  const signOut = async () => {
    try {
      setLoading(true)
      setError(null)
      
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Error signing out:', error)
        setError(error.message)
      } else {
        setUser(null)
        setSession(null)
      }
    } catch (error) {
      console.error('Sign out failed:', error)
      setError(error instanceof Error ? error.message : 'Sign out failed')
    } finally {
      setLoading(false)
    }
  }

  // Force session refresh function (can be called manually)
  const forceRefresh = useCallback(async () => {
    setLoading(true)
    const success = await validateSession()
    return success
  }, [validateSession])

  return {
    user,
    session,
    loading,
    error,
    signOut,
    refreshSession,
    forceRefresh,
    isAuthenticated: !!user && !!session,
    isSessionValid: !!session && !!user && !error,
  }
} 