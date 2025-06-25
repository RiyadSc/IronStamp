import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, FileText, Users, Mail, Download } from 'lucide-react';
import { AddCertificationModal } from './AddCertificationModal';

export const QuickActions: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const actions = [
    {
      icon: Plus,
      title: 'Add Certification',
      description: 'Upload a new certification',
      action: () => setIsModalOpen(true),
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      icon: Users,
      title: 'Add Team Member',
      description: 'Invite new team member',
      action: () => console.log('Add team member'),
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      icon: Mail,
      title: 'Send Reminders',
      description: 'Notify about expiring certs',
      action: () => console.log('Send reminders'),
      color: 'bg-orange-500 hover:bg-orange-600'
    },
    {
      icon: Download,
      title: 'Export Data',
      description: 'Download compliance report',
      action: () => console.log('Export data'),
      color: 'bg-purple-500 hover:bg-purple-600'
    }
  ];

  return (
    <Card className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border-0">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-bold tracking-tight">
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {actions.map((action, index) => {
            const IconComponent = action.icon;
            return (
              <Button
                key={index}
                variant="outline"
                className="h-24 flex flex-col items-center justify-center space-y-2 hover:shadow-md transition-all duration-200"
                onClick={action.action}
              >
                <div className={`p-2 rounded-lg ${action.color}`}>
                  <IconComponent className="h-5 w-5 text-white" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-sm">{action.title}</p>
                  <p className="text-xs text-gray-500">{action.description}</p>
                </div>
              </Button>
            );
          })}
        </div>
      </CardContent>

      {/* Add Certification Modal */}
      <AddCertificationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          // Optionally refresh data or show success message
          console.log('Certification uploaded successfully!');
        }}
      />
    </Card>
  );
}; 