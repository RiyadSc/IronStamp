import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabasePersistent = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storageKey: 'cert-keeper-auth',
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    flowType: 'pkce'
  },
  global: {
    headers: {
      'x-application-name': 'cert-keeper'
    }
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})

export const supabaseSession = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storageKey: 'cert-keeper-auth',
    storage: typeof window !== 'undefined' ? window.sessionStorage : undefined,
    flowType: 'pkce'
  },
  global: {
    headers: {
      'x-application-name': 'cert-keeper'
    }
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})

// Default export for most of the app
export const supabase = supabasePersistent 