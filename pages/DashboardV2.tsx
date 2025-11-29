import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Radar,
  Users,
  FileCheck,
  Settings,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Printer,
  Siren,
  Clock,
  ShieldCheck,
  Zap,
  UploadCloud,
  Plus,
  Check,
  Download,
  Loader2,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getDashboardStats, getExpiringCertifications, getUserProfile, type DashboardStats, type ExpirationItem, type UserProfile, type CertificationDetails } from '@/lib/data-service';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { trackReportGeneration, trackCertificationAction } from '@/lib/posthog';
import { uploadCertification } from '@/lib/certification-service';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NotifyCertificationModal } from '@/components/NotifyCertificationModal';

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const MAX_FILES = 4;
const ACCEPTED_TYPES = {
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'text/csv': ['.csv'],
  'application/vnd.ms-excel': ['.xls'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png']
};

export default function DashboardV2() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState<DashboardStats>({
    totalEmployees: 0,
    activeCertifications: 0,
    expiredCertifications: 0,
    expiringSoon: 0
  });
  const [expiringCerts, setExpiringCerts] = useState<ExpirationItem[]>([]);
  const [allExpiringCerts, setAllExpiringCerts] = useState<ExpirationItem[]>([]); // Store all certs for modal
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile>({
    companyName: null,
    teamSize: null,
    businessFocus: null,
    onboardingCompleted: false,
    userEmail: null
  });
  
  // Notification Modal State
  const [isNotifyModalOpen, setIsNotifyModalOpen] = useState(false);
  const [selectedCertification, setSelectedCertification] = useState<CertificationDetails | null>(null);

  useEffect(() => {
    // Only load initial data if user is authenticated and we haven't loaded yet
    // This prevents reloading when tab focus changes unless necessary
    if (user && !authLoading) {
      // Check if we already have data to avoid flash
      if (stats.totalEmployees === 0 && expiringCerts.length === 0) {
        loadDashboardData();
      }
    } else if (!authLoading && !user) {
      setLoading(false);
    }
  }, [user, authLoading]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [dashboardStats, expiringData, profileData] = await Promise.all([
        getDashboardStats(),
        getExpiringCertifications(100), // Fetch more items for the modal view
        getUserProfile()
      ]);
      setStats(dashboardStats);
      setUserProfile(profileData);
      
      // Sort certifications: Expired first, then by days left (ascending), then Valid
      const sortedCerts = expiringData.sort((a, b) => {
        // Priority order: Expired (daysLeft < 0) -> Expiring Soon -> Valid
        const getPriorityScore = (days: number) => {
          if (days < 0) return 0; // Highest priority
          if (days <= 30) return 1; // Medium priority
          return 2; // Lowest priority
        };

        const scoreA = getPriorityScore(a.daysLeft);
        const scoreB = getPriorityScore(b.daysLeft);

        if (scoreA !== scoreB) return scoreA - scoreB;
        
        // If same priority category, sort by actual days left (ascending)
        return a.daysLeft - b.daysLeft;
      });

      setAllExpiringCerts(sortedCerts);
      setExpiringCerts(sortedCerts.slice(0, 6)); // Only show top 6 on dashboard
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle opening notification modal
  const handleNotify = (cert: ExpirationItem) => {
    // Convert ExpirationItem to CertificationDetails structure expected by modal
    const certDetails: CertificationDetails = {
      id: cert.id,
      employee: cert.employee,
      type: cert.certification,
      status: cert.daysLeft < 0 ? "Expired" : "Expiring Soon",
      expirationDate: cert.expirationDate,
      daysLeft: cert.daysLeft,
      issueDate: "" // Not available in ExpirationItem
    };
    
    setSelectedCertification(certDetails);
    setIsNotifyModalOpen(true);
  };

  const handleNotificationSuccess = () => {
    toast({
      title: "Notification Sent",
      description: "The employee has been notified successfully.",
    });
    setIsNotifyModalOpen(false);
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  // Helper function to download files from API
  const downloadReport = async (endpoint: string, filename: string, reportType: string) => {
    try {
      setExportLoading(reportType);
      
      toast({
        title: "Generating Report",
        description: `Please wait while we generate your ${reportType}...`,
      });
      
      // Get current session for authentication
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.access_token) {
        throw new Error('Authentication required. Please sign in again.');
      }

      const response = await fetch(`/api/reports/${endpoint}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: Failed to generate report`;
        
        if (response.status === 413) {
          errorMessage = 'Report is too large to generate. Try filtering your data or contact support.';
        } else if (response.status === 429) {
          errorMessage = 'Too many requests. Please wait a moment and try again.';
        } else if (response.status === 404) {
          errorMessage = 'No data found for the requested report.';
        } else {
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } catch {
            // If JSON parsing fails, use the default error message
          }
        }
        
        throw new Error(errorMessage);
      }
      
      // Get the response as a blob immediately to avoid JSON parsing issues
      const blob = await response.blob();
      
      if (blob.size === 0) {
        throw new Error('Empty file received. Report generation failed.');
      }
      
      // Validate that we got a PDF or calendar file
      if (!blob.type.includes('application/pdf') && !blob.type.includes('text/calendar')) {
        throw new Error(`Invalid file type received: ${blob.type}. Expected PDF or calendar file.`);
      }

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Export Complete",
        description: `${reportType} has been downloaded successfully.`,
        duration: 3000
      });

      // Track successful report generation
      trackReportGeneration(reportType, {
        report_type: reportType,
        file_size: blob.size,
        file_type: blob.type
      });

    } catch (error) {
      console.error(`Error exporting ${reportType}:`, error);
      toast({
        title: "Export Failed",
        description: error instanceof Error ? error.message : `Failed to export ${reportType}`,
        variant: "destructive",
        duration: 5000
      });
    } finally {
      setExportLoading(null);
    }
  };

  const handleTeamCertificationReport = async () => {
    await downloadReport(
      'team-certification',
      `team-certification-report-${new Date().toISOString().split('T')[0]}.pdf`,
      'Team Certification Report'
    );
  };

  const handleComplianceSummary = async () => {
    await downloadReport(
      'compliance-summary',
      `compliance-summary-${new Date().toISOString().split('T')[0]}.pdf`,
      'Compliance Summary'
    );
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

    // Format name: "First Last" or "First L." or just use as is
    const nameParts = displayName.split(' ');
    if (nameParts.length > 1) {
      displayName = `${nameParts[0]} ${nameParts[nameParts.length - 1][0]}.`;
    }

    return { displayName, email };
  };

  const { displayName: profileName, email: profileEmail } = getProfileDisplayInfo();

  // Get initials for avatar
  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // File Upload Logic
  const [uploadingFiles, setUploadingFiles] = useState<boolean>(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length > MAX_FILES) {
      toast({
        title: "Too many files",
        description: `Maximum ${MAX_FILES} files allowed.`,
        variant: "destructive",
      });
      return;
    }

    setUploadingFiles(true);
    let successCount = 0;
    let errorCount = 0;

    for (const file of acceptedFiles) {
      if (file.size > MAX_FILE_SIZE) {
        toast({
          title: "File too large",
          description: `File "${file.name}" exceeds 20MB limit.`,
          variant: "destructive",
        });
        errorCount++;
        continue;
      }

      try {
        await uploadCertification(file);
        successCount++;
      } catch (error) {
        console.error('Upload error:', error);
        errorCount++;
      }
    }

    setUploadingFiles(false);

    if (successCount > 0) {
      toast({
        title: "Upload Complete",
        description: `Successfully processed ${successCount} file(s).`,
      });
      loadDashboardData(); // Refresh data
      
      trackCertificationAction('upload', {
        files_count: acceptedFiles.length,
        success_count: successCount,
        error_count: errorCount,
        file_types: acceptedFiles.map(f => f.type)
      });
    }

    if (errorCount > 0) {
      toast({
        title: "Upload Issues",
        description: `${errorCount} file(s) failed to upload.`,
        variant: "destructive",
      });
    }
  }, [toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxFiles: MAX_FILES,
    disabled: uploadingFiles
  });

  return (
    <div className="font-mono bg-[#F8FAFC] text-[#050505] min-h-screen flex flex-col md:flex-row">
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Oswald:wght@400;500;700&display=swap');

        .font-mono { font-family: 'JetBrains Mono', monospace; }
        .font-display { font-family: 'Oswald', sans-serif; }

        /* Technical Grid Background */
        .bg-tech-grid {
          background-size: 40px 40px;
          background-image: 
            linear-gradient(to right, rgba(0, 56, 255, 0.05) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(0, 56, 255, 0.05) 1px, transparent 1px);
        }

        /* "Technical" Borders */
        .border-tech {
          border: 1px solid #E2E8F0;
          position: relative;
        }
        .border-tech::after {
          content: '';
          position: absolute;
          top: -1px;
          left: -1px;
          width: 10px;
          height: 10px;
          border-top: 2px solid #0038FF;
          border-left: 2px solid #0038FF;
        }

        /* Status Indicators */
        .status-badge {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.75rem;
          padding: 0.25rem 0.5rem;
          text-transform: uppercase;
          font-weight: 700;
        }
        .status-ok { background: #DCFCE7; color: #166534; }
        .status-warn { background: #FEF9C3; color: #854D0E; }
        .status-crit { background: #FEE2E2; color: #991B1B; }

        /* The "Shut Up" Button Effect */
        .btn-print {
          box-shadow: 4px 4px 0px #0038FF;
          transition: all 0.1s;
        }
        .btn-print:active {
          transform: translate(2px, 2px);
          box-shadow: 2px 2px 0px #0038FF;
        }

        /* Sidebar Collapse */
        .sidebar {
          transition: width 0.3s ease;
        }
        .sidebar.collapsed {
          width: 6rem;
        }
        .sidebar.collapsed .sidebar-text {
          opacity: 0;
          width: 0;
          overflow: hidden;
          white-space: nowrap;
        }
        .sidebar.collapsed .nav-item {
          justify-content: center;
          padding-left: 0;
          padding-right: 0;
        }
        .sidebar.collapsed .nav-item svg {
          margin: 0;
        }
      `}} />

      {/* SIDEBAR NAV */}
      <aside
        id="sidebar"
        className={`sidebar w-full md:w-64 bg-[#050505] text-white flex flex-col border-r border-[#0038FF]/20 shrink-0 ${
          sidebarCollapsed ? 'collapsed' : ''
        }`}
      >
        <div className="pt-6 pr-6 pb-6 pl-4 border-b border-white/10">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src="/IronStampLogov3.png" alt="IronStamp" className="h-8 w-auto" />
              <span className="sidebar-text font-display font-bold text-2xl tracking-tighter transition-opacity">
                IRONSTAMP
              </span>
            </div>
            <button
              onClick={toggleSidebar}
              className="hidden md:block text-gray-400 hover:text-white transition-colors p-1"
            >
              {sidebarCollapsed ? (
                <PanelLeftOpen className="w-4 h-4" />
              ) : (
                <PanelLeftClose className="w-4 h-4" />
              )}
            </button>
          </div>
          <div className="sidebar-text mt-2 text-[10px] font-mono text-gray-500 transition-opacity">
            SYS.STATUS: ONLINE
          </div>
        </div>

        <nav className="flex-1 py-4 space-y-2">
          <a
            href="#"
            className="nav-item flex items-center gap-3 px-8 py-3 bg-[#0038FF] text-white font-mono text-sm font-bold"
          >
            <Radar className="w-4 h-4" />
            <span className="sidebar-text">THE RADAR</span>
          </a>
          <a
            href="/crew"
            className="nav-item flex items-center gap-3 px-8 py-3 text-gray-400 hover:bg-white/5 hover:text-white font-mono text-sm transition-colors"
          >
            <Users className="w-4 h-4" />
            <span className="sidebar-text">THE CREW</span>
          </a>
          <a
            href="/vault"
            className="nav-item flex items-center gap-3 px-8 py-3 text-gray-400 hover:bg-white/5 hover:text-white font-mono text-sm transition-colors"
          >
            <FileCheck className="w-4 h-4" />
            <span className="sidebar-text">THE VAULT</span>
          </a>
          <a
            href="/config"
            className="nav-item flex items-center gap-3 px-8 py-3 text-gray-400 hover:bg-white/5 hover:text-white font-mono text-sm transition-colors"
          >
            <Settings className="w-4 h-4" />
            <span className="sidebar-text">CONFIG</span>
          </a>
        </nav>

        {/* User Profile Section */}
        <div className="p-4 border-t border-white/10">
          <div className={`flex items-center gap-3 px-2 py-2 ${sidebarCollapsed ? 'justify-center' : ''}`}>
            <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center flex-shrink-0">
              <span className="text-white font-mono text-sm font-bold">
                {getInitials(profileName)}
              </span>
            </div>
            <div className="flex-1 min-w-0 sidebar-text">
              <p className="text-white font-mono text-sm font-bold truncate">
                {profileName}
              </p>
              <p className="text-gray-400 font-mono text-xs truncate">
                {profileEmail}
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Action */}
        <div className="p-4 border-t border-white/10">
          <button className="nav-item w-full flex items-center justify-center gap-2 border border-white/20 text-white py-2 hover:bg-white/10 transition-colors font-mono text-xs">
            <LogOut className="w-3 h-3" />
            <span className="sidebar-text">LOGOUT</span>
          </button>
        </div>
      </aside>

      {/* MAIN INTERFACE */}
      <main className="flex-1 p-6 md:p-12 overflow-y-auto bg-tech-grid">
        {/* HEADER: "The Radar" */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
          <div>
            <p className="font-mono text-[#0038FF] text-xs mb-1">/// SYSTEM OVERVIEW ///</p>
            <h1 className="font-display text-4xl md:text-5xl font-bold uppercase">Compliance Radar</h1>
            <p className="font-mono text-gray-500 text-sm mt-2">
              Tracking {loading ? '...' : stats.totalEmployees} Technicians • {loading ? '...' : stats.activeCertifications + stats.expiredCertifications} Certifications
            </p>
          </div>

          {/* The "Shut Up" Button (One-Click Report) */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="btn-print bg-[#050505] text-white px-6 py-3 flex items-center gap-3 font-bold font-mono text-sm hover:bg-[#0038FF] transition-colors border border-[#050505]">
                <Printer className="w-4 h-4" />
                GENERATE INSPECTION REPORT
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72 font-mono">
              <DropdownMenuItem 
                onClick={handleTeamCertificationReport} 
                disabled={exportLoading === 'Team Certification Report'}
                className="flex flex-col items-start py-3 px-3"
              >
                <span className="font-bold text-sm">Team Certification Report</span>
                <span className="text-xs text-gray-500 mt-1">Complete overview of all team certifications (PDF)</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={handleComplianceSummary} 
                disabled={exportLoading === 'Compliance Summary'}
                className="flex flex-col items-start py-3 px-3"
              >
                <span className="font-bold text-sm">Compliance Summary</span>
                <span className="text-xs text-gray-500 mt-1">Executive summary with statistics and recommendations (PDF)</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        {/* TOP STATS (Technical Cards) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Stat 1: Critical */}
          <div className="bg-white p-6 border-tech shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Siren className="w-12 h-12 text-red-600" />
            </div>
            <p className="font-mono text-xs text-gray-500 uppercase">Critical Alerts</p>
            <div className="font-display text-5xl font-bold text-red-600 mt-2">
              {loading ? '-' : String(stats.expiredCertifications).padStart(2, '0')}
            </div>
            <p className="font-mono text-xs text-red-600 mt-2 font-bold">
              {stats.expiredCertifications > 0 ? '/// IMMEDIATE ACTION REQUIRED ///' : 'SYSTEM STABLE'}
            </p>
          </div>

          {/* Stat 2: Expiring Soon */}
          <div className="bg-white p-6 border-tech shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Clock className="w-12 h-12 text-yellow-600" />
            </div>
            <p className="font-mono text-xs text-gray-500 uppercase">Expiring &lt; 30 Days</p>
            <div className="font-display text-5xl font-bold text-yellow-600 mt-2">
              {loading ? '-' : String(stats.expiringSoon).padStart(2, '0')}
            </div>
            <p className="font-mono text-xs text-yellow-600 mt-2">Auto-reminders sent.</p>
          </div>

          {/* Stat 3: Active Certifications */}
          <div className="bg-white p-6 border-tech shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <ShieldCheck className="w-12 h-12 text-green-600" />
            </div>
            <p className="font-mono text-xs text-gray-500 uppercase">Active Certifications</p>
            <div className="font-display text-5xl font-bold text-green-600 mt-2">
              {loading ? '-' : stats.activeCertifications}
            </div>
            <p className="font-mono text-xs text-green-600 mt-2">Up to date.</p>
          </div>
        </div>

        {/* THE FEED: "Live Wire" */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Action Items */}
          <div className="lg:col-span-2">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-display text-2xl font-bold uppercase flex items-center gap-2">
                <Zap className="w-5 h-5 text-[#0038FF]" /> Live Wire
              </h2>
              
              <Dialog>
                <DialogTrigger asChild>
                  <button className="text-[#0038FF] font-mono text-xs font-bold hover:underline">VIEW ALL &gt;</button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-white p-0 gap-0 rounded-none border-2 border-[#050505] shadow-[8px_8px_0px_#0038FF]">
                  <DialogHeader className="p-6 border-b border-gray-100 bg-gray-50 sticky top-0 z-10 flex flex-row items-center justify-between">
                    <DialogTitle className="font-display text-2xl font-bold uppercase flex items-center gap-2">
                      <Zap className="w-5 h-5 text-[#0038FF]" /> Live Wire // All Systems
                    </DialogTitle>
                    <DialogClose className="text-gray-400 hover:text-[#050505] transition-colors">
                      <Plus className="w-6 h-6 rotate-45" />
                    </DialogClose>
                  </DialogHeader>
                  
                  <div className="bg-white">
                    {/* Header Row */}
                    <div className="grid grid-cols-12 gap-4 p-4 border-b border-gray-200 bg-gray-50 font-mono text-xs text-gray-500 font-bold uppercase sticky top-[73px] z-10">
                      <div className="col-span-4">Technician</div>
                      <div className="col-span-4">Certification</div>
                      <div className="col-span-2">Status</div>
                      <div className="col-span-2 text-right">Action</div>
                    </div>

                    {allExpiringCerts.map((cert) => {
                      // Determine visual style based on priority
                      let rowClass = "hover:bg-gray-50 transition-colors";
                      let statusBadgeClass = "status-ok";
                      let statusText = "VALID";
                      let actionText = "VIEW";
                      let actionClass = "text-gray-400 cursor-default";

                      if (cert.daysLeft < 0) {
                        rowClass = "hover:bg-red-50/30 transition-colors";
                        statusBadgeClass = "status-crit";
                        statusText = "EXPIRED";
                        actionText = "FIX NOW";
                        actionClass = "text-[#0038FF] hover:underline cursor-pointer";
                      } else if (cert.daysLeft <= 30) {
                        rowClass = "hover:bg-yellow-50/30 transition-colors";
                        statusBadgeClass = "status-warn";
                        statusText = `${cert.daysLeft} DAYS`;
                        actionText = "PING";
                        actionClass = "text-[#0038FF] hover:underline cursor-pointer";
                      }

                      return (
                        <div key={cert.id} className={`grid grid-cols-12 gap-4 p-4 border-b border-gray-100 items-center ${rowClass}`}>
                          <div className="col-span-4 flex items-center gap-3">
                            <div className={`w-8 h-8 flex items-center justify-center font-mono text-xs font-bold ${cert.daysLeft < 0 ? 'bg-[#050505] text-white' : 'bg-gray-200 text-gray-600'}`}>
                              {cert.employee.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
                            </div>
                            <span className="font-bold text-sm truncate">{cert.employee}</span>
                          </div>
                          <div className="col-span-4 font-mono text-xs truncate" title={cert.certification}>
                            {cert.certification}
                          </div>
                          <div className="col-span-2">
                            <span className={`status-badge ${statusBadgeClass}`}>{statusText}</span>
                          </div>
                          <div className="col-span-2 text-right">
                            <button 
                              className={`font-mono text-xs font-bold ${actionClass}`}
                              onClick={() => {
                                if (actionText === "FIX NOW" || actionText === "PING") {
                                  handleNotify(cert);
                                }
                              }}
                            >
                              {actionText}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="bg-white border border-gray-200 shadow-sm">
              {/* Header Row */}
              <div className="grid grid-cols-12 gap-4 p-4 border-b border-gray-200 bg-gray-50 font-mono text-xs text-gray-500 font-bold uppercase">
                <div className="col-span-4">Technician</div>
                <div className="col-span-4">Certification</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-2 text-right">Action</div>
              </div>

              {loading ? (
                <div className="p-8 text-center text-gray-500 font-mono text-sm">
                  Loading live data...
                </div>
              ) : expiringCerts.length === 0 ? (
                <div className="p-8 text-center text-gray-500 font-mono text-sm">
                  All systems nominal. No immediate actions required.
                </div>
              ) : (
                expiringCerts.map((cert) => {
                  // Determine visual style based on priority
                  let rowClass = "hover:bg-gray-50 transition-colors";
                  let statusBadgeClass = "status-ok";
                  let statusText = "VALID";
                  let actionText = "VIEW";
                  let actionClass = "text-gray-400 cursor-default";

                  if (cert.daysLeft < 0) {
                    rowClass = "hover:bg-red-50/30 transition-colors";
                    statusBadgeClass = "status-crit";
                    statusText = "EXPIRED";
                    actionText = "FIX NOW";
                    actionClass = "text-[#0038FF] hover:underline cursor-pointer";
                  } else if (cert.daysLeft <= 30) {
                    rowClass = "hover:bg-yellow-50/30 transition-colors";
                    statusBadgeClass = "status-warn";
                    statusText = `${cert.daysLeft} DAYS`;
                    actionText = "PING";
                    actionClass = "text-[#0038FF] hover:underline cursor-pointer";
                  }

                  return (
                    <div key={cert.id} className={`grid grid-cols-12 gap-4 p-4 border-b border-gray-100 items-center ${rowClass}`}>
                      <div className="col-span-4 flex items-center gap-3">
                        <div className={`w-8 h-8 flex items-center justify-center font-mono text-xs font-bold ${cert.daysLeft < 0 ? 'bg-[#050505] text-white' : 'bg-gray-200 text-gray-600'}`}>
                          {cert.employee.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
                        </div>
                        <span className="font-bold text-sm truncate">{cert.employee}</span>
                      </div>
                      <div className="col-span-4 font-mono text-xs truncate" title={cert.certification}>
                        {cert.certification}
                      </div>
                      <div className="col-span-2">
                        <span className={`status-badge ${statusBadgeClass}`}>{statusText}</span>
                      </div>
                      <div className="col-span-2 text-right">
                        <button 
                          className={`font-mono text-xs font-bold ${actionClass}`}
                          onClick={() => {
                            if (actionText === "FIX NOW" || actionText === "PING") {
                              handleNotify(cert);
                            }
                          }}
                        >
                          {actionText}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Quick Upload */}
          <div className="lg:col-span-1">
            <h2 className="font-display text-2xl font-bold uppercase mb-6 flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-[#0038FF]" /> Ingest
            </h2>

            <div 
              {...getRootProps()}
              className={`bg-white border-2 border-dashed ${isDragActive ? 'border-[#0038FF] bg-[#0038FF]/5' : 'border-[#0038FF]/30'} p-8 flex flex-col items-center justify-center text-center hover:bg-[#0038FF]/5 transition-colors cursor-pointer group relative overflow-hidden`}
            >
              <input {...getInputProps()} />
              
              {uploadingFiles && (
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
                  <Loader2 className="w-8 h-8 text-[#0038FF] animate-spin" />
                </div>
              )}

              <div className="w-16 h-16 bg-[#0038FF]/10 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Plus className="w-8 h-8 text-[#0038FF]" />
              </div>
              <h3 className="font-bold text-lg">Drop Cert Here</h3>
              <p className="font-mono text-xs text-gray-500 mt-2">or snap a photo from mobile.</p>
            </div>
            
            <div className="mt-2 text-[10px] text-gray-400 font-mono text-center">
              SUPPORTED: PDF, DOCX, JPG, PNG • MAX 4 FILES (20MB)
            </div>

            {/* Recent Syncs */}
            <div className="mt-8">
              <p className="font-mono text-xs text-gray-400 uppercase mb-4">/// RECENT SYNC LOG ///</p>
              <div className="space-y-3">
                <div className="flex items-start gap-3 text-sm">
                  <Check className="w-4 h-4 text-green-500 mt-0.5" />
                  <div>
                    <span className="font-bold">Roger D.</span> synced <span className="text-gray-500">EPA 608</span>
                    <div className="text-xs text-gray-400 font-mono">10:42 AM</div>
                  </div>
                </div>
                <div className="flex items-start gap-3 text-sm">
                  <Check className="w-4 h-4 text-green-500 mt-0.5" />
                  <div>
                    <span className="font-bold">Admin</span> updated <span className="text-gray-500">Company Insurance</span>
                    <div className="text-xs text-gray-400 font-mono">09:15 AM</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Notify Certification Modal */}
      <NotifyCertificationModal
        isOpen={isNotifyModalOpen}
        onClose={() => setIsNotifyModalOpen(false)}
        onSuccess={handleNotificationSuccess}
        certification={selectedCertification}
        managers={['manager@company.com', 'supervisor@company.com']} // Mock manager emails
      />
    </div>
  );
}
