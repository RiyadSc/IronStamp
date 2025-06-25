import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, FileText, Users, Mail, AlertTriangle, Download } from 'lucide-react';
import { AddCertificationModal } from './AddCertificationModal';

export const QuickActionsWidget: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const actions = [
    {
      icon: Plus,
      title: 'Add Certification',
      description: 'Upload new cert',
      action: () => setIsModalOpen(true),
      variant: 'default' as const
    },
    {
      icon: Users,
      title: 'Add Team Member',
      description: 'Invite member',
      action: () => console.log('Add team member'),
      variant: 'outline' as const
    },
    {
      icon: Mail,
      title: 'Send Reminders',
      description: 'Notify team',
      action: () => console.log('Send reminders'),
      variant: 'outline' as const
    },
    {
      icon: Download,
      title: 'Export Report',
      description: 'Download data',
      action: () => console.log('Export data'),
      variant: 'outline' as const
    }
  ];

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