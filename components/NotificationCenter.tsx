import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Bell, AlertTriangle, CheckCircle, Info, Clock } from '@/lib/icons';
import { getNotifications, type Notification } from '@/lib/data-service';

export const NotificationCenter: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showAllModal, setShowAllModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const data = await getNotifications();
      setNotifications(data);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'urgent':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <Clock className="h-4 w-4 text-orange-500" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const getNotificationBadge = (type: string) => {
    switch (type) {
      case 'urgent':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Urgent</Badge>;
      case 'warning':
        return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">Warning</Badge>;
      case 'success':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Success</Badge>;
      case 'info':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Info</Badge>;
      default:
        return <Badge variant="secondary">{type}</Badge>;
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const displayedNotifications = notifications.slice(0, 4);
  const hasMoreNotifications = notifications.length > 4;

  const NotificationItem = ({ notification, onClick }: { notification: Notification; onClick?: () => void }) => (
            <div
              key={notification.id}
      className={`p-3 rounded-lg border transition-all duration-200 cursor-pointer ${
                notification.read 
                  ? 'bg-gray-50/50 border-gray-100' 
                  : 'bg-white border-gray-200 shadow-sm'
              }`}
      onClick={() => {
        if (!notification.read) markAsRead(notification.id);
        onClick?.();
      }}
            >
              <div className="flex items-start space-x-3">
                <div className="mt-0.5">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className={`text-sm font-semibold ${
                      notification.read ? 'text-gray-700' : 'text-gray-900'
                    }`}>
                      {notification.title}
                    </p>
                    {getNotificationBadge(notification.type)}
                  </div>
                  <p className={`text-sm ${
                    notification.read ? 'text-gray-500' : 'text-gray-600'
                  }`}>
                    {notification.message}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">{notification.time}</p>
                </div>
                {!notification.read && (
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                )}
              </div>
            </div>
  );

  if (loading) {
    return (
      <Card className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border-0">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-bold tracking-tight flex items-center">
            <Bell className="h-5 w-5 mr-2 text-blue-600" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-3"></div>
            <span className="text-gray-600">Loading notifications...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border-0">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-bold tracking-tight flex items-center">
              <Bell className="h-5 w-5 mr-2 text-blue-600" />
              Notifications
              {unreadCount > 0 && (
                <Badge className="ml-2 bg-red-100 text-red-800 hover:bg-red-100">
                  {unreadCount}
                </Badge>
              )}
            </CardTitle>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700" onClick={markAllAsRead}>
                Mark all read
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {notifications.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No notifications yet</p>
              <p className="text-sm text-gray-500">New notifications will appear here</p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {displayedNotifications.map((notification) => (
                  <NotificationItem key={notification.id} notification={notification} />
          ))}
        </div>
        
              {hasMoreNotifications && (
        <div className="mt-4 pt-4 border-t border-gray-100">
                  <Button 
                    variant="ghost" 
                    className="w-full text-sm text-blue-600 hover:text-blue-700"
                    onClick={() => setShowAllModal(true)}
                  >
                    View All Notifications ({notifications.length})
          </Button>
        </div>
              )}
            </>
          )}
      </CardContent>
    </Card>

      {/* All Notifications Modal */}
      <Dialog open={showAllModal} onOpenChange={setShowAllModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-xl font-bold flex items-center">
              <Bell className="h-6 w-6 mr-2 text-blue-600" />
              All Notifications ({notifications.length})
            </DialogTitle>
            {unreadCount > 0 && (
              <div className="flex justify-end pt-2">
                <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700" onClick={markAllAsRead}>
                  Mark all read
                </Button>
              </div>
            )}
          </DialogHeader>
          <div className="flex-1 overflow-auto pr-2">
            <div className="space-y-3">
              {notifications.map((notification) => (
                <NotificationItem 
                  key={notification.id} 
                  notification={notification}
                  onClick={() => {
                    // Optional: Handle notification click in modal
                  }}
                />
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}; 