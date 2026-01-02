import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/use-toast'
import { WelcomeStep } from '@/components/onboarding/WelcomeStep'
import { UploadMethodStep } from '@/components/onboarding/UploadMethodStep'
import { FileUploadStep } from '@/components/onboarding/FileUploadStep'
import { ColumnMappingStep } from '@/components/onboarding/ColumnMappingStep'
import { DataPreviewStep } from '@/components/onboarding/DataPreviewStep'
import { IndividualUploadStep } from '@/components/onboarding/IndividualUploadStep'
import { FreshStartStep } from '@/components/onboarding/FreshStartStep'
import { NotificationSetupStep } from '@/components/onboarding/NotificationSetupStep'
import { SuccessStep } from '@/components/onboarding/SuccessStep'
import { supabase } from '@/lib/supabase'
import { trackEvent, POSTHOG_EVENTS } from '@/lib/posthog'

export default function Onboarding() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const { toast } = useToast()
  const [currentStep, setCurrentStep] = useState(1)
  const [currentSubStep, setCurrentSubStep] = useState(1) // For Step 3A sub-steps
  const [dataLoaded, setDataLoaded] = useState(false) // Track if we've loaded data
  const loadedOnce = useRef(false) // Prevent multiple loads
  
  const [onboardingData, setOnboardingData] = useState({
    company_name: '',
    team_size: '',
    business_focus: '',
    upload_method: ''
  })
  
  // Step 3A specific data
  const [bulkUploadData, setBulkUploadData] = useState<{
    fileData: any | null
    mappings: any[]
    uploadComplete: boolean
  }>({
    fileData: null,
    mappings: [],
    uploadComplete: false
  })

  const loadExistingData = useCallback(async () => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('company_name, team_size, business_focus, upload_method, onboarding_step, onboarding_completed')
        .eq('id', user?.id)
        .single()

      if (!error && profile) {
        // If onboarding is already completed, redirect to dashboard
        if (profile.onboarding_completed) {
          router.push('/DashboardV2')
          return
        }

        // Load existing data
        setOnboardingData({
          company_name: profile.company_name || '',
          team_size: profile.team_size || '',
          business_focus: profile.business_focus || '',
          upload_method: profile.upload_method || ''
        })

        // Fix: Calculate CURRENT step based on COMPLETED step
        const completedStep = profile.onboarding_step || 0
        let nextStep = 1
        
        if (completedStep === 0) {
          nextStep = 1 // Start at step 1
        } else if (completedStep === 1) {
          nextStep = 2 // Step 1 completed, go to step 2
        } else if (completedStep === 2) {
          // Step 2 completed, check upload method
          if (profile.upload_method === 'bulk') {
            nextStep = 3 // Go to Step 3A (bulk upload)
            setCurrentSubStep(1) // Start with file upload
            
            // Try to recover bulk upload data from localStorage
            try {
              const bulkData = localStorage.getItem('onboarding_bulk_data')
              if (bulkData) {
                const parsed = JSON.parse(bulkData)
                // Verify it's for the current user
                if (parsed.userId === user?.id && parsed.step === 3) {
                  setBulkUploadData({
                    fileData: parsed.fileData || null,
                    mappings: parsed.mappings || [],
                    uploadComplete: false
                  })
                  setCurrentSubStep(parsed.subStep || 1)
                }
              }
            } catch (error) {
              console.warn('Failed to recover bulk upload data:', error)
            }
          } else if (profile.upload_method === 'individual') {
            nextStep = 3 // Go to Step 3B (individual upload)
          } else if (profile.upload_method === 'fresh') {
            nextStep = 3 // Go to Step 3C (fresh start preview)
          } else {
            nextStep = 4 // Skip to final step
          }
        } else if (completedStep === 3) {
          nextStep = 4 // Go to Step 4 (notification setup)
        } else if (completedStep === 4) {
          nextStep = 5 // Go to Step 5 (success screen)
        } else {
          nextStep = completedStep + 1
        }
        
        setCurrentStep(nextStep)
      }
      
      setDataLoaded(true)
    } catch (error) {
      console.error('Error loading existing onboarding data:', error)
      setDataLoaded(true)
    }
  }, [user, router]);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/signin')
      return
    }

    // Load existing onboarding data ONCE when user is authenticated
    if (user && !loading && !loadedOnce.current) {
      loadedOnce.current = true
      loadExistingData()
      
      // Track onboarding start
      trackEvent(POSTHOG_EVENTS.ONBOARDING_STARTED, {
        user_id: user.id,
        email: user.email
      })
    }
  }, [user, loading, router, loadExistingData]);

  const handleStepComplete = async (stepData: any) => {
    const updatedData = { ...onboardingData, ...stepData }
    setOnboardingData(updatedData)

    if (currentStep === 1) {
      // Save step 1 data and move to step 2
      try {
        await supabase
          .from('profiles')
          .update({
            company_name: updatedData.company_name,
            team_size: updatedData.team_size,
            business_focus: updatedData.business_focus,
            onboarding_step: 1 // Mark step 1 as COMPLETED
          })
          .eq('id', user?.id)
        
        setCurrentStep(2)
      } catch (error) {
        console.error('Error saving onboarding data:', error)
      }
    } else if (currentStep === 2) {
      // Save step 2 data and proceed based on upload method
      try {
        await supabase
          .from('profiles')
          .update({
            upload_method: updatedData.upload_method,
            onboarding_step: 2 // Mark step 2 as COMPLETED
          })
          .eq('id', user?.id)
        
        // Check upload method to determine next flow
        if (updatedData.upload_method === 'bulk') {
          setCurrentStep(3) // Go to Step 3A (bulk upload)
          setCurrentSubStep(1) // Start with file upload
        } else if (updatedData.upload_method === 'individual') {
          // Skip bulk upload and go to Step 3B (individual upload)
          setCurrentStep(3)
        } else if (updatedData.upload_method === 'fresh') {
          // Skip to fresh start preview
          setCurrentStep(3)
        }
      } catch (error) {
        console.error('Error saving onboarding data:', error)
      }
    }
  }

  const handleStepBack = () => {
    if (currentStep === 3 && currentSubStep > 1) {
      // Handle sub-step navigation within Step 3A
      setCurrentSubStep(currentSubStep - 1)
    } else if (currentStep > 1) {
      // Go back to previous main step
      setCurrentStep(currentStep - 1)
      setCurrentSubStep(1) // Reset sub-step
    }
  }

  const handleSkip = async () => {
    try {
      // Instead of completing onboarding, go to notification setup
      setCurrentStep(4)
    } catch (error) {
      console.error('Error skipping to notifications:', error)
    }
  }

  // Step 3A handlers
  const handleFileUploadComplete = (fileData: any) => {
    setBulkUploadData(prev => ({ ...prev, fileData }))
    // Persist to localStorage for recovery
    localStorage.setItem('onboarding_bulk_data', JSON.stringify({ 
      fileData, 
      step: 3, 
      subStep: 2,
      userId: user?.id 
    }))
    setCurrentSubStep(2) // Move to column mapping
  }

  const handleColumnMappingComplete = (mappings: any[]) => {
    setBulkUploadData(prev => ({ ...prev, mappings }))
    // Update localStorage
    const existingData = localStorage.getItem('onboarding_bulk_data')
    if (existingData) {
      const parsed = JSON.parse(existingData)
      localStorage.setItem('onboarding_bulk_data', JSON.stringify({
        ...parsed,
        mappings,
        subStep: 3
      }))
    }
    setCurrentSubStep(3) // Move to data preview
  }

  const handleImportComplete = async () => {
    try {
      // Mark bulk upload as complete
      setBulkUploadData(prev => ({ ...prev, uploadComplete: true }))
      
      // Update onboarding progress
      await supabase
        .from('profiles')
        .update({
          onboarding_step: 3, // Mark step 3 as COMPLETED
          onboarding_completed: true,
          onboarding_completed_at: new Date().toISOString()
        })
        .eq('id', user?.id)
      
      // Clear localStorage data
      localStorage.removeItem('onboarding_bulk_data')
      
      // Redirect to dashboard
      router.push('/DashboardV2')
    } catch (error) {
      console.error('Error completing import:', error)
    }
  }

  // Step 3B: Individual Upload handler
  const handleIndividualUploadComplete = async (data: any) => {
    try {
      // Create employee and certification records directly in the database
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) throw new Error('User not authenticated')

      // 1. Create or update employee
      const { data: employee, error: employeeError } = await supabase
        .from('employees')
        .upsert({
          name: data.data.employeeName,
          email: data.data.employeeEmail,
          user_id: user.id
        }, { 
          onConflict: 'email,user_id' 
        })
        .select('id')
        .single()

      if (employeeError) throw employeeError

      // 2. Create certification
      const { error: certError } = await supabase
        .from('certifications')
        .insert({
          employee_id: employee.id,
          employee_name: data.data.employeeName,
          certification_name: data.data.certificationName,
          issue_date: data.data.issueDate || null,
          expiration_date: data.data.expirationDate,
          status: 'active',
          priority: calculatePriority(data.data.expirationDate),
          user_id: user.id,
          file_url: '', // No file for manual entry
          file_name: '',
          file_size: 0
        })

      if (certError) throw certError

      // Mark onboarding as complete
      await supabase
        .from('profiles')
        .update({
          onboarding_step: 3,
          onboarding_completed: true,
          onboarding_completed_at: new Date().toISOString()
        })
        .eq('id', user.id)

      router.push('/DashboardV2')
    } catch (error) {
      console.error('Error saving individual certification:', error)
      throw error
    }
  }

  // Step 3C: Fresh Start handler
  const handleFreshStartComplete = async () => {
    try {
      // Mark onboarding as complete and redirect to dashboard
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) throw new Error('User not authenticated')

      await supabase
        .from('profiles')
        .update({
          onboarding_step: 3,
          onboarding_completed: true,
          onboarding_completed_at: new Date().toISOString()
        })
        .eq('id', user.id)

      router.push('/DashboardV2')
    } catch (error) {
      console.error('Error completing fresh start:', error)
    }
  }

  // Step 4: Go to success screen handler
  const handleNotificationComplete = async () => {
    try {
      // Mark step 4 as completed and move to success screen
      await supabase
        .from('profiles')
        .update({
          onboarding_step: 4 // Mark step 4 as COMPLETED
        })
        .eq('id', user?.id)
      
      setCurrentStep(5) // Go to success screen
    } catch (error) {
      console.error('Error completing notification setup:', error)
      setCurrentStep(5) // Still proceed to success screen
    }
  }

  // Step 5: Final completion handler
  const handleFinalComplete = async () => {
    try {
      // Track onboarding completion
      trackEvent(POSTHOG_EVENTS.ONBOARDING_COMPLETED, {
        user_id: user?.id,
        upload_method: onboardingData.upload_method,
        team_size: onboardingData.team_size,
        business_focus: onboardingData.business_focus
      })
      
      // Show success toast
      toast({
        title: "🎉 Onboarding Complete!",
        description: "Your certification tracking system is ready to use.",
        duration: 5000,
      })
      
      // Redirect to dashboard
      router.push('/DashboardV2')
    } catch (error) {
      console.error('Error completing onboarding:', error)
      router.push('/DashboardV2') // Still redirect even if there's an error
    }
  }

  // Helper function to calculate priority
  const calculatePriority = (expirationDate: string): 'low' | 'medium' | 'high' => {
    const expDate = new Date(expirationDate)
    const today = new Date()
    const diffTime = expDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays <= 30) return 'high'
    if (diffDays <= 90) return 'medium'
    return 'low'
  }

  // Show loading until data is loaded
  if (loading || !user || !dataLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center animate-spin">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      {currentStep === 1 && (
        <WelcomeStep 
          onComplete={handleStepComplete}
          onSkip={handleSkip}
          initialData={onboardingData}
        />
      )}
      
      {currentStep === 2 && (
        <UploadMethodStep
          onComplete={handleStepComplete}
          onBack={handleStepBack}
          onSkip={handleSkip}
          teamSize={onboardingData.team_size}
          initialMethod={onboardingData.upload_method}
        />
      )}

      {/* Step 3A: Bulk Upload Flow */}
      {currentStep === 3 && onboardingData.upload_method === 'bulk' && currentSubStep === 1 && (
        <FileUploadStep
          onComplete={handleFileUploadComplete}
          onBack={handleStepBack}
          onSkip={handleSkip}
        />
      )}

      {currentStep === 3 && onboardingData.upload_method === 'bulk' && currentSubStep === 2 && bulkUploadData.fileData && (
        <ColumnMappingStep
          fileData={bulkUploadData.fileData}
          onComplete={handleColumnMappingComplete}
          onBack={handleStepBack}
        />
      )}

      {currentStep === 3 && onboardingData.upload_method === 'bulk' && currentSubStep === 3 && bulkUploadData.fileData && bulkUploadData.mappings.length > 0 && (
        <DataPreviewStep
          fileData={bulkUploadData.fileData}
          mappings={bulkUploadData.mappings}
          onComplete={handleImportComplete}
          onBack={handleStepBack}
        />
      )}

      {/* Step 3B: Individual Upload Flow */}
      {currentStep === 3 && onboardingData.upload_method === 'individual' && (
        <IndividualUploadStep
          onComplete={handleIndividualUploadComplete}
          onBack={handleStepBack}
          onSkip={handleSkip}
        />
      )}

      {/* Step 3C: Fresh Start Flow */}
      {currentStep === 3 && onboardingData.upload_method === 'fresh' && (
        <FreshStartStep
          onComplete={handleFreshStartComplete}
          onBack={handleStepBack}
          onSkip={handleFreshStartComplete}
        />
      )}

      {/* Step 4: Notification Setup */}
      {currentStep === 4 && (
        <NotificationSetupStep
          onComplete={handleNotificationComplete}
          onBack={handleStepBack}
          onSkip={handleNotificationComplete}
        />
      )}

      {/* Step 5: Success Screen */}
      {currentStep === 5 && (
        <SuccessStep
          onComplete={handleFinalComplete}
        />
      )}
    </div>
  )
} 