import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase'
import { Eye, EyeOff } from '@/lib/icons'
import { ArrowLeft, Quote } from 'lucide-react'

const testimonials = [
  {
    quote: "I used to keep certs in a shoebox. Now I keep them in my pocket. IronStamp saved us from a $5k fine last month.",
    author: "Tom R.",
    role: "Owner",
    company: "Mass Mechanical",
    initials: "TR"
  },
  {
    quote: "We used to scramble with spreadsheets. Now, renewals are automated and nothing slips through the cracks.",
    author: "Angela Morris",
    role: "Compliance Manager",
    company: "ArcticEdge Heating & Cooling",
    initials: "AM"
  },
  {
    quote: "Finally, a tool that fits our workflow. IronStamp is clean, intuitive, and keeps the team accountable.",
    author: "Daniel Okafor",
    role: "HR Lead",
    company: "BlueTorque HVAC Services",
    initials: "DO"
  }
]

export default function SignIn() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [currentTestimonial, setCurrentTestimonial] = useState(0)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setCurrentTestimonial((current) => (current + 1) % testimonials.length)
          return 0
        }
        return prev + 1
      })
    }, 60) // 6 seconds total per testimonial

    return () => clearInterval(progressInterval)
  }, [])

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMessage('')
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (error) {
        if (error.message === 'Invalid login credentials') {
          setErrorMessage('Please check your email for a verification link and verify your account before signing in. If you\'ve already verified, please check your email and password.')
        } else if (error.message === 'Email not confirmed') {
          setErrorMessage('Please check your email and click the verification link to confirm your account before signing in.')
        } else {
          setErrorMessage(error.message || 'An error occurred during sign in.')
        }
        return
      }
      
      window.location.href = '/auth/callback'
    } catch (error) {
      console.error('Error signing in:', error)
      setErrorMessage('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSocialSignIn = async (provider: 'google') => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })
      
      if (error) throw error
    } catch (error) {
      console.error('Error with social sign in:', error)
    }
  }

  return (
    <div className="min-h-screen bg-[#F0F4F8] flex font-mono">
      {/* Left Side - Testimonials */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#050505] text-white flex-col justify-between p-12 relative overflow-hidden">
        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-5">
          <div className="w-full h-full" style={{
            backgroundSize: '40px 40px',
            backgroundImage: 'linear-gradient(to right, #0038FF 1px, transparent 1px), linear-gradient(to bottom, #0038FF 1px, transparent 1px)'
          }} />
        </div>

        {/* Decorative corner elements */}
        <div className="absolute top-0 right-0 w-32 h-32">
          <div className="absolute top-8 right-8 w-full h-full border-t-2 border-r-2 border-[#0038FF]/30" />
        </div>
        <div className="absolute bottom-0 left-0 w-32 h-32">
          <div className="absolute bottom-8 left-8 w-full h-full border-b-2 border-l-2 border-[#0038FF]/30" />
        </div>

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <img src="/IronStampLogov3.png" alt="IronStamp" className="h-10 w-auto brightness-0 invert" />
            <span className="font-display font-bold text-3xl tracking-tighter">IRONSTAMP</span>
          </div>
        </div>

        {/* Testimonial Content */}
        <div className="relative z-10 flex-1 flex flex-col justify-center max-w-xl">
          {/* Large quote mark */}
          <div className="mb-6">
            <Quote className="w-16 h-16 text-[#0038FF] fill-[#0038FF]/20" />
          </div>

          {/* Quote */}
          <blockquote className="font-display text-3xl md:text-4xl font-bold leading-tight mb-8 transition-opacity duration-500">
            {testimonials[currentTestimonial].quote}
          </blockquote>

          {/* Author info */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-[#0038FF] flex items-center justify-center">
              <span className="font-display font-bold text-xl">{testimonials[currentTestimonial].initials}</span>
            </div>
            <div>
              <div className="font-display font-bold text-lg uppercase tracking-wide">
                {testimonials[currentTestimonial].author}
              </div>
              <div className="font-mono text-sm text-gray-400">
                {testimonials[currentTestimonial].role} / {testimonials[currentTestimonial].company}
              </div>
            </div>
          </div>

          {/* Progress indicators */}
          <div className="flex gap-3 mt-10">
            {testimonials.map((_, index) => (
              <div 
                key={index} 
                className="h-1 flex-1 bg-white/10 overflow-hidden cursor-pointer"
                onClick={() => {
                  setCurrentTestimonial(index)
                  setProgress(0)
                }}
              >
                <div 
                  className="h-full bg-[#0038FF] transition-all duration-100 ease-linear"
                  style={{ 
                    width: index === currentTestimonial ? `${progress}%` : index < currentTestimonial ? '100%' : '0%'
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10">
          <p className="font-mono text-xs text-gray-500">© 2026 IRONSTAMP SYSTEMS. BOSTON, MA.</p>
        </div>
      </div>
      
      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 bg-tech-grid relative">
        <Link 
          href="/" 
          className="absolute top-6 left-6 flex items-center gap-2 text-xs text-gray-600 hover:text-[#0038FF] transition-colors font-mono uppercase tracking-wider"
        >
          <ArrowLeft className="w-4 h-4" />
          Return
        </Link>

        {/* Mobile logo */}
        <div className="lg:hidden absolute top-6 right-6">
          <div className="flex items-center gap-2">
            <img src="/IronStampLogov3.png" alt="IronStamp" className="h-8 w-auto" />
            <span className="font-display font-bold text-xl tracking-tighter text-[#050505]">IRONSTAMP</span>
          </div>
        </div>

        <div className="w-full max-w-md">
          {/* Header */}
          <div className="mb-4">
            <p className="text-[#0038FF] font-mono text-xs mb-1 uppercase tracking-wider">{`/// SYSTEM LOGIN ///`}</p>
            <h1 className="font-display text-4xl md:text-5xl font-bold uppercase text-[#050505]">
              Sign In
            </h1>
            <p className="text-gray-600 font-mono text-sm mt-1">
              Enter your credentials to access the system.
            </p>
          </div>

          {/* Social Login */}
          <div className="mb-3">
            <button
              type="button"
              onClick={() => handleSocialSignIn('google')}
              className="w-full flex items-center justify-center gap-3 border-2 border-gray-200 bg-white px-6 py-2.5 hover:border-[#0038FF] transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span className="font-mono text-sm font-bold uppercase">Continue with Google</span>
            </button>
          </div>

          <div className="relative my-3">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-4 bg-[#F0F4F8] text-xs text-gray-500 font-mono uppercase">Or continue with email</span>
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="bg-red-50 border-l-4 border-red-500 p-3 mb-4">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-red-700 font-mono">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSignIn} className="space-y-2">
            <div className="space-y-1">
              <Label htmlFor="email" className="text-[10px] font-mono font-bold text-gray-700 uppercase tracking-wider">
                Email Address
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

            <div className="space-y-1">
              <Label htmlFor="password" className="text-[10px] font-mono font-bold text-gray-700 uppercase tracking-wider">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
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

            <div className="flex items-center justify-end">
              <Link 
                href="/auth/forgot-password" 
                className="text-[10px] text-gray-600 hover:text-[#0038FF] font-mono uppercase tracking-wider transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#050505] text-white px-6 py-2.5 font-bold font-mono text-sm uppercase tracking-wider hover:bg-[#0038FF] transition-colors shadow-[4px_4px_0px_#0038FF] hover:shadow-[4px_4px_0px_#050505] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'AUTHENTICATING...' : 'ACCESS SYSTEM'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <span className="text-sm text-gray-600 font-mono">Don&apos;t have an account? </span>
            <Link href="/auth/signup" className="text-sm text-[#0038FF] hover:underline font-mono font-bold uppercase">
              Register
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
} 
