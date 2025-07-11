import type { AppProps } from 'next/app'
import { Toaster } from "@/components/ui/toaster"
import { Toaster as Sonner } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { initToolbar } from '@stagewise/toolbar'
import reactPlugin from '@stagewise-plugins/react'
import { AuthChecker } from '@/components/AuthChecker'
import { useRouter } from 'next/router'
import '../styles.css'

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
  '/auth-debug',
  '/404'
]

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter()
  const isPublicPage = publicPages.includes(router.pathname)

  const AppContent = () => (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Component {...pageProps} />
      </TooltipProvider>
    </QueryClientProvider>
  )

  // For public pages, render without authentication check
  if (isPublicPage) {
    return <AppContent />
  }

  // For protected pages, wrap with AuthChecker
  return (
    <AuthChecker>
      <AppContent />
    </AuthChecker>
  )
} 