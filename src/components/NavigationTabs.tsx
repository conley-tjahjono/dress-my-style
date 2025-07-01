'use client';

import React, { useState } from 'react';
import { Tag, Package, PieChart, LucideIcon } from 'lucide-react';
import Clothes from './tabs/Clothes';
import Outfits from './tabs/Outfits';
import Analytics from './tabs/Analytics';

type TabType = 'clothes' | 'outfits' | 'analytics';

interface TabConfig {
  id: TabType;
  label: string;
  icon: LucideIcon;
  component: React.ReactElement;
}

const NavigationTabs = (): React.ReactElement => {
  const [activeTab, setActiveTab] = useState<TabType>('clothes');

  const tabs: TabConfig[] = [
    { id: 'clothes', label: 'Clothes', icon: Tag, component: <Clothes /> },
    { id: 'outfits', label: 'Outfits', icon: Package, component: <Outfits /> },
    { id: 'analytics', label: 'Analytics', icon: PieChart, component: <Analytics /> }
  ];

  const getActiveTab = () => tabs.find(tab => tab.id === activeTab)?.component || <Clothes />;

  const getTabClasses = (tabId: TabType) => {
    const baseClasses = "h-10 w-28 rounded-lg flex items-center gap-1.5 px-3";
    const activeClasses = tabId === activeTab ? "bg-white" : "bg-transparent";
    return `${baseClasses} ${activeClasses}`;
  };

  const getTextIconClasses = (tabId: TabType) => 
    tabId === activeTab ? "text-gray-800" : "text-gray-500";

  return (
    <div className="w-full">
      {/* Navigation Tabs Container */}
      <div className="w-full h-16 bg-gray-100 rounded-lg mb-8">
        <div className="flex items-center h-full px-4">
          {tabs.map(({ id, label, icon: Icon }) => (
          <button 
              key={id}
              onClick={() => setActiveTab(id)}
              className={getTabClasses(id)}
          >
              <Icon 
                size={24} 
                strokeWidth={2.5} 
                className={getTextIconClasses(id)}
              />
              <span className={`text-sm font-medium ${getTextIconClasses(id)}`}>
                {label}
              </span>
          </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="w-full">
        {getActiveTab()}
      </div>
    </div>
  );
};

export default NavigationTabs; 