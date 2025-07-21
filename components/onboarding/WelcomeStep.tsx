import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Checkbox } from '@/components/ui/checkbox'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

interface WelcomeStepProps {
  onComplete: (data: {
    company_name: string
    license_number: string
    business_address: string
    phone_number: string
    business_email: string
    team_size: string
    business_focus: string
  }) => void
  onSkip: () => void
  initialData: {
    company_name: string
    license_number: string
    business_address: string
    phone_number: string
    business_email: string
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
    
    if (!formData.license_number.trim()) {
      newErrors.license_number = 'License number is required'
    }
    
    if (!formData.business_address.trim()) {
      newErrors.business_address = 'Business address is required'
    }
    
    if (!formData.phone_number.trim()) {
      newErrors.phone_number = 'Phone number is required'
    }
    
    if (!formData.business_email.trim()) {
      newErrors.business_email = 'Business email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.business_email)) {
      newErrors.business_email = 'Please enter a valid email address'
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
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <span className="text-2xl">🎉</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome to IronStamp!</h1>
              <p className="text-gray-600 leading-relaxed">
                Let&apos;s get your HVAC team&apos;s certifications<br />
                organized in under 3 minutes.
              </p>
            </div>

            {/* Progress Bar */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Progress</span>
                <span className="text-sm text-gray-500">1/4</span>
              </div>
              <Progress value={25} className="h-2" />
              <div className="flex justify-between mt-2">
                <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                <div className="w-3 h-3 bg-gray-200 rounded-full"></div>
                <div className="w-3 h-3 bg-gray-200 rounded-full"></div>
                <div className="w-3 h-3 bg-gray-200 rounded-full"></div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Company Name */}
              <div className="space-y-2">
                <Label htmlFor="company_name" className="text-sm font-medium text-gray-700">
                  Company Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="company_name"
                  type="text"
                  placeholder="Enter your company name"
                  value={formData.company_name}
                  onChange={(e) => handleInputChange('company_name', e.target.value)}
                  className={`h-12 ${errors.company_name ? 'border-red-500 focus:border-red-500' : ''}`}
                />
                {errors.company_name && (
                  <p className="text-sm text-red-500">{errors.company_name}</p>
                )}
              </div>

              {/* License Number */}
              <div className="space-y-2">
                <Label htmlFor="license_number" className="text-sm font-medium text-gray-700">
                  License Number <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="license_number"
                  type="text"
                  placeholder="e.g., HVAC-2024-001"
                  value={formData.license_number}
                  onChange={(e) => handleInputChange('license_number', e.target.value)}
                  className={`h-12 ${errors.license_number ? 'border-red-500 focus:border-red-500' : ''}`}
                />
                {errors.license_number && (
                  <p className="text-sm text-red-500">{errors.license_number}</p>
                )}
              </div>

              {/* Business Address */}
              <div className="space-y-2">
                <Label htmlFor="business_address" className="text-sm font-medium text-gray-700">
                  Business Address <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="business_address"
                  type="text"
                  placeholder="123 Main Street, City, State 12345"
                  value={formData.business_address}
                  onChange={(e) => handleInputChange('business_address', e.target.value)}
                  className={`h-12 ${errors.business_address ? 'border-red-500 focus:border-red-500' : ''}`}
                />
                {errors.business_address && (
                  <p className="text-sm text-red-500">{errors.business_address}</p>
                )}
              </div>

              {/* Phone and Email Row */}
              <div className="grid grid-cols-2 gap-4">
                {/* Phone Number */}
                <div className="space-y-2">
                  <Label htmlFor="phone_number" className="text-sm font-medium text-gray-700">
                    Phone Number <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="phone_number"
                    type="tel"
                    placeholder="(555) 123-4567"
                    value={formData.phone_number}
                    onChange={(e) => handleInputChange('phone_number', e.target.value)}
                    className={`h-12 ${errors.phone_number ? 'border-red-500 focus:border-red-500' : ''}`}
                  />
                  {errors.phone_number && (
                    <p className="text-sm text-red-500">{errors.phone_number}</p>
                  )}
                </div>

                {/* Business Email */}
                <div className="space-y-2">
                  <Label htmlFor="business_email" className="text-sm font-medium text-gray-700">
                    Business Email <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="business_email"
                    type="email"
                    placeholder="contact@company.com"
                    value={formData.business_email}
                    onChange={(e) => handleInputChange('business_email', e.target.value)}
                    className={`h-12 ${errors.business_email ? 'border-red-500 focus:border-red-500' : ''}`}
                  />
                  {errors.business_email && (
                    <p className="text-sm text-red-500">{errors.business_email}</p>
                  )}
                </div>
              </div>

              {/* Team Size */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-gray-700">
                  Team Size <span className="text-red-500">*</span>
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  {teamSizeOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleInputChange('team_size', option.value)}
                      className={`h-12 px-4 rounded-lg border-2 font-medium transition-all duration-200 ${
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
              <div className="space-y-3">
                <Label className="text-sm font-medium text-gray-700">
                  Focus <span className="text-red-500">*</span>
                </Label>
                <div className="grid grid-cols-3 gap-3">
                  {businessFocusOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleInputChange('business_focus', option.value)}
                      className={`h-12 px-3 rounded-lg border-2 font-medium transition-all duration-200 text-sm ${
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
              {saveError && <p className="text-xs text-red-600 mb-2">{saveError}</p>}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSkip}
                  className="flex-1 h-12 text-gray-600 hover:text-gray-700"
                  disabled={!acceptedTerms || saving}
                >
                  Skip Tour
                </Button>
                <Button
                  type="submit"
                  className="flex-1 h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200"
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
  )
} 