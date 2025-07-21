import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Enhanced client configuration for production
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Enable automatic session refresh
    autoRefreshToken: true,
    
    // Persist session across browser tabs/windows
    persistSession: true,
    
    // Detect session changes from other tabs
    detectSessionInUrl: true,
    
    // Storage key for session persistence
    storageKey: 'cert-keeper-auth',
    
    // Use localStorage for better persistence
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    
    // Flow type for better security
    flowType: 'pkce'
  },
  
  // Global settings
  global: {
    headers: {
      'x-application-name': 'cert-keeper'
    }
  },
  
  // Realtime settings (optional)
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
}) 