import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, CheckCircle, XCircle, Users } from '@/lib/icons';

interface StatCardProps {
  title: string;
  value: number;
  status: 'danger' | 'warning' | 'success' | 'neutral';
  subtitle?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, status, subtitle }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'danger':
        return {
          bg: 'bg-gradient-to-br from-red-50 to-rose-50/50',
          text: 'text-red-600',
          icon: XCircle,
        };
      case 'warning':
        return {
          bg: 'bg-gradient-to-br from-orange-50 to-amber-50/50',
          text: 'text-orange-600',
          icon: AlertTriangle,
        };
      case 'success':
        return {
          bg: 'bg-gradient-to-br from-green-50 to-emerald-50/50',
          text: 'text-green-600',
          icon: CheckCircle,
        };
      case 'neutral':
        return {
          bg: 'bg-gradient-to-br from-blue-50 to-indigo-50/50',
          text: 'text-blue-600',
          icon: Users,
        };
    }
  };

  const config = getStatusConfig();
  const IconComponent = config.icon;

  return (
    <Card className={`${config.bg} rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border-0`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-600 mb-1">{title}</p>
            <p className={`text-2xl font-bold tracking-tight ${config.text}`}>{value}</p>
            {subtitle && (
              <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
            )}
          </div>
          <IconComponent className={`h-10 w-10 ${config.text.replace('text-', 'text-').replace('-600', '-500')}`} />
        </div>
      </CardContent>
    </Card>
  );
}; 