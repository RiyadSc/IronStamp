import React, { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useRouter } from 'next/router'
import { formatDateTimeToAmerican } from '@/lib/utils'

const AuthDebug = () => {
  const auth = useAuth()
  const router = useRouter()
  const [rawSession, setRawSession] = useState<any>(null)
  const [sessionHistory, setSessionHistory] = useState<string[]>([])

  useEffect(() => {
    // Get raw session data
    const getRawSession = async () => {
      const { data, error } = await supabase.auth.getSession()
      setRawSession({ data, error, timestamp: new Date().toISOString() })
    }

    getRawSession()

    // Listen to auth changes and log them
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const message = `${new Date().toISOString()}: ${event} - ${session?.user?.id || 'no user'}`
      setSessionHistory(prev => [...prev.slice(-9), message]) // Keep last 10 entries
    })

    return () => subscription.unsubscribe()
  }, [])

  const getStatusColor = (condition: boolean) => {
    return condition ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
  }

  const handleGoToDashboard = () => {
    router.push('/Dashboard')
  }

  const handleRefresh = () => {
    window.location.reload()
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Authentication Debug</h1>
          <p className="text-gray-600">Debug authentication state and OAuth issues</p>
        </div>

        {/* useAuth State */}
        <Card>
          <CardHeader>
            <CardTitle>useAuth Hook State</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Loading</label>
                <Badge className={getStatusColor(!auth.loading)}>
                  {auth.loading ? 'TRUE' : 'FALSE'}
                </Badge>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Error</label>
                <Badge className={getStatusColor(!auth.error)}>
                  {auth.error || 'None'}
                </Badge>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">User ID</label>
                <Badge className={getStatusColor(!!auth.user)}>
                  {auth.user?.id || 'None'}
                </Badge>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Session Valid</label>
                <Badge className={getStatusColor(auth.isSessionValid)}>
                  {auth.isSessionValid ? 'TRUE' : 'FALSE'}
                </Badge>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Authenticated</label>
                <Badge className={getStatusColor(auth.isAuthenticated)}>
                  {auth.isAuthenticated ? 'TRUE' : 'FALSE'}
                </Badge>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Session Expires</label>
                <Badge variant="outline">
                  {auth.session?.expires_at ? formatDateTimeToAmerican(new Date(auth.session.expires_at * 1000)) : 'N/A'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Raw Session Data */}
        <Card>
          <CardHeader>
            <CardTitle>Raw Supabase Session</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto max-h-64">
              {JSON.stringify(rawSession, null, 2)}
            </pre>
          </CardContent>
        </Card>

        {/* Session History */}
        <Card>
          <CardHeader>
            <CardTitle>Authentication Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {sessionHistory.length === 0 ? (
                <p className="text-gray-500 text-sm">No events yet...</p>
              ) : (
                sessionHistory.map((event, index) => (
                  <div key={index} className="text-xs font-mono bg-gray-100 p-2 rounded">
                    {event}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-3">
              <Button onClick={handleRefresh} variant="outline">
                Refresh Page
              </Button>
              <Button onClick={auth.forceRefresh} variant="outline">
                Force Auth Refresh
              </Button>
              <Button onClick={handleGoToDashboard}>
                Go to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* URL Parameters */}
        <Card>
          <CardHeader>
            <CardTitle>URL Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <label className="text-sm font-medium text-gray-600">Current URL:</label>
                <code className="block bg-gray-100 p-2 rounded text-xs">
                  {typeof window !== 'undefined' ? window.location.href : 'N/A'}
                </code>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">URL Hash:</label>
                <code className="block bg-gray-100 p-2 rounded text-xs">
                  {typeof window !== 'undefined' ? window.location.hash || 'None' : 'N/A'}
                </code>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default AuthDebug 