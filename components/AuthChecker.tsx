import React, { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { RefreshCw, AlertTriangle, LogIn } from '@/lib/icons'
import { useRouter } from 'next/router'

interface AuthCheckerProps {
  children: React.ReactNode
}

export const AuthChecker: React.FC<AuthCheckerProps> = ({ children }) => {
  const { user, session, loading, error, forceRefresh, isSessionValid } = useAuth()
  const [showAuthError, setShowAuthError] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [timeoutReached, setTimeoutReached] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Set a timeout for loading state (in case it gets stuck)
    const timeoutId = setTimeout(() => {
      if (loading) {
        console.warn('AuthChecker: Loading timeout reached')
        setTimeoutReached(true)
      }
    }, 15000) // 15 second timeout

    return () => clearTimeout(timeoutId)
  }, [loading])

  useEffect(() => {
    // Show auth error if we have an error or no valid session after loading
    if (!loading && (!isSessionValid || error)) {
      setShowAuthError(true)
    } else {
      setShowAuthError(false)
    }
  }, [loading, isSessionValid, error])

  const handleRefresh = async () => {
    setRefreshing(true)
    setTimeoutReached(false)
    const success = await forceRefresh()
    setRefreshing(false)
    
    if (success) {
      setShowAuthError(false)
    } else {
      // If refresh fails, redirect to sign in
      router.push('/auth/signin')
    }
  }

  const handleSignIn = () => {
    router.push('/auth/signin')
  }

  const handleContinueAnyway = () => {
    // Force continue despite timeout (for development/debugging)
    setTimeoutReached(false)
    setShowAuthError(false)
  }

  // Show loading spinner while checking auth (with timeout protection)
  if (loading && !timeoutReached) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center animate-spin mb-4 mx-auto">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full"></div>
          </div>
          <p className="text-gray-600">Checking authentication...</p>
          <p className="text-xs text-gray-500 mt-2">
            This may take a moment after OAuth redirect
          </p>
        </div>
      </div>
    )
  }

  // Show timeout error if loading is stuck
  if (timeoutReached || (loading && timeoutReached)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-semibold">Authentication Timeout</p>
                <p className="text-sm">
                  Authentication is taking longer than expected. This can happen after OAuth redirects.
                </p>
              </div>
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <Button 
              onClick={handleRefresh} 
              disabled={refreshing}
              className="w-full"
              variant="outline"
            >
              {refreshing ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Refreshing...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retry Authentication
                </>
              )}
            </Button>

            <Button 
              onClick={handleSignIn}
              className="w-full"
            >
              <LogIn className="w-4 h-4 mr-2" />
              Sign In Again
            </Button>

            {process.env.NODE_ENV === 'development' && (
              <>
                <Button 
                  onClick={handleContinueAnyway}
                  variant="ghost"
                  className="w-full text-xs"
                >
                  Continue Anyway (Dev)
                </Button>
                <Button 
                  onClick={() => router.push('/auth-debug')}
                  variant="ghost"
                  className="w-full text-xs"
                >
                  Auth Debug Page
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Show auth error overlay if session is invalid
  if (showAuthError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-semibold">Session Expired</p>
                <p className="text-sm">
                  Your session has expired or authentication was lost. 
                  Please refresh your session or sign in again to continue.
                </p>
                {error && (
                  <p className="text-xs text-gray-600 mt-2">
                    Error: {error}
                  </p>
                )}
              </div>
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <Button 
              onClick={handleRefresh} 
              disabled={refreshing}
              className="w-full"
              variant="outline"
            >
              {refreshing ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Refreshing Session...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh Session
                </>
              )}
            </Button>

            <Button 
              onClick={handleSignIn}
              className="w-full"
            >
              <LogIn className="w-4 h-4 mr-2" />
              Sign In Again
            </Button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              This app requires authentication to protect your certification data.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // If we have a valid session, render the children
  if (isSessionValid) {
    return <>{children}</>
  }

  // Fallback to sign in page
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-600 mb-4">Please sign in to continue</p>
        <Button onClick={handleSignIn}>
          <LogIn className="w-4 h-4 mr-2" />
          Sign In
        </Button>
      </div>
    </div>
  )
} 