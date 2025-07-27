import type { AppProps } from 'next/app'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { initToolbar } from '@stagewise/toolbar'
import reactPlugin from '@stagewise-plugins/react'
import { AuthChecker } from '@/components/AuthChecker'
import { useRouter } from 'next/router'
import { Analytics } from '@vercel/analytics/react'
import '../styles.css'
import { useEffect } from 'react'
import posthog from 'posthog-js'
import { PostHogProvider } from 'posthog-js/react'

const queryClient = new QueryClient()

const stagewiseConfig = { plugins: [reactPlugin] }
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  initToolbar(stagewiseConfig)
}

// Pages that don't require authentication
const publicPages = [
  '/',
  '/auth/signin',
  '/auth/signup',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/confirm',
  '/auth/callback',
  '/LandingPage',
  '/privacy-policy',
  '/terms-of-service',
  '/auth-debug',
  '/404'
]

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter()
  const isPublicPage = publicPages.includes(router.pathname)

  useEffect(() => {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
      api_host: 'https://us.posthog.com',
      ui_host: 'https://us.posthog.com',
      defaults: '2025-05-24',
      capture_exceptions: true, // This enables capturing exceptions using Error Tracking
      debug: process.env.NODE_ENV === 'development',
      loaded: (posthog) => {
        if (process.env.NODE_ENV === 'development') posthog.debug()
        // Set custom properties for the production app
        posthog.people.set({
          app_url: 'https://www.ironstamp.app/',
          app_name: 'IronStamp',
          app_version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0'
        })
      },
      // Track page views automatically
      capture_pageview: true,
      // Enable session recording
      capture_pageleave: true,
      // Track clicks and form submissions
      autocapture: true,
    })
  }, [])

  const AppContent = () => (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Component {...pageProps} />
        <Analytics />
      </TooltipProvider>
    </QueryClientProvider>
  )

  // Wrap content with PostHogProvider
  if (isPublicPage) {
    return (
      <PostHogProvider client={posthog}>
        <AppContent />
      </PostHogProvider>
    )
  }

  // For protected pages, wrap with AuthChecker
  return (
    <PostHogProvider client={posthog}>
      <AuthChecker>
        <AppContent />
      </AuthChecker>
    </PostHogProvider>
  )
}