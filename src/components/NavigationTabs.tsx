'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Tag, LucideIcon } from 'lucide-react';

type TabType = 'clothes';

interface TabConfig {
  id: TabType;
  label: string;
  icon: LucideIcon;
  href: string;
}

const NavigationTabs = (): React.ReactElement => {
  const pathname = usePathname();

  const tabs: TabConfig[] = [
    { id: 'clothes', label: 'Clothes', icon: Tag, href: '/clothes' }
  ];

  const getTabClasses = (tabHref: string) => {
    const baseClasses = "h-10 w-28 rounded-lg flex items-center gap-1.5 px-3 transition-colors";
    const activeClasses = pathname === tabHref ? "bg-white" : "bg-transparent hover:bg-gray-50";
    return `${baseClasses} ${activeClasses}`;
  };

  const getTextIconClasses = (tabHref: string) => 
    pathname === tabHref ? "text-gray-800" : "text-gray-500";

  return (
    <div className="w-full">
      {/* Navigation Tabs Container */}
      <div className="w-full h-16 bg-gray-100 rounded-lg mb-8">
        <div className="flex items-center h-full px-4">
          {tabs.map(({ id, label, icon: Icon, href }) => (
            <Link 
              key={id}
              href={href}
              className={getTabClasses(href)}
            >
              <Icon 
                size={24} 
                strokeWidth={2.5} 
                className={getTextIconClasses(href)}
              />
              <span className={`text-sm font-medium ${getTextIconClasses(href)}`}>
                {label}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NavigationTabs; 