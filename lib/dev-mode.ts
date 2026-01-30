/**
 * Development Mode Configuration
 * 
 * This module provides a dev mode that bypasses authentication
 * and provides mock data for local development.
 * 
 * IMPORTANT: This only works when NODE_ENV === 'development'
 * 
 * To enable dev mode, set NEXT_PUBLIC_DEV_MODE_ENABLED=true in your .env.local
 */

// Dev mode is ONLY available in development environment
export const isDevModeAvailable = process.env.NODE_ENV === 'development'

// Dev mode must be explicitly enabled via environment variable
export const isDevModeEnabled = 
  isDevModeAvailable && 
  process.env.NEXT_PUBLIC_DEV_MODE_ENABLED === 'true'

// Mock user for dev mode
export const DEV_MODE_USER = {
  id: 'dev-user-00000000-0000-0000-0000-000000000000',
  email: 'dev@localhost.test',
  app_metadata: {
    provider: 'email'
  },
  user_metadata: {
    full_name: 'Dev User'
  },
  aud: 'authenticated',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  role: 'authenticated',
}

// Mock session for dev mode
export const DEV_MODE_SESSION = {
  access_token: 'dev-access-token',
  refresh_token: 'dev-refresh-token',
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  token_type: 'bearer',
  user: DEV_MODE_USER,
}

// Mock user profile for dev mode
export const DEV_MODE_PROFILE = {
  companyName: 'Dev Company Inc.',
  teamSize: '15',
  businessFocus: 'HVAC',
  onboardingCompleted: true,
  userEmail: 'dev@localhost.test'
}

// Mock dashboard stats for dev mode
export const DEV_MODE_STATS = {
  totalEmployees: 8,
  activeCertifications: 24,
  expiredCertifications: 3,
  expiringSoon: 5
}

// Mock expiring certifications for dev mode
export const DEV_MODE_EXPIRING_CERTS = [
  {
    id: 'dev-cert-1',
    employee: 'John Smith',
    certification: 'EPA 608 Universal',
    expirationDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    daysLeft: -30,
    status: 'expired' as const,
    priority: 'high' as const
  },
  {
    id: 'dev-cert-2',
    employee: 'Mike Johnson',
    certification: 'OSHA 30-Hour',
    expirationDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    daysLeft: -5,
    status: 'expired' as const,
    priority: 'high' as const
  },
  {
    id: 'dev-cert-3',
    employee: 'Sarah Davis',
    certification: 'NATE Core',
    expirationDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    daysLeft: 7,
    status: 'critical' as const,
    priority: 'high' as const
  },
  {
    id: 'dev-cert-4',
    employee: 'Tom Wilson',
    certification: 'First Aid/CPR',
    expirationDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    daysLeft: 15,
    status: 'warning' as const,
    priority: 'medium' as const
  },
  {
    id: 'dev-cert-5',
    employee: 'Emily Brown',
    certification: 'EPA 608 Type II',
    expirationDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    daysLeft: 25,
    status: 'warning' as const,
    priority: 'medium' as const
  },
  {
    id: 'dev-cert-6',
    employee: 'Chris Martinez',
    certification: 'EPA 608 Universal',
    expirationDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    daysLeft: 60,
    status: 'warning' as const,
    priority: 'low' as const
  }
]

// Mock team members for dev mode
export const DEV_MODE_TEAM_MEMBERS = [
  {
    id: 'dev-member-1',
    name: 'John Smith',
    email: 'john.smith@devcompany.test',
    phone: '(555) 123-4567',
    role: 'Senior Technician',
    status: 'active',
    created_at: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
    certificationsCount: 5
  },
  {
    id: 'dev-member-2',
    name: 'Mike Johnson',
    email: 'mike.johnson@devcompany.test',
    phone: '(555) 234-5678',
    role: 'Lead Installer',
    status: 'active',
    created_at: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString(),
    certificationsCount: 4
  },
  {
    id: 'dev-member-3',
    name: 'Sarah Davis',
    email: 'sarah.davis@devcompany.test',
    phone: '(555) 345-6789',
    role: 'Technician',
    status: 'active',
    created_at: new Date(Date.now() - 150 * 24 * 60 * 60 * 1000).toISOString(),
    certificationsCount: 3
  },
  {
    id: 'dev-member-4',
    name: 'Tom Wilson',
    email: 'tom.wilson@devcompany.test',
    phone: '(555) 456-7890',
    role: 'Apprentice',
    status: 'active',
    created_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    certificationsCount: 2
  },
  {
    id: 'dev-member-5',
    name: 'Emily Brown',
    email: 'emily.brown@devcompany.test',
    phone: '(555) 567-8901',
    role: 'Technician',
    status: 'active',
    created_at: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
    certificationsCount: 4
  },
  {
    id: 'dev-member-6',
    name: 'Chris Martinez',
    email: 'chris.martinez@devcompany.test',
    phone: '(555) 678-9012',
    role: 'Senior Technician',
    status: 'active',
    created_at: new Date(Date.now() - 300 * 24 * 60 * 60 * 1000).toISOString(),
    certificationsCount: 6
  }
]

// Mock activity log for dev mode
export const DEV_MODE_ACTIVITY = [
  {
    id: 'dev-activity-1',
    action: 'upload_certification',
    details: {
      employee_name: 'John Smith',
      file_name: 'EPA_608_Universal.pdf'
    },
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'dev-activity-2',
    action: 'send_notification',
    details: {
      employee_name: 'Mike Johnson',
      certification_type: 'OSHA 30-Hour'
    },
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'dev-activity-3',
    action: 'create_employee',
    details: {
      employee_name: 'Tom Wilson'
    },
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'dev-activity-4',
    action: 'generate_report',
    details: {
      employee_name: 'Admin',
      certification_type: 'Team Certification Report'
    },
    createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()
  }
]

// Log dev mode status on import (only in development)
if (isDevModeAvailable) {
  if (isDevModeEnabled) {
    console.log('🔧 DEV MODE ENABLED - Authentication bypassed')
    console.log('🔧 To disable, set NEXT_PUBLIC_DEV_MODE_ENABLED=false in .env.local')
  } else {
    console.log('💡 Dev mode available but not enabled')
    console.log('💡 To enable, set NEXT_PUBLIC_DEV_MODE_ENABLED=true in .env.local')
  }
}
