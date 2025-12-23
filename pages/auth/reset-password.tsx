import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase'
import { Eye, EyeOff, CheckCircle } from '@/lib/icons'

export default function ResetPassword() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    // Check if user is authenticated (from email link)
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/signin')
      }
    }
    
    checkUser()
  }, [router])

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    
    setLoading(true)
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      })
      
      if (error) throw error
      
      setSuccess(true)
      
      // Redirect to sign in after 3 seconds
      setTimeout(() => {
        router.push('/auth/signin')
      }, 3000)
      
    } catch (error: any) {
      setError(error.message || 'An error occurred while resetting your password')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 relative">
        <Link href="/" className="absolute top-4 left-4 text-xs text-gray-700 hover:underline flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          Return
        </Link>
        <div className="w-full max-w-sm space-y-4 text-center">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
          
          <div className="space-y-1">
            <h1 className="text-xl font-semibold text-gray-900">Password Updated!</h1>
            <p className="text-sm text-gray-600">Your password has been successfully updated. You&apos;ll be redirected to the sign in page shortly.</p>
          </div>
          
          <Link href="/auth/signin">
            <Button className="w-full h-10 bg-gray-900 hover:bg-gray-800 text-white text-sm">
              Continue to Sign In
            </Button>
          </Link>
        </div>
      </div>
    )
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
            
            <h1 className="text-xl font-semibold text-gray-900">Reset your password</h1>
            <p className="text-sm text-gray-600">Enter your new password below.</p>
          </div>
        </div>

        <form onSubmit={handleResetPassword} className="space-y-3">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-2">
              <p className="text-xs text-red-600">{error}</p>
            </div>
          )}
          
          <div className="space-y-1">
            <Label htmlFor="password" className="text-xs font-medium text-gray-700">
              New Password <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="• • • • • • • • •"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-10 pr-8 text-sm"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-2 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-3 w-3 text-gray-400" />
                ) : (
                  <Eye className="h-3 w-3 text-gray-400" />
                )}
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="confirmPassword" className="text-xs font-medium text-gray-700">
              Confirm New Password <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="• • • • • • • • •"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="h-10 pr-8 text-sm"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-2 flex items-center"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-3 w-3 text-gray-400" />
                ) : (
                  <Eye className="h-3 w-3 text-gray-400" />
                )}
              </button>
            </div>
          </div>

          <div className="text-xs text-gray-600">
            <p>Password must be at least 6 characters long.</p>
          </div>

          <Button
            type="submit"
            className="w-full h-10 bg-gray-900 hover:bg-gray-800 text-white text-sm"
            disabled={loading}
          >
            {loading ? 'Updating Password...' : 'Update Password'}
          </Button>
        </form>

        <div className="text-center">
          <Link href="/auth/signin" className="text-xs text-gray-600 hover:text-gray-900">
            Back to sign in
          </Link>
        </div>

        <div className="text-xs text-gray-500 mt-4 text-left">© 2025 IronStamp</div>
      </div>

    </div>
  )
} 