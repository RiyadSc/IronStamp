import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Home, Users, FileText, Settings, Menu, ChevronLeft, Calendar } from '@/lib/icons';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const menuItems = [
  { name: 'Dashboard', href: '/Dashboard', icon: Home },
  { name: 'Team', href: '/Team', icon: Users },
  { name: 'Certifications', href: '/Certifications', icon: FileText },
  { name: 'Calendar', href: '/calendar-demo', icon: Calendar },
  { name: 'Settings', href: '/settings', icon: Settings },
  // { name: 'Billing', href: '/Billing', icon: CreditCard }, // Hidden - uncomment to enable
];

interface SidebarProps {
  isCollapsed?: boolean;
  onToggle?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  isCollapsed: externalCollapsed, 
  onToggle: externalOnToggle 
}) => {
  const router = useRouter();
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  
  // Load collapsed state from localStorage on mount
  useEffect(() => {
    const savedCollapsed = localStorage.getItem('sidebar-collapsed');
    if (savedCollapsed !== null) {
      setInternalCollapsed(JSON.parse(savedCollapsed));
    }
  }, []);
  
  // Use external state if provided, otherwise use internal state
  const isCollapsed = externalCollapsed !== undefined ? externalCollapsed : internalCollapsed;
  
  const handleToggle = externalOnToggle || (() => {
    const newCollapsed = !internalCollapsed;
    setInternalCollapsed(newCollapsed);
    // Persist to localStorage
    localStorage.setItem('sidebar-collapsed', JSON.stringify(newCollapsed));
  });

  return (
    <div className={cn(
      "bg-white border-r border-gray-200 flex flex-col h-screen transition-all duration-300 ease-in-out",
      isCollapsed ? "w-20" : "w-64"
    )}>
      {/* Logo & Toggle */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div className={cn(
          "flex items-center transition-all duration-300",
          isCollapsed ? "justify-center" : "space-x-2"
        )}>
          <img src="/IronStampLogov3.png" alt="IronStamp" className="h-8 w-8 flex-shrink-0" />
          {!isCollapsed && (
            <span className="text-lg font-bold text-gray-900 whitespace-nowrap">IronStamp</span>
          )}
        </div>
        
        {/* Toggle Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleToggle}
          className={cn(
            "h-8 w-8 p-0 hover:bg-gray-100 transition-all duration-200",
            isCollapsed && "mx-auto"
          )}
        >
          {isCollapsed ? (
            <Menu className="h-4 w-4 text-gray-600" />
          ) : (
            <ChevronLeft className="h-4 w-4 text-gray-600" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1">
        {menuItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = router.pathname === item.href;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center rounded-lg text-sm font-medium transition-all duration-200',
                'hover:bg-gray-100 hover:text-gray-900',
                isActive
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600',
                isCollapsed 
                  ? 'justify-center p-3 mx-1' 
                  : 'space-x-3 px-3 py-2'
              )}
              title={isCollapsed ? item.name : undefined}
            >
              <IconComponent className="h-5 w-5 flex-shrink-0" />
              {!isCollapsed && <span className="whitespace-nowrap">{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer - Only show in expanded mode */}
      {!isCollapsed && (
        <div className="p-4 border-t border-gray-200">
          <div className="text-xs text-gray-500 text-center">
            IronStamp v1.0
          </div>
        </div>
      )}
    </div>
  );
}; 