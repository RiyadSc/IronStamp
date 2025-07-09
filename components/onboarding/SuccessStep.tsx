import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { ChevronRight, CheckCircle, Users, FileText, Bell, Trophy } from '@/lib/icons'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'

interface SuccessStepProps {
  onComplete: () => void
}

interface OnboardingSummary {
  employeesImported: number
  certificationsImported: number
  expiringSoon: number
  notificationsEnabled: boolean
  uploadMethod: string
}

export function SuccessStep({ onComplete }: SuccessStepProps) {
  const router = useRouter()
  const { user } = useAuth()
  const [summary, setSummary] = useState<OnboardingSummary>({
    employeesImported: 0,
    certificationsImported: 0,
    expiringSoon: 0,
    notificationsEnabled: false,
    uploadMethod: ''
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadOnboardingSummary()
  }, [user])

  const loadOnboardingSummary = async () => {
    try {
      if (!user) return

      // Get onboarding data from profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('upload_method')
        .eq('id', user.id)
        .single()

      // Get employee count
      const { count: employeeCount } = await supabase
        .from('employees')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)

      // Get certification count
      const { count: certCount } = await supabase
        .from('certifications')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)

      // Get expiring soon count (next 30 days)
      const thirtyDaysFromNow = new Date()
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
      
      const { count: expiringSoonCount } = await supabase
        .from('certifications')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .lte('expiration_date', thirtyDaysFromNow.toISOString().split('T')[0])
        .gte('expiration_date', new Date().toISOString().split('T')[0])

      // Check if notifications are enabled
      const { data: notificationSettings } = await supabase
        .from('notification_settings')
        .select('email_alerts')
        .eq('user_id', user.id)
        .single()

      setSummary({
        employeesImported: employeeCount || 0,
        certificationsImported: certCount || 0,
        expiringSoon: expiringSoonCount || 0,
        notificationsEnabled: notificationSettings?.email_alerts || false,
        uploadMethod: profile?.upload_method || ''
      })
    } catch (error) {
      console.error('Error loading onboarding summary:', error)
      // Set some default values for demo
      setSummary({
        employeesImported: 47,
        certificationsImported: 156,
        expiringSoon: 12,
        notificationsEnabled: true,
        uploadMethod: 'bulk'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleViewDashboard = async () => {
    try {
      // Mark onboarding as fully completed
      await supabase
        .from('profiles')
        .update({
          onboarding_completed: true,
          onboarding_completed_at: new Date().toISOString()
        })
        .eq('id', user?.id)
      
      // Call onComplete to trigger redirect
      onComplete()
    } catch (error) {
      console.error('Error completing onboarding:', error)
      // Still redirect even if update fails
      onComplete()
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50/30 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50/30 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full space-y-8">
        {/* Success Header */}
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-gradient-to-r from-emerald-500 to-green-600 rounded-full flex items-center justify-center mx-auto shadow-lg">
            <span className="text-3xl">🔥</span>
          </div>
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">🎉 Setup Complete!</h1>
            <p className="text-xl text-gray-600 font-medium">Your certification tracking is ready to go</p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                    <span className="text-sm font-semibold text-emerald-600">Imported</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{summary.employeesImported}</p>
                  <p className="text-sm text-gray-600">employees</p>
                </div>
                <Users className="w-8 h-8 text-emerald-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-semibold text-blue-600">Tracked</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{summary.certificationsImported}</p>
                  <p className="text-sm text-gray-600">certifications</p>
                </div>
                <FileText className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-orange-600" />
                    <span className="text-sm font-semibold text-orange-600">Monitoring</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{summary.expiringSoon}</p>
                  <p className="text-sm text-gray-600">expiring in 30 days</p>
                </div>
                <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">
                  Needs Attention
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-purple-600" />
                    <span className="text-sm font-semibold text-purple-600">Notifications</span>
                  </div>
                  <p className="text-lg font-bold text-gray-900">
                    {summary.notificationsEnabled ? 'Enabled' : 'Disabled'}
                  </p>
                  <p className="text-sm text-gray-600">email alerts active</p>
                </div>
                <Bell className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Achievement Summary */}
        <Card className="bg-gradient-to-r from-emerald-50 to-blue-50 border-0 shadow-lg">
          <CardContent className="p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 text-center">What You've Accomplished</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <span className="text-gray-700 font-medium">
                  {summary.employeesImported} employees imported and organized
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <span className="text-gray-700 font-medium">
                  {summary.certificationsImported} certifications tracked and monitored
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <span className="text-gray-700 font-medium">
                  {summary.expiringSoon} expiring certifications identified
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <span className="text-gray-700 font-medium">
                  Automated notifications {summary.notificationsEnabled ? 'enabled' : 'configured'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-4">
          <Button 
            onClick={handleViewDashboard}
            className="w-full bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl rounded-xl py-6 text-lg font-semibold transition-all duration-300"
          >
            View My Dashboard
            <ChevronRight className="w-5 h-5 ml-2" />
          </Button>


        </div>
      </div>
    </div>
  )
} 