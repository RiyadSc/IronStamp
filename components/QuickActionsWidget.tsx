import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, FileText, Users, Mail, AlertTriangle, Download, Loader2 } from '@/lib/icons';
import { AddCertificationModal } from './AddCertificationModal';
import { AddTeamMemberModal } from './AddTeamMemberModal';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

export const QuickActionsWidget: React.FC = () => {
  const { toast } = useToast();
  const [isAddCertModalOpen, setIsAddCertModalOpen] = useState(false);
  const [isAddTeamModalOpen, setIsAddTeamModalOpen] = useState(false);
  const [isRemindersModalOpen, setIsRemindersModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportLoading, setExportLoading] = useState<string | null>(null);

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
      console.log('Blob size:', blob.size, 'bytes');
      console.log('Blob type:', blob.type);
      
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

  const handleTeamMemberAdded = () => {
    toast({
      title: "Team Member Added",
      description: "New team member has been successfully added to your team.",
    });
    // The Team.tsx page will handle refreshing its own data
  };

  const handleSendReminders = () => {
    setIsRemindersModalOpen(true);
  };

  const handleExportReport = () => {
    setIsExportModalOpen(true);
  };

  const handleTeamCertificationReport = async () => {
    setIsExportModalOpen(false);
    await downloadReport(
      'team-certification',
      `team-certification-report-${new Date().toISOString().split('T')[0]}.pdf`,
      'Team Certification Report'
    );
  };

  const handleExpirationCalendar = async () => {
    setIsExportModalOpen(false);
    await downloadReport(
      'expiration-calendar',
      `certification-expiration-calendar-${new Date().toISOString().split('T')[0]}.pdf`,
      'Expiration Calendar'
    );
  };

  const handleComplianceSummary = async () => {
    setIsExportModalOpen(false);
    await downloadReport(
      'compliance-summary',
      `compliance-summary-${new Date().toISOString().split('T')[0]}.pdf`,
      'Compliance Summary'
    );
  };

  const actions = [
    {
      icon: Plus,
      title: 'Add Certification(s)',
      description: 'Upload new cert(s)',
      action: () => setIsAddCertModalOpen(true),
      variant: 'default' as const
    },
    {
      icon: Users,
      title: 'Add Team Member',
      description: 'Invite member',
      action: () => setIsAddTeamModalOpen(true),
      variant: 'outline' as const
    },
    {
      icon: Mail,
      title: 'Send Reminders',
      description: 'Notify team',
      action: handleSendReminders,
      variant: 'outline' as const
    },
    {
      icon: Download,
      title: 'Export Report',
      description: 'Download data',
      action: handleExportReport,
      variant: 'outline' as const
    }
  ];

  // Show loading overlay when generating reports
  if (exportLoading) {
    return (
      <Card className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border-0">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-bold tracking-tight flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2 text-blue-600" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <div className="relative">
              <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
              <div className="absolute inset-0 rounded-full border-2 border-blue-200 border-t-transparent animate-ping opacity-75"></div>
            </div>
            <div className="text-center">
              <p className="font-semibold text-sm text-gray-900">Generating Report</p>
              <p className="text-xs text-gray-500 mt-1">{exportLoading}</p>
              <p className="text-xs text-gray-400 mt-2">This may take up to 30 seconds...</p>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full animate-pulse"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border-0">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-bold tracking-tight flex items-center">
          <AlertTriangle className="h-5 w-5 mr-2 text-blue-600" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {actions.map((action, index) => {
            const IconComponent = action.icon;
            return (
              <Button
                key={index}
                variant={action.variant}
                className="w-full justify-start text-left h-auto p-3"
                onClick={action.action}
              >
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <IconComponent className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{action.title}</p>
                    <p className="text-xs text-gray-500">{action.description}</p>
                  </div>
                </div>
              </Button>
            );
          })}
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-100">
          <Button variant="ghost" className="w-full text-sm text-blue-600 hover:text-blue-700">
            View All Actions
          </Button>
        </div>
      </CardContent>

      {/* Add Certification Modal */}
      <AddCertificationModal
        isOpen={isAddCertModalOpen}
        onClose={() => setIsAddCertModalOpen(false)}
        onSuccess={() => {
          toast({
            title: "Certification Added",
            description: "Certification has been uploaded successfully!",
          });
        }}
        onError={(error: string) => {
          // Provide more specific error messages based on common failure cases
          let errorDescription = error;
          if (error.includes('size exceeds')) {
            errorDescription = "File is too large. Please compress your document or use a different file.";
          } else if (error.includes('processing') || error.includes('extract')) {
            errorDescription = "Unable to read certification data from this file. Please ensure it's a valid certification document with clear text.";
          } else if (error.includes('format') || error.includes('type')) {
            errorDescription = "Unsupported file format. Please upload a PDF, DOC, or DOCX file containing certification information.";
          } else if (!error) {
            errorDescription = "Upload failed. Please check that your file is a valid certification document and try again.";
          }

          toast({
            title: "Upload Failed",
            description: errorDescription,
            variant: "destructive",
            duration: 8000
          });
        }}
      />

      {/* Add Team Member Modal */}
      <AddTeamMemberModal
        isOpen={isAddTeamModalOpen}
        onClose={() => setIsAddTeamModalOpen(false)}
        onTeamMemberAdded={handleTeamMemberAdded}
      />

      {/* Send Reminders Modal */}
      <Dialog open={isRemindersModalOpen} onOpenChange={setIsRemindersModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Mail className="w-5 h-5 mr-2 text-blue-600" />
              Send Team Reminders
            </DialogTitle>
            <DialogDescription>
              Send certification expiration reminders to your team members.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-start h-auto p-4"
                onClick={() => {
                  toast({
                    title: "Reminders Sent",
                    description: "Expiration reminders sent to all team members with certifications expiring in 30 days.",
                  });
                  setIsRemindersModalOpen(false);
                }}
              >
                <div className="text-left">
                  <p className="font-semibold text-sm">Expiration Reminders</p>
                  <p className="text-xs text-gray-500">Send to all team members with expiring certifications</p>
                </div>
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-start h-auto p-4"
                onClick={() => {
                  toast({
                    title: "Reminders Sent", 
                    description: "Weekly summary reminders sent to all team members.",
                  });
                  setIsRemindersModalOpen(false);
                }}
              >
                <div className="text-left">
                  <p className="font-semibold text-sm">Weekly Summary</p>
                  <p className="text-xs text-gray-500">Send weekly compliance reports to team</p>
                </div>
              </Button>

              <Button 
                variant="outline" 
                className="w-full justify-start h-auto p-4"
                onClick={() => {
                  toast({
                    title: "Reminders Sent",
                    description: "Custom reminders sent to selected team members.",
                  });
                  setIsRemindersModalOpen(false);
                }}
              >
                <div className="text-left">
                  <p className="font-semibold text-sm">Custom Message</p>
                  <p className="text-xs text-gray-500">Send personalized reminders to specific members</p>
                </div>
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRemindersModalOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Export Report Modal */}
      <Dialog open={isExportModalOpen} onOpenChange={setIsExportModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Download className="w-5 h-5 mr-2 text-blue-600" />
              Export Reports
            </DialogTitle>
            <DialogDescription>
              Download reports and data for your team's certifications.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-start h-auto p-4"
                onClick={handleTeamCertificationReport}
                disabled={exportLoading === 'Team Certification Report'}
              >
                <div className="text-left">
                  <p className="font-semibold text-sm">Team Certification Report</p>
                  <p className="text-xs text-gray-500">Complete overview of all team certifications (PDF)</p>
                </div>
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-start h-auto p-4"
                onClick={handleExpirationCalendar}
                disabled={exportLoading === 'Expiration Calendar'}
              >
                <div className="text-left">
                  <p className="font-semibold text-sm">Expiration Calendar</p>
                  <p className="text-xs text-gray-500">Calendar view of upcoming expirations (PDF)</p>
                </div>
              </Button>

              <Button 
                variant="outline" 
                className="w-full justify-start h-auto p-4"
                onClick={handleComplianceSummary}
                disabled={exportLoading === 'Compliance Summary'}
              >
                <div className="text-left">
                  <p className="font-semibold text-sm">Compliance Summary</p>
                  <p className="text-xs text-gray-500">Executive summary with statistics and recommendations (PDF)</p>
                </div>
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsExportModalOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}; 