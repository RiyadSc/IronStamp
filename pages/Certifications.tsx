import { Search, Plus, Filter, Download, Calendar, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sidebar } from "@/components/Sidebar";
import { AddCertificationModal } from "@/components/AddCertificationModal";
import React, { useState } from "react";

const certifications = [
  { id: 1, employee: "John Smith", type: "EPA 608 Universal", issueDate: "2022-03-15", expirationDate: "2025-03-15", status: "Active", daysLeft: 425 },
  { id: 2, employee: "Sarah Johnson", type: "NATE Core", issueDate: "2021-06-10", expirationDate: "2024-06-10", status: "Expired", daysLeft: -30 },
  { id: 3, employee: "Mike Davis", type: "OSHA 10", issueDate: "2023-01-20", expirationDate: "2024-01-20", status: "Expiring Soon", daysLeft: 15 },
  { id: 4, employee: "Lisa Chen", type: "Brazing License", issueDate: "2022-09-05", expirationDate: "2025-09-05", status: "Active", daysLeft: 520 },
  { id: 5, employee: "David Wilson", type: "Refrigerant Handler", issueDate: "2023-04-12", expirationDate: "2024-04-12", status: "Expiring Soon", daysLeft: 45 },
];

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

const Certifications = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white/70 backdrop-blur-xl border-b border-gray-200/50 px-6 py-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text">
                Certifications
              </h1>
              <p className="text-gray-600 mt-1 text-sm font-medium">Manage all employee certifications and licenses</p>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" className="rounded-lg border-gray-200 hover:bg-gray-50 shadow-sm hover:shadow-md transition-all duration-200 h-8 text-xs">
                <Download className="w-3 h-3 mr-1" />
                Export
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
                    <p className="text-xs font-semibold text-gray-600 mb-1">Total Certifications</p>
                    <p className="text-2xl font-bold text-gray-900 tracking-tight">24</p>
                  </div>
                  <div className="h-10 w-10 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center shadow-md">
                    <Calendar className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50/50 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border-0">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-gray-600 mb-1">Active</p>
                    <p className="text-2xl font-bold text-green-600 tracking-tight">18</p>
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
                    <p className="text-2xl font-bold text-orange-600 tracking-tight">4</p>
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
                    <p className="text-2xl font-bold text-red-600 tracking-tight">2</p>
                  </div>
                  <XCircle className="h-10 w-10 text-red-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filter */}
          <div className="flex items-center space-x-3 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input 
                placeholder="Search certifications..." 
                className="pl-9 rounded-lg border-gray-200 bg-white/80 backdrop-blur-sm shadow-sm focus:shadow-md transition-all duration-200 h-8 text-xs"
              />
            </div>
            <Button variant="outline" className="rounded-lg border-gray-200 hover:bg-gray-50 shadow-sm hover:shadow-md transition-all duration-200 h-8 text-xs">
              <Filter className="w-3 h-3 mr-1" />
              Filter
            </Button>
          </div>

          {/* Certifications Table */}
          <Card className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border-0">
            <CardHeader className="pb-3 border-b border-gray-100">
              <CardTitle className="text-lg font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text">
                All Certifications
              </CardTitle>
              <CardDescription className="text-sm font-medium text-gray-600">
                Complete list of employee certifications and their status
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gradient-to-r from-gray-50/50 to-white">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 text-xs">Employee</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 text-xs">Certification Type</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 text-xs">Issue Date</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 text-xs">Expiration Date</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 text-xs">Days Left</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 text-xs">Status</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 text-xs">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {certifications.map((cert) => (
                      <tr key={cert.id} className="border-b border-gray-50 hover:bg-gradient-to-r hover:from-gray-50/30 hover:to-white transition-all duration-200">
                        <td className="py-3 px-4 font-semibold text-gray-900 text-xs">{cert.employee}</td>
                        <td className="py-3 px-4 text-gray-700 font-medium text-xs">{cert.type}</td>
                        <td className="py-3 px-4 text-gray-700 text-xs">{cert.issueDate}</td>
                        <td className="py-3 px-4 text-gray-700 text-xs">{cert.expirationDate}</td>
                        <td className="py-3 px-4 text-gray-700 font-semibold text-xs">
                          {cert.daysLeft > 0 ? `${cert.daysLeft} days` : `${Math.abs(cert.daysLeft)} days ago`}
                        </td>
                        <td className="py-3 px-4">{getStatusBadge(cert.status)}</td>
                        <td className="py-3 px-4">
                          <Button variant="ghost" className="rounded-lg font-medium hover:bg-gray-100 transition-colors duration-200 h-6 text-xs">
                            Edit
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Add Certification Modal */}
        <AddCertificationModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            // Optionally refresh data or show success message
            console.log('Certification uploaded successfully!');
          }}
        />
      </div>
    </div>
  );
};

export default Certifications;
