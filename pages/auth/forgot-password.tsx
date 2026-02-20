import { useState } from 'react'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase'
import { ArrowLeft } from 'lucide-react'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/reset-password`,
      })

      if (resetError) throw resetError

      setSent(true)
    } catch (err) {
      console.error('Error sending reset email:', err)
      setError(err instanceof Error ? err.message : 'Failed to send reset link. Please try again.')
    } finally {
      setLoading(false)
    }
  }

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
            <p className="text-[#0038FF] font-mono text-xs mb-1 uppercase tracking-wider">{'/// PASSWORD RECOVERY ///'}</p>
            <h1 className="font-display text-4xl md:text-5xl font-bold uppercase text-[#050505]">
              {sent ? 'Check your email' : 'Forgot password?'}
            </h1>
            <p className="text-gray-600 font-mono text-sm mt-1">
              {sent
                ? "We've sent a password reset link to your email address."
                : "Enter your email address and we'll send you a link to reset your password."}
            </p>
          </div>

          {!sent ? (
            <form onSubmit={handleResetPassword} className="space-y-3">
              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-3">
                  <p className="text-sm text-red-700 font-mono">{error}</p>
                </div>
              )}

              <div className="space-y-1">
                <Label htmlFor="email" className="text-[10px] font-mono font-bold text-gray-700 uppercase tracking-wider">
                  Email address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="operator@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-9 font-mono text-sm border-2 border-gray-200 focus:border-[#0038FF] focus:ring-0 bg-white"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#050505] text-white px-6 py-2.5 font-bold font-mono text-sm uppercase tracking-wider hover:bg-[#0038FF] transition-colors shadow-[4px_4px_0px_#0038FF] hover:shadow-[4px_4px_0px_#050505] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'SENDING...' : 'SEND RESET LINK'}
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-gray-600 font-mono">
                Didn&apos;t receive the email? Check your spam folder or{' '}
                <button
                  type="button"
                  onClick={() => { setSent(false); setError(''); }}
                  className="text-[#0038FF] hover:underline font-bold uppercase"
                >
                  try again
                </button>
              </p>
            </div>
          )}

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
