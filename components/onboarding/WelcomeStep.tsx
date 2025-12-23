import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

interface WelcomeStepProps {
  onComplete: (data: {
    company_name: string
    team_size: string
    business_focus: string
  }) => void
  onSkip: () => void
  initialData: {
    company_name: string
    team_size: string
    business_focus: string
  }
}

const teamSizeOptions = [
  { value: '1-10', label: '1-10' },
  { value: '11-25', label: '11-25' },
  { value: '26-50', label: '26-50' },
  { value: '50+', label: '50+' }
]

const businessFocusOptions = [
  { value: 'residential', label: 'Residential' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'both', label: 'Both' }
]

export function WelcomeStep({ onComplete, onSkip, initialData }: WelcomeStepProps) {
  const [formData, setFormData] = useState(initialData)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const { user } = useAuth()

  // Update form data when initialData changes (in case of loaded existing data)
  React.useEffect(() => {
    setFormData(initialData)
  }, [initialData])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.company_name.trim()) {
      newErrors.company_name = 'Company name is required'
    }
    
    if (!formData.team_size) {
      newErrors.team_size = 'Please select your team size'
    }
    
    if (!formData.business_focus) {
      newErrors.business_focus = 'Please select your business focus'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaveError(null)
    if (validateForm()) {
      if (!user) {
        setSaveError('User not found. Please sign in again.')
        return
      }
      setSaving(true)
      const { error } = await supabase
        .from('profiles')
        .update({ accepted_terms: true })
        .eq('id', user.id)
      setSaving(false)
      if (error) {
        setSaveError('Failed to save acceptance. Please try again.')
        return
      }
      onComplete(formData)
    }
  }

  const handleSkip = async () => {
    setSaveError(null)
    if (!user) {
      setSaveError('User not found. Please sign in again.')
      return
    }
    setSaving(true)
    const { error } = await supabase
      .from('profiles')
      .update({ accepted_terms: true })
      .eq('id', user.id)
    setSaving(false)
    if (error) {
      setSaveError('Failed to save acceptance. Please try again.')
      return
    }
    onSkip()
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Logo and Progress Bar - Top Left */}
      <div className="absolute top-6 left-6 z-10">
        <div className="flex flex-col gap-4">
          <img src="/IronStampLogov3.png" alt="IronStamp" className="w-12 h-12" />
          
          {/* Progress Indicators */}
          <div className="flex flex-col gap-1">
            <div className="flex gap-2">
              <div className="w-12 h-1 bg-blue-600 rounded-full"></div>
              <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
              <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
              <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
            </div>
            <p className="text-xs text-gray-500">1 of 4</p>
          </div>
        </div>
      </div>

      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center p-4 relative">
        <div className="w-full max-w-sm space-y-4">
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="p-5">
            {/* Header */}
            <div className="text-center mb-5">
              <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-2 shadow-lg">
                <span className="text-lg">🎉</span>
              </div>
              <h1 className="text-lg font-bold text-gray-900 mb-1">Welcome to IronStamp!</h1>
              <p className="text-gray-600 text-xs leading-relaxed">
                Let&apos;s get your HVAC team&apos;s certifications<br />
                organized in under 3 minutes.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Company Name */}
              <div className="space-y-1">
                <Label htmlFor="company_name" className="text-xs font-medium text-gray-700">
                  Company Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="company_name"
                  type="text"
                  placeholder="Enter your company name"
                  value={formData.company_name}
                  onChange={(e) => handleInputChange('company_name', e.target.value)}
                  className={`h-9 text-sm ${errors.company_name ? 'border-red-500 focus:border-red-500' : ''}`}
                />
                {errors.company_name && (
                  <p className="text-sm text-red-500">{errors.company_name}</p>
                )}
              </div>


              {/* Team Size */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-gray-700">
                  Team Size <span className="text-red-500">*</span>
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {teamSizeOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleInputChange('team_size', option.value)}
                      className={`h-9 px-3 rounded-lg border-2 font-medium text-xs transition-all duration-200 ${
                        formData.team_size === option.value
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                {errors.team_size && (
                  <p className="text-sm text-red-500">{errors.team_size}</p>
                )}
              </div>

              {/* Business Focus */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-gray-700">
                  Focus <span className="text-red-500">*</span>
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  {businessFocusOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleInputChange('business_focus', option.value)}
                      className={`h-9 px-2 rounded-lg border-2 font-medium transition-all duration-200 text-xs ${
                        formData.business_focus === option.value
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                {errors.business_focus && (
                  <p className="text-sm text-red-500">{errors.business_focus}</p>
                )}
              </div>

              {/* Terms Acceptance Checkbox */}
              <div className="flex items-center space-x-2 py-1">
                <Checkbox
                  id="accept-terms"
                  checked={acceptedTerms}
                  onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
                  disabled={saving}
                />
                <Label htmlFor="accept-terms" className="text-xs text-gray-600">
                  I accept the{' '}
                  <a href="/terms-of-service" className="text-gray-900 hover:underline" target="_blank" rel="noopener noreferrer">
                    Terms of Service
                  </a>
                  {' '}and{' '}
                  <a href="/privacy-policy" className="text-gray-900 hover:underline" target="_blank" rel="noopener noreferrer">
                    Privacy Policy
                  </a>
                </Label>
              </div>
              {saveError && <p className="text-xs text-red-600 mb-1">{saveError}</p>}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSkip}
                  className="flex-1 h-9 text-gray-600 hover:text-gray-700 text-xs"
                  disabled={!acceptedTerms || saving}
                >
                  Skip Tour
                </Button>
                <Button
                  type="submit"
                  className="flex-1 h-9 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium text-xs shadow-lg hover:shadow-xl transition-all duration-200"
                  disabled={!acceptedTerms || saving}
                >
                  {saving ? 'Saving...' : 'Continue Setup →'}
                </Button>
              </div>
            </form>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Right Side - Image */}
      <div className="hidden lg:flex lg:flex-1 bg-white items-center justify-center p-4">
        <div className="max-w-lg text-center space-y-6">
          <div className="relative">
            <img 
              src="/construction-trade-skills-hvac.jpg" 
              alt="HVAC professionals working on equipment" 
              className="w-full h-auto rounded-2xl shadow-2xl object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-2xl"></div>
          </div>
          
          <div className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-900">Professional HVAC Training</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              Join thousands of HVAC professionals who trust IronStamp to keep their certifications organized and up-to-date.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 