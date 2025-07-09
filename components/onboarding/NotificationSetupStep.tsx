import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Bell, 
  Mail, 
  Users, 
  Plus, 
  Check,
  Calendar,
  FileText,
  AlertTriangle
} from '@/lib/icons'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'

interface NotificationSetupStepProps {
  onComplete: () => void
  onBack: () => void
  onSkip: () => void
}

interface NotificationSettings {
  expirationWarningDays: number
  weeklySummary: boolean
  emailAlerts: boolean
  notificationEmail: string
  teamMembersToNotify: string[]
}

const warningDayOptions = [
  { value: 7, label: '7 days' },
  { value: 14, label: '14 days' },
  { value: 30, label: '30 days' },
  { value: 60, label: '60 days' },
  { value: 90, label: '90 days' }
]

export function NotificationSetupStep({ onComplete, onBack, onSkip }: NotificationSetupStepProps) {
  const { user } = useAuth()
  const [settings, setSettings] = useState<NotificationSettings>({
    expirationWarningDays: 30,
    weeklySummary: true,
    emailAlerts: true,
    notificationEmail: '',
    teamMembersToNotify: []
  })
  const [newTeamEmail, setNewTeamEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load user email on mount
  useEffect(() => {
    if (user?.email) {
      setSettings(prev => ({
        ...prev,
        notificationEmail: user.email || ''
      }))
    }
  }, [user])

  const handleAddTeamMember = () => {
    if (!newTeamEmail.trim()) return
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(newTeamEmail)) {
      setError('Please enter a valid email address')
      return
    }

    if (settings.teamMembersToNotify.includes(newTeamEmail)) {
      setError('This email is already added')
      return
    }

    setSettings(prev => ({
      ...prev,
      teamMembersToNotify: [...prev.teamMembersToNotify, newTeamEmail]
    }))
    setNewTeamEmail('')
    setError(null)
  }

  const handleRemoveTeamMember = (email: string) => {
    setSettings(prev => ({
      ...prev,
      teamMembersToNotify: prev.teamMembersToNotify.filter(e => e !== email)
    }))
  }

  const handleSubmit = async () => {
    try {
      setLoading(true)
      setError(null)

      if (!user) {
        throw new Error('User not authenticated')
      }

      // Save notification settings
      const { error: settingsError } = await supabase
        .from('notification_settings')
        .upsert({
          user_id: user.id,
          expiration_warning_days: settings.expirationWarningDays,
          weekly_summary: settings.weeklySummary,
          email_alerts: settings.emailAlerts,
          notification_email: settings.notificationEmail,
          team_members_to_notify: settings.teamMembersToNotify
        }, {
          onConflict: 'user_id'
        })

      if (settingsError) {
        throw new Error('Failed to save notification settings')
      }

      // Mark onboarding as complete
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          onboarding_completed: true,
          onboarding_completed_at: new Date().toISOString(),
          onboarding_step: 4
        })
        .eq('id', user.id)

      if (profileError) {
        throw new Error('Failed to complete onboarding')
      }

      onComplete()
    } catch (error) {
      console.error('Error saving notification settings:', error)
      setError(error instanceof Error ? error.message : 'Failed to save settings')
    } finally {
      setLoading(false)
    }
  }

  const handleSkipStep = async () => {
    try {
      setLoading(true)
      
      if (!user) {
        throw new Error('User not authenticated')
      }

      // Save default notification settings
      await supabase
        .from('notification_settings')
        .upsert({
          user_id: user.id,
          expiration_warning_days: 30,
          weekly_summary: true,
          email_alerts: true,
          notification_email: user.email || '',
          team_members_to_notify: []
        }, {
          onConflict: 'user_id'
        })

      // Mark onboarding as complete
      await supabase
        .from('profiles')
        .update({
          onboarding_completed: true,
          onboarding_completed_at: new Date().toISOString(),
          onboarding_step: 4
        })
        .eq('id', user.id)

      onSkip()
    } catch (error) {
      console.error('Error skipping notification setup:', error)
      onSkip() // Still proceed even if there's an error
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-3xl">
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Bell className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-xl">🔔 Set Up Expiration Alerts</CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Never miss a renewal again
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-8">
            {/* Progress Bar */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Progress</span>
                <span className="text-sm text-gray-500">4/4</span>
              </div>
              <Progress value={100} className="h-2" />
              <div className="flex justify-between mt-2">
                <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
              </div>
            </div>

            {/* Notification Settings */}
            <div className="space-y-6">
              {/* Alert Preferences */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Alert Preferences</h3>
                <div className="space-y-4">
                  {/* Expiration Warning */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        checked={settings.emailAlerts}
                        onCheckedChange={(checked) => 
                          setSettings(prev => ({ ...prev, emailAlerts: !!checked }))
                        }
                      />
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-600" />
                        <span className="text-sm font-medium">Email me</span>
                        <Select
                          value={settings.expirationWarningDays.toString()}
                          onValueChange={(value) => 
                            setSettings(prev => ({ ...prev, expirationWarningDays: parseInt(value) }))
                          }
                        >
                          <SelectTrigger className="w-24 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {warningDayOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value.toString()}>
                                {option.value}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <span className="text-sm">days before certifications expire</span>
                      </div>
                    </div>
                  </div>

                  {/* Weekly Summary */}
                  <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                    <Checkbox
                      checked={settings.weeklySummary}
                      onCheckedChange={(checked) => 
                        setSettings(prev => ({ ...prev, weeklySummary: !!checked }))
                      }
                    />
                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4 text-gray-600" />
                      <span className="text-sm font-medium">Send weekly team compliance summary</span>
                    </div>
                  </div>

                  {/* Alert Enabled */}
                  <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                    <Checkbox
                      checked={settings.emailAlerts}
                      onCheckedChange={(checked) => 
                        setSettings(prev => ({ ...prev, emailAlerts: !!checked }))
                      }
                    />
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="h-4 w-4 text-gray-600" />
                      <span className="text-sm font-medium">Alert me about expiring certifications</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Email Settings */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Notification Recipients</h3>
                
                {/* Primary Email */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="notificationEmail" className="text-sm font-medium">
                      Send notifications to:
                    </Label>
                    <div className="flex items-center space-x-2 mt-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <Input
                        id="notificationEmail"
                        type="email"
                        value={settings.notificationEmail}
                        onChange={(e) => setSettings(prev => ({ ...prev, notificationEmail: e.target.value }))}
                        placeholder="your-email@company.com"
                        className="flex-1"
                      />
                    </div>
                  </div>

                  {/* Team Members */}
                  <div>
                    <Label className="text-sm font-medium flex items-center">
                      <Users className="h-4 w-4 mr-2" />
                      Additional team members to notify
                    </Label>
                    
                    {/* Add Team Member */}
                    <div className="flex items-center space-x-2 mt-2">
                      <Input
                        type="email"
                        value={newTeamEmail}
                        onChange={(e) => setNewTeamEmail(e.target.value)}
                        placeholder="team-member@company.com"
                        className="flex-1"
                        onKeyPress={(e) => e.key === 'Enter' && handleAddTeamMember()}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleAddTeamMember}
                        className="h-10 px-3"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Team Members List */}
                    {settings.teamMembersToNotify.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {settings.teamMembersToNotify.map((email, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
                            <span className="text-sm text-gray-700">{email}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveTeamMember(email)}
                              className="h-6 w-6 p-0 text-gray-400 hover:text-red-600"
                            >
                              ×
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <Alert variant="destructive" className="mt-6">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 mt-8">
              <Button
                type="button"
                variant="outline"
                onClick={onBack}
                disabled={loading}
                className="h-12 px-6 text-gray-600 hover:text-gray-700"
              >
                ← Back
              </Button>
              
              <Button
                type="button"
                variant="ghost"
                onClick={handleSkipStep}
                disabled={loading}
                className="h-12 px-6 text-gray-500 hover:text-gray-600"
              >
                Use Defaults & Skip
              </Button>

              <div className="flex-1" />

              <Button
                type="button"
                onClick={handleSubmit}
                disabled={loading || !settings.notificationEmail}
                className="h-12 px-8 bg-blue-600 hover:bg-blue-700 text-white"
              >
                {loading ? (
                  <>
                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Complete Setup →
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 