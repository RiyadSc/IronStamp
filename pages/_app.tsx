import type { AppProps } from 'next/app'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { AuthChecker } from '@/components/AuthChecker'
import { useRouter } from 'next/router'
import { Analytics } from '@vercel/analytics/react'
import '../styles.css'
import { useEffect } from 'react'
import posthog from 'posthog-js'
import { PostHogProvider } from 'posthog-js/react'
import { isDevModeEnabled } from '@/lib/dev-mode'

// Self-hosted fonts via next/font (eliminates render-blocking @import)
import { JetBrains_Mono, Oswald } from 'next/font/google'

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
})

const oswald = Oswald({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-oswald',
  display: 'swap',
})

const queryClient = new QueryClient()



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
  '/LandingPageV2',
  '/privacy-policy',
  '/terms-of-service',
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
        <div className={`${jetbrainsMono.variable} ${oswald.variable}`}>
        {/* Dev Mode Banner */}
        {isDevModeEnabled && (
          <div className="bg-yellow-400 text-black px-4 py-2 text-center font-mono text-sm font-bold fixed top-0 left-0 right-0 z-50 shadow-md">
            DEV MODE ACTIVE - Authentication Bypassed
          </div>
        )}
        <div className={isDevModeEnabled ? 'pt-10' : ''}>
          <Toaster />
          <Sonner />
          <Component {...pageProps} />
          <Analytics />
        </div>
        </div>
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