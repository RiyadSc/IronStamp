import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { supabase } from '@/lib/supabase'
import { Eye, EyeOff } from '@/lib/icons'

const testimonials = [
  {
    quote: "IronStamp has transformed how we track certifications. It's clear, reliable, and saves us hours each week.",
    name: "Lucas Ramirez",
    title: "Operations Director / FrostFlow HVAC",
    initials: "LR"
  },
  {
    quote: "We used to scramble with spreadsheets. Now, renewals are automated and nothing slips through the cracks.",
    name: "Angela Morris", 
    title: "Compliance Manager / ArcticEdge Heating & Cooling",
    initials: "AM"
  },
  {
    quote: "Finally, a tool that fits our workflow. IronStamp is clean, intuitive, and keeps the team accountable.",
    name: "Daniel Okafor",
    title: "HR Lead / BlueTorque HVAC Services", 
    initials: "DO"
  }
]

export default function SignUp() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [agreeToTerms, setAgreeToTerms] = useState(false)
  const [loading, setLoading] = useState(false)
  const [currentTestimonial, setCurrentTestimonial] = useState(0)
  const [progress, setProgress] = useState(0)
  const [showEmailVerification, setShowEmailVerification] = useState(false)

  // Password strength calculation
  const getPasswordStrength = (password: string) => {
    if (password.length === 0) return { level: '', text: '', color: '' }
    if (password.length < 6) return { level: 'weak', text: 'Weak', color: 'text-red-500' }
    if (password.length >= 6 && password.length < 10) return { level: 'good', text: 'Good', color: 'text-yellow-600' }
    if (password.length >= 10) return { level: 'strong', text: 'Strong', color: 'text-green-600' }
    return { level: 'good', text: 'Good', color: 'text-yellow-600' }
  }

  const passwordStrength = getPasswordStrength(password)

  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setCurrentTestimonial((current) => (current + 1) % testimonials.length)
          return 0
        }
        return prev + 2 // Increase by 2% every 100ms (5000ms / 100 = 50 steps, 100/50 = 2)
      })
    }, 100)

    return () => clearInterval(progressInterval)
  }, [])

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      alert('Passwords do not match')
      return
    }
    
    if (!agreeToTerms) {
      alert('Please agree to the terms and conditions')
      return
    }
    
    setLoading(true)
    
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirm`
        }
      })
      
      if (error) throw error
      
      // Show email verification card instead of redirecting
      setShowEmailVerification(true)
    } catch (error) {
      console.error('Error signing up:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSocialSignUp = async (provider: 'google') => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })
      
      if (error) throw error
    } catch (error) {
      console.error('Error with social sign up:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Logo/Brand Element - Moved outside container for free positioning */}
      <div className="absolute top-4 left-1/2 -translate-x-16">
        <img src="/IronStampLogov3.png" alt="IronStamp" className="w-12 h-12" />
      </div>
      
      {/* Left Side - Sign Up Form */}
      <div className="flex-1 flex items-center justify-center p-4 relative">
        <Link href="/" className="absolute top-4 left-4 text-xs text-gray-700 hover:underline flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          Return
        </Link>
        <div className="w-full max-w-sm space-y-4">
          {/* Header */}
          <div className="text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-gray-900 mb-1">Create your account</h1>
            <p className="text-sm text-gray-600 mb-4">Enter your details to get started.</p>
          </div>

          {/* Social Sign Up Buttons */}
          <div className="flex justify-center mb-3">
            <Button
              type="button"
              variant="outline"
              className="w-12 h-12 p-0 flex items-center justify-center"
              onClick={() => handleSocialSignUp('google')}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            </Button>
          </div>

          <div className="relative my-3">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-gray-50 text-gray-500">OR</span>
            </div>
          </div>

          {/* Sign Up Form */}
          <form onSubmit={handleSignUp} className="space-y-2">
            <div className="space-y-1">
              <Label htmlFor="email" className="text-xs font-medium text-gray-700">
                Email Address <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-10 text-sm"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="password" className="text-xs font-medium text-gray-700">
                Password <span className="text-red-500">*</span>
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

            {/* Password strength indicator */}
            {password && (
              <div className="flex items-center justify-between text-xs mt-1">
                <span className="text-gray-500">Minimum 8 characters</span>
                <span className={`font-medium ${passwordStrength.color}`}>
                  {passwordStrength.text}
                </span>
              </div>
            )}

            <div className="space-y-1">
              <Label htmlFor="confirmPassword" className="text-xs font-medium text-gray-700">
                Confirm Password <span className="text-red-500">*</span>
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

            <div className="flex items-center space-x-2 py-1">
              <Checkbox
                id="agree-terms"
                checked={agreeToTerms}
                onCheckedChange={(checked) => setAgreeToTerms(checked as boolean)}
              />
              <Label htmlFor="agree-terms" className="text-xs text-gray-600">
                I agree to the{' '}
                <Link href="/terms" className="text-gray-900 hover:underline">
                  Terms of Service
                </Link>
                {' '}and{' '}
                <Link href="/privacy" className="text-gray-900 hover:underline">
                  Privacy Policy
                </Link>
              </Label>
            </div>

            <Button
              type="submit"
              className="w-full h-10 bg-gray-900 hover:bg-gray-800 text-white text-sm mt-3"
              disabled={loading}
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>

          <div className="text-center">
            <span className="text-xs text-gray-600">Already have an account? </span>
            <Link href="/auth/signin" className="text-xs text-gray-900 hover:underline">
              Sign in
            </Link>
          </div>
        </div>
        <div className="absolute bottom-4 left-4 text-xs text-gray-500">© 2025 IronStamp</div>
      </div>

      {/* Right Side - Testimonial */}
      <div className="hidden lg:flex lg:flex-1 bg-white items-center justify-center p-4">
        <div className="max-w-sm text-center space-y-3">
          <Avatar className="w-12 h-12 mx-auto">
            <AvatarImage src="/api/placeholder/64/64" alt={testimonials[currentTestimonial].name} />
            <AvatarFallback>{testimonials[currentTestimonial].initials}</AvatarFallback>
          </Avatar>
          
          <blockquote className="text-lg text-gray-900 leading-relaxed">
            "{testimonials[currentTestimonial].quote}"
          </blockquote>
          
          <div className="space-y-1">
            <div className="text-sm font-semibold text-gray-900">{testimonials[currentTestimonial].name}</div>
            <div className="text-xs text-gray-600">{testimonials[currentTestimonial].title}</div>
          </div>
          
          <div className="w-[40%] mx-auto bg-gray-200 rounded-full h-1">
            <div 
              className="h-1 rounded-full transition-all duration-100 ease-linear"
              style={{ 
                width: `${progress}%`,
                background: 'linear-gradient(90deg, #8b5cf6, #06b6d4)'
              }}
            />
          </div>
        </div>
      </div>

      {/* Email Verification Card */}
      {showEmailVerification && (
        <div 
          data-email-card
          className="fixed bottom-6 right-6 max-w-sm bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50 animate-in slide-in-from-bottom-2 duration-300"
        >
          <div className="relative">
            {/* Close button - top right */}
            <button
              onClick={() => {
                // Add closing animation class and then hide after animation
                const card = document.querySelector('[data-email-card]') as HTMLElement
                if (card) {
                  card.style.animation = 'slideOutRight 300ms ease-in-out forwards'
                  setTimeout(() => setShowEmailVerification(false), 300)
                }
              }}
              className="absolute -top-1 -right-1 w-6 h-6 hover:bg-gray-100 rounded flex items-center justify-center transition-colors duration-200"
            >
              <svg className="w-4 h-4 text-gray-500 hover:text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="flex-1 pr-2">
                <h3 className="text-sm font-semibold text-gray-900 mb-1">Check your email</h3>
                <p className="text-xs text-gray-600 mb-2">
                  We've sent a verification link to <span className="font-medium">{email}</span>. 
                  Click the link to verify your account and complete your registration.
                </p>
                <p className="text-xs text-gray-500">Didn't receive it? Check your spam folder.</p>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
} 