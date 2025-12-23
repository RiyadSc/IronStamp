import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  Radar,
  Users,
  FileCheck,
  Settings,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  UserPlus,
  MoreVertical,
  Pencil,
  Archive,
  Trash2,
  Calendar
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { 
  getTeamMembersWithCerts, 
  getEmployeeCertificationSummary,
  getUserProfile,
  deleteTeamMember,
  type TeamMember,
  type EmployeeCertificationSummary,
  type UserProfile
} from '@/lib/data-service';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/csrf-client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Technician {
  id: string;
  initials: string;
  name: string;
  status: 'NON-COMPLIANT' | 'ACTION REQUIRED' | 'COMPLIANT';
  statusColor: 'red' | 'yellow' | 'green';
  certifications: {
    name: string;
    status: 'EXPIRED' | 'VALID' | string;
    statusType: 'crit' | 'warn' | 'ok';
  }[];
}

const modalLoading = (label: string) => {
  const LoadingComponent = (_props: any) => (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50">
      <div className="bg-white border-2 border-[#050505] shadow-[8px_8px_0px_#0038FF] p-6">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-[#0038FF] border-t-transparent rounded-full animate-spin" />
          <p className="font-mono text-xs text-gray-600 uppercase tracking-wider">{label}</p>
        </div>
      </div>
    </div>
  );
  LoadingComponent.displayName = `ModalLoading(${label})`;
  return LoadingComponent;
};

// Lazy-load modals so Crew route loads fast; they mount only when opened.
const AddCrewMemberModal = dynamic(
  () => import('@/components/AddCrewMemberModal').then((m) => m.AddCrewMemberModal),
  { ssr: false, loading: modalLoading('LOADING ADD TECH...') }
);
const CrewTechnicianProfileModal = dynamic(
  () => import('@/components/CrewTechnicianProfileModal').then((m) => m.CrewTechnicianProfileModal),
  { ssr: false, loading: modalLoading('LOADING PROFILE...') }
);
const EditCrewMemberModal = dynamic(
  () => import('@/components/EditCrewMemberModal').then((m) => m.EditCrewMemberModal),
  { ssr: false, loading: modalLoading('LOADING EDITOR...') }
);
const ConfirmActionModal = dynamic(
  () => import('@/components/ConfirmActionModal').then((m) => m.ConfirmActionModal),
  { ssr: false, loading: modalLoading('LOADING CONFIRMATION...') }
);

// Helper function to get initials (safely handles whitespace and empty parts)
const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  if (parts.length === 1 && parts[0].length > 0) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return '??'; // Fallback for empty/invalid names
};

// Helper function to determine technician status and process certifications
const processTechnicianData = (teamMembers: TeamMember[], certSummaries: EmployeeCertificationSummary[]): Technician[] => {
  return teamMembers
    .filter(member => member.status !== 'Archived') // Only show active members
    .map(member => {
      const employeeCerts = certSummaries.find(s => s.employeeName === member.name);
      
      let status: 'NON-COMPLIANT' | 'ACTION REQUIRED' | 'COMPLIANT' = 'COMPLIANT';
      let statusColor: 'red' | 'yellow' | 'green' = 'green';
      
      const certifications = employeeCerts?.certifications?.map(cert => {
        let statusText = 'VALID';
        let statusType: 'crit' | 'warn' | 'ok' = 'ok';
        
        if (cert.daysLeft < 0) {
          statusText = 'EXPIRED';
          statusType = 'crit';
        } else if (cert.daysLeft <= 30) {
          statusText = `${cert.daysLeft} DAYS`;
          statusType = 'warn';
        }
        
        return {
          name: cert.type,
          status: statusText,
          statusType
        };
      }) || [];
      
      // Determine overall status
      const hasNoCerts = certifications.length === 0;
      const hasExpired = certifications.some(c => c.statusType === 'crit');
      const hasExpiringSoon = certifications.some(c => c.statusType === 'warn');
      
      if (hasNoCerts || hasExpired) {
        status = 'NON-COMPLIANT';
        statusColor = 'red';
      } else if (hasExpiringSoon) {
        status = 'ACTION REQUIRED';
        statusColor = 'yellow';
      }
      
      return {
        id: member.id,
        initials: getInitials(member.name),
        name: member.name,
        status,
        statusColor,
        certifications: certifications.slice(0, 3) // Show first 3 certifications
      };
    });
};

export default function Crew() {
  const { user } = useAuth();
  const { toast } = useToast();
  // Keep a stable ref to toast for use in async callbacks (avoids stale closures).
  const toastRef = useRef<typeof toast | null>(null);
  toastRef.current = toast;
  
  // Helper to safely call toast via ref (stable reference via useCallback)
  const showToast: typeof toast = useCallback((props) => {
    if (toastRef.current) {
      return toastRef.current(props);
    }
    return { id: '', dismiss: () => {}, update: () => {} };
  }, []);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [certSummaries, setCertSummaries] = useState<EmployeeCertificationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'archive' | 'delete'>('archive');
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile>({
    companyName: null,
    teamSize: null,
    businessFocus: null,
    onboardingCompleted: false,
    userEmail: null
  });

  // Fetch team members and their certifications
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [teamMembers, certSummaries, profileData] = await Promise.all([
        getTeamMembersWithCerts(),
        getEmployeeCertificationSummary(),
        getUserProfile()
      ]);
      
      setTeamMembers(teamMembers);
      setCertSummaries(certSummaries);

      const processedData = processTechnicianData(teamMembers, certSummaries);
      setTechnicians(processedData);
      setUserProfile(profileData);
    } catch (error: any) {
      console.error('Error fetching crew data:', error);
      showToast({
        title: "Error loading crew",
        description: error.message || "Failed to load crew members. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (user) {
      fetchData();
    } else {
      setTechnicians([]);
      setLoading(false);
    }
  }, [user, fetchData]);

  const handleAddTeamMember = () => {
    setIsAddModalOpen(true);
  };

  const handleTeamMemberAdded = () => {
    fetchData(); // Refresh the list
  };

  const handleOpenProfile = (techId: string) => {
    const member = teamMembers.find((m) => m.id === techId) ?? null;
    setSelectedMember(member);
    setIsProfileModalOpen(true);
  };

  const handleEditMember = (techId: string) => {
    const member = teamMembers.find((m) => m.id === techId) ?? null;
    setSelectedMember(member);
    setIsEditModalOpen(true);
  };

  const handleArchiveMember = (techId: string) => {
    const member = teamMembers.find((m) => m.id === techId) ?? null;
    setSelectedMember(member);
    setConfirmAction('archive');
    setIsConfirmModalOpen(true);
  };

  const handleDeleteMember = (techId: string) => {
    const member = teamMembers.find((m) => m.id === techId) ?? null;
    setSelectedMember(member);
    setConfirmAction('delete');
    setIsConfirmModalOpen(true);
  };

  const executeArchive = async (): Promise<boolean> => {
    // Capture member at invocation time to avoid stale references during async operations
    const member = selectedMember;
    if (!member) return false;
    
    try {
      // apiRequest handles Authorization header automatically via supabase session
      const response = await apiRequest('/api/team/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: member.id,
          name: member.name,
          email: member.email,
          phone: member.phone,
          role: member.role,
          status: 'Archived'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || 'Failed to archive team member');
      }

      // Refresh data before showing success (await to ensure UI updates before modal closes)
      try {
        await fetchData();
      } catch (refreshError) {
        console.warn('Data refresh failed after archive:', refreshError);
        // Continue to success - the archive operation itself succeeded
      }

      showToast({
        title: "Technician Archived",
        description: `${member.name} has been archived and removed from the active crew.`,
      });

      return true;
    } catch (error: any) {
      console.error('Error archiving crew member:', error);
      showToast({
        title: "Error",
        description: error.message || "Failed to archive team member.",
        variant: "destructive"
      });
      return false;
    }
  };

  const executeDelete = async (): Promise<boolean> => {
    // Capture member at invocation time to avoid stale references during async operations
    const member = selectedMember;
    if (!member) return false;
    
    try {
      // Use the data-service function which properly:
      // 1. Filters by user_id for security
      // 2. Archives related certifications before deleting
      await deleteTeamMember(member.id);

      // Refresh data before showing success (await to ensure UI updates before modal closes)
      try {
        await fetchData();
      } catch (refreshError) {
        console.warn('Data refresh failed after delete:', refreshError);
        // Continue to success - the delete operation itself succeeded
      }

      showToast({
        title: "Technician Deleted",
        description: `${member.name} has been permanently removed.`,
      });

      return true;
    } catch (error: any) {
      console.error('Error deleting crew member:', error);
      showToast({
        title: "Error",
        description: error.message || "Failed to delete team member.",
        variant: "destructive"
      });
      return false;
    }
  };

  const filteredTechnicians = technicians.filter(tech =>
    tech.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

    // Format name: "First Last" or "First L." or just use as is
    // Safely handle trailing/extra spaces by trimming and filtering empty parts
    const nameParts = displayName.trim().split(/\s+/).filter(Boolean);
    if (nameParts.length > 1 && nameParts[nameParts.length - 1].length > 0) {
      displayName = `${nameParts[0]} ${nameParts[nameParts.length - 1][0]}.`;
    } else if (nameParts.length === 1) {
      displayName = nameParts[0];
    } else {
      // Fallback for whitespace-only or empty names
      displayName = 'User';
    }

    return { displayName, email };
  };

  const { displayName: profileName, email: profileEmail } = getProfileDisplayInfo();

  // Handle logout
  const handleLogout = async () => {
    try {
      // Set flag to indicate intentional logout (prevents "Session Expired" screen)
      sessionStorage.setItem('intentional_logout', 'true');
      const { supabase } = await import('@/lib/supabase');
      await supabase.auth.signOut();
      window.location.href = '/';
    } catch (error) {
      // Clear the flag if logout fails
      sessionStorage.removeItem('intentional_logout');
      console.error('Error logging out:', error);
      showToast({
        title: "Logout Failed",
        description: "There was an error logging out. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="font-mono bg-[#F8FAFC] text-[#050505] min-h-screen flex flex-col md:flex-row">
      {/* SIDEBAR */}
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
          <Link
            href="/DashboardV2"
            className="nav-item flex items-center gap-3 px-8 py-3 text-gray-400 hover:bg-white/5 hover:text-white font-mono text-sm transition-colors"
          >
            <Radar className="w-4 h-4" />
            <span className="sidebar-text">THE RADAR</span>
          </Link>
          <Link
            href="/Crew"
            className="nav-item flex items-center gap-3 px-8 py-3 bg-[#0038FF] text-white font-mono text-sm font-bold"
          >
            <Users className="w-4 h-4" />
            <span className="sidebar-text">THE CREW</span>
          </Link>
          <Link
            href="/calendar-demo"
            className="nav-item flex items-center gap-3 px-8 py-3 text-gray-400 hover:bg-white/5 hover:text-white font-mono text-sm transition-colors"
          >
            <Calendar className="w-4 h-4" />
            <span className="sidebar-text">CALENDAR</span>
          </Link>
          <Link
            href="/vault"
            className="nav-item flex items-center gap-3 px-8 py-3 text-gray-400 hover:bg-white/5 hover:text-white font-mono text-sm transition-colors"
          >
            <FileCheck className="w-4 h-4" />
            <span className="sidebar-text">THE VAULT</span>
          </Link>
          <Link
            href="/config"
            className="nav-item flex items-center gap-3 px-8 py-3 text-gray-400 hover:bg-white/5 hover:text-white font-mono text-sm transition-colors"
          >
            <Settings className="w-4 h-4" />
            <span className="sidebar-text">CONFIG</span>
          </Link>
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
          <button 
            onClick={handleLogout}
            className="nav-item w-full flex items-center justify-center gap-2 border border-white/20 text-white py-2 hover:bg-white/10 transition-colors font-mono text-xs"
          >
            <LogOut className="w-3 h-3" />
            <span className="sidebar-text">LOGOUT</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-6 md:p-12 overflow-y-auto bg-tech-grid">
        <header className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
          <div>
            <p className="font-mono text-[#0038FF] text-xs mb-1">{`/// PERSONNEL ROSTER ///`}</p>
            <h1 className="font-display text-4xl md:text-5xl font-bold uppercase">The Crew</h1>
            <p className="font-mono text-gray-500 text-sm mt-2">
              Active Field Technicians: <span id="crew-count">{filteredTechnicians.length}</span>
            </p>
          </div>

          <div className="flex gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <input
                type="text"
                id="crew-search"
                placeholder="SEARCH ROSTER..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 font-mono text-xs focus:outline-none focus:border-[#0038FF] focus:ring-1 focus:ring-[#0038FF] shadow-sm"
              />
            </div>
            <button 
              onClick={handleAddTeamMember}
              className="bg-[#050505] text-white px-6 py-3 flex items-center gap-3 font-bold font-mono text-sm hover:bg-[#0038FF] transition-colors border border-[#050505] shadow-[4px_4px_0px_#0038FF]"
            >
              <UserPlus className="w-4 h-4" /> ADD TECH
            </button>
          </div>
        </header>

        {/* Crew Grid */}
        <div id="crew-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full flex items-center justify-center py-12">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-[#0038FF] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="font-mono text-gray-600">LOADING CREW DATA...</p>
              </div>
            </div>
          ) : filteredTechnicians.length === 0 ? (
            <div className="col-span-full flex items-center justify-center py-12">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="font-display text-lg font-semibold text-gray-900 mb-2">
                  {searchTerm ? 'NO MATCHING TECHNICIANS' : 'NO CREW MEMBERS YET'}
                </h3>
                <p className="font-mono text-gray-600 text-sm mb-4">
                  {searchTerm 
                    ? 'Try adjusting your search criteria.' 
                    : 'Get started by adding your first team member from the Team page.'
                  }
                </p>
              </div>
            </div>
          ) : (
            filteredTechnicians.map((tech) => (
            <div
              key={tech.id}
              className="crew-card bg-white border-tech p-6 hover:shadow-lg transition-shadow group cursor-pointer relative overflow-hidden"
            >
              <div
                className={`absolute top-0 right-0 w-2 h-full ${
                  tech.statusColor === 'red'
                    ? 'bg-red-500'
                    : tech.statusColor === 'yellow'
                    ? 'bg-yellow-400'
                    : 'bg-green-500'
                }`}
              ></div>
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div
                    className={`w-12 h-12 flex items-center justify-center font-mono font-bold text-lg ${
                      tech.statusColor === 'green'
                        ? 'bg-gray-200 text-gray-600'
                        : 'bg-[#050505] text-white'
                    }`}
                  >
                    {tech.initials}
                  </div>
                  <div>
                    <h3 className="font-display text-xl font-bold group-hover:text-[#0038FF] transition-colors">
                      {tech.name}
                    </h3>
                    <p
                      className={`font-mono text-xs font-bold ${
                        tech.statusColor === 'red'
                          ? 'text-red-600'
                          : tech.statusColor === 'yellow'
                          ? 'text-yellow-600'
                          : 'text-green-600'
                      }`}
                    >
                      {tech.status}
                    </p>
                  </div>
                </div>
                
                {/* Actions Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button 
                      className="p-1 hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="font-mono text-xs rounded-none border-2 border-[#050505] shadow-[4px_4px_0px_#0038FF]">
                    <DropdownMenuItem 
                      onClick={(e) => { e.stopPropagation(); handleEditMember(tech.id); }}
                      className="cursor-pointer"
                    >
                      <Pencil className="w-4 h-4 mr-2" />
                      EDIT PROFILE
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={(e) => { e.stopPropagation(); handleArchiveMember(tech.id); }}
                      className="cursor-pointer text-yellow-600 focus:text-yellow-600"
                    >
                      <Archive className="w-4 h-4 mr-2" />
                      ARCHIVE
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={(e) => { e.stopPropagation(); handleDeleteMember(tech.id); }}
                      className="cursor-pointer text-red-600 focus:text-red-600"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      DELETE
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="space-y-3 font-mono text-xs">
                {tech.certifications.map((cert, idx) => (
                  <div key={idx} className="flex justify-between items-center">
                    <span className="text-gray-500">{cert.name}</span>
                    <span
                      className={`status-badge ${
                        cert.statusType === 'crit'
                          ? 'status-crit'
                          : cert.statusType === 'warn'
                          ? 'status-warn'
                          : 'status-ok'
                      }`}
                    >
                      {cert.status}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-4 border-t border-gray-100 flex gap-2">
                <button
                  onClick={() => handleOpenProfile(tech.id)}
                  className="flex-1 py-2 text-xs font-bold border border-gray-200 hover:bg-gray-50"
                >
                  PROFILE
                </button>
                {tech.statusColor === 'red' && (
                  <button className="flex-1 py-2 text-xs font-bold bg-red-50 text-red-600 hover:bg-red-100 border border-red-100">
                    NOTIFY
                  </button>
                )}
                {tech.statusColor === 'yellow' && (
                  <button className="flex-1 py-2 text-xs font-bold bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border border-yellow-100">
                    REMIND
                  </button>
                )}
                {tech.statusColor === 'green' && (
                  <button className="flex-1 py-2 text-xs font-bold text-gray-400 cursor-default">
                    NO ACTION
                  </button>
                )}
              </div>
            </div>
          ))
          )}
        </div>

        {/* Add Crew Member Modal (lazy-loaded) */}
        {isAddModalOpen && (
          <AddCrewMemberModal
            isOpen={isAddModalOpen}
            onClose={() => setIsAddModalOpen(false)}
            onSuccess={handleTeamMemberAdded}
          />
        )}

        {/* Technician Profile Modal (lazy-loaded) */}
        {isProfileModalOpen && (
          <CrewTechnicianProfileModal
            isOpen={isProfileModalOpen}
            onClose={() => setIsProfileModalOpen(false)}
            member={selectedMember}
            summaries={certSummaries}
          />
        )}

        {/* Edit Crew Member Modal (lazy-loaded) */}
        {isEditModalOpen && (
          <EditCrewMemberModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            onSuccess={fetchData}
            member={selectedMember}
          />
        )}

        {/* Confirm Archive/Delete Modal (lazy-loaded) */}
        {isConfirmModalOpen && (
          <ConfirmActionModal
            isOpen={isConfirmModalOpen}
            onClose={() => setIsConfirmModalOpen(false)}
            onConfirm={confirmAction === 'archive' ? executeArchive : executeDelete}
            title={confirmAction === 'archive' ? 'Archive Technician' : 'Delete Technician'}
            message={
              confirmAction === 'archive'
                ? `Are you sure you want to archive this technician? They will be removed from the active crew roster but their records will be preserved.`
                : `Are you sure you want to permanently delete this technician? This will remove all their data from the system.`
            }
            confirmLabel={confirmAction === 'archive' ? 'ARCHIVE' : 'DELETE'}
            type={confirmAction}
            technicianName={selectedMember?.name}
          />
        )}
      </main>
    </div>
  );
}

