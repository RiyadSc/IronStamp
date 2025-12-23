import { supabase } from './supabase'

/**
 * Session Recovery Utilities
 * Helps restore user data when authentication is recovered
 */

export interface SessionRecoveryStatus {
  success: boolean
  userRestored: boolean
  dataAvailable: boolean
  error?: string
}

/**
 * Check if user session is valid and data is accessible
 */
export async function checkSessionHealth(): Promise<SessionRecoveryStatus> {
  try {
    // Check if we have a valid session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      return {
        success: false,
        userRestored: false,
        dataAvailable: false,
        error: `Session error: ${sessionError.message}`
      }
    }

    if (!session?.user) {
      return {
        success: false,
        userRestored: false,
        dataAvailable: false,
        error: 'No authenticated user found'
      }
    }

    // Check if we can access user data
    const { count: _count, error: dataError } = await supabase
      .from('certifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', session.user.id)

    if (dataError) {
      return {
        success: false,
        userRestored: true,
        dataAvailable: false,
        error: `Data access error: ${dataError.message}`
      }
    }

    return {
      success: true,
      userRestored: true,
      dataAvailable: true,
      error: undefined
    }

  } catch (error) {
    return {
      success: false,
      userRestored: false,
      dataAvailable: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Refresh session and attempt to restore data access
 */
export async function recoverSession(): Promise<SessionRecoveryStatus> {
  try {
    // First try to refresh the session
    const { data: { session }, error: refreshError } = await supabase.auth.refreshSession()
    
    if (refreshError || !session) {
      return {
        success: false,
        userRestored: false,
        dataAvailable: false,
        error: refreshError?.message || 'Session refresh failed'
      }
    }

    // Check if data is now accessible
    return await checkSessionHealth()

  } catch (error) {
    return {
      success: false,
      userRestored: false,
      dataAvailable: false,
      error: error instanceof Error ? error.message : 'Recovery failed'
    }
  }
}

/**
 * Clear any cached data to force fresh load
 */
export function clearLocalCache(): void {
  try {
    // Clear any localStorage items that might cache user data
    const keysToRemove = [
      'supabase.auth.token',
      'cert-keeper-auth',
      'onboarding_bulk_data'
    ]

    keysToRemove.forEach(key => {
      localStorage.removeItem(key)
    })

    // Clear any sessionStorage items
    sessionStorage.clear()

    console.log('Local cache cleared successfully')
  } catch (error) {
    console.error('Error clearing local cache:', error)
  }
}

/**
 * Get current user ID if available
 */
export async function getCurrentUserId(): Promise<string | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.user?.id || null
  } catch (error) {
    console.error('Error getting current user ID:', error)
    return null
  }
}

/**
 * Get basic user statistics to verify data access
 */
export async function getUserDataSummary() {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return { error: 'No authenticated user' }
    }

    // Get counts of user data
    const [employeesResult, certificationsResult, profileResult] = await Promise.all([
      supabase
        .from('employees')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId),
      
      supabase
        .from('certifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId),
      
      supabase
        .from('profiles')
        .select('company_name, onboarding_completed')
        .eq('id', userId)
        .single()
    ])

    return {
      userId,
      employees: employeesResult.count || 0,
      certifications: certificationsResult.count || 0,
      companyName: profileResult.data?.company_name || 'Unknown',
      onboardingCompleted: profileResult.data?.onboarding_completed || false,
      error: null
    }

  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Failed to get user data summary'
    }
  }
} 