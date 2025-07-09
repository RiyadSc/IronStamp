import { Save, User, Bell, Shield, CreditCard, Building, Mail } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Sidebar } from "@/components/Sidebar";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getUserProfile, type UserProfile } from "@/lib/data-service";
import { useToast } from "@/hooks/use-toast";

const Settings = () => {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      if (user && !authLoading) {
        try {
          const profileData = await getUserProfile();
          setProfile(profileData);
        } catch (error) {
          console.error('Error loading profile:', error);
          toast({
            title: "Error",
            description: "Failed to load profile data",
            variant: "destructive"
          });
        } finally {
          setLoading(false);
        }
      }
    };

    loadProfile();
  }, [user, authLoading]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100/50 flex">
      <Sidebar />
      
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 px-6 py-6 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Settings</h1>
              <p className="text-gray-600 mt-1 text-lg">Manage your account and application preferences</p>
            </div>
            <Button className="ios-button bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md">
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </div>

        <div className="px-6 py-6 pb-12">
          <Tabs defaultValue="company" className="w-full">
            <TabsList className="grid w-full grid-cols-5 bg-gray-100/80 rounded-xl p-1 shadow-sm">
              <TabsTrigger value="company" className="rounded-lg font-medium">Company</TabsTrigger>
              <TabsTrigger value="account" className="rounded-lg font-medium">Account</TabsTrigger>
              <TabsTrigger value="notifications" className="rounded-lg font-medium">Notifications</TabsTrigger>
              <TabsTrigger value="security" className="rounded-lg font-medium">Security</TabsTrigger>
              <TabsTrigger value="billing" className="rounded-lg font-medium">Billing</TabsTrigger>
            </TabsList>

            <TabsContent value="company" className="space-y-6 mt-6">
              <Card className="ios-card">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center text-xl font-bold tracking-tight">
                    <Building className="w-5 h-5 mr-3 text-blue-600" />
                    Company Information
                  </CardTitle>
                  <CardDescription className="text-base">
                    Update your company details and business information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label htmlFor="company-name" className="text-sm font-semibold text-gray-700">Company Name</Label>
                      <Input 
                        id="company-name" 
                        defaultValue={loading ? "Loading..." : profile?.companyName || ""} 
                        disabled={loading}
                        className="ios-input" 
                      />
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="license-number" className="text-sm font-semibold text-gray-700">License Number</Label>
                      <Input 
                        id="license-number" 
                        defaultValue={loading ? "Loading..." : profile?.licenseNumber || ""} 
                        disabled={loading}
                        className="ios-input" 
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="address" className="text-sm font-semibold text-gray-700">Business Address</Label>
                    <Input 
                      id="address" 
                      defaultValue={loading ? "Loading..." : profile?.businessAddress || ""} 
                      disabled={loading}
                      className="ios-input" 
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label htmlFor="phone" className="text-sm font-semibold text-gray-700">Phone Number</Label>
                      <Input 
                        id="phone" 
                        defaultValue={loading ? "Loading..." : profile?.phoneNumber || ""} 
                        disabled={loading}
                        className="ios-input" 
                      />
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="email" className="text-sm font-semibold text-gray-700">Business Email</Label>
                      <Input 
                        id="email" 
                        defaultValue={loading ? "Loading..." : profile?.businessEmail || ""} 
                        disabled={loading}
                        className="ios-input" 
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="account" className="space-y-6 mt-6">
              <Card className="ios-card">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center text-xl font-bold tracking-tight">
                    <User className="w-5 h-5 mr-3 text-blue-600" />
                    Personal Information
                  </CardTitle>
                  <CardDescription className="text-base">
                    Manage your personal account details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label htmlFor="first-name" className="text-sm font-semibold text-gray-700">First Name</Label>
                      <Input id="first-name" defaultValue="John" className="ios-input" />
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="last-name" className="text-sm font-semibold text-gray-700">Last Name</Label>
                      <Input id="last-name" defaultValue="Doe" className="ios-input" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="user-email" className="text-sm font-semibold text-gray-700">Email Address</Label>
                    <Input id="user-email" type="email" defaultValue="john.doe@acmehvac.com" className="ios-input" />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="role" className="text-sm font-semibold text-gray-700">Role</Label>
                    <Input id="role" defaultValue="Administrator" disabled className="ios-input bg-gray-100" />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications" className="space-y-6 mt-6">
              <Card className="ios-card">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center text-xl font-bold tracking-tight">
                    <Bell className="w-5 h-5 mr-3 text-blue-600" />
                    Notification Preferences
                  </CardTitle>
                  <CardDescription className="text-base">
                    Control how and when you receive notifications
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  <div className="space-y-6">
                    <h4 className="font-semibold text-gray-900 text-lg">Email Notifications</h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-gray-50/50 rounded-xl">
                        <div>
                          <p className="font-medium text-gray-900">Certification Expiring</p>
                          <p className="text-sm text-gray-600 mt-1">Get notified when certifications are about to expire</p>
                        </div>
                        <Switch defaultChecked={true} />
                      </div>
                      <div className="flex items-center justify-between p-4 bg-gray-50/50 rounded-xl">
                        <div>
                          <p className="font-medium text-gray-900">New Team Member</p>
                          <p className="text-sm text-gray-600 mt-1">Get notified when new team members are added</p>
                        </div>
                        <Switch defaultChecked={true} />
                      </div>
                      <div className="flex items-center justify-between p-4 bg-gray-50/50 rounded-xl">
                        <div>
                          <p className="font-medium text-gray-900">Weekly Summary</p>
                          <p className="text-sm text-gray-600 mt-1">Receive weekly compliance reports</p>
                        </div>
                        <Switch defaultChecked={false} />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h4 className="font-semibold text-gray-900 text-lg">SMS Notifications</h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-gray-50/50 rounded-xl">
                        <div>
                          <p className="font-medium text-gray-900">Urgent Reminders</p>
                          <p className="text-sm text-gray-600 mt-1">Critical certification expiration alerts</p>
                        </div>
                        <Switch defaultChecked={false} />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security" className="space-y-6 mt-6">
              <Card className="ios-card">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center text-xl font-bold tracking-tight">
                    <Shield className="w-5 h-5 mr-3 text-blue-600" />
                    Security Settings
                  </CardTitle>
                  <CardDescription className="text-base">
                    Manage your account security and access controls
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <Label htmlFor="current-password" className="text-sm font-semibold text-gray-700">Current Password</Label>
                    <Input id="current-password" type="password" className="ios-input" />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="new-password" className="text-sm font-semibold text-gray-700">New Password</Label>
                    <Input id="new-password" type="password" className="ios-input" />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="confirm-password" className="text-sm font-semibold text-gray-700">Confirm New Password</Label>
                    <Input id="confirm-password" type="password" className="ios-input" />
                  </div>
                  
                  <div className="pt-6 border-t border-gray-200/50">
                    <div className="flex items-center justify-between p-4 bg-gray-50/50 rounded-xl">
                      <div>
                        <p className="font-medium text-gray-900">Two-Factor Authentication</p>
                        <p className="text-sm text-gray-600 mt-1">Add an extra layer of security to your account</p>
                      </div>
                      <Button variant="outline" className="rounded-xl font-medium">Enable</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="billing" className="space-y-6 mt-6">
              <Card className="ios-card">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center text-xl font-bold tracking-tight">
                    <CreditCard className="w-5 h-5 mr-3 text-blue-600" />
                    Billing Information
                  </CardTitle>
                  <CardDescription className="text-base">
                    Manage your subscription and payment details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="bg-blue-50/80 border border-blue-200/50 rounded-2xl p-6 backdrop-blur-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-blue-900 text-lg">Professional Plan</h4>
                        <p className="text-blue-700 mt-1">$49/month • Up to 25 team members</p>
                      </div>
                      <Badge className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium">Active</Badge>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold text-gray-700">Payment Method</Label>
                    <div className="p-4 border border-gray-200 rounded-xl flex items-center justify-between bg-gray-50/50">
                      <div className="flex items-center">
                        <CreditCard className="w-4 h-4 mr-3 text-gray-600" />
                        <span className="font-medium">•••• •••• •••• 4242</span>
                      </div>
                      <Button variant="outline" className="rounded-xl font-medium">Update</Button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-gray-700">Next Billing Date</Label>
                      <p className="text-gray-600 font-medium">January 15, 2024</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-gray-700">Amount</Label>
                      <p className="text-gray-600 font-medium">$49.00</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Settings;
