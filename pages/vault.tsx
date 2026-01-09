import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  Radar,
  Users,
  FileCheck,
  Settings,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Upload,
  ChevronLeft,
  ChevronRight,
  FileText,
  Image,
  Trash2,
  Calendar,
  Paperclip,
  Loader2,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getAllCertifications, getUserProfile, type CertificationDetails, type UserProfile } from '@/lib/data-service';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { AddCertificationModal } from '@/components/AddCertificationModal';
import { deleteCertificationFile } from '@/lib/certification-service';
import { EditCertificationModal } from '@/components/EditCertificationModal';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface VaultDocument {
  id: string;
  name: string;
  technician: string;
  expDate: string;
  expDateStatus: 'expired' | 'warning' | 'valid' | 'lifetime';
  type: 'PDF' | 'JPG';
  category: string;
  hasDocument: boolean;
  fileUrl?: string;
}

export default function Vault() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('ALL DOCS');
  const [certifications, setCertifications] = useState<CertificationDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [editingCert, setEditingCert] = useState<CertificationDetails | null>(null);
  const [deletingCertId, setDeletingCertId] = useState<string | null>(null);
  const [uploadingCertId, setUploadingCertId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const onChangeFiredRef = useRef<boolean>(false);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [viewingCertId, setViewingCertId] = useState<string | null>(null);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [signedUrlExpiresAt, setSignedUrlExpiresAt] = useState<number | null>(null);
  const [loadingSignedUrl, setLoadingSignedUrl] = useState(false);
  const [viewerError, setViewerError] = useState<string | null>(null);
  const [viewingCertData, setViewingCertData] = useState<CertificationDetails | null>(null);
  const lastApiCallRef = useRef<number>(0);
  const signedUrlTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile>({
    companyName: null,
    teamSize: null,
    businessFocus: null,
    onboardingCompleted: false,
    userEmail: null
  });
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const nameRefs = useRef<Map<string, HTMLSpanElement>>(new Map());
  const [hasOverflow, setHasOverflow] = useState<Map<string, boolean>>(new Map());

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
      await supabase.auth.signOut();
      window.location.href = '/';
    } catch (error) {
      // Clear the flag if logout fails
      sessionStorage.removeItem('intentional_logout');
      console.error('Error logging out:', error);
      toast({
        title: "Logout Failed",
        description: "There was an error logging out. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Map certification type to category
  const getCategoryFromType = (type: string): string => {
    const upperType = type.toUpperCase();
    if (upperType.includes('EPA') || upperType.includes('608')) return 'EPA 608';
    if (upperType.includes('OSHA')) return 'OSHA';
    if (upperType.includes('LICENSE') || upperType.includes('LICENSED')) return 'STATE LICENSES';
    if (upperType.includes('INSURANCE')) return 'INSURANCE';
    if (upperType.includes('NATE')) return 'NATE';
    if (upperType.includes('HEAT PUMP') || upperType.includes('MASS SAVE')) return 'HEAT PUMP / MASS SAVE';
    if (upperType.includes('MANUFACTURER')) return 'MANUFACTURER';
    if (upperType.includes('SAFETY') || upperType.includes('PERMIT')) return 'SAFETY';
    if (upperType.includes('BOILER') || upperType.includes('HYDRONIC')) return 'BOILER / HYDRONICS';
    if (upperType.includes('COMMERCIAL')) return 'COMMERCIAL';
    return 'OTHER';
  };

  // Convert certifications to vault documents with proper error handling
  const convertToVaultDocuments = useCallback((certs: CertificationDetails[]): VaultDocument[] => {
    return certs.map(cert => {
      const daysLeft = cert.daysLeft;
      const isLifetime = cert.isLifetime || daysLeft === Infinity;
      let expDateStatus: 'expired' | 'warning' | 'valid' | 'lifetime' = 'valid';
      let expDate = '';
      
      // Validate and format expiration date
      try {
        // Handle lifetime certifications first
        if (isLifetime) {
          expDate = 'LIFETIME';
          expDateStatus = 'lifetime';
        } else if (!cert.expirationDate) {
          expDate = 'No date';
          expDateStatus = 'expired';
        } else {
          const date = new Date(cert.expirationDate);
          if (isNaN(date.getTime())) {
            expDate = 'Invalid date';
            expDateStatus = 'expired';
          } else {
            if (daysLeft < 0) {
              expDateStatus = 'expired';
              expDate = `EXPIRED (${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`;
            } else if (daysLeft <= 30) {
              expDateStatus = 'warning';
              expDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            } else {
              expDateStatus = 'valid';
              expDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            }
          }
        }
      } catch (error) {
        console.error('Error formatting date:', error);
        expDate = 'Invalid date';
        expDateStatus = 'expired';
      }

      // Use certification type as the name (not filename)
      const certType = cert.type || 'Certification';
      const employeeName = cert.employee || 'Unknown';
      
      // Validate file URL - check for empty strings
      const hasDocument = !!(cert.fileUrl && cert.fileUrl.trim().length > 0);
      
      // Determine file type from extension only if document exists
      let type: 'PDF' | 'JPG' = 'PDF';
      if (hasDocument && cert.fileName) {
        const fileName = cert.fileName;
        const fileExt = fileName.includes('.') 
          ? fileName.split('.').pop()?.toUpperCase() || 'PDF'
          : 'PDF';
        type = (fileExt === 'JPG' || fileExt === 'JPEG' || fileExt === 'PNG') ? 'JPG' : 'PDF';
      }

      return {
        id: cert.id,
        name: certType, // Use certification type instead of filename
        technician: employeeName,
        expDate,
        expDateStatus,
        type,
        category: getCategoryFromType(certType),
        hasDocument,
        fileUrl: hasDocument ? cert.fileUrl : undefined,
      };
    });
  }, []);

  // Fetch certifications and user profile
  const loadCertifications = useCallback(async () => {
    if (!user && !authLoading) {
      setLoading(false);
      return;
    }
    
    if (user) {
      try {
        setLoading(true);
        const [certs, profileData] = await Promise.all([
          getAllCertifications(),
          getUserProfile()
        ]);
        setCertifications(certs);
        setUserProfile(profileData);
      } catch (error) {
        console.error('Error loading data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load data',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    }
  }, [user, authLoading, toast]);

  useEffect(() => {
    loadCertifications();
  }, [loadCertifications]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (uploadTimeoutRef.current) {
        clearTimeout(uploadTimeoutRef.current);
      }
    };
  }, []);

  const documents = useMemo(() => convertToVaultDocuments(certifications), [certifications, convertToVaultDocuments]);

  // Check for overflow on name elements
  useEffect(() => {
    const checkOverflow = () => {
      const newOverflow = new Map<string, boolean>();
      nameRefs.current.forEach((element, certId) => {
        if (element) {
          newOverflow.set(certId, element.scrollWidth > element.clientWidth);
        }
      });
      setHasOverflow(newOverflow);
    };

    checkOverflow();
    window.addEventListener('resize', checkOverflow);
    return () => window.removeEventListener('resize', checkOverflow);
  }, [documents]);

  const categories = [
    'ALL DOCS',
    'EPA 608',
    'OSHA',
    'STATE LICENSES',
    'INSURANCE',
    'NATE',
    'HEAT PUMP / MASS SAVE',
    'MANUFACTURER',
    'SAFETY',
    'BOILER / HYDRONICS',
    'COMMERCIAL',
    'OTHER',
  ];

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.technician.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeTab === 'ALL DOCS' || doc.category === activeTab;
    return matchesSearch && matchesCategory;
  });

  const handleUploadSuccess = useCallback(async () => {
    // Reload certifications after successful upload
    try {
      const certs = await getAllCertifications();
      setCertifications(certs);
      toast({
        title: 'Success',
        description: 'Certification uploaded successfully',
      });
    } catch (error) {
      console.error('Error reloading certifications:', error);
      toast({
        title: 'Warning',
        description: 'Certification uploaded but failed to refresh list',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const handleDeleteCert = useCallback(async (certId: string) => {
    // Find the certification to check if it has a file
    const cert = certifications.find(c => c.id === certId);
    const hasFile = cert?.hasDocument;

    if (!hasFile) {
      toast({
        title: 'No File',
        description: 'This certification has no file to delete.',
        variant: 'destructive',
      });
      return;
    }

    if (!window.confirm('Are you sure you want to delete the file for this certification? The certification record will remain, but the file will be permanently deleted.')) {
      return;
    }

    try {
      setDeletingCertId(certId);
      await deleteCertificationFile(certId);
      await loadCertifications();
      toast({
        title: 'Success',
        description: 'File deleted successfully. The certification record remains.',
      });
    } catch (error) {
      console.error('Error deleting file:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete file',
        variant: 'destructive',
      });
    } finally {
      setDeletingCertId(null);
    }
  }, [certifications, loadCertifications, toast]);

  const handleEditSuccess = useCallback(async () => {
    setEditingCert(null);
    await loadCertifications();
  }, [loadCertifications]);

  const handleUploadClick = useCallback((certId: string) => {
    setUploadingCertId(certId);
    onChangeFiredRef.current = false; // Reset the flag
    
    // Clear any existing timeout
    if (uploadTimeoutRef.current) {
      clearTimeout(uploadTimeoutRef.current);
    }
    
    // Set a very long fallback timeout (30 seconds) only as a safety net
    // This should rarely trigger since onChange always fires (even on cancel)
    uploadTimeoutRef.current = setTimeout(() => {
      // Only reset if onChange never fired (edge case)
      if (!onChangeFiredRef.current) {
        setUploadingCertId(null);
      }
    }, 30000);
    
    fileInputRef.current?.click();
  }, []);

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    const certId = uploadingCertId;
    
    // Mark that onChange has fired
    onChangeFiredRef.current = true;
    
    // Clear the timeout since onChange has fired
    if (uploadTimeoutRef.current) {
      clearTimeout(uploadTimeoutRef.current);
      uploadTimeoutRef.current = null;
    }
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    // If no file selected (user canceled), reset state immediately
    if (!file || !certId) {
      setUploadingCertId(null);
      return;
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/jpg',
      'image/png'
    ];

    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'Invalid File Type',
        description: 'Please upload PDF, DOC, DOCX, JPG, or PNG files only.',
        variant: 'destructive',
      });
      setUploadingCertId(null);
      return;
    }

    // Validate file size (5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast({
        title: 'File Too Large',
        description: 'File size must be less than 5MB.',
        variant: 'destructive',
      });
      setUploadingCertId(null);
      return;
    }

    // Find the certification to get current data
    const cert = certifications.find(c => c.id === certId);
    if (!cert) {
      toast({
        title: 'Error',
        description: 'Certification not found.',
        variant: 'destructive',
      });
      setUploadingCertId(null);
      return;
    }

    // Upload the file using the update API
    try {
      // Get current session for authentication
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.access_token) {
        throw new Error('Authentication required. Please sign in again.');
      }

      // Get CSRF token
      const { getCSRFToken } = await import('@/lib/csrf-client');
      const csrfToken = await getCSRFToken();

      // Create form data with current certification data and new file
      const formData = new FormData();
      formData.append('file', file);
      formData.append('certificationId', certId);
      formData.append('certificationName', cert.type);
      formData.append('employeeName', cert.employee);
      formData.append('issueDate', cert.issueDate || '');
      formData.append('expirationDate', cert.expirationDate || '');
      formData.append('isLifetime', String(!!cert.isLifetime));
      formData.append('priority', cert.priority || 'medium');
      formData.append('notes', cert.notes || '');

      // Call the update API
      const response = await fetch('/api/certifications/update', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'X-CSRF-Token': csrfToken,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `Failed to upload file (${response.status})`);
      }

      toast({
        title: 'Success',
        description: 'File uploaded successfully',
      });

      // Reload certifications to show the new file
      await loadCertifications();
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload Failed',
        description: error instanceof Error ? error.message : 'Failed to upload file. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setUploadingCertId(null);
    }
  }, [uploadingCertId, certifications, toast, loadCertifications]);

  const handleViewFile = useCallback(async (certId: string) => {
    // Prevent race conditions: don't allow multiple simultaneous calls
    if (loadingSignedUrl) {
      return;
    }

    // Rate limiting: prevent API calls more frequently than once per 500ms
    const now = Date.now();
    const timeSinceLastCall = now - lastApiCallRef.current;
    if (timeSinceLastCall < 500) {
      return;
    }
    lastApiCallRef.current = now;

    try {
      // Re-fetch certification data to avoid stale data in modal title
      const cert = certifications.find(c => c.id === certId);
      if (cert) {
        setViewingCertData(cert);
      } else {
        // If cert not found in current list, try to fetch fresh data
        try {
          const freshCerts = await getAllCertifications();
          const freshCert = freshCerts.find(c => c.id === certId);
          if (freshCert) {
            setViewingCertData(freshCert);
            // Update certifications list if it changed
            setCertifications(freshCerts);
          } else {
            setViewingCertData(null);
          }
        } catch (error) {
          console.error('Error fetching fresh cert data:', error);
          setViewingCertData(cert || null);
        }
      }

      setViewingCertId(certId);
      setIsViewerOpen(true);
      setLoadingSignedUrl(true);
      setViewerError(null);
      setSignedUrl(null);
      setSignedUrlExpiresAt(null);
      
      // Clear any existing timeout
      if (signedUrlTimeoutRef.current) {
        clearTimeout(signedUrlTimeoutRef.current);
        signedUrlTimeoutRef.current = null;
      }

      // Get current session for authentication
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.access_token) {
        throw new Error('Authentication required. Please sign in again.');
      }

      // Fetch signed URL from secure API endpoint
      const response = await fetch(`/api/certifications/view/${certId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `Failed to load file (${response.status})`);
      }

      const data = await response.json();
      setSignedUrl(data.signedUrl);
      
      // Set expiration time (1 hour = 3600 seconds)
      const expiresAt = Date.now() + (data.expiresIn * 1000 || 3600000);
      setSignedUrlExpiresAt(expiresAt);
      
      // Clear signed URL after expiration to prevent memory leaks
      const timeUntilExpiration = data.expiresIn * 1000 || 3600000;
      signedUrlTimeoutRef.current = setTimeout(() => {
        setSignedUrl(null);
        setSignedUrlExpiresAt(null);
        setViewerError('File access has expired. Please close and reopen to view again.');
      }, timeUntilExpiration);
    } catch (error) {
      console.error('Error loading file:', error);
      setViewerError(error instanceof Error ? error.message : 'Failed to load file');
      // Don't show toast on initial error - let user retry via button
      // Toast will only show on retry attempts
    } finally {
      setLoadingSignedUrl(false);
    }
  }, [loadingSignedUrl, certifications]);

  const handleRetryViewFile = useCallback(() => {
    if (viewingCertId && !loadingSignedUrl) {
      handleViewFile(viewingCertId);
    }
  }, [viewingCertId, loadingSignedUrl, handleViewFile]);

  const handleCloseViewer = useCallback(() => {
    setIsViewerOpen(false);
    setViewingCertId(null);
    setSignedUrl(null);
    setSignedUrlExpiresAt(null);
    setViewerError(null);
    setViewingCertData(null);
    
    // Clear timeout when modal closes to prevent memory leaks
    if (signedUrlTimeoutRef.current) {
      clearTimeout(signedUrlTimeoutRef.current);
      signedUrlTimeoutRef.current = null;
    }
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (signedUrlTimeoutRef.current) {
        clearTimeout(signedUrlTimeoutRef.current);
      }
    };
  }, []);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const scrollTabs = (direction: 'left' | 'right') => {
    if (tabsContainerRef.current) {
      tabsContainerRef.current.scrollBy({
        left: direction === 'left' ? -200 : 200,
        behavior: 'smooth',
      });
    }
  };

  const getExpDateColor = (status: string) => {
    switch (status) {
      case 'expired':
        return 'text-red-600';
      case 'warning':
        return 'text-yellow-600';
      case 'valid':
        return 'text-green-600';
      case 'lifetime':
        return 'text-indigo-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="font-mono bg-[#F8FAFC] text-[#050505] min-h-screen flex flex-col md:flex-row">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Oswald:wght@400;500;700&display=swap');

        .font-mono { font-family: 'JetBrains Mono', monospace; }
        .font-display { font-family: 'Oswald', sans-serif; }

        .bg-tech-grid {
          background-size: 40px 40px;
          background-image: 
            linear-gradient(to right, rgba(0, 56, 255, 0.05) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(0, 56, 255, 0.05) 1px, transparent 1px);
        }

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

        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      {/* SIDEBAR */}
      <aside
        id="sidebar"
        className={`sidebar w-full md:w-64 bg-[#050505] text-white flex flex-col border-r border-[#0038FF]/20 shrink-0 ${
          sidebarCollapsed ? 'collapsed' : ''
        }`}
      >
        <div className="pt-6 pr-6 pb-6 pl-4 border-b border-white/10">
          <div className="flex items-center justify-between">
            <Link href="/DashboardV2" className="flex items-center gap-2">
              <img src="/IronStampLogov3.png" alt="IronStamp" className="h-8 w-auto" />
              <span className="sidebar-text font-display font-bold text-2xl tracking-tighter transition-opacity">
                IRONSTAMP
              </span>
            </Link>
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
            className="nav-item flex items-center gap-3 px-8 py-3 text-gray-400 hover:bg-white/5 hover:text-white font-mono text-sm transition-colors"
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
            className="nav-item flex items-center gap-3 px-8 py-3 bg-[#0038FF] text-white font-mono text-sm font-bold"
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
            <p className="font-mono text-[#0038FF] text-xs mb-1">{'///'} DOCUMENT ARCHIVE {'///'}</p>
            <h1 className="font-display text-4xl md:text-5xl font-bold uppercase">The Vault</h1>
            <p className="font-mono text-gray-500 text-sm mt-2">
              Secure Storage • {filteredDocuments.length} Documents
            </p>
          </div>
          <div className="flex gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="SEARCH BY TECH OR CERT ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 font-mono text-xs focus:outline-none focus:border-[#0038FF] focus:ring-1 focus:ring-[#0038FF] shadow-sm"
              />
            </div>
            <button 
              onClick={() => setIsUploadModalOpen(true)}
              className="bg-[#050505] text-white px-6 py-3 flex items-center gap-3 font-bold font-mono text-sm hover:bg-[#0038FF] transition-colors border border-[#050505] shadow-[4px_4px_0px_#0038FF]"
            >
              <Upload className="w-4 h-4" /> UPLOAD
            </button>
          </div>
        </header>

        {/* Filter Tabs Container */}
        <div className="relative mb-8 border-b border-gray-200">
          {/* Scroll Buttons */}
          <button
            onClick={() => scrollTabs('left')}
            className="absolute left-0 top-0 bottom-0 z-10 bg-gradient-to-r from-[#F8FAFC] via-[#F8FAFC] to-transparent px-2 hidden md:flex items-center text-gray-400 hover:text-[#0038FF] transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => scrollTabs('right')}
            className="absolute right-0 top-0 bottom-0 z-10 bg-gradient-to-l from-[#F8FAFC] via-[#F8FAFC] to-transparent px-2 hidden md:flex items-center text-gray-400 hover:text-[#0038FF] transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Tabs List */}
          <div
            ref={tabsContainerRef}
            className="flex gap-4 pb-1 overflow-x-auto scrollbar-hide px-8 scroll-smooth"
          >
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveTab(category)}
                className={`px-4 py-2 font-mono text-xs font-bold whitespace-nowrap flex-shrink-0 transition-colors ${
                  activeTab === category
                    ? 'text-[#0038FF] border-b-2 border-[#0038FF]'
                    : 'text-gray-400 hover:text-[#050505]'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Document List */}
        <div className="bg-white border-tech shadow-sm">
          {/* Header */}
          <div className="grid grid-cols-12 gap-3 p-4 border-b border-gray-200 bg-gray-50 font-mono text-xs text-gray-500 font-bold uppercase">
            <div className="col-span-4">Certification Name</div>
            <div className="col-span-3">Technician</div>
            <div className="col-span-2">Exp. Date</div>
            <div className="col-span-1 text-center">Type</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>

          {/* Document Rows */}
          {loading ? (
            <div className="p-8 text-center">
              <Loader2 className="w-6 h-6 animate-spin text-[#0038FF] mx-auto mb-2" />
              <p className="font-mono text-xs text-gray-500">Loading certifications...</p>
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="p-8 text-center">
              <FileCheck className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="font-mono text-sm text-gray-500">
                {searchTerm || activeTab !== 'ALL DOCS' 
                  ? 'No certifications match your filters' 
                  : 'No certifications yet. Upload your first certification to get started.'}
              </p>
            </div>
          ) : (
            filteredDocuments.map((doc) => (
              <div
                key={doc.id}
                className="grid grid-cols-12 gap-3 p-4 border-b border-gray-100 items-center hover:bg-gray-50 transition-colors group last:border-b-0"
              >
                <div className="col-span-4 flex items-center gap-2 min-w-0">
                  {doc.type === 'PDF' ? (
                    <FileText className="w-4 h-4 text-[#0038FF] flex-shrink-0" />
                  ) : (
                    <Image className="w-4 h-4 text-[#0038FF] flex-shrink-0" aria-label="Image file" />
                  )}
                  <div className="flex items-center gap-2 min-w-0 flex-1 relative">
                    <div className="flex-1 min-w-0 relative">
                      <span
                        ref={(el) => {
                          if (el) nameRefs.current.set(doc.id, el);
                          else nameRefs.current.delete(doc.id);
                        }}
                        className="font-bold text-sm whitespace-nowrap overflow-x-auto overflow-y-hidden scrollbar-hide block"
                        title={doc.name}
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                      >
                        {doc.name}
                      </span>
                      {hasOverflow.get(doc.id) && (
                        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-r from-transparent via-white to-white group-hover:via-gray-50 group-hover:to-gray-50 pointer-events-none" />
                      )}
                    </div>
                    {doc.hasDocument && (
                      <span title="Document attached" className="flex-shrink-0">
                        <Paperclip className="w-3.5 h-3.5 text-green-600" />
                      </span>
                    )}
                  </div>
                </div>
                <div className="col-span-3 font-mono text-xs truncate" title={doc.technician}>{doc.technician}</div>
                <div className={`col-span-2 font-mono text-xs font-bold ${getExpDateColor(doc.expDateStatus)}`}>
                  {doc.expDate}
                </div>
                <div className="col-span-1 text-center">
                  <div className="flex items-center justify-center gap-1">
                    {doc.hasDocument ? (
                      <span className="bg-gray-100 text-gray-600 px-2 py-1 text-[10px] font-bold rounded">
                        {doc.type}
                      </span>
                    ) : (
                      <span className="bg-yellow-100 text-yellow-700 px-1.5 py-0.5 text-[9px] font-bold rounded" title="No document attached">
                        NO DOC
                      </span>
                    )}
                  </div>
                </div>
                <div className="col-span-2 text-right flex items-center justify-end gap-2 flex-shrink-0">
                  {doc.hasDocument ? (
                    <button
                      onClick={() => handleViewFile(doc.id)}
                      disabled={loadingSignedUrl}
                      className="text-[#0038FF] font-mono text-xs font-bold hover:underline whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                      title="View certification document"
                    >
                      {loadingSignedUrl ? 'LOADING...' : 'VIEW'}
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleUploadClick(doc.id)}
                      disabled={uploadingCertId === doc.id}
                      className="text-[#0038FF] font-mono text-xs font-bold hover:underline whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Upload document for this certification"
                    >
                      {uploadingCertId === doc.id ? 'UPLOADING...' : 'UPLOAD'}
                    </button>
                  )}
                  <button 
                    onClick={() => handleDeleteCert(doc.id)}
                    disabled={deletingCertId === doc.id}
                    className="text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 p-1"
                    title="Delete file (keeps certification record)"
                  >
                    {deletingCertId === doc.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Hidden file input for direct upload */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
        onChange={handleFileSelect}
      />

      {/* Upload Modal */}
      <AddCertificationModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSuccess={handleUploadSuccess}
      />

      {/* Edit/Upload Document Modal */}
      {editingCert && (
        <EditCertificationModal
          isOpen={!!editingCert}
          onClose={() => setEditingCert(null)}
          onSuccess={handleEditSuccess}
          certification={editingCert}
          employees={Array.from(new Set(certifications.map(c => c.employee)))}
        />
      )}

      {/* File Viewer Modal */}
      <Dialog open={isViewerOpen} onOpenChange={handleCloseViewer}>
        <DialogContent className="max-w-5xl max-h-[90vh] p-0 gap-0 rounded-none border-2 border-[#050505] shadow-[8px_8px_0px_#0038FF] bg-white">
          <DialogHeader className="p-6 border-b border-gray-200 bg-gray-50">
            <DialogTitle className="font-display text-xl font-bold uppercase flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#0038FF]" />
              {viewingCertData 
                ? `${viewingCertData.type} - ${viewingCertData.employee}`
                : viewingCertId 
                ? 'View Certification'
                : 'View Certification'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="p-6 bg-white overflow-auto" style={{ maxHeight: 'calc(90vh - 100px)' }}>
            {loadingSignedUrl ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-[#0038FF] mb-4" />
                <p className="font-mono text-sm text-gray-600">Loading secure file...</p>
              </div>
            ) : viewerError ? (
              <div className="flex flex-col items-center justify-center py-12">
                <FileText className="w-12 h-12 text-red-500 mb-4" />
                <p className="font-mono text-sm text-red-600 font-bold">{viewerError}</p>
                <p className="font-mono text-xs text-gray-500 mt-4 mb-4">Please try again or contact support if the issue persists.</p>
                <button
                  onClick={handleRetryViewFile}
                  disabled={loadingSignedUrl}
                  className="bg-[#0038FF] text-white px-6 py-2 font-mono text-xs font-bold hover:bg-[#0028CC] transition-colors border-2 border-[#050505] shadow-[4px_4px_0px_#050505] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingSignedUrl ? 'RETRYING...' : 'RETRY'}
                </button>
              </div>
            ) : signedUrl && viewingCertId ? (() => {
              // Use viewingCertData for fresh data, fallback to certifications list
              const cert = viewingCertData || certifications.find(c => c.id === viewingCertId);
              const doc = documents.find(d => d.id === viewingCertId);
              
              // Check if signed URL has expired
              const isExpired = signedUrlExpiresAt && Date.now() >= signedUrlExpiresAt;
              if (isExpired) {
                return (
                  <div className="flex flex-col items-center justify-center py-12">
                    <FileText className="w-12 h-12 text-yellow-500 mb-4" />
                    <p className="font-mono text-sm text-yellow-600 font-bold">File access has expired</p>
                    <p className="font-mono text-xs text-gray-500 mt-2 mb-4">Please close and reopen to view the file again.</p>
                    <button
                      onClick={handleCloseViewer}
                      className="bg-[#0038FF] text-white px-6 py-2 font-mono text-xs font-bold hover:bg-[#0028CC] transition-colors border-2 border-[#050505] shadow-[4px_4px_0px_#050505]"
                    >
                      CLOSE
                    </button>
                  </div>
                );
              }
              const fileType = doc?.type === 'JPG' ? 'image' : 'pdf';
              
              // Check if file is large (over 10MB)
              const fileSizeMB = cert?.fileSize ? cert.fileSize / (1024 * 1024) : 0;
              const isLargeFile = fileSizeMB > 10;
              
              return (
                <div className="flex flex-col gap-4">
                  {isLargeFile && (
                    <div className="bg-yellow-50 border-2 border-yellow-200 p-4 font-mono text-xs">
                      <p className="font-bold text-yellow-800 mb-2">
                        ⚠️ LARGE FILE DETECTED ({fileSizeMB.toFixed(1)} MB)
                      </p>
                      <p className="text-yellow-700 mb-3">
                        This file may take longer to load. For better performance, consider downloading it instead.
                      </p>
                      <a
                        href={signedUrl}
                        download={cert?.fileName || 'certification'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block bg-[#0038FF] text-white px-4 py-2 font-bold hover:bg-[#0028CC] transition-colors border-2 border-[#050505] shadow-[4px_4px_0px_#050505]"
                      >
                        DOWNLOAD FILE
                      </a>
                    </div>
                  )}
                  <div className={isLargeFile ? 'opacity-75' : ''}>
                    {fileType === 'image' ? (
                      <div className="flex items-center justify-center">
                        <img 
                          src={signedUrl} 
                          alt="Certification document"
                          className="max-w-full max-h-[70vh] object-contain border-2 border-gray-200"
                          loading="lazy"
                        />
                      </div>
                    ) : (
                      <iframe
                        src={signedUrl}
                        className="w-full h-[70vh] border-2 border-gray-200"
                        title="Certification document"
                        loading="lazy"
                      />
                    )}
                  </div>
                </div>
              );
            })() : null}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
