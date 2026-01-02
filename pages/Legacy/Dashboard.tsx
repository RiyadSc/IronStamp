import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/router";
import { Sidebar } from "@/components/Sidebar";
import { StatCard } from "@/components/StatCard";
import { ExpirationTable } from "@/components/ExpirationTable";

import { PriorityWidget } from "@/components/PriorityWidget";
import { QuickActionsWidget } from "@/components/QuickActionsWidget";
import { ComplianceTrendChart } from "@/components/ComplianceTrendChart";
import { NotificationCenter } from "@/components/NotificationCenter";
import { getDashboardStats, getUserProfile, type DashboardStats, type UserProfile } from "@/lib/data-service";
import { useAuth } from "@/hooks/useAuth";
import { trackEvent, POSTHOG_EVENTS } from "@/lib/posthog";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, User, ChevronDown } from "@/lib/icons";
import { Button } from "@/components/ui/button";

const Index = () => {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  // Redirect to DashboardV2 in production - this page is dev-only
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') {
      router.replace('/DashboardV2');
      return;
    }
  }, [router]);
  const [stats, setStats] = useState<DashboardStats>({
    totalEmployees: 0,
    activeCertifications: 0,
    expiredCertifications: 0,
    expiringSoon: 0
  });
  const [userProfile, setUserProfile] = useState<UserProfile>({
    companyName: null,
    teamSize: null,
    businessFocus: null,
    onboardingCompleted: false,
    userEmail: null
  });
  const [loading, setLoading] = useState(true);
  
  // Track if we've loaded data and for which user to prevent unnecessary re-loads
  const loadedUserRef = useRef<string | null>(null);
  const hasLoadedRef = useRef(false);

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const [dashboardStats, profileData] = await Promise.all([
        getDashboardStats(),
        getUserProfile()
      ]);
      setStats(dashboardStats);
      setUserProfile(profileData);
      hasLoadedRef.current = true; // Mark as successfully loaded
      
      // Track dashboard view
      trackEvent(POSTHOG_EVENTS.DASHBOARD_VIEWED, {
        user_id: user?.id,
        total_employees: dashboardStats.totalEmployees,
        active_certifications: dashboardStats.activeCertifications,
        expired_certifications: dashboardStats.expiredCertifications,
        expiring_soon: dashboardStats.expiringSoon
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      // Keep default values on error, but don't mark as loaded so it can retry
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    // Only load data if:
    // 1. We have a user and auth is not loading
    // 2. We haven't loaded data yet OR the user has changed
    if (user && !authLoading) {
      const currentUserId = user.id;
      const shouldLoad = !hasLoadedRef.current || loadedUserRef.current !== currentUserId;
      
      if (shouldLoad) {
        loadedUserRef.current = currentUserId;
        loadDashboardData();
      } else {
        // User is the same and data is already loaded, just set loading to false
        setLoading(false);
      }
    } else if (!authLoading && !user) {
      // No user and auth loading is done - let AuthChecker handle this
      setLoading(false);
      hasLoadedRef.current = false;
      loadedUserRef.current = null;
    }
  }, [user, authLoading, loadDashboardData]);

  // Force refresh function (for manual refresh if needed)
  const _refreshDashboard = async () => {
    hasLoadedRef.current = false;
    await loadDashboardData();
  };

  // Handle logout
  const handleLogout = () => {
    window.location.href = '/';
  };

  // Generate display name and subtitle based on profile data
  const getDisplayInfo = () => {
    let displayName = 'Welcome back';
    let subtitle = 'User';

    if (userProfile.companyName) {
      displayName = `Welcome, ${userProfile.companyName}`;
      
      // Create subtitle based on business focus and team size
      if (userProfile.businessFocus && userProfile.teamSize) {
        const focus = userProfile.businessFocus === 'both' ? 'Residential & Commercial' 
                     : userProfile.businessFocus === 'residential' ? 'Residential HVAC'
                     : userProfile.businessFocus === 'commercial' ? 'Commercial HVAC'
                     : 'HVAC Services';
        subtitle = `${focus} • ${userProfile.teamSize} employees`;
      } else if (userProfile.businessFocus) {
        const focus = userProfile.businessFocus === 'both' ? 'Residential & Commercial HVAC' 
                     : userProfile.businessFocus === 'residential' ? 'Residential HVAC'
                     : userProfile.businessFocus === 'commercial' ? 'Commercial HVAC'
                     : 'HVAC Services';
        subtitle = focus;
      } else {
        subtitle = 'HVAC Manager';
      }
    } else if (userProfile.userEmail) {
      // Fallback to email if no company name
      displayName = `Welcome back`;
      subtitle = userProfile.userEmail;
    } else if (user?.email) {
      // Ultimate fallback to auth user email
      displayName = `Welcome back`;
      subtitle = user.email;
    }

    return { displayName, subtitle };
  };

  const { displayName, subtitle } = getDisplayInfo();

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 flex items-center justify-center">
        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center animate-spin">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 flex">
      <Sidebar />
      
      <main className="flex-1 overflow-auto">
        {/* Header - Mobile Optimized with Logout Dropdown */}
        <div className="bg-white/70 backdrop-blur-xl border-b border-gray-200/50 px-4 sm:px-6 py-4 sm:py-5 sticky top-0 z-10 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text truncate">
                Dashboard
              </h1>
              <p className="text-gray-600 mt-1 text-xs sm:text-sm font-medium">Overview of your team&apos;s certification status</p>
            </div>
            
            {/* User Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="flex-shrink-0 bg-gradient-to-br from-white to-gray-50 p-2 sm:p-3 rounded-lg sm:rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 h-auto"
                >
                  <div className="flex items-center space-x-2">
                    <div className="text-left">
                      <p className="text-xs text-gray-600 font-medium truncate max-w-40">
                        {loading ? 'Loading...' : displayName}
                      </p>
                      <p className="text-xs text-gray-500 font-medium truncate max-w-40">
                        {loading ? '...' : subtitle}
                      </p>
                    </div>
                    <ChevronDown className="h-3 w-3 text-gray-500 ml-1" />
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem disabled className="flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{userProfile.companyName || 'User'}</span>
                    <span className="text-xs text-gray-500">{user?.email}</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="flex items-center space-x-2 text-red-600 hover:text-red-700 hover:bg-red-50">
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="px-4 sm:px-6 py-4 sm:py-6">
          {/* Stats Grid - Mobile Optimized */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
            <StatCard
              title="Expired Certifications"
              value={stats.expiredCertifications}
              status="danger"
              subtitle="Requires immediate action"
            />
            <StatCard
              title="Expiring Soon"
              value={stats.expiringSoon}
              status="warning"
              subtitle="Next 30 days"
            />
            <StatCard
              title="Active Certifications"
              value={stats.activeCertifications}
              status="success"
              subtitle="Up to date"
            />
            <StatCard
              title="Employees Tracked"
              value={stats.totalEmployees}
              status="neutral"
              subtitle="Total team members"
            />
          </div>

          {/* Priority Section - Mobile Optimized */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
            <div className="lg:col-span-2 order-2 lg:order-1">
              <PriorityWidget />
            </div>
            <div className="order-1 lg:order-2">
              <QuickActionsWidget />
            </div>
          </div>
          
          {/* Analytics and Notifications - Mobile Optimized */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
            <ComplianceTrendChart />
            <NotificationCenter />
          </div>
          
          {/* Main Content - Mobile Optimized */}
          <div className="space-y-4 sm:space-y-6">
            <ExpirationTable />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;