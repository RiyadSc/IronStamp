import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertTriangle, Clock, User, X } from '@/lib/icons';
import { getPriorityActions, type PriorityItem } from '@/lib/data-service';
import { useAuth } from '@/hooks/useAuth';
import { NotifyPriorityActionModal } from './NotifyPriorityActionModal';

export const PriorityWidget: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const [priorityItems, setPriorityItems] = useState<PriorityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAllModal, setShowAllModal] = useState(false);
  
  // Notification modal state
  const [isNotifyModalOpen, setIsNotifyModalOpen] = useState(false);
  const [selectedPriorityItem, setSelectedPriorityItem] = useState<PriorityItem | null>(null);

  // Track if we've loaded data to prevent unnecessary re-loads on tab switches
  const loadedUserRef = useRef<string | null>(null);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    // Only load data if:
    // 1. We have a user and auth is not loading
    // 2. We haven't loaded data yet OR the user has changed
    if (user && !authLoading) {
      const currentUserId = user.id;
      const shouldLoad = !hasLoadedRef.current || loadedUserRef.current !== currentUserId;
      
      if (shouldLoad) {
        loadedUserRef.current = currentUserId;
        loadPriorityData();
      } else {
        // User is the same and data is already loaded, just set loading to false
        setLoading(false);
      }
    } else if (!authLoading) {
      setLoading(false);
      hasLoadedRef.current = false;
      loadedUserRef.current = null;
    }
  }, [user, authLoading]);

  const loadPriorityData = async () => {
    try {
      setLoading(true);
      const data = await getPriorityActions();
      setPriorityItems(data);
      hasLoadedRef.current = true; // Mark as successfully loaded
    } catch (error) {
      console.error('Error loading priority data:', error);
      // Don't mark as loaded on error so it can retry
    } finally {
      setLoading(false);
    }
  };

  // Force refresh function (for when certifications change priority levels)
  const refreshPriorityData = async () => {
    hasLoadedRef.current = false;
    await loadPriorityData();
  };

  const handleNotifyClick = (item: PriorityItem) => {
    setSelectedPriorityItem(item);
    setIsNotifyModalOpen(true);
  };

  const handleNotificationSuccess = () => {
    // Optionally refresh data or show success message
    console.log('Priority notification sent successfully');
    // Could add a toast notification here
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">High</Badge>;
      case 'medium':
        return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">Medium</Badge>;
      case 'low':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Low</Badge>;
      default:
        return <Badge variant="secondary">{priority}</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'expired':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'expiring':
        return <Clock className="h-4 w-4 text-orange-500" />;
      case 'missing':
        return <User className="h-4 w-4 text-blue-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTypeText = (item: PriorityItem) => {
    switch (item.type) {
      case 'expired':
        return 'Expired certification';
      case 'expiring':
        return `Expires in ${item.daysLeft} days`;
      case 'missing':
        return 'Missing required certification';
      default:
        return 'Unknown status';
    }
  };

  const PriorityItemCard: React.FC<{ item: PriorityItem }> = ({ item }) => (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 bg-gradient-to-r from-gray-50/50 to-white rounded-lg border border-gray-100 hover:border-gray-200 transition-all duration-200 space-y-3 sm:space-y-0">
      <div className="flex items-center space-x-3 min-w-0 flex-1">
        {getTypeIcon(item.type)}
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-gray-900 truncate">{item.employee}</p>
          <p className="text-sm text-gray-600 truncate">{item.certification}</p>
          <p className="text-xs text-gray-500">{getTypeText(item)}</p>
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
        {getPriorityBadge(item.priority)}
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => handleNotifyClick(item)}
          className="text-xs px-3 py-1 h-7"
        >
          Notify
        </Button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <Card className="bg-white/80 backdrop-blur-sm rounded-lg sm:rounded-xl shadow-lg border-0">
        <CardHeader className="pb-3 sm:pb-4 px-3 sm:px-6 py-3 sm:py-6">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />
            <CardTitle className="text-base sm:text-lg font-bold tracking-tight">
              Priority Actions Required
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
          <div className="flex items-center justify-center py-8">
            <div className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const displayedItems = priorityItems.slice(0, 4);
  const hasMoreItems = priorityItems.length > 4;

  return (
    <>
      <Card className="bg-white/80 backdrop-blur-sm rounded-lg sm:rounded-xl shadow-lg border-0">
        <CardHeader className="pb-3 sm:pb-4 px-3 sm:px-6 py-3 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-red-500 flex-shrink-0" />
              <CardTitle className="text-base sm:text-lg font-bold tracking-tight">
                Priority Actions Required
              </CardTitle>
            </div>
            <Badge className="bg-red-100 text-red-800 hover:bg-red-100 text-xs self-start sm:self-center">
              {priorityItems.length} items
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
          {priorityItems.length > 0 ? (
            <div className="space-y-2 sm:space-y-3">
              {displayedItems.map((item) => (
                <PriorityItemCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertTriangle className="h-10 w-10 sm:h-12 sm:w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium text-sm sm:text-base">No priority actions required</p>
              <p className="text-xs sm:text-sm text-gray-400 mt-1">All certifications are up to date!</p>
            </div>
          )}
          
          {priorityItems.length > 0 && (
            <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-100">
              <Dialog open={showAllModal} onOpenChange={setShowAllModal}>
                <DialogTrigger asChild>
                  <Button className="w-full text-xs sm:text-sm" variant="outline">
                    View All Priority Items {hasMoreItems && `(${priorityItems.length})`}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[85vh]">
                  <DialogHeader>
                    <DialogTitle className="text-lg sm:text-xl font-bold tracking-tight flex items-center">
                      <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-red-500 mr-2" />
                      All Priority Actions Required ({priorityItems.length} items)
                    </DialogTitle>
                  </DialogHeader>
                  <div className="overflow-y-auto max-h-[65vh] space-y-2 sm:space-y-3 pr-2">
                    {priorityItems.map((item) => (
                      <PriorityItemCard key={item.id} item={item} />
                    ))}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notify Priority Action Modal */}
      <NotifyPriorityActionModal
        isOpen={isNotifyModalOpen}
        onClose={() => setIsNotifyModalOpen(false)}
        onSuccess={handleNotificationSuccess}
        priorityItem={selectedPriorityItem}
      />
    </>
  );
}; 