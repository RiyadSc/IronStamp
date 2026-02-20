import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabase'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle, LogIn } from '@/lib/icons'

export default function AuthCallback() {
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'redirecting' | 'error' | 'timeout'>('loading')
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<any>(null)

  useEffect(() => {
    let mounted = true
    let _timeoutId: NodeJS.Timeout

    // Password reset (recovery) links must go to the reset-password page, not here.
    // If the user landed on callback with a recovery hash, send them to reset-password with the hash preserved.
    if (typeof window !== 'undefined' && window.location.hash.includes('type=recovery')) {
      window.location.replace(`${window.location.origin}/auth/reset-password${window.location.hash}`)
      return () => {}
    }

    // Set a timeout to prevent infinite loading
    const callbackTimeout = setTimeout(() => {
      if (mounted) {
        console.warn('OAuth callback timeout')
        setStatus('timeout')
      }
    }, 15000) // 15 second timeout

    const handleCallback = async () => {
      try {
        console.log('OAuth callback: Starting authentication process')
        
        // Add a small delay to ensure OAuth tokens are processed
        await new Promise(resolve => setTimeout(resolve, 1000))

        // Get the current session
        const { data: { session }, error } = await supabase.auth.getSession()
        
        // Store debug info
        setDebugInfo({
          hasSession: !!session,
          hasUser: !!session?.user,
          userId: session?.user?.id,
          error: error?.message,
          timestamp: new Date().toISOString()
        })

        if (error) {
          console.error('OAuth callback session error:', error)
          setError(`Authentication error: ${error.message}`)
          setStatus('error')
          return
        }

        if (session?.user) {
          console.log('OAuth callback: User authenticated successfully', session.user.id)
          setStatus('redirecting')
          
          // Add another small delay before checking profile
          await new Promise(resolve => setTimeout(resolve, 500))
          
          // Check if user has completed onboarding
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('onboarding_completed, onboarding_step')
            .eq('id', session.user.id)
            .single()

          if (profileError) {
            // If profile doesn't exist or error, go to new onboarding
            console.log('OAuth callback: No profile found, redirecting to onboarding')
            router.push('/OnboardingV1')
            return
          }

          // If onboarding is completed, go to dashboard
          if (profile?.onboarding_completed) {
            console.log('OAuth callback: Onboarding completed, redirecting to dashboard')
            router.push('/DashboardV2')
          } else {
            // Otherwise, go to new onboarding
            console.log('OAuth callback: Onboarding not completed, redirecting to onboarding')
            router.push('/OnboardingV1')
          }
        } else {
          // No session, redirect to signin
          console.log('OAuth callback: No session found, redirecting to signin')
          setError('No authentication session found')
          setStatus('error')
        }
      } catch (error) {
        console.error('OAuth callback error:', error)
        setError(error instanceof Error ? error.message : 'Authentication failed')
        setStatus('error')
      }
    }

    // Wait for any URL hash changes to be processed
    setTimeout(() => {
      if (mounted) {
        handleCallback()
      }
    }, 500)

    return () => {
      mounted = false
      clearTimeout(callbackTimeout)
    }
  }, [router])

  const handleRetry = () => {
    setStatus('loading')
    setError(null)
    window.location.reload()
  }

  const handleGoToSignIn = () => {
    router.push('/auth/signin')
  }

  if (status === 'error' || status === 'timeout') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="shadow-lg">
            <CardContent className="p-8">
              <Alert variant="destructive" className="mb-6">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-semibold">
                      {status === 'timeout' ? 'Authentication Timeout' : 'Authentication Failed'}
                    </p>
                    <p className="text-sm">
                      {status === 'timeout' 
                        ? 'The authentication process took too long. This can happen with OAuth redirects.'
                        : error || 'Something went wrong during authentication.'
                      }
                    </p>
                  </div>
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <Button onClick={handleRetry} className="w-full">
                  Try Again
                </Button>
                <Button onClick={handleGoToSignIn} variant="outline" className="w-full">
                  <LogIn className="w-4 h-4 mr-2" />
                  Back to Sign In
                </Button>
              </div>

              {process.env.NODE_ENV === 'development' && debugInfo && (
                <div className="mt-6">
                  <details>
                    <summary className="text-xs text-gray-500 cursor-pointer">Debug Info</summary>
                    <pre className="text-xs bg-gray-100 p-2 rounded mt-2 overflow-auto">
                      {JSON.stringify(debugInfo, null, 2)}
                    </pre>
                  </details>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-lg">
          <CardContent className="p-8 text-center">
            <div className="space-y-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto animate-spin">
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full"></div>
              </div>
              <h1 className="text-xl font-semibold text-gray-900">
                {status === 'loading' ? 'Completing sign in...' : 'Redirecting...'}
              </h1>
              <p className="text-gray-600">
                {status === 'loading' 
                  ? 'Please wait while we verify your account.' 
                  : 'Taking you to your account...'
                }
              </p>
              <p className="text-xs text-gray-500">
                This may take a moment after OAuth authentication
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 