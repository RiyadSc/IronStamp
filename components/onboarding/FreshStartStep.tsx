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

// Sample HVAC certification data for preview
const sampleData = {
  totalEmployees: 12,
  activeCertifications: 45,
  expiringSoon: 3,
  recentCertifications: [
    {
      employeeName: 'Mike Johnson',
      certificationName: 'EPA 608 Universal',
      expirationDate: '2025-03-15',
      priority: 'medium' as const,
      daysUntilExpiry: 45
    },
    {
      employeeName: 'Sarah Davis', 
      certificationName: 'NATE HVAC Excellence',
      expirationDate: '2025-02-20',
      priority: 'high' as const,
      daysUntilExpiry: 22
    },
    {
      employeeName: 'Robert Chen',
      certificationName: 'OSHA 10-Hour Safety',
      expirationDate: '2025-06-10',
      priority: 'low' as const,
      daysUntilExpiry: 120
    },
    {
      employeeName: 'Jessica Martinez',
      certificationName: 'Carrier Factory Authorized',
      expirationDate: '2025-04-08',
      priority: 'medium' as const,
      daysUntilExpiry: 68
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
      <div className="w-full max-w-5xl">
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 text-lg">👀</span>
              </div>
              <div>
                <CardTitle className="text-xl">Let&apos;s see what your dashboard will look like</CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                                      We&apos;ve added sample HVAC certifications to give you a preview
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-8">
            {/* Progress Bar */}
            <div className="mb-8">
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
            <div className="bg-gradient-to-br from-slate-50 to-blue-50/30 rounded-lg p-6 border-2 border-dashed border-blue-200">
              <div className="flex items-center space-x-2 mb-6">
                <BarChart3 className="h-6 w-6 text-blue-600" />
                <h3 className="text-xl font-bold text-gray-900">📊 Dashboard Preview</h3>
                <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                  <Eye className="h-3 w-3 mr-1" />
                  Demo Data
                </Badge>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card className="bg-white/80 border-0 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="bg-blue-100 p-2 rounded-lg">
                        <Users className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-gray-900">{sampleData.totalEmployees}</p>
                        <p className="text-sm text-gray-600">Total Employees</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/80 border-0 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="bg-green-100 p-2 rounded-lg">
                        <Award className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-gray-900">{sampleData.activeCertifications}</p>
                        <p className="text-sm text-gray-600">Active Certifications</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/80 border-0 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="bg-orange-100 p-2 rounded-lg">
                        <AlertTriangle className="h-5 w-5 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-gray-900">{sampleData.expiringSoon}</p>
                        <p className="text-sm text-gray-600">Expiring Soon (30 days)</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Certifications */}
              <Card className="bg-white/80 border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2 text-gray-600" />
                    Recent Certifications
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {sampleData.recentCertifications.map((cert, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-600">
                              {cert.employeeName.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{cert.employeeName}</p>
                            <p className="text-sm text-gray-600">{cert.certificationName}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-600">
                              Expires {formatDate(cert.expirationDate)}
                            </span>
                          </div>
                          <Badge 
                            variant="secondary" 
                            className={`mt-1 ${getPriorityColor(cert.priority)}`}
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
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start space-x-3">
                <div className="bg-blue-100 p-1 rounded-full mt-0.5">
                  <Eye className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-blue-900">This is just a preview!</h4>
                  <p className="text-sm text-blue-800 mt-1">
                    This sample data shows you what your dashboard will look like once you start adding your team's real certifications. 
                    You can begin with your first certification or explore the dashboard first.
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-8">
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

              <div className="flex-1" />

              <Button
                type="button"
                onClick={onComplete}
                className="h-12 px-8 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add My First Real Certification →
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 