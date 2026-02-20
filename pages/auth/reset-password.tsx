import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase'
import { Eye, EyeOff, CheckCircle } from '@/lib/icons'
import { ArrowLeft } from 'lucide-react'

export default function ResetPassword() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [authState, setAuthState] = useState<'checking' | 'ready' | 'expired'>('checking')
  const router = useRouter()

  useEffect(() => {
    let mounted = true

    const checkUser = async () => {
      // If URL has recovery hash, Supabase may need a moment to process it
      const hasRecoveryHash = typeof window !== 'undefined' && window.location.hash.includes('type=recovery')

      if (hasRecoveryHash) {
        // Give Supabase time to parse the hash and set the session
        await new Promise((r) => setTimeout(r, 600))
      }

      const { data: { session } } = await supabase.auth.getSession()
      if (!mounted) return

      if (session?.user) {
        setAuthState('ready')
        return
      }

      if (hasRecoveryHash) {
        // Retry once more in case session wasn't ready
        await new Promise((r) => setTimeout(r, 800))
        const { data: { session: retrySession } } = await supabase.auth.getSession()
        if (!mounted) return
        if (retrySession?.user) {
          setAuthState('ready')
          return
        }
        setAuthState('expired')
      } else {
        router.replace('/auth/signin')
      }
    }

    checkUser()
    return () => { mounted = false }
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
      const { error: updateError } = await supabase.auth.updateUser({ password })

      if (updateError) throw updateError

      setSuccess(true)
      setTimeout(() => router.push('/auth/signin'), 3000)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred while resetting your password')
    } finally {
      setLoading(false)
    }
  }

  // Success state – IronStamp UI
  if (success) {
    return (
      <div className="min-h-screen bg-[#F0F4F8] flex font-mono">
        <div className="flex-1 flex items-center justify-center p-6 md:p-12 bg-tech-grid relative">
          <Link
            href="/auth/signin"
            className="absolute top-6 left-6 flex items-center gap-2 text-xs text-gray-600 hover:text-[#0038FF] transition-colors font-mono uppercase tracking-wider"
          >
            <ArrowLeft className="w-4 h-4" />
            Return
          </Link>
          <div className="w-full max-w-md space-y-6 text-center">
            <div className="w-14 h-14 bg-[#0038FF]/10 border-2 border-[#0038FF] flex items-center justify-center mx-auto">
              <CheckCircle className="w-7 h-7 text-[#0038FF]" />
            </div>
            <div>
              <p className="text-[#0038FF] font-mono text-xs mb-1 uppercase tracking-wider">{'/// PASSWORD UPDATED ///'}</p>
              <h1 className="font-display text-2xl md:text-3xl font-bold uppercase text-[#050505]">Password Updated</h1>
              <p className="text-gray-600 font-mono text-sm mt-2">
                Your password has been successfully updated. You&apos;ll be redirected to sign in shortly.
              </p>
            </div>
            <Link
              href="/auth/signin"
              className="inline-block w-full bg-[#050505] text-white px-6 py-2.5 font-bold font-mono text-sm uppercase tracking-wider hover:bg-[#0038FF] transition-colors shadow-[4px_4px_0px_#0038FF]"
            >
              Continue to Sign In
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Checking session (recovery hash present)
  if (authState === 'checking') {
    return (
      <div className="min-h-screen bg-[#F0F4F8] flex font-mono items-center justify-center p-6 bg-tech-grid">
        <div className="w-full max-w-md text-center">
          <div className="w-12 h-12 border-2 border-[#0038FF] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#050505] font-mono text-sm uppercase tracking-wider">Confirming your link...</p>
          <p className="text-gray-600 font-mono text-xs mt-1">Please wait.</p>
        </div>
      </div>
    )
  }

  // Link expired (recovery hash but no session)
  if (authState === 'expired') {
    return (
      <div className="min-h-screen bg-[#F0F4F8] flex font-mono">
        <div className="flex-1 flex items-center justify-center p-6 md:p-12 bg-tech-grid relative">
          <Link
            href="/auth/signin"
            className="absolute top-6 left-6 flex items-center gap-2 text-xs text-gray-600 hover:text-[#0038FF] transition-colors font-mono uppercase tracking-wider"
          >
            <ArrowLeft className="w-4 h-4" />
            Return
          </Link>
          <div className="w-full max-w-md space-y-4 text-center">
            <p className="text-[#0038FF] font-mono text-xs uppercase tracking-wider">{'/// LINK EXPIRED ///'}</p>
            <h1 className="font-display text-2xl font-bold uppercase text-[#050505]">Reset link expired</h1>
            <p className="text-gray-600 font-mono text-sm">
              This password reset link has expired or was already used. Request a new link below.
            </p>
            <Link
              href="/auth/forgot-password"
              className="inline-block w-full bg-[#050505] text-white px-6 py-2.5 font-bold font-mono text-sm uppercase tracking-wider hover:bg-[#0038FF] transition-colors shadow-[4px_4px_0px_#0038FF]"
            >
              Request new reset link
            </Link>
            <Link href="/auth/signin" className="block text-sm text-[#0038FF] hover:underline font-mono uppercase">
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Not ready yet (e.g. redirecting to signin)
  if (authState !== 'ready') {
    return null
  }

  // Reset form – IronStamp UI (match signin)
  return (
    <div className="min-h-screen bg-[#F0F4F8] flex font-mono">
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 bg-tech-grid relative">
        <Link
          href="/auth/signin"
          className="absolute top-6 left-6 flex items-center gap-2 text-xs text-gray-600 hover:text-[#0038FF] transition-colors font-mono uppercase tracking-wider"
        >
          <ArrowLeft className="w-4 h-4" />
          Return
        </Link>

        <div className="w-full max-w-md">
          <div className="mb-4">
            <p className="text-[#0038FF] font-mono text-xs mb-1 uppercase tracking-wider">{'/// RESET PASSWORD ///'}</p>
            <h1 className="font-display text-4xl md:text-5xl font-bold uppercase text-[#050505]">
              Set new password
            </h1>
            <p className="text-gray-600 font-mono text-sm mt-1">
              Enter your new password below.
            </p>
          </div>

          <form onSubmit={handleResetPassword} className="space-y-3">
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-3">
                <p className="text-sm text-red-700 font-mono">{error}</p>
              </div>
            )}

            <div className="space-y-1">
              <Label htmlFor="password" className="text-[10px] font-mono font-bold text-gray-700 uppercase tracking-wider">
                New password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-9 font-mono text-sm border-2 border-gray-200 focus:border-[#0038FF] focus:ring-0 pr-12 bg-white"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-4 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400 hover:text-[#0038FF] transition-colors" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400 hover:text-[#0038FF] transition-colors" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="confirmPassword" className="text-[10px] font-mono font-bold text-gray-700 uppercase tracking-wider">
                Confirm new password
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="••••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="h-9 font-mono text-sm border-2 border-gray-200 focus:border-[#0038FF] focus:ring-0 pr-12 bg-white"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-4 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400 hover:text-[#0038FF] transition-colors" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400 hover:text-[#0038FF] transition-colors" />
                  )}
                </button>
              </div>
            </div>

            <p className="text-xs text-gray-500 font-mono">Password must be at least 6 characters.</p>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#050505] text-white px-6 py-2.5 font-bold font-mono text-sm uppercase tracking-wider hover:bg-[#0038FF] transition-colors shadow-[4px_4px_0px_#0038FF] hover:shadow-[4px_4px_0px_#050505] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'UPDATING...' : 'UPDATE PASSWORD'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <Link href="/auth/signin" className="text-sm text-[#0038FF] hover:underline font-mono font-bold uppercase">
              Back to sign in
            </Link>
          </div>

          <p className="font-mono text-xs text-gray-500 mt-6">© 2026 IRONSTAMP</p>
        </div>
      </div>
    </div>
  )
}
