import React, { useState, useEffect } from 'react';
import Link from 'next/link';
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
  User,
  Bell,
  CreditCard,
  Shield,
  Database,
  Mail,
  Clock,
  AlertTriangle,
  Check,
  ChevronRight,
  Building2,
  Globe,
  Save,
  Download,
  Trash2,
  Key,
  Smartphone,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getUserProfile, type UserProfile } from '@/lib/data-service';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { Switch } from '@/components/ui/switch';

type SettingsTab = 'profile' | 'notifications' | 'billing' | 'security' | 'data';

// Mock billing data (would come from Stripe in production)
const billingHistory = [
  { id: 1, date: '01/15/2026', amount: '$49.00', status: 'Paid', invoice: 'INV-2026-01' },
  { id: 2, date: '12/15/2025', amount: '$49.00', status: 'Paid', invoice: 'INV-2025-12' },
  { id: 3, date: '11/15/2025', amount: '$49.00', status: 'Paid', invoice: 'INV-2025-11' },
];

const plans = [
  {
    name: 'Starter',
    price: '$19',
    period: 'month',
    features: ['Up to 5 technicians', 'Basic tracking', 'Email reminders', 'Standard support'],
    current: false
  },
  {
    name: 'Professional',
    price: '$49',
    period: 'month',
    features: ['Up to 25 technicians', 'Advanced tracking', 'Email & SMS', 'Custom reports', 'Priority support'],
    current: true,
    popular: true
  },
  {
    name: 'Enterprise',
    price: '$99',
    period: 'month',
    features: ['Unlimited technicians', 'Full management', 'All notifications', 'API access', 'Dedicated support'],
    current: false
  }
];

export default function Config() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile>({
    companyName: null,
    teamSize: null,
    businessFocus: null,
    onboardingCompleted: false,
    userEmail: null
  });

  // Profile form state
  const [companyName, setCompanyName] = useState('');
  const [timezone, setTimezone] = useState('America/New_York');

  // Notification settings state
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [expirationReminders, setExpirationReminders] = useState(true);
  const [reminderDays, setReminderDays] = useState<number[]>([30, 14, 7, 1]);
  const [weeklyDigest, setWeeklyDigest] = useState(true);
  const [instantAlerts, setInstantAlerts] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      
      try {
        const profileData = await getUserProfile();
        setUserProfile(profileData);
        setCompanyName(profileData.companyName || '');
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      loadData();
    }
  }, [user, authLoading]);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  // Get initials for avatar
  const getInitials = (name: string) => {
    const parts = (name || '').trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    if (parts.length === 1 && parts[0].length > 0) {
      return parts[0].substring(0, 2).toUpperCase();
    }
    return '??';
  };

  // Get display name
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

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      // In production, this would update the user's profile in the database
      await new Promise(resolve => setTimeout(resolve, 800)); // Simulate API call
      toast({
        title: "Profile Updated",
        description: "Your settings have been saved successfully.",
      });
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotifications = async () => {
    setSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      toast({
        title: "Notification Settings Updated",
        description: "Your notification preferences have been saved.",
      });
    } catch (error) {
      console.error('Error saving notifications:', error);
      toast({
        title: "Error",
        description: "Failed to save notification settings.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleExportData = async () => {
    toast({
      title: "Export Started",
      description: "Your data export is being prepared. You'll receive an email when it's ready.",
    });
  };

  const settingsTabs = [
    { id: 'profile' as SettingsTab, label: 'PROFILE', icon: User },
    { id: 'notifications' as SettingsTab, label: 'ALERTS', icon: Bell },
    { id: 'billing' as SettingsTab, label: 'BILLING', icon: CreditCard },
    { id: 'security' as SettingsTab, label: 'SECURITY', icon: Shield },
    { id: 'data' as SettingsTab, label: 'DATA', icon: Database },
  ];

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
          <Link href="/calendar-demo" className="nav-item flex items-center gap-3 px-8 py-3 text-gray-400 hover:bg-white/5 hover:text-white font-mono text-sm transition-colors" onClick={closeMobileMenu}>
            <Calendar className="w-4 h-4" />
            <span className="sidebar-text">CALENDAR</span>
          </Link>
          <Link href="/vault" className="nav-item flex items-center gap-3 px-8 py-3 text-gray-400 hover:bg-white/5 hover:text-white font-mono text-sm transition-colors" onClick={closeMobileMenu}>
            <FileCheck className="w-4 h-4" />
            <span className="sidebar-text">THE VAULT</span>
          </Link>
          <Link href="/config" className="nav-item flex items-center gap-3 px-8 py-3 bg-[#0038FF] text-white font-mono text-sm font-bold" onClick={closeMobileMenu}>
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
        <header className="mb-12">
          <p className="font-mono text-[#0038FF] text-xs mb-1">{`/// SYSTEM CONFIGURATION ///`}</p>
          <h1 className="font-display text-4xl md:text-5xl font-bold uppercase">Config</h1>
          <p className="font-mono text-gray-500 text-sm mt-2">
            Manage your account, notifications, and billing preferences
          </p>
        </header>

        {/* Settings Layout */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Settings Navigation */}
          <div className="lg:w-64 shrink-0">
            <div className="bg-white border-tech p-2 space-y-1">
              {settingsTabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 font-mono text-xs font-bold transition-colors ${
                      activeTab === tab.id
                        ? 'bg-[#050505] text-white'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                    {activeTab === tab.id && <ChevronRight className="w-4 h-4 ml-auto" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Settings Content */}
          <div className="flex-1">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="w-8 h-8 border-2 border-[#0038FF] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="font-mono text-xs text-gray-500 uppercase tracking-wider">Loading Configuration...</p>
                </div>
              </div>
            ) : (
              <>
            {/* Profile Settings */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div className="bg-white border-tech p-6">
                  <h2 className="font-display text-xl font-bold uppercase mb-6 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-[#0038FF]" /> Company Profile
                  </h2>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block font-mono text-xs text-gray-500 uppercase mb-2">
                        Company Name
                      </label>
                      <input
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="Enter your company name"
                        className="w-full px-4 py-3 bg-white border border-gray-200 font-mono text-sm focus:outline-none focus:border-[#0038FF] focus:ring-1 focus:ring-[#0038FF]"
                      />
                    </div>

                    <div>
                      <label className="block font-mono text-xs text-gray-500 uppercase mb-2">
                        Account Email
                      </label>
                      <input
                        type="email"
                        value={profileEmail}
                        disabled
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 font-mono text-sm text-gray-500 cursor-not-allowed"
                      />
                      <p className="font-mono text-xs text-gray-400 mt-1">Contact support to change your email</p>
                    </div>

                    <div>
                      <label className="block font-mono text-xs text-gray-500 uppercase mb-2">
                        <Globe className="w-3 h-3 inline mr-1" /> Timezone
                      </label>
                      <select
                        value={timezone}
                        onChange={(e) => setTimezone(e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-gray-200 font-mono text-sm focus:outline-none focus:border-[#0038FF] focus:ring-1 focus:ring-[#0038FF]"
                      >
                        <option value="America/New_York">Eastern Time (ET)</option>
                        <option value="America/Chicago">Central Time (CT)</option>
                        <option value="America/Denver">Mountain Time (MT)</option>
                        <option value="America/Los_Angeles">Pacific Time (PT)</option>
                        <option value="America/Anchorage">Alaska Time (AKT)</option>
                        <option value="Pacific/Honolulu">Hawaii Time (HT)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-mono text-xs text-gray-500 uppercase mb-2">
                        Business Focus
                      </label>
                      <div className="px-4 py-3 bg-gray-50 border border-gray-200 font-mono text-sm text-gray-600">
                        {userProfile.businessFocus || 'Not specified'}
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-gray-100">
                    <button
                      onClick={handleSaveProfile}
                      disabled={saving}
                      className="bg-[#050505] text-white px-6 py-3 flex items-center gap-2 font-bold font-mono text-sm hover:bg-[#0038FF] transition-colors border border-[#050505] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Save className="w-4 h-4" />
                      {saving ? 'SAVING...' : 'SAVE CHANGES'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Notification Settings */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div className="bg-white border-tech p-6">
                  <h2 className="font-display text-xl font-bold uppercase mb-6 flex items-center gap-2">
                    <Mail className="w-5 h-5 text-[#0038FF]" /> Email Notifications
                  </h2>

                  <div className="space-y-6">
                    <div className="flex items-center justify-between py-4 border-b border-gray-100">
                      <div>
                        <p className="font-mono text-sm font-bold">Email Notifications</p>
                        <p className="font-mono text-xs text-gray-500 mt-1">Receive email updates about your account</p>
                      </div>
                      <Switch
                        checked={emailNotifications}
                        onCheckedChange={setEmailNotifications}
                      />
                    </div>

                    <div className="flex items-center justify-between py-4 border-b border-gray-100">
                      <div>
                        <p className="font-mono text-sm font-bold">Weekly Digest</p>
                        <p className="font-mono text-xs text-gray-500 mt-1">Get a weekly summary of expiring certifications</p>
                      </div>
                      <Switch
                        checked={weeklyDigest}
                        onCheckedChange={setWeeklyDigest}
                      />
                    </div>

                    <div className="flex items-center justify-between py-4 border-b border-gray-100">
                      <div>
                        <p className="font-mono text-sm font-bold">Instant Critical Alerts</p>
                        <p className="font-mono text-xs text-gray-500 mt-1">Immediate notifications for expired certifications</p>
                      </div>
                      <Switch
                        checked={instantAlerts}
                        onCheckedChange={setInstantAlerts}
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-white border-tech p-6">
                  <h2 className="font-display text-xl font-bold uppercase mb-6 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-[#0038FF]" /> Expiration Reminders
                  </h2>

                  <div className="space-y-6">
                    <div className="flex items-center justify-between py-4 border-b border-gray-100">
                      <div>
                        <p className="font-mono text-sm font-bold">Automatic Reminders</p>
                        <p className="font-mono text-xs text-gray-500 mt-1">Send automated reminders before certifications expire</p>
                      </div>
                      <Switch
                        checked={expirationReminders}
                        onCheckedChange={setExpirationReminders}
                      />
                    </div>

                    {expirationReminders && (
                      <div>
                        <label className="block font-mono text-xs text-gray-500 uppercase mb-4">
                          Reminder Schedule (days before expiration)
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {[30, 14, 7, 1].map((day) => (
                            <label
                              key={day}
                              className={`flex items-center gap-2 px-4 py-3 border cursor-pointer transition-colors ${
                                reminderDays.includes(day)
                                  ? 'border-[#0038FF] bg-[#0038FF]/5'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={reminderDays.includes(day)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setReminderDays([...reminderDays, day].sort((a, b) => b - a));
                                  } else {
                                    setReminderDays(reminderDays.filter(d => d !== day));
                                  }
                                }}
                                className="sr-only"
                              />
                              <div className={`w-4 h-4 border flex items-center justify-center ${
                                reminderDays.includes(day)
                                  ? 'border-[#0038FF] bg-[#0038FF]'
                                  : 'border-gray-300'
                              }`}>
                                {reminderDays.includes(day) && <Check className="w-3 h-3 text-white" />}
                              </div>
                              <span className="font-mono text-sm">{day} {day === 1 ? 'day' : 'days'}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-8 pt-6 border-t border-gray-100">
                    <button
                      onClick={handleSaveNotifications}
                      disabled={saving}
                      className="bg-[#050505] text-white px-6 py-3 flex items-center gap-2 font-bold font-mono text-sm hover:bg-[#0038FF] transition-colors border border-[#050505] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Save className="w-4 h-4" />
                      {saving ? 'SAVING...' : 'SAVE PREFERENCES'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Billing Settings */}
            {activeTab === 'billing' && (
              <div className="space-y-6">
                {/* Current Plan */}
                <div className="bg-white border-tech p-6">
                  <h2 className="font-display text-xl font-bold uppercase mb-6 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-[#0038FF]" /> Current Plan
                  </h2>

                  <div className="bg-[#0038FF]/5 border-2 border-[#0038FF] p-6 mb-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-display text-2xl font-bold">PROFESSIONAL</h3>
                        <p className="font-mono text-sm text-gray-600">$49/month • Billed monthly</p>
                      </div>
                      <span className="status-badge status-ok">ACTIVE</span>
                    </div>
                    <div className="grid grid-cols-2 gap-6 mt-6">
                      <div>
                        <p className="font-mono text-xs text-gray-500 uppercase">Next Billing Date</p>
                        <p className="font-mono text-sm font-bold mt-1">February 15, 2026</p>
                      </div>
                      <div>
                        <p className="font-mono text-xs text-gray-500 uppercase">Team Members Used</p>
                        <p className="font-mono text-sm font-bold mt-1">12 of 25</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-gray-200">
                    <div className="flex items-center gap-3">
                      <CreditCard className="w-8 h-8 text-gray-400" />
                      <div>
                        <p className="font-mono text-sm font-bold">•••• •••• •••• 4242</p>
                        <p className="font-mono text-xs text-gray-500">Expires 12/2027</p>
                      </div>
                    </div>
                    <button className="font-mono text-xs font-bold text-[#0038FF] hover:underline">
                      UPDATE
                    </button>
                  </div>
                </div>

                {/* Available Plans */}
                <div className="bg-white border-tech p-6">
                  <h2 className="font-display text-xl font-bold uppercase mb-6">Available Plans</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {plans.map((plan) => (
                      <div
                        key={plan.name}
                        className={`p-6 border-2 relative ${
                          plan.current 
                            ? 'border-[#0038FF] bg-[#0038FF]/5' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {plan.current && (
                          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                            <span className="bg-[#0038FF] text-white text-[10px] font-mono font-bold px-2 py-1 uppercase">
                              Current
                            </span>
                          </div>
                        )}
                        <h3 className="font-display text-lg font-bold uppercase">{plan.name}</h3>
                        <div className="mt-2 mb-4">
                          <span className="font-display text-3xl font-bold">{plan.price}</span>
                          <span className="font-mono text-sm text-gray-500">/{plan.period}</span>
                        </div>
                        <ul className="space-y-2 mb-6">
                          {plan.features.map((feature, idx) => (
                            <li key={idx} className="flex items-start gap-2 font-mono text-xs text-gray-600">
                              <Check className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                        <button
                          disabled={plan.current}
                          className={`w-full py-2 font-mono text-xs font-bold transition-colors ${
                            plan.current
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-[#050505] text-white hover:bg-[#0038FF]'
                          }`}
                        >
                          {plan.current ? 'CURRENT PLAN' : 'UPGRADE'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Billing History */}
                <div className="bg-white border-tech p-6">
                  <h2 className="font-display text-xl font-bold uppercase mb-6">Billing History</h2>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 font-mono text-xs text-gray-500 uppercase">Date</th>
                          <th className="text-left py-3 font-mono text-xs text-gray-500 uppercase">Invoice</th>
                          <th className="text-left py-3 font-mono text-xs text-gray-500 uppercase">Amount</th>
                          <th className="text-left py-3 font-mono text-xs text-gray-500 uppercase">Status</th>
                          <th className="text-right py-3 font-mono text-xs text-gray-500 uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {billingHistory.map((bill) => (
                          <tr key={bill.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-4 font-mono text-sm">{bill.date}</td>
                            <td className="py-4 font-mono text-sm font-bold">{bill.invoice}</td>
                            <td className="py-4 font-mono text-sm">{bill.amount}</td>
                            <td className="py-4">
                              <span className="status-badge status-ok">{bill.status}</span>
                            </td>
                            <td className="py-4 text-right">
                              <button className="font-mono text-xs text-[#0038FF] hover:underline flex items-center gap-1 ml-auto">
                                <Download className="w-3 h-3" /> PDF
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Security Settings */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <div className="bg-white border-tech p-6">
                  <h2 className="font-display text-xl font-bold uppercase mb-6 flex items-center gap-2">
                    <Key className="w-5 h-5 text-[#0038FF]" /> Password & Authentication
                  </h2>

                  <div className="space-y-6">
                    <div className="flex items-center justify-between py-4 border-b border-gray-100">
                      <div>
                        <p className="font-mono text-sm font-bold">Password</p>
                        <p className="font-mono text-xs text-gray-500 mt-1">Last changed 30 days ago</p>
                      </div>
                      <Link 
                        href="/auth/forgot-password"
                        className="font-mono text-xs font-bold text-[#0038FF] hover:underline"
                      >
                        CHANGE PASSWORD
                      </Link>
                    </div>

                    <div className="flex items-center justify-between py-4 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        <Smartphone className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="font-mono text-sm font-bold">Two-Factor Authentication</p>
                          <p className="font-mono text-xs text-gray-500 mt-1">Add an extra layer of security to your account</p>
                        </div>
                      </div>
                      <span className="status-badge status-warn">COMING SOON</span>
                    </div>

                    <div className="flex items-center justify-between py-4">
                      <div>
                        <p className="font-mono text-sm font-bold">Active Sessions</p>
                        <p className="font-mono text-xs text-gray-500 mt-1">1 active session on this device</p>
                      </div>
                      <button className="font-mono text-xs font-bold text-red-600 hover:underline">
                        SIGN OUT ALL DEVICES
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-white border-tech p-6">
                  <h2 className="font-display text-xl font-bold uppercase mb-6 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-500" /> Security Recommendations
                  </h2>

                  <div className="space-y-4">
                    <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200">
                      <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-mono text-sm font-bold text-yellow-800">Enable Two-Factor Authentication</p>
                        <p className="font-mono text-xs text-yellow-700 mt-1">
                          Protect your account with an additional verification step when signing in.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Data & Privacy Settings */}
            {activeTab === 'data' && (
              <div className="space-y-6">
                <div className="bg-white border-tech p-6">
                  <h2 className="font-display text-xl font-bold uppercase mb-6 flex items-center gap-2">
                    <Download className="w-5 h-5 text-[#0038FF]" /> Export Your Data
                  </h2>

                  <p className="font-mono text-sm text-gray-600 mb-6">
                    Download a copy of all your data including team members, certifications, and activity history.
                  </p>

                  <button
                    onClick={handleExportData}
                    className="bg-[#050505] text-white px-6 py-3 flex items-center gap-2 font-bold font-mono text-sm hover:bg-[#0038FF] transition-colors border border-[#050505]"
                  >
                    <Download className="w-4 h-4" />
                    REQUEST DATA EXPORT
                  </button>
                </div>

                <div className="bg-white border-tech p-6">
                  <h2 className="font-display text-xl font-bold uppercase mb-6 flex items-center gap-2">
                    <ExternalLink className="w-5 h-5 text-[#0038FF]" /> Privacy & Legal
                  </h2>

                  <div className="space-y-4">
                    <Link 
                      href="/privacy-policy"
                      className="flex items-center justify-between p-4 border border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      <span className="font-mono text-sm font-bold">Privacy Policy</span>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </Link>
                    <Link 
                      href="/terms-of-service"
                      className="flex items-center justify-between p-4 border border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      <span className="font-mono text-sm font-bold">Terms of Service</span>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </Link>
                  </div>
                </div>

                <div className="bg-white border-2 border-red-200 p-6">
                  <h2 className="font-display text-xl font-bold uppercase mb-4 text-red-600 flex items-center gap-2">
                    <Trash2 className="w-5 h-5" /> Danger Zone
                  </h2>

                  <p className="font-mono text-sm text-gray-600 mb-6">
                    Once you delete your account, there is no going back. All your data will be permanently removed.
                  </p>

                  <button
                    className="px-6 py-3 border-2 border-red-500 text-red-600 font-bold font-mono text-sm hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4 inline mr-2" />
                    DELETE ACCOUNT
                  </button>
                </div>
              </div>
            )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
