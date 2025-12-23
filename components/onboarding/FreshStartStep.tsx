import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { 
  BarChart3, 
  Users, 
  Award, 
  AlertTriangle, 
  Calendar,
  TrendingUp,
  Plus,
  Eye
} from '@/lib/icons'

interface FreshStartStepProps {
  onComplete: () => void
  onBack: () => void
  onSkip: () => void
}

// Sample data for preview
const sampleData = {
  totalEmployees: 8,
  activeCertifications: 24,
  expiringSoon: 3,
  recentCertifications: [
    {
      employeeName: 'Mike Rodriguez',
      certificationName: 'EPA 608 Universal',
      expirationDate: '2024-09-15',
      priority: 'high',
      daysUntilExpiry: 45
    },
    {
      employeeName: 'Sarah Chen',
      certificationName: 'OSHA 10-Hour',
      expirationDate: '2024-11-20',
      priority: 'medium',
      daysUntilExpiry: 110
    },
    {
      employeeName: 'David Thompson',
      certificationName: 'Mass HVAC License',
      expirationDate: '2025-01-30',
      priority: 'low',
      daysUntilExpiry: 180
    },
    {
      employeeName: 'Jessica Park',
      certificationName: 'EPA 608 Type I',
      expirationDate: '2024-08-10',
      priority: 'high',
      daysUntilExpiry: 15
    }
  ]
}

export function FreshStartStep({ onComplete, onBack, onSkip }: FreshStartStepProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-orange-100 text-orange-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-3xl lg:max-w-5xl">
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 text-lg">👀</span>
              </div>
              <div>
                <CardTitle className="text-lg sm:text-xl">Let&apos;s see what your dashboard will look like</CardTitle>
                <p className="text-xs sm:text-sm text-gray-600 mt-1">
                  We&apos;ve added sample HVAC certifications to give you a preview
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-4 sm:p-8">
            {/* Progress Bar */}
            <div className="mb-6 sm:mb-8">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Progress</span>
                <span className="text-sm text-gray-500">3/4</span>
              </div>
              <Progress value={75} className="h-2" />
              <div className="flex justify-between mt-2">
                <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
              </div>
            </div>

            {/* Dashboard Preview */}
            <div className="bg-gradient-to-br from-slate-50 to-blue-50/30 rounded-lg p-4 sm:p-6 border-2 border-dashed border-blue-200">
              <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 mb-4 sm:mb-6">
                <BarChart3 className="h-6 w-6 text-blue-600" />
                <h3 className="text-lg sm:text-xl font-bold text-gray-900">📊 Dashboard Preview</h3>
                <Badge variant="secondary" className="bg-blue-100 text-blue-700 w-fit">
                  <Eye className="h-3 w-3 mr-1" />
                  Demo Data
                </Badge>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
                <Card className="bg-white/80 border-0 shadow-sm">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center space-x-3">
                      <div className="bg-blue-100 p-2 rounded-lg">
                        <Users className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xl sm:text-2xl font-bold text-gray-900">{sampleData.totalEmployees}</p>
                        <p className="text-xs sm:text-sm text-gray-600">Total Employees</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/80 border-0 shadow-sm">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center space-x-3">
                      <div className="bg-green-100 p-2 rounded-lg">
                        <Award className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-xl sm:text-2xl font-bold text-gray-900">{sampleData.activeCertifications}</p>
                        <p className="text-xs sm:text-sm text-gray-600">Active Certifications</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/80 border-0 shadow-sm sm:col-span-2 lg:col-span-1">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center space-x-3">
                      <div className="bg-orange-100 p-2 rounded-lg">
                        <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-xl sm:text-2xl font-bold text-gray-900">{sampleData.expiringSoon}</p>
                        <p className="text-xs sm:text-sm text-gray-600">Expiring Soon (30 days)</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Certifications */}
              <Card className="bg-white/80 border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base sm:text-lg flex items-center">
                    <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-gray-600" />
                    Recent Certifications
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {sampleData.recentCertifications.map((cert, index) => (
                      <div key={index} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-gray-50 rounded-lg space-y-2 sm:space-y-0">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-xs sm:text-sm font-medium text-blue-600">
                              {cert.employeeName.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 text-sm sm:text-base">{cert.employeeName}</p>
                            <p className="text-xs sm:text-sm text-gray-600">{cert.certificationName}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between sm:block sm:text-right">
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                            <span className="text-xs sm:text-sm text-gray-600">
                              Expires {formatDate(cert.expirationDate)}
                            </span>
                          </div>
                          <Badge 
                            variant="secondary" 
                            className={`mt-0 sm:mt-1 text-xs ${getPriorityColor(cert.priority)}`}
                          >
                            {cert.daysUntilExpiry} days left
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Info Message */}
            <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start space-x-3">
                <div className="bg-blue-100 p-1 rounded-full mt-0.5">
                  <Eye className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-blue-900 text-sm sm:text-base">This is just a preview!</h4>
                  <p className="text-xs sm:text-sm text-blue-800 mt-1">
                    This sample data shows you what your dashboard will look like once you start adding your team&apos;s real certifications. 
                    You can begin with your first certification or explore the dashboard first.
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 mt-6 sm:mt-8">
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
                variant="ghost"
                onClick={onSkip}
                className="h-12 px-6 text-gray-500 hover:text-gray-600"
              >
                Explore Dashboard First
              </Button>

              <div className="hidden sm:block flex-1" />

              <Button
                type="button"
                onClick={onComplete}
                className="h-12 px-4 sm:px-8 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                <span className="text-sm sm:text-base">Add My First Real Certification →</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 