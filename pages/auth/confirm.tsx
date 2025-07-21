import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export default function ConfirmEmail() {
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      try {
        // Get the current session to see if user is authenticated
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Session error:', error)
          setStatus('error')
          setMessage('There was an error confirming your email. Please try again.')
          return
        }

        // Always show success if the page loads (confirmation link was used)
        setStatus('success')
        setMessage('Your email has been confirmed! Please sign in to continue.')
        // Redirect to signin after 3 seconds
        setTimeout(() => {
          router.push('/auth/signin')
        }, 3000)
      } catch (error) {
        console.error('Confirmation error:', error)
        setStatus('error')
        setMessage('An unexpected error occurred. Please try again.')
      }
    }

    handleEmailConfirmation()
  }, [router])

  const handleContinueToDashboard = () => {
    router.push('/onboarding')
  }

  const handleBackToSignIn = () => {
    router.push('/auth/signin')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-lg">
          <CardContent className="p-8 text-center">
            {status === 'loading' && (
              <div className="space-y-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto animate-spin">
                  <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                </div>
                <h1 className="text-xl font-semibold text-gray-900">Confirming your email...</h1>
                <p className="text-gray-600">Please wait while we verify your account.</p>
              </div>
            )}

            {status === 'success' && (
              <div className="space-y-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h1 className="text-xl font-semibold text-green-900">Email Confirmed!</h1>
                <p className="text-gray-600">{message}</p>
                <p className="text-sm text-gray-500">You'll be redirected to setup in a few seconds...</p>
                <Button 
                  onClick={handleContinueToDashboard}
                  className="w-full bg-gray-900 hover:bg-gray-800"
                >
                  Continue to Setup
                </Button>
              </div>
            )}

            {status === 'error' && (
              <div className="space-y-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h1 className="text-xl font-semibold text-red-900">Confirmation Failed</h1>
                <p className="text-gray-600">{message}</p>
                <div className="space-y-2">
                  <Button 
                    onClick={handleBackToSignIn}
                    className="w-full bg-gray-900 hover:bg-gray-800"
                  >
                    Back to Sign In
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => router.push('/auth/signup')}
                    className="w-full"
                  >
                    Create New Account
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 