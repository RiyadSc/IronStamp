import { Search, Plus, Mail, Phone, Filter, MoreHorizontal, Edit, Eye, Archive, Trash2, LogOut, User, ChevronDown } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sidebar } from "@/components/Sidebar";

import { AddTeamMemberModal } from "@/components/AddTeamMemberModal";
import { EditTeamMemberModal } from "@/components/EditTeamMemberModal";
import { formatDateToAmerican } from "@/lib/utils";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/lib/supabase";
import { useEffect, useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { getTeamMembersWithCerts, type TeamMember, getEmployeeCertificationSummary, type CertificationDetails, type EmployeeCertificationSummary, deleteTeamMember, archiveTeamMember, restoreTeamMember, getUserProfile, type UserProfile } from "@/lib/data-service";
import { useAuth } from "@/hooks/useAuth";

// Use TeamMember interface from data-service.ts

const getInitials = (name: string) => {
  const parts = name.split(' ');
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

const Team = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile>({
    companyName: null,
    teamSize: null,
    businessFocus: null,
    onboardingCompleted: false,
    userEmail: null,
    licenseNumber: null,
    businessAddress: null,
    phoneNumber: null,
    businessEmail: null
  });
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Edit modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  
  // Delete/Archive/Restore confirmation states
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [archiveConfirmOpen, setArchiveConfirmOpen] = useState(false);
  const [restoreConfirmOpen, setRestoreConfirmOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Certs modal state
  const [viewCertsFor, setViewCertsFor] = useState<TeamMember | null>(null);
  const [certsLoading, setCertsLoading] = useState(false);
  const [employeeCerts, setEmployeeCerts] = useState<CertificationDetails[] | null>(null);

  // Track if we've loaded data to prevent unnecessary re-loads on tab switches
  const loadedUserRef = useRef<string | null>(null);
  const hasLoadedRef = useRef(false);

  const fetchTeamMembers = async () => {
    try {
      setLoading(true);
      const [teamData, profileData] = await Promise.all([
        getTeamMembersWithCerts(),
        getUserProfile()
      ]);
      setTeamMembers(teamData);
      setUserProfile(profileData);
      hasLoadedRef.current = true; // Mark as successfully loaded
    } catch (error: any) {
      console.error('Error fetching team members:', error);
      toast({
        title: "Error loading team members",
        description: error.message || "Failed to load team members. Please try again.",
        variant: "destructive",
      });
      // Don't mark as loaded on error so it can retry
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only load data if:
    // 1. We have a user
    // 2. We haven't loaded data yet OR the user has changed
    if (user) {
      const currentUserId = user.id;
      const shouldLoad = !hasLoadedRef.current || loadedUserRef.current !== currentUserId;
      
      if (shouldLoad) {
        loadedUserRef.current = currentUserId;
        fetchTeamMembers();
      } else {
        // User is the same and data is already loaded, just set loading to false
        setLoading(false);
      }
    } else {
      // No user - reset everything
      setTeamMembers([]);
      setLoading(false);
      hasLoadedRef.current = false;
      loadedUserRef.current = null;
    }
  }, [user]);

  // Force refresh function (for when team members are actually added/updated)
  const refreshTeamMembers = async () => {
    hasLoadedRef.current = false;
    await fetchTeamMembers();
  };

  // Handle logout
  const handleLogout = () => {
    window.location.href = '/';
  };

  // Generate display name and subtitle based on profile data
  const getDisplayInfo = () => {
    let displayName = 'Team Management';
    let subtitle = 'User';

    if (userProfile.companyName) {
      displayName = userProfile.companyName;
      
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
      displayName = 'Team Management';
      subtitle = userProfile.userEmail;
    } else if (user?.email) {
      // Ultimate fallback to auth user email
      displayName = 'Team Management';
      subtitle = user.email;
    }

    return { displayName, subtitle };
  };

  const { displayName, subtitle } = getDisplayInfo();

  // Fetch certs when modal opens
  useEffect(() => {
    if (viewCertsFor) {
      setCertsLoading(true);
      getEmployeeCertificationSummary().then((summaries) => {
        const found = summaries.find(s => s.employeeName === viewCertsFor.name);
        setEmployeeCerts(found ? found.certifications : []);
      }).finally(() => setCertsLoading(false));
    } else {
      setEmployeeCerts(null);
    }
  }, [viewCertsFor]);



  const handleAddTeamMember = () => {
    setIsModalOpen(true);
  };

  const handleTeamMemberAdded = () => {
    refreshTeamMembers(); // Refresh the list when someone is actually added
  };

  const handleTeamMemberUpdated = () => {
    refreshTeamMembers(); // Refresh the list when someone is actually updated
    toast({
      title: "Team Member Updated",
      description: "Team member information has been updated successfully.",
    });
  };

  // Menu actions
  const handleEditMember = (member: TeamMember) => {
    setEditingMember(member);
    setIsEditModalOpen(true);
  };

  const handleViewCerts = (member: TeamMember) => {
    setViewCertsFor(member);
  };

  const handleDeleteMember = (member: TeamMember) => {
    setSelectedMember(member);
    setDeleteConfirmOpen(true);
  };

  const handleArchiveMember = (member: TeamMember) => {
    setSelectedMember(member);
    setArchiveConfirmOpen(true);
  };

  const handleRestoreMember = (member: TeamMember) => {
    setSelectedMember(member);
    setRestoreConfirmOpen(true);
  };

  const confirmDeleteMember = async () => {
    if (!selectedMember) return;
    
    setDeleteLoading(true);
    try {
      // Delete the team member and archive their certifications
      await deleteTeamMember(selectedMember.id);
      
      toast({
        title: "Employee Removed",
        description: `${selectedMember.name} has been removed from your team and their certifications have been archived.`,
        variant: "destructive",
      });
      
      setDeleteConfirmOpen(false);
      setSelectedMember(null);
      refreshTeamMembers();
    } catch (error) {
      console.error('Error deleting team member:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to remove employee. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  const confirmArchiveMember = async () => {
    if (!selectedMember) return;
    
    setDeleteLoading(true);
    try {
      // Archive the team member (set status to archived, keep certifications active)
      await archiveTeamMember(selectedMember.id);
      
      toast({
        title: "Employee Archived",
        description: `${selectedMember.name} has been archived and moved to inactive status.`,
      });
      
      setArchiveConfirmOpen(false);
      setSelectedMember(null);
      refreshTeamMembers();
    } catch (error) {
      console.error('Error archiving team member:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to archive employee. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  const confirmRestoreMember = async () => {
    if (!selectedMember) return;
    
    setDeleteLoading(true);
    try {
      // Restore the team member (set status back to active)
      await restoreTeamMember(selectedMember.id);
      
      toast({
        title: "Employee Restored",
        description: `${selectedMember.name} has been restored to active status.`,
      });
      
      setRestoreConfirmOpen(false);
      setSelectedMember(null);
      refreshTeamMembers();
    } catch (error) {
      console.error('Error restoring team member:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to restore employee. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  // Filter team members based on archived status and search query
  const filteredMembers = teamMembers.filter(member => {
    const matchesArchiveStatus = showArchived ? member.status === 'Archived' : member.status !== 'Archived';
    
    if (!searchQuery.trim()) {
      return matchesArchiveStatus;
    }
    
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      member.name.toLowerCase().includes(searchLower) ||
      member.role?.toLowerCase().includes(searchLower) ||
      member.email?.toLowerCase().includes(searchLower);
    
    return matchesArchiveStatus && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100/50 flex">
      <Sidebar />
      
      <main className="flex-1 overflow-auto">
        {/* Header with User Profile Dropdown */}
        <div className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 px-4 sm:px-6 py-6 sticky top-0 z-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Team Members</h1>
                <p className="text-gray-600 mt-1 text-base sm:text-lg">Manage your HVAC team and their certifications</p>
              </div>
              
              {/* User Profile Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="flex-shrink-0 bg-gradient-to-br from-white to-gray-50 p-2 sm:p-3 rounded-lg sm:rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 h-auto self-start"
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
          
          {/* Action Buttons */}
          <div className="flex items-center space-x-3 mt-4">
            <Button 
              variant="outline" 
              onClick={() => setShowArchived(!showArchived)}
              className="ios-button border-gray-200 hover:bg-gray-50 min-h-[44px]"
            >
              <Archive className="w-4 h-4 mr-2" />
              {showArchived ? 'Show Active' : 'Show Archived'}
            </Button>
            <Button variant="outline" className="ios-button border-gray-200 hover:bg-gray-50 min-h-[44px] hidden sm:flex">
              <Mail className="w-4 h-4 mr-2" />
              Send Reminder
            </Button>
            <Button 
              onClick={handleAddTeamMember}
              className="ios-button bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md min-h-[44px]"
            >
              <Plus className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Add Team Member</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="px-4 sm:px-6 py-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
            <Card className="ios-card hover:shadow-md transition-all duration-200">
              <CardContent className="p-4 sm:p-6">
                <div>
                  <p className="text-xs sm:text-sm font-semibold text-gray-600 mb-2">
                    {showArchived ? 'Archived' : 'Active'} Members
                  </p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                    {teamMembers.filter(member => showArchived ? member.status === 'Archived' : member.status !== 'Archived').length}
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 sm:p-6">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Total Certs</p>
                  <p className="text-xl sm:text-2xl font-bold text-green-600">
                    {teamMembers.filter(member => showArchived ? member.status === 'Archived' : member.status !== 'Archived').reduce((sum, member) => sum + member.certificationsCount, 0)}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-600">Newest Member</p>
                    <p className="text-xl sm:text-2xl font-bold text-blue-600 truncate">
                      {(() => {
                        const relevantMembers = teamMembers.filter(member => showArchived ? member.status === 'Archived' : member.status !== 'Archived');
                        return relevantMembers.length > 0 ? relevantMembers[0].name.split(' ')[0] : 'None';
                      })()}
                    </p>
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">recently added</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-600">This Month</p>
                    <p className="text-xl sm:text-2xl font-bold text-orange-600">
                      {teamMembers.filter(member => {
                        const matchesArchiveStatus = showArchived ? member.status === 'Archived' : member.status !== 'Archived';
                        const created = new Date(member.created_at);
                        const now = new Date();
                        const isThisMonth = created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
                        return matchesArchiveStatus && isThisMonth;
                      }).length}
                    </p>
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">new additions</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Search and Filter */}
          <div className="space-y-4 mb-8">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input 
                  placeholder="Search by name, role, or email..." 
                  className="ios-input pl-11 min-h-[44px]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button variant="outline" className="ios-button border-gray-200 hover:bg-gray-50 min-h-[44px]">
                <Filter className="w-4 h-4 mr-2" />
                Export Data
              </Button>
            </div>

          </div>

          {/* Team Members Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 pb-6">
            {loading ? (
              <div className="col-span-full flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading team members...</p>
                </div>
              </div>
            ) : filteredMembers.length === 0 ? (
              <div className="col-span-full flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    {showArchived ? <Archive className="w-8 h-8 text-gray-400" /> : <Plus className="w-8 h-8 text-gray-400" />}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {showArchived ? 'No archived members' : 'No team members yet'}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {showArchived 
                      ? 'All your team members are currently active.' 
                      : 'Get started by adding your first team member.'
                    }
                  </p>
                  {!showArchived && (
                    <Button onClick={handleAddTeamMember} className="bg-blue-600 hover:bg-blue-700 min-h-[44px]">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Team Member
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              filteredMembers.map((member) => (
                <Card key={member.id} className="ios-card hover:shadow-md transition-all duration-200">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <Avatar className="h-12 w-12 flex-shrink-0">
                          <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold">
                            {getInitials(member.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-gray-900 truncate">{member.name}</h3>
                          <p className="text-sm text-gray-600 truncate">{member.role}</p>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 flex-shrink-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => handleEditMember(member)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleViewCerts(member)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Certs
                          </DropdownMenuItem>
                          {!showArchived && (
                            <DropdownMenuItem onClick={() => handleArchiveMember(member)}>
                              <Archive className="mr-2 h-4 w-4" />
                              Archive Employee
                            </DropdownMenuItem>
                          )}
                          {showArchived && (
                            <DropdownMenuItem onClick={() => handleRestoreMember(member)}>
                              <Archive className="mr-2 h-4 w-4" />
                              Restore Employee
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem 
                            onClick={() => handleDeleteMember(member)}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Employee
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      {member.email && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Mail className="h-4 w-4 mr-2 flex-shrink-0" />
                          <span className="truncate">{member.email}</span>
                        </div>
                      )}
                      {member.phone && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Phone className="h-4 w-4 mr-2 flex-shrink-0" />
                          <span className="truncate">{member.phone}</span>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-base sm:text-lg font-semibold text-blue-600">
                          {member.certificationsCount}
                        </div>
                        <div className="text-xs text-gray-600">Certifications</div>
                      </div>
                      <div className="text-center">
                        <div className="text-base sm:text-lg font-semibold text-gray-900">
                          {formatDateToAmerican(member.created_at)}
                        </div>
                        <div className="text-xs text-gray-600">Joined</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <Badge className={`${
                        member.status === 'Active' 
                          ? 'bg-green-100 text-green-800 hover:bg-green-100'
                          : 'bg-gray-100 text-gray-800 hover:bg-gray-100'
                      }`}>
                        {member.status}
                      </Badge>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleViewCerts(member)}
                        className="min-h-[36px]"
                      >
                        Certs & Info
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Delete Confirmation Dialog */}
          <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle className="flex items-center text-red-600">
                  <Trash2 className="w-5 h-5 mr-2" />
                  Remove Employee
                </DialogTitle>
                <DialogDescription className="text-left space-y-3">
                  <p className="font-medium text-gray-900">
                    Are you sure you want to remove {selectedMember?.name} from your team?
                  </p>
                  <div className="text-sm text-gray-600">
                    <p className="font-medium mb-2">This will:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Archive their certifications</li>
                      <li>Remove them from compliance reports</li>
                    </ul>
                    <p className="mt-3 text-xs text-gray-500">
                      You can restore this user within 30 days.
                    </p>
                  </div>
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={confirmDeleteMember}
                  disabled={deleteLoading}
                >
                  {deleteLoading ? 'Removing...' : 'Delete Employee'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Archive Confirmation Dialog */}
          <Dialog open={archiveConfirmOpen} onOpenChange={setArchiveConfirmOpen}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle className="flex items-center text-orange-600">
                  <Archive className="w-5 h-5 mr-2" />
                  Archive Employee
                </DialogTitle>
                <DialogDescription className="text-left">
                  <p className="text-gray-900 mb-3">
                    Are you sure you want to archive <strong>{selectedMember?.name}</strong>?
                  </p>
                  <p className="text-sm text-gray-600">
                    This will remove them from active dashboards and reports, but their data will remain accessible. 
                    You can restore them anytime from the archived team view.
                  </p>
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setArchiveConfirmOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={confirmArchiveMember}
                  disabled={deleteLoading}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  {deleteLoading ? 'Archiving...' : 'Archive'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Restore Confirmation Dialog */}
          <Dialog open={restoreConfirmOpen} onOpenChange={setRestoreConfirmOpen}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle className="flex items-center text-green-600">
                  <Archive className="w-5 h-5 mr-2" />
                  Restore Employee
                </DialogTitle>
                <DialogDescription className="text-left">
                  <p className="text-gray-900 mb-3">
                    Are you sure you want to restore <strong>{selectedMember?.name}</strong>?
                  </p>
                  <p className="text-sm text-gray-600">
                    This will return them to active status and they will appear in active dashboards and reports again.
                  </p>
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setRestoreConfirmOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={confirmRestoreMember}
                  disabled={deleteLoading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {deleteLoading ? 'Restoring...' : 'Restore'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Add Team Member Modal */}
          <AddTeamMemberModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onTeamMemberAdded={handleTeamMemberAdded}
          />

          {/* Edit Team Member Modal */}
          <EditTeamMemberModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            onSuccess={handleTeamMemberUpdated}
            teamMember={editingMember}
          />

          {/* Certs Modal/Card */}
          <Dialog open={!!viewCertsFor} onOpenChange={open => { if (!open) setViewCertsFor(null); }}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Certifications for {viewCertsFor?.name}</DialogTitle>
              </DialogHeader>
              {certsLoading ? (
                <div className="py-8 text-center text-gray-500">Loading certifications...</div>
              ) : employeeCerts && employeeCerts.length > 0 ? (
                <div className="space-y-4">
                  {employeeCerts.map(cert => (
                    <div key={cert.id} className="border rounded-lg p-4 flex flex-col gap-1 bg-gray-50">
                      <div className="font-semibold text-gray-900">{cert.type}</div>
                      <div className="text-xs text-gray-600">Start: {cert.issueDate ? formatDateToAmerican(cert.issueDate) : 'N/A'}</div>
                      <div className="text-xs text-gray-600">Expiry: {cert.expirationDate ? formatDateToAmerican(cert.expirationDate) : 'N/A'}</div>
                      <div className="text-xs text-gray-500">Status: {cert.status}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <div className="text-gray-700 font-medium mb-2">{viewCertsFor?.name} currently holds no certifications.</div>
                  <Button onClick={() => setIsModalOpen(true)} className="mt-2">Add Certification</Button>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </main>
    </div>
  );
};

export default Team;
