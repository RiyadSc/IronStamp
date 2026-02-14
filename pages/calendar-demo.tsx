import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useAuth } from "@/hooks/useAuth";
import { getUserProfile, type UserProfile } from '@/lib/data-service';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import {
  Radar,
  Users,
  FileCheck,
  Settings,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  Calendar,
  Loader2,
} from 'lucide-react';

// Helper function to get initials
const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  if (parts.length === 1 && parts[0].length > 0) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return '??';
};

const InteractiveCalendar = dynamic(
  () => import('@/components/visualize-booking').then((m) => m.default),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-[#0038FF] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="font-mono text-xs text-gray-500 uppercase tracking-wider">
            Loading calendar...
          </p>
        </div>
      </div>
    ),
  }
);

export default function CalendarDemoPage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile>({
    companyName: null,
    teamSize: null,
    businessFocus: null,
    onboardingCompleted: false,
    userEmail: null
  });

  useEffect(() => {
    const loadProfile = async () => {
      if (user) {
        try {
          const profile = await getUserProfile();
          setUserProfile(profile);
        } catch (error) {
          console.error('Error loading profile:', error);
        }
      }
    };
    loadProfile();
  }, [user]);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  // Get display name and email for profile
  const getProfileDisplayInfo = () => {
    let displayName = 'User';
    let email = user?.email || '';

    if (userProfile.companyName) {
      displayName = userProfile.companyName;
    } else if (userProfile.userEmail) {
      displayName = userProfile.userEmail.split('@')[0];
      email = userProfile.userEmail;
    } else if (user?.email) {
      displayName = user.email.split('@')[0];
      email = user.email;
    }

    const nameParts = displayName.trim().split(/\s+/).filter(Boolean);
    if (nameParts.length > 1 && nameParts[nameParts.length - 1].length > 0) {
      displayName = `${nameParts[0]} ${nameParts[nameParts.length - 1][0]}.`;
    } else if (nameParts.length === 1) {
      displayName = nameParts[0];
    } else {
      displayName = 'User';
    }

    return { displayName, email };
  };

  const { displayName: profileName, email: profileEmail } = getProfileDisplayInfo();

  // Handle logout
  const handleLogout = async () => {
    try {
      sessionStorage.setItem('intentional_logout', 'true');
      await supabase.auth.signOut();
      window.location.href = '/';
    } catch (error) {
      sessionStorage.removeItem('intentional_logout');
      console.error('Error logging out:', error);
      toast({
        title: "Logout Failed",
        description: "There was an error logging out. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center font-mono">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-[#0038FF]/10 border-2 border-[#0038FF] flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-[#0038FF] animate-spin" />
          </div>
          <p className="font-mono text-xs text-gray-500 uppercase tracking-wider">Loading System...</p>
        </div>
      </div>
    );
  }

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <div className="font-mono bg-[#F8FAFC] text-[#050505] min-h-screen flex flex-col md:flex-row">
      {mobileMenuOpen && (
        <button type="button" aria-label="Close menu" className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={closeMobileMenu} />
      )}

      <aside
        id="sidebar"
        className={`sidebar fixed md:relative left-0 top-0 bottom-0 z-50 w-64 md:w-64 bg-[#050505] text-white flex flex-col border-r border-[#0038FF]/20 shrink-0 transition-transform duration-200 ease-out ${
          sidebarCollapsed ? 'collapsed' : ''
        } ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        <div className="pt-6 pr-6 pb-6 pl-4 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src="/IronStampLogov3.png" alt="IronStamp" className="h-8 w-auto" />
              <span className="sidebar-text font-display font-bold text-2xl tracking-tighter transition-opacity">IRONSTAMP</span>
            </div>
            <button onClick={toggleSidebar} className="hidden md:block text-gray-400 hover:text-white transition-colors p-1">
              {sidebarCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
            </button>
          </div>
          <div className="sidebar-text mt-2 text-[10px] font-mono text-gray-500 transition-opacity">SYS.STATUS: ONLINE</div>
        </div>

        <nav className="flex-1 py-4 space-y-2">
          <Link href="/DashboardV2" className="nav-item flex items-center gap-3 px-8 py-3 text-gray-400 hover:bg-white/5 hover:text-white font-mono text-sm transition-colors" onClick={closeMobileMenu}>
            <Radar className="w-4 h-4" />
            <span className="sidebar-text">THE RADAR</span>
          </Link>
          <Link href="/Crew" className="nav-item flex items-center gap-3 px-8 py-3 text-gray-400 hover:bg-white/5 hover:text-white font-mono text-sm transition-colors" onClick={closeMobileMenu}>
            <Users className="w-4 h-4" />
            <span className="sidebar-text">THE CREW</span>
          </Link>
          <Link href="/calendar-demo" className="nav-item flex items-center gap-3 px-8 py-3 bg-[#0038FF] text-white font-mono text-sm font-bold" onClick={closeMobileMenu}>
            <Calendar className="w-4 h-4" />
            <span className="sidebar-text">CALENDAR</span>
          </Link>
          <Link href="/vault" className="nav-item flex items-center gap-3 px-8 py-3 text-gray-400 hover:bg-white/5 hover:text-white font-mono text-sm transition-colors" onClick={closeMobileMenu}>
            <FileCheck className="w-4 h-4" />
            <span className="sidebar-text">THE VAULT</span>
          </Link>
          <Link href="/config" className="nav-item flex items-center gap-3 px-8 py-3 text-gray-400 hover:bg-white/5 hover:text-white font-mono text-sm transition-colors" onClick={closeMobileMenu}>
            <Settings className="w-4 h-4" />
            <span className="sidebar-text">CONFIG</span>
          </Link>
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className={`flex items-center gap-3 px-2 py-2 ${sidebarCollapsed ? 'justify-center' : ''}`}>
            <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center flex-shrink-0">
              <span className="text-white font-mono text-sm font-bold">{getInitials(profileName)}</span>
            </div>
            <div className="flex-1 min-w-0 sidebar-text">
              <p className="text-white font-mono text-sm font-bold truncate">{profileName}</p>
              <p className="text-gray-400 font-mono text-xs truncate">{profileEmail}</p>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-white/10">
          <button onClick={() => { closeMobileMenu(); handleLogout(); }} className="nav-item w-full flex items-center justify-center gap-2 border border-white/20 text-white py-2 hover:bg-white/10 transition-colors font-mono text-xs">
            <LogOut className="w-3 h-3" />
            <span className="sidebar-text">LOGOUT</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0 p-6 md:p-12 overflow-y-auto bg-tech-grid">
        <div className="md:hidden flex items-center justify-between mb-6 -mt-2 -mx-2 px-2 py-3">
          <div className="flex items-center gap-2">
            <img src="/IronStampLogov3.png" alt="IronStamp" className="h-7 w-auto" />
            <span className="font-display font-bold text-xl tracking-tighter text-[#050505]">IRONSTAMP</span>
          </div>
          <button type="button" aria-label="Open menu" onClick={() => setMobileMenuOpen(true)} className="p-2 rounded-lg text-[#050505] hover:bg-[#050505]/10 transition-colors">
            <Menu className="w-6 h-6" />
          </button>
        </div>
        <header className="mb-8">
          <p className="font-mono text-[#0038FF] text-xs mb-1">{`/// EXPIRATION TIMELINE ///`}</p>
          <h1 className="font-display text-4xl md:text-5xl font-bold uppercase">Certification Calendar</h1>
          <p className="font-mono text-gray-500 text-sm mt-2">
            Interactive timeline showing certification expiry dates and renewal windows
          </p>
        </header>

        {/* Calendar Component */}
        <div className="bg-white border-2 border-[#050505] shadow-[8px_8px_0px_#0038FF] p-6">
          <InteractiveCalendar />
        </div>
      </main>
    </div>
  );
} 
