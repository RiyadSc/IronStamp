import { Download, CreditCard, Calendar, ArrowUp, Check } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sidebar } from "@/components/Sidebar";
import { formatDateToAmerican } from "@/lib/utils";

const billingHistory = [
  { id: 1, date: formatDateToAmerican("2023-12-15"), amount: "$49.00", status: "Paid", invoice: "INV-2023-12" },
  { id: 2, date: formatDateToAmerican("2023-11-15"), amount: "$49.00", status: "Paid", invoice: "INV-2023-11" },
  { id: 3, date: formatDateToAmerican("2023-10-15"), amount: "$49.00", status: "Paid", invoice: "INV-2023-10" },
  { id: 4, date: formatDateToAmerican("2023-09-15"), amount: "$49.00", status: "Paid", invoice: "INV-2023-09" },
];

const plans = [
  {
    name: "Starter",
    price: "$19",
    period: "month",
    features: [
      "Up to 5 team members",
      "Basic certification tracking",
      "Email reminders",
      "Standard support"
    ],
    current: false
  },
  {
    name: "Professional",
    price: "$49",
    period: "month",
    features: [
      "Up to 25 team members",
      "Advanced certification tracking",
      "Email & SMS reminders",
      "Custom reports",
      "Priority support"
    ],
    current: true
  },
  {
    name: "Enterprise",
    price: "$99",
    period: "month",
    features: [
      "Unlimited team members",
      "Full certification management",
      "All notification types",
      "Advanced analytics",
      "API access",
      "Dedicated support"
    ],
    current: false
  }
];

const Dashboard = () => {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Billing & Subscription</h1>
              <p className="text-sm text-gray-600">Manage your subscription and billing information</p>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Download Invoice
              </Button>
              <Button size="sm">
                <ArrowUp className="w-4 h-4 mr-2" />
                Upgrade Plan
              </Button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto px-6 py-4">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="plans">Plans</TabsTrigger>
              <TabsTrigger value="history">Billing History</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Current Plan */}
              <Card>
                <CardHeader>
                  <CardTitle>Current Subscription</CardTitle>
                  <CardDescription>Your active plan and usage details</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-blue-900">Professional Plan</h3>
                        <p className="text-blue-700">$49 per month</p>
                      </div>
                      <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Active</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-blue-700">Next billing date</p>
                        <p className="font-medium text-blue-900">January 15, 2024</p>
                      </div>
                      <div>
                        <p className="text-blue-700">Team members used</p>
                        <p className="font-medium text-blue-900">12 of 25</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">Team Members</span>
                        <span className="text-lg font-semibold">12/25</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full" style={{ width: '48%' }}></div>
                      </div>
                    </div>
                    
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">Certifications</span>
                        <span className="text-lg font-semibold">24</span>
                      </div>
                      <div className="text-xs text-gray-500">Unlimited tracking</div>
                    </div>
                    
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">Reminders Sent</span>
                        <span className="text-lg font-semibold">156</span>
                      </div>
                      <div className="text-xs text-gray-500">This month</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Method */}
              <Card>
                <CardHeader>
                  <CardTitle>Payment Method</CardTitle>
                  <CardDescription>Manage your payment information</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <CreditCard className="h-8 w-8 text-gray-400" />
                      <div>
                        <p className="font-medium">•••• •••• •••• 4242</p>
                        <p className="text-sm text-gray-600">Expires 12/2025</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">Update</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="plans" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {plans.map((plan) => (
                  <Card key={plan.name} className={`relative ${plan.current ? 'border-blue-500 shadow-lg' : ''}`}>
                    {plan.current && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <Badge className="bg-blue-500 text-white hover:bg-blue-500">Current Plan</Badge>
                      </div>
                    )}
                    <CardHeader className="text-center">
                      <CardTitle className="text-xl">{plan.name}</CardTitle>
                      <div className="mt-2">
                        <span className="text-3xl font-bold">{plan.price}</span>
                        <span className="text-gray-600">/{plan.period}</span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3 mb-6">
                        {plan.features.map((feature, index) => (
                          <li key={index} className="flex items-center text-sm">
                            <Check className="h-4 w-4 text-green-500 mr-2" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                      <Button 
                        className="w-full" 
                        variant={plan.current ? "outline" : "default"}
                        disabled={plan.current}
                      >
                        {plan.current ? "Current Plan" : "Upgrade"}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="history" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Billing History</CardTitle>
                  <CardDescription>View and download your past invoices</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 font-medium text-gray-600">Date</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-600">Invoice</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-600">Amount</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-600">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {billingHistory.map((bill) => (
                          <tr key={bill.id} className="border-b hover:bg-gray-50">
                            <td className="py-4 px-4">
                              <div className="flex items-center">
                                <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                                {bill.date}
                              </div>
                            </td>
                            <td className="py-4 px-4 font-medium">{bill.invoice}</td>
                            <td className="py-4 px-4 font-medium">{bill.amount}</td>
                            <td className="py-4 px-4">
                              <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                                {bill.status}
                              </Badge>
                            </td>
                            <td className="py-4 px-4">
                              <Button variant="ghost" size="sm">
                                <Download className="h-4 w-4 mr-1" />
                                Download
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;