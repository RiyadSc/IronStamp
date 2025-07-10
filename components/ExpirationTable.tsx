import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertTriangle, Calendar, User, Bell } from '@/lib/icons';
import { getExpiringCertifications, type ExpirationItem, type CertificationDetails } from '@/lib/data-service';
import { useAuth } from '@/hooks/useAuth';
import { NotifyCertificationModal } from './NotifyCertificationModal';
import { formatDateToAmerican } from '@/lib/utils';

export const ExpirationTable: React.FC = () => {
  const { user } = useAuth();
  const [allExpirationData, setAllExpirationData] = useState<ExpirationItem[]>([]);
  const [showAllModal, setShowAllModal] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Notification modal state
  const [isNotifyModalOpen, setIsNotifyModalOpen] = useState(false);
  const [selectedCertification, setSelectedCertification] = useState<CertificationDetails | null>(null);

  useEffect(() => {
    if (user) {
      loadExpiringCertifications();
    }
  }, [user]);

  const loadExpiringCertifications = async () => {
    try {
      setLoading(true);
      const data = await getExpiringCertifications(50); // Get more data to sort and display
      // Sort by expiration date - closest to expire first (ascending order)
      const sortedData = data.sort((a, b) => {
        // Convert dates to compare - non-expired items should come first
        const aDaysLeft = a.daysLeft;
        const bDaysLeft = b.daysLeft;
        
        // If one is expired and one isn't, non-expired comes first
        if (aDaysLeft >= 0 && bDaysLeft < 0) return -1;
        if (bDaysLeft >= 0 && aDaysLeft < 0) return 1;
        
        // If both are active (non-expired), sort by closest to expire first
        if (aDaysLeft >= 0 && bDaysLeft >= 0) {
          return aDaysLeft - bDaysLeft;
        }
        
        // If both are expired, sort by most recently expired (higher negative number)
        if (aDaysLeft < 0 && bDaysLeft < 0) {
          return bDaysLeft - aDaysLeft; // Most recently expired first
        }
        
        return 0;
      });
      setAllExpirationData(sortedData);
    } catch (error) {
      console.error('Error loading expiring certifications:', error);
      setAllExpirationData([]);
    } finally {
      setLoading(false);
    }
  };

  // Convert ExpirationItem to CertificationDetails for the notification modal
  const convertExpirationItemToCertificationDetails = (item: ExpirationItem): CertificationDetails => {
    return {
      id: item.id,
      employee: item.employee,
      type: item.certification,
      issueDate: '', // Not available in ExpirationItem
      expirationDate: item.expirationDate,
      status: item.status === 'expired' ? 'Expired' : item.status === 'critical' ? 'Expiring Soon' : 'Active',
      daysLeft: item.daysLeft,
      priority: item.priority
    };
  };

  const handleNotifyClick = (item: ExpirationItem) => {
    const certificationDetails = convertExpirationItemToCertificationDetails(item);
    setSelectedCertification(certificationDetails);
    setIsNotifyModalOpen(true);
  };

  const handleNotificationSuccess = () => {
    // Optionally refresh data
    console.log('Notification sent successfully from ExpirationTable');
  };

  const getStatusBadge = (status: string, daysLeft: number) => {
    switch (status) {
      case 'critical':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Critical</Badge>;
      case 'warning':
        return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">Warning</Badge>;
      case 'expired':
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Expired</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getDaysLeftText = (daysLeft: number) => {
    if (daysLeft < 0) {
      return `${Math.abs(daysLeft)} days ago`;
    }
    return `${daysLeft} days`;
  };

  const displayedCertifications = allExpirationData.slice(0, 6);
  const hasMoreCertifications = allExpirationData.length > 6;

  const CertificationItem = ({ item }: { item: ExpirationItem }) => (
    <div
      key={item.id}
      className="group flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 bg-gradient-to-r from-gray-50/50 to-white rounded-lg border border-gray-100 hover:border-gray-200 transition-all duration-200 space-y-3 sm:space-y-0"
    >
      <div className="flex items-center space-x-3 min-w-0 flex-1">
        <div className="h-8 w-8 sm:h-10 sm:w-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
          <User className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-gray-900 truncate">{item.employee}</p>
          <p className="text-sm text-gray-600 truncate">{item.certification}</p>
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
        <div className="flex items-center justify-between sm:justify-end sm:text-right">
          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="h-4 w-4 mr-1 flex-shrink-0" />
            <span className="text-xs sm:text-sm">{formatDateToAmerican(item.expirationDate)}</span>
          </div>
          <p className="text-xs text-gray-500 sm:hidden">{getDaysLeftText(item.daysLeft)}</p>
        </div>
        <div className="hidden sm:block text-right">
          <p className="text-xs text-gray-500">{getDaysLeftText(item.daysLeft)}</p>
        </div>
        <div className="flex items-center justify-between sm:justify-end space-x-2">
          {getStatusBadge(item.status, item.daysLeft)}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => handleNotifyClick(item)}
            className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200 text-xs px-2 py-1 h-7"
          >
            <Bell className="w-3 h-3 mr-1" />
            Notify
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <Card className="bg-white/80 backdrop-blur-sm rounded-lg sm:rounded-xl shadow-lg border-0">
        <CardHeader className="pb-3 sm:pb-4 px-3 sm:px-6 py-3 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500 flex-shrink-0" />
              <CardTitle className="text-base sm:text-lg font-bold tracking-tight">
                Expiring Certifications
                {allExpirationData.length > 0 && (
                  <span className="text-sm font-normal text-gray-600 ml-2">
                    ({allExpirationData.length} total)
                  </span>
                )}
              </CardTitle>
            </div>
            {hasMoreCertifications && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowAllModal(true)}
                className="text-xs sm:text-sm"
              >
                View All ({allExpirationData.length})
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="ml-2 text-gray-600 text-sm">Loading certifications...</span>
            </div>
          ) : allExpirationData.length === 0 ? (
            <div className="text-center py-8">
              <AlertTriangle className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600 font-medium text-sm sm:text-base">No expiring certifications found</p>
              <p className="text-xs sm:text-sm text-gray-500">All certifications are up to date!</p>
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {displayedCertifications.map((item) => (
                <CertificationItem key={item.id} item={item} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* All Expiring Certifications Modal */}
      <Dialog open={showAllModal} onOpenChange={setShowAllModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-lg sm:text-xl font-bold flex items-center">
              <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 mr-2 text-orange-500" />
              All Expiring Certifications ({allExpirationData.length})
            </DialogTitle>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">
              Sorted by closest to expire first, then expired certifications
            </p>
          </DialogHeader>
          <div className="flex-1 overflow-auto pr-2">
            <div className="space-y-2 sm:space-y-3">
              {allExpirationData.map((item) => (
                <CertificationItem key={`modal-${item.id}`} item={item} />
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Notify Certification Modal */}
      <NotifyCertificationModal
        isOpen={isNotifyModalOpen}
        onClose={() => setIsNotifyModalOpen(false)}
        onSuccess={handleNotificationSuccess}
        certification={selectedCertification}
        managers={['manager@company.com', 'supervisor@company.com']} // Mock manager emails
      />
    </>
  );
}; 