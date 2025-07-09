import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase'
import { ArrowLeft } from '@/lib/icons'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })
      
      if (error) throw error
      
      setSent(true)
    } catch (error) {
      console.error('Error sending reset email:', error)
      // Handle error (show toast, etc.)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 relative">
      <Link href="/" className="absolute top-4 left-4 text-xs text-gray-700 hover:underline flex items-center gap-1">
        <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        Return
      </Link>
      <div className="w-full max-w-sm space-y-4">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-end mb-4">
            <img src="/IronStampLogov3.png" alt="IronStamp" className="w-12 h-12" />
          </div>
          
          <div className="space-y-1">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            
            {!sent ? (
              <>
                <h1 className="text-xl font-semibold text-gray-900">Forgot your password?</h1>
                <p className="text-sm text-gray-600">Enter your email address and we'll send you a link to reset your password.</p>
              </>
            ) : (
              <>
                <h1 className="text-xl font-semibold text-gray-900">Check your email</h1>
                <p className="text-sm text-gray-600">We've sent a password reset link to your email address.</p>
              </>
            )}
          </div>
        </div>

        {!sent ? (
          <form onSubmit={handleResetPassword} className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="email" className="text-xs font-medium text-gray-700">
                Email Address <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="hello@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-10 text-sm"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-10 bg-gray-900 hover:bg-gray-800 text-white text-sm"
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </Button>
          </form>
        ) : (
          <div className="space-y-3">
            <div className="text-center text-xs text-gray-600">
              Didn't receive the email? Check your spam folder or{' '}
              <button
                onClick={() => setSent(false)}
                className="text-gray-900 hover:underline"
              >
                try again
              </button>
            </div>
          </div>
        )}

        <div className="text-center">
          <Link href="/auth/signin" className="inline-flex items-center space-x-1 text-xs text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-3 h-3" />
            <span>Back to sign in</span>
          </Link>
        </div>

        <div className="text-xs text-gray-500 mt-4 text-left">© 2025 IronStamp</div>
      </div>

    </div>
  )
} 