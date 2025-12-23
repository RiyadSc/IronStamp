import { supabase } from './supabase'
import { User } from '@supabase/supabase-js'

// Enhanced user authentication with better error handling
async function getCurrentUser(): Promise<User | null> {
  try {
    // First try to get the current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error('Session error in data service:', sessionError)
      return null
    }
    
    if (!session?.user) {
      console.warn('No authenticated user found in data service')
      return null
    }
    
    // Verify the session is still valid
    const now = Math.floor(Date.now() / 1000)
    const expiresAt = session.expires_at || 0
    
    if (expiresAt <= now) {
      console.warn('Session expired in data service')
      // Try to refresh the session
      const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession()
      
      if (refreshError || !refreshedSession?.user) {
        console.error('Session refresh failed in data service:', refreshError)
        return null
      }
      
      console.log('Session refreshed successfully in data service')
      return refreshedSession.user
    }
    
    return session.user
  } catch (error) {
    console.error('Error getting current user in data service:', error)
    return null
  }
}

export interface DashboardStats {
  totalEmployees: number
  activeCertifications: number
  expiredCertifications: number
  expiringSoon: number
}

export interface ExpirationItem {
  id: string
  employee: string
  certification: string
  expirationDate: string
  daysLeft: number
  status: 'critical' | 'warning' | 'expired'
  priority: 'low' | 'medium' | 'high'
}

export interface CertificationDetails {
  id: string
  employee: string
  type: string
  issueDate: string
  expirationDate: string
  status: string
  daysLeft: number
  priority?: 'low' | 'medium' | 'high'
  notes?: string
}

export interface TeamMember {
  id: string
  name: string
  email: string
  phone: string
  role: string
  status: string
  created_at: string
  certificationsCount: number
}

export interface ReminderData {
  id: string
  employee: string
  certification: string
  dueDate: string
  daysUntil: number
  reminderType: string
  status: string
}

export interface PriorityItem {
  id: string
  type: 'expiring' | 'expired' | 'missing'
  employee: string
  certification: string
  daysLeft?: number
  priority: 'high' | 'medium' | 'low'
  expirationDate: string
}

export interface Notification {
  id: string
  type: 'urgent' | 'warning' | 'success' | 'info'
  title: string
  message: string
  time: string
  read: boolean
  createdAt: string
}

export interface EmployeeCertificationSummary {
  employeeId: string
  employeeName: string
  employeeEmail: string
  totalCertifications: number
  activeCertifications: number
  expiringSoonCertifications: number
  expiredCertifications: number
  certifications: CertificationDetails[]
}

export interface UserProfile {
  companyName: string | null
  teamSize: string | null
  businessFocus: string | null
  onboardingCompleted: boolean
  userEmail: string | null
}

export interface ActivityLog {
  id: string
  action: string
  details: {
    employee_name?: string
    certification_type?: string
    certification_id?: string
    file_name?: string
    notification_type?: string
    [key: string]: any
  }
  createdAt: string
}

// Calculate days between dates
const calculateDaysBetween = (date1: string, date2?: string): number => {
  const targetDate = new Date(date1)
  const compareDate = date2 ? new Date(date2) : new Date()
  const timeDiff = targetDate.getTime() - compareDate.getTime()
  return Math.ceil(timeDiff / (1000 * 60 * 60 * 24))
}

// Determine status based on days left
const getStatus = (daysLeft: number): 'critical' | 'warning' | 'expired' => {
  if (daysLeft < 0) return 'expired'
  if (daysLeft <= 7) return 'critical'
  if (daysLeft <= 30) return 'warning'
  return 'warning'
}

// Get dashboard statistics
export async function getDashboardStats(userId?: string): Promise<DashboardStats> {
  try {
    let user: any = null;
    
    if (userId) {
      // Server-side usage with explicit userId
      user = { id: userId };
    } else {
      // Client-side usage
      user = await getCurrentUser();
    }
    
    // Return empty stats if not authenticated
    if (!user) {
      return {
        totalEmployees: 0,
        activeCertifications: 0,
        expiredCertifications: 0,
        expiringSoon: 0
      }
    }

    // Get total employees
    const { count: employeeCount } = await supabase
      .from('employees')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)

    // Get total certifications
    const { count: totalCerts } = await supabase
      .from('certifications')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .neq('status', 'suspended')

    // Get expired certifications
    const today = new Date().toISOString().split('T')[0]
    const { count: expiredCount } = await supabase
      .from('certifications')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .neq('status', 'suspended')
      .lt('expiration_date', today)

    // Get expiring soon (next 30 days)
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
    const { count: expiringSoonCount } = await supabase
      .from('certifications')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .neq('status', 'suspended')
      .gte('expiration_date', today)
      .lte('expiration_date', thirtyDaysFromNow.toISOString().split('T')[0])

    const activeCerts = (totalCerts || 0) - (expiredCount || 0)

    return {
      totalEmployees: employeeCount || 0,
      activeCertifications: activeCerts,
      expiredCertifications: expiredCount || 0,
      expiringSoon: expiringSoonCount || 0
    }
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return {
      totalEmployees: 0,
      activeCertifications: 0,
      expiredCertifications: 0,
      expiringSoon: 0
    }
  }
}

// Get expiring certifications for dashboard table
export async function getExpiringCertifications(_limit: number = 10, userId?: string): Promise<ExpirationItem[]> {
  try {
    let user: any = null;
    
    if (userId) {
      // Server-side usage with explicit userId
      user = { id: userId };
    } else {
      // Client-side usage
      user = await getCurrentUser();
    }
    
    // Return empty array if not authenticated
    if (!user) {
      return []
    }

    // Get certifications expiring in the next 60 days or already expired
    const sixtyDaysFromNow = new Date()
    sixtyDaysFromNow.setDate(sixtyDaysFromNow.getDate() + 60)

    const { data, error } = await supabase
      .from('certifications')
      .select('id, employee_name, certification_name, expiration_date, priority')
      .eq('user_id', user.id)
      .neq('status', 'suspended')
      .lte('expiration_date', sixtyDaysFromNow.toISOString().split('T')[0])
      .order('expiration_date', { ascending: true })

    if (error) throw error

    return (data || []).map(cert => {
      const daysLeft = calculateDaysBetween(cert.expiration_date)
      return {
        id: cert.id,
        employee: cert.employee_name,
        certification: cert.certification_name,
        expirationDate: cert.expiration_date,
        daysLeft,
        status: getStatus(daysLeft),
        priority: cert.priority || 'medium'
      }
    })
  } catch (error) {
    console.error('Error fetching expiring certifications:', error)
    return []
  }
}

// Get all certifications for certifications page
export async function getAllCertifications(): Promise<CertificationDetails[]> {
  try {
    const user = await getCurrentUser()
    
    // Return empty array if not authenticated
    if (!user) {
      return []
    }

    const { data, error } = await supabase
      .from('certifications')
      .select('id, employee_name, certification_name, issue_date, expiration_date, priority, notes')
      .eq('user_id', user.id)
      .neq('status', 'suspended')
      .order('expiration_date', { ascending: true })

    if (error) throw error

    return (data || []).map(cert => {
      const daysLeft = calculateDaysBetween(cert.expiration_date)
      let status = 'Active'
      if (daysLeft < 0) status = 'Expired'
      else if (daysLeft <= 30) status = 'Expiring Soon'

      return {
        id: cert.id,
        employee: cert.employee_name,
        type: cert.certification_name,
        issueDate: cert.issue_date || '',
        expirationDate: cert.expiration_date,
        status,
        daysLeft,
        priority: cert.priority || 'medium',
        notes: cert.notes || undefined
      }
    })
  } catch (error) {
    console.error('Error fetching all certifications:', error)
    return []
  }
}

// Get team members with certification counts
export async function getTeamMembersWithCerts(): Promise<TeamMember[]> {
  try {
    const user = await getCurrentUser()
    
    // Return empty array if not authenticated
    if (!user) {
      return []
    }

    // Get employees and their certification counts in parallel
    const [employeesResult, certificationsResult] = await Promise.all([
      supabase
        .from('employees')
        .select('id, name, email, phone, role, status, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      
      supabase
        .from('certifications')
        .select('employee_name')
        .eq('user_id', user.id)
        .neq('status', 'suspended')
    ])

    if (employeesResult.error) throw employeesResult.error
    if (certificationsResult.error) throw certificationsResult.error

    // Create certification count map
    const certCountMap = new Map<string, number>()
    certificationsResult.data?.forEach(cert => {
      const name = cert.employee_name
      certCountMap.set(name, (certCountMap.get(name) || 0) + 1)
    })

    // Map employees with their certification counts
    const teamMembers: TeamMember[] = (employeesResult.data || []).map(employee => ({
      id: employee.id,
      name: employee.name,
      email: employee.email,
      phone: employee.phone || '',
      role: employee.role || 'Technician',
      status: employee.status || 'Active',
      created_at: employee.created_at || new Date().toISOString(),
      certificationsCount: certCountMap.get(employee.name) || 0
    }))

    return teamMembers
  } catch (error) {
    console.error('Error fetching team members:', error)
    return []
  }
}

// Archive team member (set status to archived, keep certifications active)
export async function archiveTeamMember(teamMemberId: string): Promise<void> {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      throw new Error('Authentication required')
    }

    // Update employee status to archived
    const { error: updateError } = await supabase
      .from('employees')
      .update({ 
        status: 'Archived'
      })
      .eq('id', teamMemberId)
      .eq('user_id', user.id)

    if (updateError) throw updateError

  } catch (error) {
    console.error('Error archiving team member:', error)
    throw error
  }
}

// Restore archived team member (set status back to active)
export async function restoreTeamMember(teamMemberId: string): Promise<void> {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      throw new Error('Authentication required')
    }

    // Update employee status back to active
    const { error: updateError } = await supabase
      .from('employees')
      .update({ 
        status: 'Active'
      })
      .eq('id', teamMemberId)
      .eq('user_id', user.id)

    if (updateError) throw updateError

  } catch (error) {
    console.error('Error restoring team member:', error)
    throw error
  }
}

// Delete team member and archive their certifications
export async function deleteTeamMember(teamMemberId: string): Promise<void> {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      throw new Error('Authentication required')
    }

    // First, get the team member to get their name
    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .select('name')
      .eq('id', teamMemberId)
      .eq('user_id', user.id)
      .single()

    if (employeeError) throw employeeError
    if (!employee) throw new Error('Employee not found')

    // Archive all certifications for this employee
    const { error: certArchiveError } = await supabase
      .from('certifications')
      .update({ 
        status: 'suspended'
      })
      .eq('employee_name', employee.name)
      .eq('user_id', user.id)

    if (certArchiveError) {
      console.error('Error archiving certifications:', certArchiveError)
      // Continue with employee deletion even if certification archiving fails
    }

    // Delete the employee record
    const { error: deleteError } = await supabase
      .from('employees')
      .delete()
      .eq('id', teamMemberId)
      .eq('user_id', user.id)

    if (deleteError) throw deleteError

  } catch (error) {
    console.error('Error deleting team member:', error)
    throw error
  }
}

// Get reminder data
export async function getReminderData(): Promise<ReminderData[]> {
  try {
    const user = await getCurrentUser()
    
    // Return empty array if not authenticated
    if (!user) {
      return []
    }

    // Get certifications that need reminders (expiring in next 90 days)
    const ninetyDaysFromNow = new Date()
    ninetyDaysFromNow.setDate(ninetyDaysFromNow.getDate() + 90)

    const { data, error } = await supabase
      .from('certifications')
      .select('id, employee_name, certification_name, expiration_date')
      .eq('user_id', user.id)
      .neq('status', 'suspended')
      .gte('expiration_date', new Date().toISOString().split('T')[0])
      .lte('expiration_date', ninetyDaysFromNow.toISOString().split('T')[0])
      .order('expiration_date', { ascending: true })

    if (error) throw error

    return (data || []).map(cert => {
      const daysUntil = calculateDaysBetween(cert.expiration_date)
      let status = 'Pending'
      if (daysUntil <= 7) status = 'Urgent'
      else if (daysUntil <= 30) status = 'Sent'

      return {
        id: cert.id,
        employee: cert.employee_name,
        certification: cert.certification_name,
        dueDate: cert.expiration_date,
        daysUntil,
        reminderType: 'Email + SMS',
        status
      }
    })
  } catch (error) {
    console.error('Error fetching reminder data:', error)
    return []
  }
}

// Get certification stats for certifications page
export async function getCertificationStats() {
  try {
    const user = await getCurrentUser()
    
    // Return empty stats if not authenticated
    if (!user) {
      return {
        total: 0,
        active: 0,
        expiringSoon: 0,
        expired: 0
      }
    }

    const today = new Date().toISOString().split('T')[0]
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)

    // Total certifications
    const { count: totalCount } = await supabase
      .from('certifications')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .neq('status', 'suspended')

    // Active certifications
    const { count: activeCount } = await supabase
      .from('certifications')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .neq('status', 'suspended')
      .gte('expiration_date', today)

    // Expiring soon
    const { count: expiringSoonCount } = await supabase
      .from('certifications')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .neq('status', 'suspended')
      .gte('expiration_date', today)
      .lte('expiration_date', thirtyDaysFromNow.toISOString().split('T')[0])

    // Expired
    const { count: expiredCount } = await supabase
      .from('certifications')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .neq('status', 'suspended')
      .lt('expiration_date', today)

    return {
      total: totalCount || 0,
      active: activeCount || 0,
      expiringSoon: expiringSoonCount || 0,
      expired: expiredCount || 0
    }
  } catch (error) {
    console.error('Error fetching certification stats:', error)
    return {
      total: 0,
      active: 0,
      expiringSoon: 0,
      expired: 0
    }
  }
}

// Get priority actions (expired, expiring soon, missing certifications)
export async function getPriorityActions(userId?: string): Promise<PriorityItem[]> {
  try {
    let user: any = null;
    
    if (userId) {
      // Server-side usage with explicit userId
      user = { id: userId };
    } else {
      // Client-side usage
      user = await getCurrentUser();
    }
    
    // Return empty array if not authenticated
    if (!user) {
      return []
    }

    const _today = new Date().toISOString().split('T')[0]
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)

    // Get expired and expiring certifications
    const { data: certifications, error } = await supabase
      .from('certifications')
      .select('id, employee_name, certification_name, expiration_date')
      .eq('user_id', user.id)
      .neq('status', 'suspended')
      .lte('expiration_date', thirtyDaysFromNow.toISOString().split('T')[0])
      .order('expiration_date', { ascending: true })

    if (error) throw error

    const priorityItems: PriorityItem[] = []

    // Process certifications
    certifications?.forEach(cert => {
      const daysLeft = calculateDaysBetween(cert.expiration_date)
      
      let type: 'expiring' | 'expired' = 'expiring'
      let priority: 'high' | 'medium' | 'low' = 'low'
      
      if (daysLeft < 0) {
        type = 'expired'
        priority = 'high'
      } else if (daysLeft <= 7) {
        type = 'expiring'
        priority = 'high'
      } else if (daysLeft <= 30) {
        type = 'expiring'
        priority = 'medium'
      }
      
      // Only include high and medium priority items
      if (priority === 'high' || priority === 'medium') {
        priorityItems.push({
          id: cert.id,
          type,
          employee: cert.employee_name,
          certification: cert.certification_name,
          daysLeft: daysLeft >= 0 ? daysLeft : undefined,
          priority,
          expirationDate: cert.expiration_date
        })
      }
    })

    // Sort by priority (high first) then by days left
    priorityItems.sort((a, b) => {
      if (a.priority === 'high' && b.priority === 'medium') return -1
      if (a.priority === 'medium' && b.priority === 'high') return 1
      
      // If same priority, sort by days left (expired first, then closest to expiry)
      const aDays = a.daysLeft ?? -999
      const bDays = b.daysLeft ?? -999
      return aDays - bDays
    })

    return priorityItems

  } catch (error) {
    console.error('Error fetching priority actions:', error)
    return []
  }
}

// Get notifications based on certification data
export async function getNotifications(): Promise<Notification[]> {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return []
    }

    const notifications: Notification[] = []
    
    // Get expired certifications
    const today = new Date().toISOString().split('T')[0]
    const { data: expiredCerts } = await supabase
      .from('certifications')
      .select('id, employee_name, certification_name, expiration_date')
      .eq('user_id', user.id)
      .neq('status', 'suspended')
      .lt('expiration_date', today)
      .order('expiration_date', { ascending: false })
      .limit(10)

    // Get expiring soon certifications (next 7 days)
    const sevenDaysFromNow = new Date()
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)
    const { data: expiringSoonCerts } = await supabase
      .from('certifications')
      .select('id, employee_name, certification_name, expiration_date')
      .eq('user_id', user.id)
      .neq('status', 'suspended')
      .gte('expiration_date', today)
      .lte('expiration_date', sevenDaysFromNow.toISOString().split('T')[0])
      .order('expiration_date', { ascending: true })
      .limit(10)

    // Get recently added certifications (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const { data: recentCerts } = await supabase
      .from('certifications')
      .select('id, employee_name, certification_name, created_at')
      .eq('user_id', user.id)
      .neq('status', 'suspended')
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(5)

    // Generate notifications for expired certifications
    expiredCerts?.forEach(cert => {
      const daysAgo = Math.abs(calculateDaysBetween(cert.expiration_date))
      notifications.push({
        id: `expired-${cert.id}`,
        type: 'urgent',
        title: 'Certification Expired',
        message: `${cert.employee_name}'s ${cert.certification_name} expired ${daysAgo} days ago`,
        time: `${daysAgo} days ago`,
        read: false,
        createdAt: cert.expiration_date
      })
    })

    // Generate notifications for expiring soon certifications
    expiringSoonCerts?.forEach(cert => {
      const daysLeft = calculateDaysBetween(cert.expiration_date)
      notifications.push({
        id: `expiring-${cert.id}`,
        type: 'warning',
        title: 'Expiring Soon',
        message: `${cert.employee_name}'s ${cert.certification_name} expires in ${daysLeft} days`,
        time: `${Math.abs(daysLeft - 7)} days ago`,
        read: false,
        createdAt: new Date(Date.now() - (Math.abs(daysLeft - 7) * 24 * 60 * 60 * 1000)).toISOString()
      })
    })

    // Generate notifications for recently added certifications
    recentCerts?.forEach(cert => {
      const hoursAgo = Math.floor((Date.now() - new Date(cert.created_at).getTime()) / (1000 * 60 * 60))
      const timeText = hoursAgo < 24 ? `${hoursAgo} hours ago` : `${Math.floor(hoursAgo / 24)} days ago`
      
      notifications.push({
        id: `new-${cert.id}`,
        type: 'success',
        title: 'Certification Updated',
        message: `${cert.employee_name} uploaded new ${cert.certification_name} certification`,
        time: timeText,
        read: true,
        createdAt: cert.created_at
      })
    })

    // Add a monthly reminder notification
    const lastMonth = new Date()
    lastMonth.setDate(lastMonth.getDate() - 30)
    notifications.push({
      id: 'reminder-monthly',
      type: 'info',
      title: 'Team Reminder Sent',
      message: 'Monthly certification reminder sent to all team members',
      time: '2 days ago',
      read: true,
      createdAt: new Date(Date.now() - (2 * 24 * 60 * 60 * 1000)).toISOString()
    })

    // Sort by creation date (newest first) and return
    return notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  } catch (error) {
    console.error('Error fetching notifications:', error)
    return []
  }
}

// Get employee-centric certification data
export async function getEmployeeCertificationSummary(userId?: string): Promise<EmployeeCertificationSummary[]> {
  try {
    let user: any = null;
    
    if (userId) {
      // Server-side usage with explicit userId
      user = { id: userId };
    } else {
      // Client-side usage
      user = await getCurrentUser();
    }
    
    if (!user) {
      return []
    }

    // Get all certifications for the user
    const { data: certifications, error } = await supabase
      .from('certifications')
      .select('id, employee_name, certification_name, issue_date, expiration_date, priority, notes')
      .eq('user_id', user.id)
      .neq('status', 'suspended')
      .order('employee_name', { ascending: true })

    if (error) throw error

    if (!certifications) return []

    // Process certifications and group by employee
    const employeeMap = new Map<string, EmployeeCertificationSummary>()

    certifications.forEach(cert => {
      const daysLeft = calculateDaysBetween(cert.expiration_date)
      let status = 'Active'
      if (daysLeft < 0) status = 'Expired'
      else if (daysLeft <= 30) status = 'Expiring Soon'
      
      const certDetail: CertificationDetails = {
        id: cert.id,
        employee: cert.employee_name,
        type: cert.certification_name,
        issueDate: cert.issue_date || '',
        expirationDate: cert.expiration_date,
        status,
        daysLeft,
        priority: cert.priority || 'medium',
        notes: cert.notes || undefined
      }

      const employeeKey = cert.employee_name || 'Unknown Employee'
      
      if (!employeeMap.has(employeeKey)) {
        employeeMap.set(employeeKey, {
          employeeId: employeeKey, // Use employee name as stable ID
          employeeName: cert.employee_name || 'Unknown Employee',
          employeeEmail: '', // Email not stored in certifications table
          totalCertifications: 0,
          activeCertifications: 0,
          expiringSoonCertifications: 0,
          expiredCertifications: 0,
          certifications: []
        })
      }

      const employee = employeeMap.get(employeeKey)!
      employee.certifications.push(certDetail)
      employee.totalCertifications++

      // Count by status
      if (certDetail.status === 'Active') {
        employee.activeCertifications++
      } else if (certDetail.status === 'Expiring Soon') {
        employee.expiringSoonCertifications++
      } else if (certDetail.status === 'Expired') {
        employee.expiredCertifications++
      }
    })

    // Convert map to array and sort certifications within each employee
    const result = Array.from(employeeMap.values()).map(employee => ({
      ...employee,
      certifications: employee.certifications.sort((a, b) => {
        // Sort by status priority (expired first, then expiring soon, then active)
        const statusPriority = { 'Expired': 0, 'Expiring Soon': 1, 'Active': 2 }
        const aPriority = statusPriority[a.status as keyof typeof statusPriority] ?? 3
        const bPriority = statusPriority[b.status as keyof typeof statusPriority] ?? 3
        
        if (aPriority !== bPriority) {
          return aPriority - bPriority
        }
        
        // If same status, sort by days left (ascending)
        return a.daysLeft - b.daysLeft
      })
    }))

    return result

  } catch (error) {
    console.error('Error fetching employee certification summary:', error)
    return []
  }
}

// Get user profile data for dashboard display
export async function getUserProfile(): Promise<UserProfile> {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return {
        companyName: null,
        teamSize: null,
        businessFocus: null,
        onboardingCompleted: false,
        userEmail: null
      }
    }

    // Get user profile from profiles table
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('company_name, team_size, business_focus, onboarding_completed')
      .eq('id', user.id)
      .single()

    if (error) {
      console.error('Error fetching user profile:', error)
      // Return basic info with user email as fallback
      return {
        companyName: null,
        teamSize: null,
        businessFocus: null,
        onboardingCompleted: false,
        userEmail: user.email || null
      }
    }

    return {
      companyName: profile?.company_name || null,
      teamSize: profile?.team_size || null,
      businessFocus: profile?.business_focus || null,
      onboardingCompleted: profile?.onboarding_completed || false,
      userEmail: user.email || null
    }

  } catch (error) {
    console.error('Error getting user profile:', error)
    return {
      companyName: null,
      teamSize: null,
      businessFocus: null,
      onboardingCompleted: false,
      userEmail: null
    }
  }
}

// Get recent activity logs for dashboard
export async function getRecentActivity(limit: number = 5): Promise<ActivityLog[]> {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return []
    }

    const { data, error } = await supabase
      .from('activity_logs')
      .select('id, action, details, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching activity logs:', error)
      return []
    }

    return (data || []).map(log => ({
      id: log.id,
      action: log.action,
      details: log.details || {},
      createdAt: log.created_at
    }))

  } catch (error) {
    console.error('Error getting recent activity:', error)
    return []
  }
}

// Log an activity (helper function for client-side logging)
export async function logActivity(
  action: string, 
  details: Record<string, any>
): Promise<boolean> {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return false
    }

    const { error } = await supabase
      .from('activity_logs')
      .insert({
        user_id: user.id,
        action,
        details,
        created_at: new Date().toISOString()
      })

    if (error) {
      console.error('Error logging activity:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error in logActivity:', error)
    return false
  }
} 