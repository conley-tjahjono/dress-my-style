import React from 'react';

const Analytics = (): React.ReactElement => {
  return (
    <div className="w-full min-h-[calc(100vh-200px)]">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Analytics</h2>
        <div className="flex gap-4">
          <button className="px-4 py-2 bg-[#2C2C2C] text-white rounded-lg hover:bg-[#1a1a1a] transition-colors">
            Export Data
          </button>
          <button className="px-4 py-2 bg-[#2C2C2C] text-white rounded-lg hover:bg-[#1a1a1a] transition-colors">
            Generate Report
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Wardrobe Overview Card */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-medium mb-4">Wardrobe Overview</h3>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Items</span>
              <span className="font-medium">124</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Categories</span>
              <span className="font-medium">8</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Most Worn</span>
              <span className="font-medium">Blue Jeans</span>
            </div>
          </div>
        </div>

        {/* Most Worn Items Card */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-medium mb-4">Most Worn Items</h3>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-600">Blue Jeans</span>
              <span className="font-medium">24 times</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">White T-Shirt</span>
              <span className="font-medium">18 times</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Black Hoodie</span>
              <span className="font-medium">15 times</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics; 