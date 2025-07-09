import { Plus, Bell, Calendar, Clock, Settings as SettingsIcon, Check } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Sidebar } from "@/components/Sidebar";
import { useState, useEffect } from "react";
import { getReminderData, type ReminderData } from "@/lib/data-service";
import { useAuth } from "@/hooks/useAuth";

const reminderSettings = [
  { id: 1, title: "90 Days Before Expiration", description: "First reminder notification", enabled: true },
  { id: 2, title: "60 Days Before Expiration", description: "Second reminder notification", enabled: true },
  { id: 3, title: "30 Days Before Expiration", description: "Final warning notification", enabled: true },
  { id: 4, title: "7 Days Before Expiration", description: "Urgent reminder notification", enabled: false },
  { id: 5, title: "Day of Expiration", description: "Expiration day notification", enabled: true },
];

const Reminders = () => {
  const { user } = useAuth();
  const [upcomingReminders, setUpcomingReminders] = useState<ReminderData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadReminderData();
    }
  }, [user]);

  const loadReminderData = async () => {
    try {
      setLoading(true);
      const data = await getReminderData();
      setUpcomingReminders(data);
    } catch (error) {
      console.error('Error loading reminder data:', error);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100/50 flex">
      <Sidebar />
      
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 px-6 py-6 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Certification Reminders</h1>
              <p className="text-gray-600 mt-1 text-lg">Automated notifications for certification renewals</p>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" className="ios-button border-gray-200 hover:bg-gray-50">
                <SettingsIcon className="w-4 h-4 mr-2" />
                Configure
              </Button>
              <Button className="ios-button bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md">
                <Plus className="w-4 h-4 mr-2" />
                Create Reminder
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="ios-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Reminders</p>
                    <p className="text-2xl font-bold text-gray-900">{upcomingReminders.length}</p>
                  </div>
                  <Bell className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="ios-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Sent This Week</p>
                    <p className="text-2xl font-bold text-green-600">
                      {upcomingReminders.filter(r => r.status === 'Sent').length}
                    </p>
                  </div>
                  <Check className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="ios-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pending</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {upcomingReminders.filter(r => r.status === 'Pending').length}
                    </p>
                  </div>
                  <Clock className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="ios-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Urgent</p>
                    <p className="text-2xl font-bold text-red-600">
                      {upcomingReminders.filter(r => r.status === 'Urgent').length}
                    </p>
                  </div>
                  <Calendar className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-6">
            {/* Upcoming Reminders */}
            <Card className="ios-card">
              <CardHeader>
                <CardTitle>Upcoming Reminders</CardTitle>
                <CardDescription>Scheduled notifications for certification renewals</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-3"></div>
                    <span className="text-gray-600">Loading reminders...</span>
                  </div>
                ) : upcomingReminders.length === 0 ? (
                  <div className="text-center py-8">
                    <Bell className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No reminders scheduled</h3>
                    <p className="text-gray-600">All certifications are up to date!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {upcomingReminders.map((reminder) => (
                    <div key={reminder.id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-medium text-gray-900">{reminder.employee}</h4>
                          <p className="text-sm text-gray-600">{reminder.certification}</p>
                        </div>
                        <Badge 
                          className={
                            reminder.status === 'Overdue' ? 'bg-red-100 text-red-800 hover:bg-red-100' :
                            reminder.status === 'Sent' ? 'bg-green-100 text-green-800 hover:bg-green-100' :
                            'bg-orange-100 text-orange-800 hover:bg-orange-100'
                          }
                        >
                          {reminder.status}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <span>Due: {reminder.dueDate}</span>
                        <span>
                          {reminder.daysUntil > 0 
                            ? `${reminder.daysUntil} days left` 
                            : `${Math.abs(reminder.daysUntil)} days overdue`
                          }
                        </span>
                      </div>
                      <div className="mt-2">
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                          {reminder.reminderType}
                        </span>
                      </div>
                    </div>
                  ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Reminder Settings */}
            <Card className="ios-card">
              <CardHeader>
                <CardTitle>Reminder Settings</CardTitle>
                <CardDescription>Configure when and how reminders are sent</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reminderSettings.map((setting) => (
                    <div key={setting.id} className="flex items-center justify-between py-3 border-b last:border-0">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{setting.title}</h4>
                        <p className="text-sm text-gray-600">{setting.description}</p>
                      </div>
                      <Switch 
                        checked={setting.enabled}
                        className="ml-4"
                      />
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 pt-4 border-t">
                  <h4 className="font-medium text-gray-900 mb-2">Notification Methods</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Email Notifications</span>
                      <Switch checked={true} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">SMS Notifications</span>
                      <Switch checked={false} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Dashboard Notifications</span>
                      <Switch checked={true} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Reminders;
