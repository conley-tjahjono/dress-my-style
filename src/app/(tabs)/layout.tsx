'use client';

import React from 'react';
import NavigationTabs from '@/components/NavigationTabs';

export default function TabsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="font-sans bg-[theme(colors.bg-default)]">
      <main>
        <NavigationTabs />
        {children}
      </main>
    </div>
  );
}

