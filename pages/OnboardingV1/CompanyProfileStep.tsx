import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Building2, Users, Wrench, ArrowLeft, Shield, CheckCircle, FastForward } from 'lucide-react'
import type { OnboardingData } from './index'
import { isDevModeEnabled } from '@/lib/dev-mode'

interface CompanyProfileStepProps {
  initialData: OnboardingData
  onComplete: (data: Partial<OnboardingData>) => void
  saving: boolean
}

const teamSizeOptions = [
  { value: 'just_me', label: 'Just Me', description: 'Solo operator' },
  { value: '2-5', label: '2-5', description: 'Small crew' },
  { value: '6-15', label: '6-15', description: 'Growing team' },
  { value: '16-30', label: '16-30', description: 'Mid-size' },
  { value: '30+', label: '30+', description: 'Large operation' }
]

const workTypeOptions = [
  { value: 'residential', label: 'Residential', description: 'Homes & apartments' },
  { value: 'commercial', label: 'Commercial', description: 'Offices & retail' },
  { value: 'industrial', label: 'Industrial', description: 'Factories & plants' }
]

const serviceOptions = [
  { 
    value: 'refrigeration', 
    label: 'Air Conditioning & Refrigeration',
    description: 'Requires EPA 608 certification',
    required_cert: 'EPA 608'
  },
  { 
    value: 'heating', 
    label: 'Heating Systems',
    description: 'Furnaces, boilers, heat pumps',
    required_cert: null
  },
  { 
    value: 'oil_burner', 
    label: 'Oil Burner Installation/Service',
    description: 'Requires MA Oil Burner License',
    required_cert: 'MA Oil Burner License'
  },
  { 
    value: 'sheet_metal', 
    label: 'Sheet Metal Fabrication',
    description: 'Requires MA Sheet Metal License',
    required_cert: 'MA Sheet Metal License'
  },
  { 
    value: 'gas_fitting', 
    label: 'Gas Piping/Fitting',
    description: 'Requires MA Gas Fitter License',
    required_cert: 'MA Gas Fitter License'
  },
  { 
    value: 'refrigeration_large', 
    label: 'Large Refrigeration (>10 tons)',
    description: 'Requires MA Refrigeration License',
    required_cert: 'MA Refrigeration License'
  }
]

export default function CompanyProfileStep({ initialData, onComplete, saving }: CompanyProfileStepProps) {
  const [formData, setFormData] = useState({
    company_name: initialData.company_name || '',
    city: initialData.city || '',
    team_size: initialData.team_size || '',
    work_types: initialData.work_types || [],
    services: initialData.services || []
  })
  
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    setFormData({
      company_name: initialData.company_name || '',
      city: initialData.city || '',
      team_size: initialData.team_size || '',
      work_types: initialData.work_types || [],
      services: initialData.services || []
    })
  }, [initialData])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.company_name.trim()) {
      newErrors.company_name = 'Company name is required'
    }
    
    if (!formData.city.trim()) {
      newErrors.city = 'City/Town is required'
    }
    
    if (!formData.team_size) {
      newErrors.team_size = 'Please select your team size'
    }
    
    if (formData.work_types.length === 0) {
      newErrors.work_types = 'Please select at least one work type'
    }
    
    if (formData.services.length === 0) {
      newErrors.services = 'Please select at least one service'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      onComplete(formData)
    }
  }

  const handleTeamSizeSelect = (value: string) => {
    setFormData(prev => ({ ...prev, team_size: value }))
    if (errors.team_size) {
      setErrors(prev => ({ ...prev, team_size: '' }))
    }
  }

  const handleWorkTypeToggle = (value: string) => {
    setFormData(prev => ({
      ...prev,
      work_types: prev.work_types.includes(value)
        ? prev.work_types.filter(t => t !== value)
        : [...prev.work_types, value]
    }))
    if (errors.work_types) {
      setErrors(prev => ({ ...prev, work_types: '' }))
    }
  }

  const handleServiceToggle = (value: string) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.includes(value)
        ? prev.services.filter(s => s !== value)
        : [...prev.services, value]
    }))
    if (errors.services) {
      setErrors(prev => ({ ...prev, services: '' }))
    }
  }

  return (
    <div className="min-h-screen bg-[#F0F4F8] flex font-mono">
      {/* Left Side - Branding & Value Props */}
      <div className="hidden lg:flex lg:w-2/5 bg-[#050505] text-white flex-col justify-between p-12 relative overflow-hidden">
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
          <p className="font-mono text-xs text-gray-500 mt-2 uppercase tracking-wider">Massachusetts HVAC Compliance Platform</p>
        </div>

        {/* Value Props */}
        <div className="relative z-10 flex-1 flex flex-col justify-center">
          <h2 className="font-display text-3xl font-bold mb-8 uppercase">
            Let&apos;s Set Up Your<br />
            <span className="text-[#0038FF]">Compliance System</span>
          </h2>
          
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-[#0038FF] flex items-center justify-center flex-shrink-0">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display font-bold text-lg uppercase">Massachusetts focused</h3>
                <p className="text-sm text-gray-400 mt-1">
                  Built for MA licensing. We track your licenses so you stay compliant.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-[#0038FF] flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display font-bold text-lg uppercase">Track what you need</h3>
                <p className="text-sm text-gray-400 mt-1">
                  Upload certs or assign them to your team in the next steps, we&apos;ll infer types and keep everything organized.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-[#0038FF] flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display font-bold text-lg uppercase">Built for teams</h3>
                <p className="text-sm text-gray-400 mt-1">
                  From solo operators to 50+ person crews. Import your roster; we&apos;ll handle the rest.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10">
          <p className="font-mono text-xs text-gray-500">© 2026 IRONSTAMP SYSTEMS. BOSTON, MA.</p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex flex-col bg-tech-grid relative overflow-y-auto">
        {/* Desktop back button (floats over content) */}
        <div className="hidden lg:block absolute top-6 left-6">
          <Link 
            href="/" 
            className="flex items-center gap-2 text-xs text-gray-600 hover:text-[#0038FF] transition-colors font-mono uppercase tracking-wider"
          >
            <ArrowLeft className="w-4 h-4" />
            Exit Setup
          </Link>
        </div>

        {/* Mobile header: back + centered logo */}
        <div className="lg:hidden pt-4 px-4 pb-4">
          <div className="flex items-center justify-between">
            <Link 
              href="/" 
              className="flex items-center gap-2 text-xs text-gray-600 hover:text-[#0038FF] transition-colors font-mono uppercase tracking-wider"
            >
              <ArrowLeft className="w-4 h-4" />
              Exit Setup
            </Link>
          </div>
          <div className="mt-3 flex justify-center">
            <div className="flex items-center gap-2">
              <img src="/IronStampLogov3.png" alt="IronStamp" className="h-8 w-auto" />
              <span className="font-display font-bold text-xl tracking-tighter text-[#050505]">IRONSTAMP</span>
            </div>
          </div>
        </div>

        {/* Progress indicator */}
        <div className="px-6 md:px-12 pt-8 md:pt-16">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex gap-2">
                <div className="w-12 h-1.5 bg-[#0038FF] rounded-full"></div>
                <div className="w-12 h-1.5 bg-gray-200 rounded-full"></div>
                <div className="w-12 h-1.5 bg-gray-200 rounded-full"></div>
                <div className="w-12 h-1.5 bg-gray-200 rounded-full"></div>
              </div>
              <span className="font-mono text-xs text-gray-500 ml-2">Step 1 of 4</span>
            </div>
          </div>
        </div>

        {/* Form content */}
        <div className="flex-1 px-6 md:px-12 py-6 md:py-8">
          <div className="max-w-2xl">
            {/* Header */}
            <div className="mb-8">
              <p className="text-[#0038FF] font-mono text-xs mb-1 uppercase tracking-wider">{`/// COMPANY PROFILE ///`}</p>
              <h1 className="font-display text-3xl md:text-4xl font-bold uppercase text-[#050505]">
                Tell Us About Your Operation
              </h1>
              <p className="text-gray-600 font-mono text-sm mt-2">
                This helps us configure your compliance requirements correctly.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Section 1: Basic Info */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-[#0038FF] font-mono text-xs font-bold uppercase mb-4">
                  <Building2 className="w-4 h-4" />
                  <span>Company Information</span>
                  <div className="h-[1px] flex-1 bg-[#0038FF]/20"></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="company_name" className="text-[10px] font-mono font-bold text-gray-700 uppercase tracking-wider">
                      Company Name *
                    </Label>
                    <Input
                      id="company_name"
                      value={formData.company_name}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, company_name: e.target.value }))
                        if (errors.company_name) setErrors(prev => ({ ...prev, company_name: '' }))
                      }}
                      placeholder="ACME Heating & Cooling"
                      className={`h-11 font-mono text-sm border-2 ${errors.company_name ? 'border-red-500' : 'border-gray-200'} focus:border-[#0038FF] focus:ring-0 bg-white`}
                    />
                    {errors.company_name && (
                      <p className="text-xs text-red-600 font-mono">{errors.company_name}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="city" className="text-[10px] font-mono font-bold text-gray-700 uppercase tracking-wider">
                      City/Town *
                    </Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, city: e.target.value }))
                        if (errors.city) setErrors(prev => ({ ...prev, city: '' }))
                      }}
                      placeholder="Worcester"
                      className={`h-11 font-mono text-sm border-2 ${errors.city ? 'border-red-500' : 'border-gray-200'} focus:border-[#0038FF] focus:ring-0 bg-white`}
                    />
                    {errors.city && (
                      <p className="text-xs text-red-600 font-mono">{errors.city}</p>
                    )}
                    <p className="text-[10px] text-gray-500 font-mono">Used to determine your licensing jurisdiction</p>
                  </div>
                </div>
              </div>

              {/* Section 2: Team Size */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-[#0038FF] font-mono text-xs font-bold uppercase mb-4">
                  <Users className="w-4 h-4" />
                  <span>Team Size</span>
                  <div className="h-[1px] flex-1 bg-[#0038FF]/20"></div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {teamSizeOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleTeamSizeSelect(option.value)}
                      className={`p-3 border-2 text-left transition-all ${
                        formData.team_size === option.value
                          ? 'border-[#0038FF] bg-[#0038FF]/5'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="font-display font-bold text-lg text-[#050505]">{option.label}</div>
                      <div className="font-mono text-[10px] text-gray-500 uppercase">{option.description}</div>
                    </button>
                  ))}
                </div>
                {errors.team_size && (
                  <p className="text-xs text-red-600 font-mono">{errors.team_size}</p>
                )}
              </div>

              {/* Section 3: Work Types */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-[#0038FF] font-mono text-xs font-bold uppercase mb-4">
                  <Building2 className="w-4 h-4" />
                  <span>Type of Work</span>
                  <div className="h-[1px] flex-1 bg-[#0038FF]/20"></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {workTypeOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleWorkTypeToggle(option.value)}
                      className={`p-4 border-2 text-left transition-all flex items-start gap-3 ${
                        formData.work_types.includes(option.value)
                          ? 'border-[#0038FF] bg-[#0038FF]/5'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className={`w-5 h-5 border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        formData.work_types.includes(option.value)
                          ? 'border-[#0038FF] bg-[#0038FF]'
                          : 'border-gray-300'
                      }`}>
                        {formData.work_types.includes(option.value) && (
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <div className="font-display font-bold text-[#050505] uppercase">{option.label}</div>
                        <div className="font-mono text-xs text-gray-500">{option.description}</div>
                      </div>
                    </button>
                  ))}
                </div>
                {errors.work_types && (
                  <p className="text-xs text-red-600 font-mono">{errors.work_types}</p>
                )}
              </div>

              {/* Section 4: Services */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-[#0038FF] font-mono text-xs font-bold uppercase mb-4">
                  <Wrench className="w-4 h-4" />
                  <span>Services Offered</span>
                  <div className="h-[1px] flex-1 bg-[#0038FF]/20"></div>
                </div>

                <p className="font-mono text-xs text-gray-600 -mt-2 mb-4">
                  Select all services your company performs. This determines which certifications are legally required.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {serviceOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleServiceToggle(option.value)}
                      className={`p-4 border-2 text-left transition-all flex items-start gap-3 ${
                        formData.services.includes(option.value)
                          ? 'border-[#0038FF] bg-[#0038FF]/5'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className={`w-5 h-5 border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        formData.services.includes(option.value)
                          ? 'border-[#0038FF] bg-[#0038FF]'
                          : 'border-gray-300'
                      }`}>
                        {formData.services.includes(option.value) && (
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-display font-bold text-sm text-[#050505] uppercase">{option.label}</div>
                        <div className="font-mono text-[10px] text-gray-500 mt-0.5">{option.description}</div>
                        {option.required_cert && formData.services.includes(option.value) && (
                          <div className="mt-2 inline-flex items-center gap-1 bg-[#0038FF]/10 text-[#0038FF] px-2 py-0.5 text-[10px] font-mono font-bold uppercase">
                            <Shield className="w-3 h-3" />
                            {option.required_cert} Required
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
                {errors.services && (
                  <p className="text-xs text-red-600 font-mono">{errors.services}</p>
                )}
              </div>

              {/* Submit Button */}
              <div className="flex justify-end gap-3 pt-4">
                {/* DEV MODE: Skip button */}
                {isDevModeEnabled && (
                  <button
                    type="button"
                    onClick={() => onComplete({
                      company_name: 'Dev Company',
                      city: 'Boston',
                      team_size: '6-15',
                      work_types: ['residential', 'commercial'],
                      services: ['refrigeration', 'heating']
                    })}
                    className="bg-yellow-500 text-black px-6 py-3 font-bold font-mono text-sm uppercase tracking-wider hover:bg-yellow-400 transition-colors flex items-center gap-2"
                  >
                    <FastForward className="w-4 h-4" />
                    Skip (Dev)
                  </button>
                )}
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-[#050505] text-white px-8 py-3 font-bold font-mono text-sm uppercase tracking-wider hover:bg-[#0038FF] transition-colors shadow-[4px_4px_0px_#0038FF] hover:shadow-[4px_4px_0px_#050505] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      Continue to Certifications
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
