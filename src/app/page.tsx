import React from 'react';
import Header from "@/components/Header";

export default function Home(): React.ReactElement {
  return (
    <div className="font-sans bg-[theme(colors.bg-default)] max-w-xl md:max-w-6xl mx-auto">
      <Header />
      <main>
        {/* Main content will go here */}
      </main>
    </div>
  );
}
