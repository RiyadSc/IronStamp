import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Home, Users, FileText, Settings, CreditCard, LogOut, Shield } from '@/lib/icons';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const menuItems = [
  { name: 'Dashboard', href: '/Dashboard', icon: Home },
  { name: 'Team', href: '/Team', icon: Users },
  { name: 'Certifications', href: '/Certifications', icon: FileText },
  { name: 'Settings', href: '/settings', icon: Settings },
  // { name: 'Billing', href: '/Billing', icon: CreditCard }, // Hidden - uncomment to enable
];

export const Sidebar = () => {
  const router = useRouter();

  const handleLogout = () => {
    // Add logout logic here
    window.location.href = '/';
  };

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <img src="/IronStampLogov3.png" alt="IronStamp" className="h-9 w-9" />
          <span className="text-xl font-bold text-gray-900">IronStamp</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {menuItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = router.pathname === item.href;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              )}
            >
              <IconComponent className="h-5 w-5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-gray-200">
        <Button
          variant="ghost"
          className="w-full justify-start text-gray-600 hover:text-gray-900"
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5 mr-3" />
          Logout
        </Button>
      </div>
    </div>
  );
}; 