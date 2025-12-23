import { Plus, Filter, Download, AlertTriangle, CheckCircle, XCircle, ChevronDown, ChevronRight, User, Bell } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sidebar } from "@/components/Sidebar";
import { AddCertificationModal } from "@/components/AddCertificationModal";
import React, { useState, useEffect, useMemo, useRef } from "react";
import { getEmployeeCertificationSummary, getCertificationStats, type EmployeeCertificationSummary, type CertificationDetails } from "@/lib/data-service";
import { EditCertificationModal } from "@/components/EditCertificationModal";
import { NotifyCertificationModal } from "@/components/NotifyCertificationModal";
import { useAuth } from "@/hooks/useAuth";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

const getStatusBadge = (status: string) => {
  switch (status) {
    case "Active":
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100 rounded-full px-2 py-0.5 font-medium text-xs"><CheckCircle className="w-2 h-2 mr-1" />Active</Badge>;
    case "Expiring Soon":
      return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100 rounded-full px-2 py-0.5 font-medium text-xs"><AlertTriangle className="w-2 h-2 mr-1" />Expiring</Badge>;
    case "Expired":
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-100 rounded-full px-2 py-0.5 font-medium text-xs"><XCircle className="w-2 h-2 mr-1" />Expired</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

const getCountBadge = (count: number, type: 'active' | 'expiring' | 'expired') => {
  if (count === 0) return null;
  
  const baseClasses = "rounded-full px-2 py-0.5 font-medium text-xs";
  switch (type) {
    case 'active':
      return <Badge className={`bg-green-100 text-green-800 hover:bg-green-100 ${baseClasses}`}>{count}</Badge>;
    case 'expiring':
      return <Badge className={`bg-orange-100 text-orange-800 hover:bg-orange-100 ${baseClasses}`}>{count}</Badge>;
    case 'expired':
      return <Badge className={`bg-red-100 text-red-800 hover:bg-red-100 ${baseClasses}`}>{count}</Badge>;
    default:
      return <Badge className={baseClasses}>{count}</Badge>;
  }
};

const _getPriorityBadge = (priority: 'low' | 'medium' | 'high') => {
  const baseClasses = "rounded-full px-2 py-0.5 font-medium text-xs";
  switch (priority) {
    case 'high':
      return <Badge className={`bg-red-100 text-red-800 hover:bg-red-100 ${baseClasses}`}>High</Badge>;
    case 'medium':
      return <Badge className={`bg-yellow-100 text-yellow-800 hover:bg-yellow-100 ${baseClasses}`}>Medium</Badge>;
    case 'low':
      return <Badge className={`bg-gray-100 text-gray-800 hover:bg-gray-100 ${baseClasses}`}>Low</Badge>;
    default:
      return <Badge className={baseClasses}>{priority}</Badge>;
  }
};

const Certifications = () => {
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [employees, setEmployees] = useState<EmployeeCertificationSummary[]>([]);
  const [expandedEmployees, setExpandedEmployees] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    expiringSoon: 0,
    expired: 0
  });
  const [loading, setLoading] = useState(true);

  // Track if we've loaded data to prevent unnecessary re-loads on tab switches
  const loadedUserRef = useRef<string | null>(null);
  const hasLoadedRef = useRef(false);

  // Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCertification, setSelectedCertification] = useState<CertificationDetails | null>(null);

  // Notify modal state
  const [isNotifyModalOpen, setIsNotifyModalOpen] = useState(false);
  const [notifyCertification, setNotifyCertification] = useState<CertificationDetails | null>(null);

  // Export modal state
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const { toast } = useToast();

  // List of all employee names for the edit modal
  const allEmployeeNames = useMemo(() => {
    const names = new Set<string>();
    employees.forEach(emp => names.add(emp.employeeName));
    return Array.from(names);
  }, [employees]);

  // Mock manager emails - in real app, this would come from user/company data
  const managerEmails = ['manager@company.com', 'supervisor@company.com'];

  // Filter employees based on search term and status filter
  const filteredEmployees = useMemo(() => {
    return employees.filter(employee => {
      const matchesSearch = 
        employee.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.certifications.some(cert => 
          cert.type.toLowerCase().includes(searchTerm.toLowerCase())
        );
      
      let matchesFilter = true;
      if (filterStatus !== "all") {
        switch (filterStatus) {
          case "Active":
            matchesFilter = employee.activeCertifications > 0;
            break;
          case "Expiring Soon":
            matchesFilter = employee.expiringSoonCertifications > 0;
            break;
          case "Expired":
            matchesFilter = employee.expiredCertifications > 0;
            break;
        }
      }
      
      return matchesSearch && matchesFilter;
    });
  }, [employees, searchTerm, filterStatus]);

  useEffect(() => {
    // Only load data if:
    // 1. We have a user
    // 2. We haven't loaded data yet OR the user has changed
    if (user) {
      const currentUserId = user.id;
      const shouldLoad = !hasLoadedRef.current || loadedUserRef.current !== currentUserId;
      
      if (shouldLoad) {
        loadedUserRef.current = currentUserId;
        loadCertificationData();
      } else {
        // User is the same and data is already loaded, just set loading to false
        setLoading(false);
      }
    } else {
      // Clear data when user is not authenticated
      setEmployees([]);
      setStats({
        total: 0,
        active: 0,
        expiringSoon: 0,
        expired: 0
      });
      setLoading(false);
      hasLoadedRef.current = false;
      loadedUserRef.current = null;
    }
  }, [user]);

  const loadCertificationData = async () => {
    try {
      setLoading(true);
      const [employeeData, statsData] = await Promise.all([
        getEmployeeCertificationSummary(),
        getCertificationStats()
      ]);
      setEmployees(employeeData);
      setStats(statsData);
      hasLoadedRef.current = true; // Mark as successfully loaded
    } catch (error) {
      console.error('Error loading certification data:', error);
      // Don't mark as loaded on error so it can retry
    } finally {
      setLoading(false);
    }
  };

  // Force refresh function (for when certifications are actually added/updated)
  const refreshCertificationData = async () => {
    hasLoadedRef.current = false;
    await loadCertificationData();
  };

  const toggleEmployeeExpansion = (employeeId: string) => {
    const newExpanded = new Set(expandedEmployees);
    if (newExpanded.has(employeeId)) {
      newExpanded.delete(employeeId);
    } else {
      newExpanded.add(employeeId);
    }
    setExpandedEmployees(newExpanded);
  };

  const handleFilterChange = (status: string) => {
    setFilterStatus(status);
  };

  const handleEditCertification = (cert: CertificationDetails) => {
    setSelectedCertification(cert);
    setIsEditModalOpen(true);
  };

  const handleNotifyCertification = (cert: CertificationDetails) => {
    setNotifyCertification(cert);
    setIsNotifyModalOpen(true);
  };

  const handleModalSuccess = () => {
    refreshCertificationData();
  };

  // Helper function to download Team Certification Report
  const downloadTeamCertificationReport = async () => {
    try {
      setExportLoading(true);
      setIsExportModalOpen(false);
      
      toast({
        title: "Generating Report",
        description: "Please wait while we generate your Team Certification Report...",
      });
      
      // Get current session for authentication
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.access_token) {
        throw new Error('Authentication required. Please sign in again.');
      }

      const response = await fetch('/api/reports/team-certification', {
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
      
      // Validate that we got a PDF
      if (!blob.type.includes('application/pdf')) {
        throw new Error(`Invalid file type received: ${blob.type}. Expected PDF file.`);
      }

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `team-certification-report-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Export Complete",
        description: "Team Certification Report has been downloaded successfully.",
        duration: 3000
      });

    } catch (error) {
      console.error('Error exporting Team Certification Report:', error);
      toast({
        title: "Export Failed",
        description: error instanceof Error ? error.message : "Failed to export Team Certification Report",
        variant: "destructive",
        duration: 5000
      });
    } finally {
      setExportLoading(false);
    }
  };



  // Helper function to format dates to American format (MM/DD/YYYY)
  const formatDateToAmerican = (dateString: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US');
    } catch {
      return dateString; // Return original if parsing fails
    }
  };

  const CertificationDetailRow = ({ cert }: { cert: CertificationDetails }) => (
    <>
      <tr className="bg-gray-50/50 hover:bg-gray-100/50 transition-all duration-200">
        <td className="py-2 px-6 text-xs text-gray-600">
          <div className="flex items-center space-x-2">
            <span>↳ {cert.type}</span>
          </div>
        </td>
        <td className="py-2 px-4 text-xs text-gray-600">
          <div>
            <div className="text-xs font-medium text-gray-500 mb-1">Issue Date</div>
            {formatDateToAmerican(cert.issueDate)}
          </div>
        </td>
        <td className="py-2 px-4 text-xs text-gray-600">
          <div>
            <div className="text-xs font-medium text-gray-500 mb-1">Expiration Date</div>
            {formatDateToAmerican(cert.expirationDate)}
          </div>
        </td>
        <td className="py-2 px-4 text-xs text-gray-600">
          <div>
            <div className="text-xs font-medium text-gray-500 mb-1">Days Remaining</div>
            {cert.daysLeft > 0 ? `${cert.daysLeft} days` : `${Math.abs(cert.daysLeft)} days ago`}
          </div>
        </td>
        <td className="py-2 px-4">
          <div>
            <div className="text-xs font-medium text-gray-500 mb-1">Status</div>
            {getStatusBadge(cert.status)}
          </div>
        </td>
        <td className="py-2 px-4">
          <div className="flex items-center space-x-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 text-xs"
              onClick={() => handleEditCertification(cert)}
            >
              Edit
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 text-xs"
              onClick={() => handleNotifyCertification(cert)}
            >
              <Bell className="w-3 h-3 mr-1" />
              Notify
            </Button>
          </div>
        </td>
      </tr>
      {cert.notes && (
        <tr className="bg-gray-50/30">
          <td colSpan={6} className="py-1 px-6 text-xs text-gray-500 italic">
            <span className="text-gray-400">💬</span> {cert.notes}
          </td>
        </tr>
      )}
    </>
  );

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white/70 backdrop-blur-xl border-b border-gray-200/50 px-6 py-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text">
                HVAC Certifications
              </h1>
              <p className="text-gray-600 mt-1 text-sm font-medium">Manage all HVAC employee certifications and licenses</p>
            </div>
            <div className="flex items-center space-x-3">
              <Button 
                variant="outline" 
                className="rounded-lg border-gray-200 hover:bg-gray-50 shadow-sm hover:shadow-md transition-all duration-200 h-8 text-xs"
                onClick={() => setIsExportModalOpen(true)}
                disabled={exportLoading || stats.total === 0}
                title={stats.total === 0 ? "No certifications to export" : ""}
              >
                <Download className="w-3 h-3 mr-1" />
                {exportLoading ? 'Exporting...' : 'Export'}
              </Button>
              <Button 
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl rounded-lg transition-all duration-200 h-8 text-xs"
                onClick={() => setIsModalOpen(true)}
              >
                <Plus className="w-3 h-3 mr-1" />
                Add Certification
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="px-6 py-5 flex-1">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="bg-gradient-to-br from-white to-gray-50/50 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border-0">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-gray-600 mb-1">Total Employees</p>
                    <p className="text-2xl font-bold text-gray-900 tracking-tight">{employees.length}</p>
                  </div>
                  <div className="h-10 w-10 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center shadow-md">
                    <User className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50/50 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border-0">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-gray-600 mb-1">Active</p>
                    <p className="text-2xl font-bold text-green-600 tracking-tight">{stats.active}</p>
                  </div>
                  <CheckCircle className="h-10 w-10 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-50 to-amber-50/50 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border-0">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-gray-600 mb-1">Expiring Soon</p>
                    <p className="text-2xl font-bold text-orange-600 tracking-tight">{stats.expiringSoon}</p>
                  </div>
                  <AlertTriangle className="h-10 w-10 text-orange-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-red-50 to-rose-50/50 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border-0">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-gray-600 mb-1">Expired</p>
                    <p className="text-2xl font-bold text-red-600 tracking-tight">{stats.expired}</p>
                  </div>
                  <XCircle className="h-10 w-10 text-red-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filter */}
          <div className="flex items-center space-x-3 mb-6">
            <div className="relative flex-1 max-w-md">
              <img 
                src="/search (1).png" 
                alt="Search" 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 object-contain z-10"
              />
              <Input 
                placeholder="Search employees or certifications..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 rounded-lg border-gray-200 bg-white/80 backdrop-blur-sm shadow-sm focus:shadow-md transition-all duration-200 h-8 text-xs"
              />
            </div>
            <div className="relative">
              <select
                value={filterStatus}
                onChange={(e) => handleFilterChange(e.target.value)}
                className="appearance-none bg-white border border-gray-200 rounded-lg px-3 py-1.5 pr-8 text-xs font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm hover:shadow-md transition-all duration-200 h-8"
              >
                <option value="all">All Status</option>
                <option value="Active">Has Active</option>
                <option value="Expiring Soon">Has Expiring Soon</option>
                <option value="Expired">Has Expired</option>
              </select>
              <Filter className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-3 w-3 pointer-events-none" />
            </div>
          </div>

          {/* Employee-Centric Table */}
          <Card className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border-0">
            <CardHeader className="pb-3 border-b border-gray-100">
              <CardTitle className="text-lg font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text">
                Employee Certifications
                {searchTerm || filterStatus !== "all" ? (
                  <span className="text-sm font-normal text-gray-600 ml-2">
                    ({filteredEmployees.length} of {employees.length} employees)
                  </span>
                ) : null}
              </CardTitle>
              <CardDescription className="text-sm font-medium text-gray-600">
                {searchTerm || filterStatus !== "all" 
                  ? "Filtered employee certification overview"
                  : "Complete overview of all employee certifications"
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-3"></div>
                  <span className="text-gray-600">Loading employees...</span>
                </div>
              ) : filteredEmployees.length === 0 ? (
                <div className="text-center py-12">
                  <User className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {searchTerm || filterStatus !== "all" ? "No matching employees found" : "No employees found"}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {searchTerm || filterStatus !== "all" 
                      ? "Try adjusting your search or filter criteria."
                      : "Start by adding your first HVAC certification."
                    }
                  </p>
                  {!searchTerm && filterStatus === "all" && (
                  <Button 
                    onClick={() => setIsModalOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Certification
                  </Button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gradient-to-r from-gray-50/50 to-white">
                        <th className="text-left py-3 px-4 font-semibold text-gray-700 text-xs">Employee</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700 text-xs">Total Certs</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700 text-xs">Active</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700 text-xs">Expiring Soon</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700 text-xs">Expired</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700 text-xs">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEmployees.map((employee) => (
                        <React.Fragment key={employee.employeeId}>
                          {/* Employee Summary Row */}
                          <tr className="border-b border-gray-50 hover:bg-gradient-to-r hover:from-gray-50/30 hover:to-white transition-all duration-200">
                            <td className="py-3 px-4">
                              <div className="flex items-center space-x-3">
                                <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                                  <User className="h-4 w-4 text-blue-600" />
                                </div>
                                <div>
                                  <p className="font-semibold text-gray-900 text-xs">{employee.employeeName}</p>
                                  {employee.employeeEmail && (
                                    <p className="text-xs text-gray-500">{employee.employeeEmail}</p>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <Badge variant="outline" className="text-xs">{employee.totalCertifications}</Badge>
                            </td>
                            <td className="py-3 px-4">
                              {getCountBadge(employee.activeCertifications, 'active') || (
                                <span className="text-xs text-gray-400">0</span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              {getCountBadge(employee.expiringSoonCertifications, 'expiring') || (
                                <span className="text-xs text-gray-400">0</span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              {getCountBadge(employee.expiredCertifications, 'expired') || (
                                <span className="text-xs text-gray-400">0</span>
                              )}
                          </td>
                          <td className="py-3 px-4">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => toggleEmployeeExpansion(employee.employeeId)}
                                className="h-6 text-xs flex items-center space-x-1"
                              >
                                {expandedEmployees.has(employee.employeeId) ? (
                                  <ChevronDown className="w-3 h-3" />
                                ) : (
                                  <ChevronRight className="w-3 h-3" />
                                )}
                                <span>View Certs</span>
                            </Button>
                          </td>
                        </tr>
                          
                          {/* Expanded Certification Details */}
                          {expandedEmployees.has(employee.employeeId) && (
                            employee.certifications.length > 0 ? (
                              employee.certifications.map((cert) => (
                                <CertificationDetailRow key={cert.id} cert={cert} />
                              ))
                            ) : (
                              <tr className="bg-gray-50/50">
                                <td colSpan={6} className="py-4 px-6 text-center text-gray-500 text-xs">
                                  No certifications found for this employee
                                </td>
                              </tr>
                            )
                          )}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Add Certification Modal */}
        <AddCertificationModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            refreshCertificationData();
            console.log('Certification uploaded successfully!');
          }}
        />

        {/* Edit Certification Modal */}
        <EditCertificationModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={handleModalSuccess}
          certification={selectedCertification}
          employees={allEmployeeNames}
        />

        {/* Notify Certification Modal */}
        <NotifyCertificationModal
          isOpen={isNotifyModalOpen}
          onClose={() => setIsNotifyModalOpen(false)}
          onSuccess={handleModalSuccess}
          certification={notifyCertification}
          managers={managerEmails}
        />

        {/* Export Report Modal */}
        <Dialog open={isExportModalOpen} onOpenChange={setIsExportModalOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <Download className="w-5 h-5 mr-2 text-blue-600" />
                Export Team Certification Report
              </DialogTitle>
              <DialogDescription>
                Generate a comprehensive PDF report containing a complete overview of all team certifications.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {stats.total === 0 ? (
                <div className="text-center py-6">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Download className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Certifications to Export</h3>
                  <p className="text-gray-600 text-sm">
                    Add some certifications to your team before generating reports.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start h-auto p-4"
                    onClick={downloadTeamCertificationReport}
                    disabled={exportLoading}
                  >
                    <div className="text-left">
                      <p className="font-semibold text-sm">Team Certification Report</p>
                      <p className="text-xs text-gray-500">Complete overview of all team certifications (PDF)</p>
                    </div>
                  </Button>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsExportModalOpen(false)}>
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Certifications;
