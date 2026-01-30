import posthog from 'posthog-js'

// Server-side PostHog import (only used in API routes)
let PostHog: any = null
if (typeof window === 'undefined') {
  // Only import on server-side
  PostHog = require("posthog-node").PostHog
}

// NOTE: This is a Node.js client, so you can use it for sending events from the server side to PostHog.
export default function PostHogClient() {
  if (!PostHog) {
    throw new Error('PostHog server library not available in client-side context')
  }
  const posthogClient = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    host: 'https://us.posthog.com',
    flushAt: 1,
    flushInterval: 0,
  })
  return posthogClient
}

// Event tracking constants
export const POSTHOG_EVENTS = {
  // User lifecycle events
  USER_SIGNED_UP: 'user_signed_up',
  USER_SIGNED_IN: 'user_signed_in',
  USER_SIGNED_OUT: 'user_signed_out',
  
  // Onboarding events
  ONBOARDING_STARTED: 'onboarding_started',
  ONBOARDING_STEP_COMPLETED: 'onboarding_step_completed',
  ONBOARDING_COMPLETED: 'onboarding_completed',
  
  // Core feature events
  CERTIFICATION_UPLOADED: 'certification_uploaded',
  CERTIFICATION_EDITED: 'certification_edited',
  CERTIFICATION_DELETED: 'certification_deleted',
  EMPLOYEE_ADDED: 'employee_added',
  EMPLOYEE_EDITED: 'employee_edited',
  EMPLOYEE_DELETED: 'employee_deleted',
  
  // Dashboard & analytics events
  DASHBOARD_VIEWED: 'dashboard_viewed',
  REPORT_GENERATED: 'report_generated',
  NOTIFICATION_SENT: 'notification_sent',
  NOTIFICATION_SETUP: 'notification_setup',
  
  // Business events
  PLAN_UPGRADED: 'plan_upgraded',
  PLAN_DOWNGRADED: 'plan_downgraded',
  PAYMENT_MADE: 'payment_made',
  TRIAL_STARTED: 'trial_started',
  TRIAL_CONVERTED: 'trial_converted',
  
  // Feature usage events
  FEATURE_USED: 'feature_used',
  EXPORT_DOWNLOADED: 'export_downloaded',
  CSV_IMPORTED: 'csv_imported',
  BULK_ACTION_PERFORMED: 'bulk_action_performed',
  
  // Error & support events
  ERROR_OCCURRED: 'error_occurred',
  SUPPORT_CONTACTED: 'support_contacted',
  
  // Engagement events
  PAGE_VIEWED: 'page_viewed',
  BUTTON_CLICKED: 'button_clicked',
  MODAL_OPENED: 'modal_opened',
  SEARCH_PERFORMED: 'search_performed'
} as const

// Custom properties for consistent tracking
export const POSTHOG_PROPERTIES = {
  // User properties
  TEAM_SIZE: 'team_size',
  BUSINESS_TYPE: 'business_type',
  PLAN_TYPE: 'plan_type',
  ONBOARDING_COMPLETED: 'onboarding_completed',
  CERTIFICATION_COUNT: 'certification_count',
  EMPLOYEE_COUNT: 'employee_count',
  
  // Onboarding properties
  CERTS_TRACKED: 'certs_tracked',
  CERTS_ASSIGNED: 'certs_assigned',
  
  // Feature properties
  FEATURE_NAME: 'feature_name',
  FEATURE_CATEGORY: 'feature_category',
  UPLOAD_METHOD: 'upload_method',
  REPORT_TYPE: 'report_type',
  NOTIFICATION_TYPE: 'notification_type',
  
  // Business properties
  REVENUE_AMOUNT: 'revenue_amount',
  SUBSCRIPTION_PERIOD: 'subscription_period',
  TRIAL_DURATION: 'trial_duration',
  
  // Error properties
  ERROR_TYPE: 'error_type',
  ERROR_MESSAGE: 'error_message',
  ERROR_LOCATION: 'error_location'
} as const

// Client-side tracking functions
export const trackEvent = (eventName: string, properties?: Record<string, any>) => {
  if (typeof window !== 'undefined' && posthog) {
    const enhancedProperties = {
      app_url: 'https://www.ironstamp.app/',
      app_name: 'IronStamp',
      app_version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
      ...properties
    }
    posthog.capture(eventName, enhancedProperties)
  }
}

export const identifyUser = (userId: string, properties?: Record<string, any>) => {
  if (typeof window !== 'undefined' && posthog) {
    posthog.identify(userId, properties)
  }
}

export const setUserProperties = (properties: Record<string, any>) => {
  if (typeof window !== 'undefined' && posthog) {
    posthog.people.set(properties)
  }
}

// Business-specific tracking functions
export const trackOnboardingStep = (stepNumber: number, stepName: string, properties?: Record<string, any>) => {
  trackEvent(POSTHOG_EVENTS.ONBOARDING_STEP_COMPLETED, {
    step_number: stepNumber,
    step_name: stepName,
    ...properties
  })
}

export const trackCertificationAction = (action: 'upload' | 'edit' | 'delete', properties?: Record<string, any>) => {
  const eventMap = {
    upload: POSTHOG_EVENTS.CERTIFICATION_UPLOADED,
    edit: POSTHOG_EVENTS.CERTIFICATION_EDITED,
    delete: POSTHOG_EVENTS.CERTIFICATION_DELETED
  }
  
  trackEvent(eventMap[action], properties)
}

export const trackFeatureUsage = (featureName: string, category: string, properties?: Record<string, any>) => {
  trackEvent(POSTHOG_EVENTS.FEATURE_USED, {
    [POSTHOG_PROPERTIES.FEATURE_NAME]: featureName,
    [POSTHOG_PROPERTIES.FEATURE_CATEGORY]: category,
    ...properties
  })
}

export const trackReportGeneration = (reportType: string, properties?: Record<string, any>) => {
  trackEvent(POSTHOG_EVENTS.REPORT_GENERATED, {
    [POSTHOG_PROPERTIES.REPORT_TYPE]: reportType,
    ...properties
  })
}

export const trackNotificationAction = (action: 'sent' | 'setup', notificationType: string, properties?: Record<string, any>) => {
  const eventMap = {
    sent: POSTHOG_EVENTS.NOTIFICATION_SENT,
    setup: POSTHOG_EVENTS.NOTIFICATION_SETUP
  }
  
  trackEvent(eventMap[action], {
    [POSTHOG_PROPERTIES.NOTIFICATION_TYPE]: notificationType,
    ...properties
  })
}

export const trackBusinessEvent = (eventType: 'upgrade' | 'downgrade' | 'payment' | 'trial_start' | 'trial_convert', properties?: Record<string, any>) => {
  const eventMap = {
    upgrade: POSTHOG_EVENTS.PLAN_UPGRADED,
    downgrade: POSTHOG_EVENTS.PLAN_DOWNGRADED,
    payment: POSTHOG_EVENTS.PAYMENT_MADE,
    trial_start: POSTHOG_EVENTS.TRIAL_STARTED,
    trial_convert: POSTHOG_EVENTS.TRIAL_CONVERTED
  }
  
  trackEvent(eventMap[eventType], properties)
}

export const trackError = (errorType: string, errorMessage: string, errorLocation: string, properties?: Record<string, any>) => {
  trackEvent(POSTHOG_EVENTS.ERROR_OCCURRED, {
    [POSTHOG_PROPERTIES.ERROR_TYPE]: errorType,
    [POSTHOG_PROPERTIES.ERROR_MESSAGE]: errorMessage,
    [POSTHOG_PROPERTIES.ERROR_LOCATION]: errorLocation,
    ...properties
  })
}

// Server-side tracking function for API events
export const trackServerEvent = (eventName: string, userId?: string, properties?: Record<string, any>) => {
  if (typeof window !== 'undefined') {
    // Don't run server-side tracking in client context
    return
  }
  
  try {
    const posthogClient = PostHogClient()
    const enhancedProperties = {
      app_url: 'https://www.ironstamp.app/',
      app_name: 'IronStamp',
      app_version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
      event_source: 'server',
      ...properties
    }
    posthogClient.capture({
      event: eventName,
      distinctId: userId || 'anonymous',
      properties: enhancedProperties
    })
    posthogClient.shutdown()
  } catch (error) {
    console.error('Failed to track server event:', error)
  }
}
