import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'
import { getCSRFToken } from '@/lib/csrf-client'
import { trackEvent, POSTHOG_EVENTS, POSTHOG_PROPERTIES } from '@/lib/posthog'
import CompanyProfileStep from './CompanyProfileStep'
import TeamRosterStep, { TeamMember } from './TeamRosterStep'
import CertificationAssignmentStep, { CertificationAssignment } from './CertificationAssignmentStep'
import ComplianceReviewStep from './ComplianceReviewStep'
import { isDevModeEnabled } from '@/lib/dev-mode'

export interface OnboardingData {
  // Step 1: Company Profile
  company_name: string
  city: string
  team_size: string
  work_types: string[] // residential, commercial, industrial
  services: string[] // refrigeration, heating, oil_burner, sheet_metal, gas_fitting
  
  // Derived from uploads/assignments; no longer a dedicated step
  required_certifications: string[]
  
  // Step 2: Team Roster
  team_members: TeamMember[]
  
  // Step 3: Certification Assignments
  certification_assignments: CertificationAssignment[]
  
  // Meta
  onboarding_step: number
}

const initialOnboardingData: OnboardingData = {
  company_name: '',
  city: '',
  team_size: '',
  work_types: [],
  services: [],
  required_certifications: [],
  team_members: [],
  certification_assignments: [],
  onboarding_step: 0
}

// DEV MODE: Pre-filled data for testing
const devModeOnboardingData: OnboardingData = {
  company_name: 'Dev HVAC Company',
  city: 'Boston',
  team_size: '6-15',
  work_types: ['residential', 'commercial'],
  services: ['refrigeration', 'heating', 'gas_fitting'],
  required_certifications: ['epa_608', 'ma_gas_fitter', 'osha_10'],
  team_members: [],
  certification_assignments: [],
  onboarding_step: 0
}

/** Normalize a name for comparison (lowercase + trim). */
function normalizeName(name: string | null | undefined): string {
  return (name || '').toLowerCase().trim()
}

/**
 * Persist certification assignments to the certifications table.
 *
 * Behaviour:
 * - Matches employees by name to set `employee_id`
 * - If a certification record for the same employee + certification already exists
 *   (for example, created earlier via document upload), we UPDATE that record
 *   instead of inserting a duplicate.
 * - Otherwise, we INSERT a new certification row.
 */
async function persistCertificationAssignments(
  userId: string,
  assignments: CertificationAssignment[]
): Promise<{ saved: number; error?: string }> {
  if (assignments.length === 0) return { saved: 0 }

  const { data: employees, error: fetchError } = await supabase
    .from('employees')
    .select('id, name')
    .eq('user_id', userId)
  if (fetchError) return { saved: 0, error: fetchError.message }
  const employeeMap = new Map<string, string>()
  employees?.forEach(emp => {
    employeeMap.set(normalizeName(emp.name), emp.id)
  })

  // Fetch existing certifications for this user once so we can de-duplicate.
  // This lets us link document-uploaded certs (which already exist) to team members
  // instead of creating near-identical duplicates.
  const { data: existingCerts, error: existingError } = await supabase
    .from('certifications')
    .select('id, employee_name, certification_name')
    .eq('user_id', userId)

  if (existingError) {
    console.error('Error fetching existing certifications:', existingError)
    // Don't block onboarding entirely – fall back to insert-only behaviour.
  }

  const existingMap = new Map<string, string>()
  existingCerts?.forEach(cert => {
    const key = `${normalizeName(cert.employee_name)}|${normalizeName(cert.certification_name)}`
    if (!existingMap.has(key)) {
      existingMap.set(key, cert.id)
    }
  })

  const toInsert: any[] = []
  const toUpdate: { id: string; data: any }[] = []

  assignments.forEach(assignment => {
    const normalizedMemberName = normalizeName(assignment.memberName)
    const employeeId = employeeMap.get(normalizedMemberName)
    if (!employeeId) return

    const issueDate = (assignment as { issueDate?: string }).issueDate
    const cleanIssueDate =
      issueDate && issueDate !== 'N/A'
        ? issueDate
        : null
    const cleanExpirationDate =
      assignment.expirationDate && assignment.expirationDate !== 'N/A'
        ? assignment.expirationDate
        : null

    const employeeNameTrimmed = (assignment.memberName || '').trim()
    const certNameTrimmed = (assignment.certificationName || '').trim()
    const existingKey = `${normalizeName(employeeNameTrimmed)}|${normalizeName(certNameTrimmed)}`
    const existingId = existingMap.get(existingKey)

    const baseData = {
      user_id: userId,
      employee_id: employeeId,
      employee_name: employeeNameTrimmed,
      certification_name: certNameTrimmed,
      issue_date: cleanIssueDate,
      expiration_date: cleanExpirationDate,
      is_lifetime: Boolean(assignment.isLifetime),
      priority: 'medium',
      status: 'active'
    }

    if (existingId) {
      // Link and update the existing certification (e.g., created via document upload)
      toUpdate.push({ id: existingId, data: baseData })
    } else {
      // No matching existing certification – create a new row
      toInsert.push(baseData)
    }
  })

  let savedCount = 0

  if (toInsert.length > 0) {
    const { error: insertError } = await supabase.from('certifications').insert(toInsert)
    if (insertError) {
      console.error('Error inserting certifications:', insertError)
      return { saved: savedCount, error: insertError.message }
    }
    savedCount += toInsert.length
  }

  if (toUpdate.length > 0) {
    // Perform updates sequentially; volume is small in onboarding.
    for (const item of toUpdate) {
      const { error: updateError } = await supabase
        .from('certifications')
        .update(item.data)
        .eq('id', item.id)
      if (updateError) {
        console.error('Error updating certification:', updateError)
        return { saved: savedCount, error: updateError.message }
      }
      savedCount += 1
    }
  }

  return { saved: savedCount }
}

export default function OnboardingV1() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const { toast } = useToast()
  const [currentStep, setCurrentStep] = useState(1)
  const [dataLoaded, setDataLoaded] = useState(false)
  const loadedOnce = useRef(false)
  
  // DEV MODE: Use pre-filled data
  const [onboardingData, setOnboardingData] = useState<OnboardingData>(
    isDevModeEnabled ? devModeOnboardingData : initialOnboardingData
  )
  const [saving, setSaving] = useState(false)

  const loadExistingData = useCallback(async () => {
    // DEV MODE: Skip database loading, use mock data
    if (isDevModeEnabled) {
      setOnboardingData(devModeOnboardingData)
      setDataLoaded(true)
      return
    }

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('company_name, city, team_size, work_types, services, required_certifications, onboarding_step, onboarding_completed')
        .eq('id', user?.id)
        .single()

      if (!error && profile) {
        // If onboarding is already completed, redirect to dashboard
        // DEV MODE: Skip this redirect
        if (profile.onboarding_completed && !isDevModeEnabled) {
          router.push('/DashboardV2')
          return
        }

        // Load existing data
        setOnboardingData({
          company_name: profile.company_name || '',
          city: profile.city || '',
          team_size: profile.team_size || '',
          work_types: profile.work_types || [],
          services: profile.services || [],
          required_certifications: profile.required_certifications || [],
          team_members: [],
          certification_assignments: [],
          onboarding_step: profile.onboarding_step || 0
        })

        // Resume from where they left off (4 steps: 1=company, 2=team, 3=assign, 4=review)
        // Map old 5-step progress to new 4-step: old 1→1, old 2|3→2, old 4→3, old 5→4
        const completedStep = profile.onboarding_step || 0
        const stepMap: Record<number, number> = { 1: 1, 2: 2, 3: 2, 4: 3, 5: 4 }
        const newStep = stepMap[completedStep] ?? (completedStep >= 1 ? Math.min(completedStep, 4) : 0)
        if (newStep >= 1) {
          setCurrentStep(newStep)
        }
      }
      
      setDataLoaded(true)
    } catch (error) {
      console.error('Error loading existing onboarding data:', error)
      setDataLoaded(true)
    }
  }, [user, router])

  useEffect(() => {
    // DEV MODE: Skip auth check
    if (isDevModeEnabled) {
      loadedOnce.current = true
      loadExistingData()
      return
    }

    if (!loading && !user) {
      router.push('/auth/signin')
      return
    }

    if (user && !loading && !loadedOnce.current) {
      loadedOnce.current = true
      loadExistingData()
      
      trackEvent(POSTHOG_EVENTS.ONBOARDING_STARTED, {
        user_id: user.id,
        email: user.email,
        version: 'v1'
      })
    }
  }, [user, loading, router, loadExistingData])

  const handleStep1Complete = async (stepData: Partial<OnboardingData>) => {
    const updatedData = { ...onboardingData, ...stepData }
    setOnboardingData(updatedData)
    
    // DEV MODE: Skip database save, just advance step
    if (isDevModeEnabled) {
      console.log('🔧 DEV MODE: Step 1 complete (skipping save)', stepData)
      setCurrentStep(2)
      return
    }

    setSaving(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) throw new Error('Not authenticated')
      const csrfToken = await getCSRFToken()
      const res = await fetch('/api/onboarding/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
          'X-CSRF-Token': csrfToken,
        },
        body: JSON.stringify({
          step: 1,
          company_name: updatedData.company_name,
          city: updatedData.city,
          team_size: updatedData.team_size,
          work_types: updatedData.work_types,
          services: updatedData.services,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Failed to save')
      setCurrentStep(2)
    } catch (error) {
      console.error('Error saving step 1:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setSaving(false)
    }
  }

  const handleStep2Complete = async (teamMembers: TeamMember[]) => {
    const updatedData = { ...onboardingData, team_members: teamMembers }
    setOnboardingData(updatedData)
    
    // DEV MODE: Skip database save, just advance step
    if (isDevModeEnabled) {
      console.log('🔧 DEV MODE: Step 2 (team) complete (skipping save)', { teamMembers })
      setCurrentStep(3)
      return
    }

    setSaving(true)

    try {
      // Create employees in the database
      if (teamMembers.length > 0) {
        const employeesToInsert = teamMembers.map(member => ({
          user_id: user?.id,
          name: member.name,
          email: member.email || null,
          phone: member.phone || null,
          role: member.role,
          status: 'Active'
        }))

        const { error: employeeError } = await supabase
          .from('employees')
          .insert(employeesToInsert)

        if (employeeError) {
          console.error('Error creating employees:', employeeError)
          // Don't throw - continue with onboarding even if employee insert fails
        }
      }

      // Update profile onboarding step (2 = team roster done)
      const { error } = await supabase
        .from('profiles')
        .update({
          onboarding_step: 2
        })
        .eq('id', user?.id)

      if (error) throw error
      
      setCurrentStep(3)
    } catch (error) {
      console.error('Error saving step 2 (team):', error)
      toast({
        title: 'Error',
        description: 'Failed to save team members. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setSaving(false)
    }
  }

  const handleStep3Complete = async (assignments: CertificationAssignment[]) => {
    const updatedData = { ...onboardingData, certification_assignments: assignments }
    setOnboardingData(updatedData)
    
    // DEV MODE: Skip database save, just advance step
    if (isDevModeEnabled) {
      console.log('🔧 DEV MODE: Step 3 (assign) complete (skipping save)', { assignments })
      setCurrentStep(4)
      return
    }

    setSaving(true)

    try {
      if (user?.id && assignments.length > 0) {
        const { saved, error: persistError } = await persistCertificationAssignments(user.id, assignments)
        if (persistError) {
          console.error('Error creating certifications:', persistError)
          toast({
            title: 'Certifications not fully saved',
            description: saved > 0 ? `${saved} saved. Some could not be matched to team members.` : 'Failed to save. Check that team member names in assignments match the roster.',
            variant: 'destructive'
          })
        }
      }

      const { error } = await supabase
        .from('profiles')
        .update({ onboarding_step: 3 })
        .eq('id', user?.id)

      if (error) throw error
      setCurrentStep(4)
    } catch (error) {
      console.error('Error saving step 3 (assign):', error)
      toast({
        title: 'Error',
        description: 'Failed to save certification assignments. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setSaving(false)
    }
  }

  const handleStep4Complete = async () => {
    // DEV MODE: Skip database save, just redirect
    if (isDevModeEnabled) {
      console.log('🔧 DEV MODE: Step 4 (review) complete (skipping save)')
      toast({
        title: 'Onboarding Complete!',
        description: 'Welcome to IronStamp. Your dashboard is ready.',
      })
      router.push('/DashboardV2')
      return
    }

    setSaving(true)

    try {
      // Safety net: persist certifications when completing onboarding (e.g. if Step 3 save was skipped or failed)
      if (user?.id && onboardingData.certification_assignments.length > 0) {
        const { count } = await supabase
          .from('certifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
        if (count === 0) {
          const { error: persistErr } = await persistCertificationAssignments(user.id, onboardingData.certification_assignments)
          if (persistErr) console.error('Step 4 cert persist:', persistErr)
        }
      }

      // Mark onboarding as complete (4 steps total)
      const { error } = await supabase
        .from('profiles')
        .update({
          onboarding_step: 4,
          onboarding_completed: true
        })
        .eq('id', user?.id)

      if (error) throw error
      
      // Track completion
      trackEvent(POSTHOG_EVENTS.ONBOARDING_COMPLETED, {
        user_id: user?.id,
        email: user?.email,
        version: 'v1',
        [POSTHOG_PROPERTIES.TEAM_SIZE]: onboardingData.team_members.length,
        [POSTHOG_PROPERTIES.CERTS_TRACKED]: onboardingData.required_certifications.length,
        [POSTHOG_PROPERTIES.CERTS_ASSIGNED]: onboardingData.certification_assignments.length
      })
      
      toast({
        title: 'Onboarding Complete!',
        description: 'Welcome to IronStamp. Your dashboard is ready.',
      })
      
      router.push('/DashboardV2')
    } catch (error) {
      console.error('Error completing onboarding:', error)
      toast({
        title: 'Error',
        description: 'Failed to complete onboarding. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setSaving(false)
    }
  }

  const handleStepBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  // DEV MODE: Direct step navigation (4 steps)
  const goToStep = (step: number) => {
    if (isDevModeEnabled && step >= 1 && step <= 4) {
      setCurrentStep(step)
    }
  }

  // Show loading until data is loaded
  if (loading || !user || !dataLoaded) {
    return (
      <div className="min-h-screen bg-[#F0F4F8] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-[#0038FF] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="font-mono text-sm text-gray-600 uppercase tracking-wider">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F0F4F8]">
      {/* DEV MODE: Step Navigation Bar */}
      {isDevModeEnabled && (
        <div className="fixed bottom-0 left-0 right-0 bg-gray-900 text-white p-3 z-50 font-mono text-sm">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <span className="text-yellow-400 font-bold">DEV MODE: Onboarding Navigator</span>
            <div className="flex items-center gap-2">
              <span className="text-gray-400 mr-2">Jump to:</span>
              {[1, 2, 3, 4].map((step) => (
                <button
                  key={step}
                  onClick={() => goToStep(step)}
                  className={`px-3 py-1 font-bold transition-colors ${
                    currentStep === step
                      ? 'bg-[#0038FF] text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                  title={`Step ${step}`}
                >
                  {step}
                </button>
              ))}
              <span className="mx-2 text-gray-500">|</span>
              <button
                onClick={() => router.push('/DashboardV2')}
                className="px-4 py-1 bg-green-600 text-white font-bold hover:bg-green-500 transition-colors"
              >
                Skip to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add padding at bottom for dev mode nav bar */}
      <div className={isDevModeEnabled ? 'pb-16' : ''}>
        {currentStep === 1 && (
          <CompanyProfileStep
            initialData={onboardingData}
            onComplete={handleStep1Complete}
            saving={saving}
          />
        )}
        
        {currentStep === 2 && (
          <TeamRosterStep
            initialData={onboardingData}
            onComplete={handleStep2Complete}
            onBack={handleStepBack}
            saving={saving}
          />
        )}

        {currentStep === 3 && (
          <CertificationAssignmentStep
            initialData={onboardingData}
            onComplete={handleStep3Complete}
            onBack={handleStepBack}
            saving={saving}
          />
        )}

        {currentStep === 4 && (
          <ComplianceReviewStep
            initialData={onboardingData}
            onComplete={handleStep4Complete}
            onBack={handleStepBack}
            saving={saving}
          />
        )}
      </div>
    </div>
  )
}
