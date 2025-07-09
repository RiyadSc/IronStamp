import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

interface UploadMethodStepProps {
  onComplete: (data: { upload_method: string }) => void
  onBack: () => void
  onSkip: () => void
  teamSize: string
  initialMethod?: string
}

const uploadMethods = [
  {
    id: 'bulk',
    icon: '🚀',
    title: 'We use Excel/Spreadsheets',
    subtitle: 'Most choose this',
    description: 'Upload your existing file and we\'ll import everything automatically',
    prominent: false
  },
  {
    id: 'individual',
    icon: '📄',
    title: 'We track manually/individually',
    subtitle: '',
    description: 'Add certifications one by one',
    prominent: false
  },
  {
    id: 'fresh',
    icon: '📋',
    title: 'We\'re starting fresh',
    subtitle: '',
    description: 'Set up from scratch with sample data',
    prominent: false
  }
]

export function UploadMethodStep({ onComplete, onBack, onSkip, teamSize, initialMethod }: UploadMethodStepProps) {
  const [selectedMethod, setSelectedMethod] = React.useState(initialMethod || '')

  // Smart recommendations based on team size
  const getRecommendedOptions = () => {
    const options = [...uploadMethods]
    
    if (teamSize === '1-10') {
      // Show individual upload prominently, reorder to put it first
      const individualIndex = options.findIndex(opt => opt.id === 'individual')
      const individual = { ...options[individualIndex], prominent: true }
      options.splice(individualIndex, 1)
      return [individual, ...options]
    } else if (teamSize === '50+') {
      // Default to bulk upload, hide individual option
      return options.filter(opt => opt.id !== 'individual').map(opt => 
        opt.id === 'bulk' ? { ...opt, prominent: true } : opt
      )
    } else {
      // Show both options equally, but highlight bulk as most popular
      return options.map(opt => 
        opt.id === 'bulk' ? { ...opt, prominent: true } : opt
      )
    }
  }

  const recommendedOptions = getRecommendedOptions()

  const handleMethodSelect = (method: string) => {
    setSelectedMethod(method)
  }

  const handleContinue = () => {
    if (selectedMethod) {
      onComplete({ upload_method: selectedMethod })
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                How do you currently track certifications?
              </h1>
            </div>

            {/* Progress Bar */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Progress</span>
                <span className="text-sm text-gray-500">2/4</span>
              </div>
              <Progress value={50} className="h-2" />
              <div className="flex justify-between mt-2">
                <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                <div className="w-3 h-3 bg-gray-200 rounded-full"></div>
                <div className="w-3 h-3 bg-gray-200 rounded-full"></div>
              </div>
            </div>

            {/* Options */}
            <div className="space-y-4 mb-8">
              {recommendedOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleMethodSelect(option.id)}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all duration-200 relative ${
                    selectedMethod === option.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {/* Prominent badge */}
                  {option.prominent && (
                    <div className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full font-medium">
                      {teamSize === '1-10' ? 'Recommended' : 'Most Popular'}
                    </div>
                  )}
                  
                  <div className="flex items-start space-x-4">
                    <div className="text-2xl flex-shrink-0 mt-1">
                      {option.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-semibold text-gray-900">
                          {option.title}
                        </h3>
                        {option.subtitle && (
                          <span className="text-sm text-blue-600 font-medium">
                            - {option.subtitle}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {option.description}
                      </p>
                    </div>
                    {selectedMethod === option.id && (
                      <div className="flex-shrink-0 mt-1">
                        <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onBack}
                className="h-12 px-6 text-gray-600 hover:text-gray-700"
              >
                ← Back
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onSkip}
                className="h-12 px-6 text-gray-600 hover:text-gray-700"
              >
                Skip Setup
              </Button>
              <Button
                onClick={handleContinue}
                disabled={!selectedMethod}
                className="flex-1 h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue →
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 