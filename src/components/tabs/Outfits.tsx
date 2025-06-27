import React from 'react';

const Outfits = (): React.ReactElement => {
  return (
    <div className="w-full min-h-[calc(100vh-200px)]">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">My Outfits</h2>
        <button className="px-4 py-2 bg-[#2C2C2C] text-white rounded-lg hover:bg-[#1a1a1a] transition-colors">
          Create Outfit
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {/* Example outfit card */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="aspect-square bg-gray-100"></div>
          <div className="p-4">
            <h3 className="font-medium">Outfit Name</h3>
            <p className="text-sm text-gray-500">Last worn: 2 days ago</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Outfits; 