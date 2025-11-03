import React from 'react';
import { Search, X } from 'lucide-react';

interface ClothesSearchBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  categories: string[];
  selectedCategory: string;
  onCategoryClick: (category: string) => void;
  categoryCounts: Record<string, number>;
  filteredItemsCount: number;
  getCategoryDisplayName: (category: string) => string;
}

const ClothesSearchBar: React.FC<ClothesSearchBarProps> = ({
  searchTerm,
  onSearchChange,
  categories,
  selectedCategory,
  onCategoryClick,
  categoryCounts,
  filteredItemsCount,
  getCategoryDisplayName
}) => {
  return (
    <>
      {/* Search Bar - Full Width */}
      <div className="mb-6">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by name, brand, category, or tags..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
          />
          {searchTerm && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Dynamic Category Filter Chips */}
      <div className="flex flex-wrap gap-2 mb-6">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => onCategoryClick(category)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedCategory === category
                ? 'bg-green-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {getCategoryDisplayName(category)} ({categoryCounts[category] || 0})
          </button>
        ))}
      </div>

      {/* Search Results Info */}
      {(searchTerm || selectedCategory !== 'all') && (
        <div className="mb-4 text-sm text-gray-600">
          {filteredItemsCount === 0 
            ? `No items found${searchTerm ? ` for "${searchTerm}"` : ''}${selectedCategory !== 'all' ? ` in ${selectedCategory}` : ''}` 
            : `Showing ${filteredItemsCount} item${filteredItemsCount === 1 ? '' : 's'}${searchTerm ? ` for "${searchTerm}"` : ''}${selectedCategory !== 'all' ? ` in ${selectedCategory}` : ''}`
          }
        </div>
      )}
    </>
  );
};

export default ClothesSearchBar;
