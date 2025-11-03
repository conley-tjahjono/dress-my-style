import React from 'react';
import { Search, X } from 'lucide-react';

interface ColorOption {
  name: string;
  hex: string;
}

interface ClothesFiltersProps {
  keywords: string[];
  onRemoveKeyword: (keyword: string) => void;
  onClearAll: () => void;
  selectedTags: string[];
  setSelectedTags: (tags: string[]) => void;
  toggleTag: (tag: string) => void;
  selectedBrands: string[];
  setSelectedBrands: (brands: string[]) => void;
  toggleBrand: (brand: string) => void;
  brandSearchTerm: string;
  setBrandSearchTerm: (term: string) => void;
  filteredBrands: string[];
  selectedSizes: string[];
  toggleSize: (size: string) => void;
  setSelectedSizes: (sizes: string[]) => void;
  selectedAccessorySizes: string[];
  toggleAccessorySize: (size: string) => void;
  setSelectedAccessorySizes: (sizes: string[]) => void;
  selectedShoeSizes: string[];
  toggleShoeSize: (size: string) => void;
  setSelectedShoeSizes: (sizes: string[]) => void;
  selectedColors: string[];
  toggleColor: (color: string) => void;
  setSelectedColors: (colors: string[]) => void;
  colorSearchTerm: string;
  setColorSearchTerm: (term: string) => void;
  filteredColors: ColorOption[];
  priceRange: [number, number];
  setPriceRange: (range: [number, number]) => void;
  allGarmentSizes: string[];
  allAccessorySizes: string[];
  allShoeSizes: string[];
  onApply: () => void;
}

const ClothesFilters: React.FC<ClothesFiltersProps> = ({
  keywords,
  onRemoveKeyword,
  onClearAll,
  selectedTags,
  setSelectedTags,
  toggleTag,
  selectedBrands,
  setSelectedBrands,
  toggleBrand,
  brandSearchTerm,
  setBrandSearchTerm,
  filteredBrands,
  selectedSizes,
  toggleSize,
  setSelectedSizes,
  selectedAccessorySizes,
  toggleAccessorySize,
  setSelectedAccessorySizes,
  selectedShoeSizes,
  toggleShoeSize,
  setSelectedShoeSizes,
  selectedColors,
  toggleColor,
  setSelectedColors,
  colorSearchTerm,
  setColorSearchTerm,
  filteredColors,
  priceRange,
  setPriceRange,
  allGarmentSizes,
  allAccessorySizes,
  allShoeSizes,
  onApply
}) => {
  return (
    <div className="w-64 flex-shrink-0">
      {/* Keywords Section */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Active Filters</h3>
        <div className="flex flex-wrap gap-2 mb-4">
          {keywords.map((keyword, index) => (
            <span
              key={`${keyword}-${index}`}
              className={`inline-flex items-center gap-1 px-3 py-1 text-sm rounded-full ${
                keyword.startsWith('Search: "') 
                  ? 'bg-blue-100 text-blue-800'
                  : keyword.startsWith('Category: ')
                  ? 'bg-purple-100 text-purple-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {keyword}
              <button onClick={() => onRemoveKeyword(keyword)} className="hover:text-red-500">
                <X size={14} />
              </button>
            </span>
          ))}
          {keywords.length === 0 && (
            <span className="text-sm text-gray-500 italic">No active filters</span>
          )}
        </div>
        {/* Clear All Button - Only show when there are active filters */}
        {keywords.length > 0 && (
          <button
            onClick={onClearAll}
            className="w-full text-sm text-red-600 hover:text-red-700 hover:bg-red-50 py-2 px-3 rounded-lg border border-red-200 transition-colors"
          >
            🧹 Clear All Filters
          </button>
        )}
      </div>

      {/* Tags Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-900">Tags</h3>
          {selectedTags.length > 0 && (
            <button
              onClick={() => setSelectedTags([])}
              className="text-xs text-red-500 hover:text-red-700 transition-colors"
            >
              Clear All
            </button>
          )}
        </div>
        
        {/* Selected Tags Display */}
        {selectedTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {selectedTags.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border bg-green-100 text-green-700 border-green-500"
              >
                {tag}
                <button
                  onClick={() => toggleTag(tag)}
                  className="ml-1 hover:opacity-70 transition-opacity"
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Seasonal Tags */}
        <div className="mb-4">
          <p className="text-xs font-medium text-gray-500 mb-2">SEASONAL</p>
          <div className="grid grid-cols-4 gap-2">
            {[
              { name: 'Spring', color: '#10B981' },
              { name: 'Summer', color: '#F59E0B' },
              { name: 'Fall', color: '#D97706' },
              { name: 'Winter', color: '#3B82F6' }
            ].map(tag => (
              <button
                key={tag.name}
                onClick={() => toggleTag(tag.name)}
                className="p-2 border rounded-md text-xs font-medium transition-all duration-200 hover:scale-105 min-h-[2.5rem] flex items-center justify-center text-center leading-tight"
                style={{
                  backgroundColor: selectedTags.includes(tag.name) ? tag.color + '20' : 'transparent',
                  borderColor: selectedTags.includes(tag.name) ? tag.color : '#D1D5DB',
                  color: selectedTags.includes(tag.name) ? tag.color : '#6B7280'
                }}
              >
                {tag.name}
              </button>
            ))}
          </div>
        </div>

        {/* Occasion Tags */}
        <div>
          <p className="text-xs font-medium text-gray-500 mb-2">OCCASION</p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { name: 'Casual', color: '#6B7280' },
              { name: 'Business', color: '#1F2937' },
              { name: 'Date Night', color: '#EC4899' },
              { name: 'Formal', color: '#7C2D12' },
              { name: 'Work', color: '#374151' },
              { name: 'Weekend', color: '#059669' },
              { name: 'Travel', color: '#0891B2' },
              { name: 'Gym', color: '#DC2626' },
              { name: 'Party', color: '#7C3AED' },
              { name: 'Beach', color: '#06B6D4' }
            ].map(tag => (
              <button
                key={tag.name}
                onClick={() => toggleTag(tag.name)}
                className="p-2 border rounded-md text-xs font-medium transition-all duration-200 hover:scale-105 min-h-[2.5rem] flex items-center justify-center text-center leading-tight"
                style={{
                  backgroundColor: selectedTags.includes(tag.name) ? tag.color + '20' : 'transparent',
                  borderColor: selectedTags.includes(tag.name) ? tag.color : '#D1D5DB',
                  color: selectedTags.includes(tag.name) ? tag.color : '#6B7280'
                }}
              >
                {tag.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Price Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-900">Price</h3>
          {priceRange[1] < 100 && (
            <button
              onClick={() => setPriceRange([0, 100])}
              className="text-xs text-red-500 hover:text-red-700 transition-colors"
            >
              Clear
            </button>
          )}
        </div>
        
        {/* Current Price Display */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
          <div className="text-center">
            <span className="text-lg font-semibold text-gray-900">
              ${priceRange[0]} - ${priceRange[1] === 100 ? '100+' : priceRange[1]}
            </span>
            <p className="text-xs text-gray-500 mt-1">Price Range</p>
          </div>
        </div>

        {/* Enhanced Slider */}
        <div className="relative px-1">
          <input
            type="range"
            min="0"
            max="100"
            value={priceRange[1]}
            onChange={(e) => setPriceRange([0, parseInt(e.target.value)])}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-thumb"
            style={{
              background: `linear-gradient(to right, #10B981 0%, #10B981 ${priceRange[1]}%, #E5E7EB ${priceRange[1]}%, #E5E7EB 100%)`
            }}
          />
          
          {/* Price markers */}
          <div className="flex justify-between text-xs text-gray-400 mt-2 px-1">
            <span>$0</span>
            <span>$25</span>
            <span>$50</span>
            <span>$75</span>
            <span>$100+</span>
          </div>
        </div>
      </div>

      {/* Colors Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-900">Colors</h3>
          {selectedColors.length > 0 && (
            <button
              onClick={() => setSelectedColors([])}
              className="text-xs text-red-500 hover:text-red-700 transition-colors"
            >
              Clear All
            </button>
          )}
        </div>
        
        {/* Selected Colors Display */}
        {selectedColors.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {selectedColors.map((color) => (
              <span
                key={color}
                className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs"
              >
                {color.charAt(0).toUpperCase() + color.slice(1)}
                <button
                  onClick={() => toggleColor(color)}
                  className="w-3 h-3 flex items-center justify-center rounded-full hover:bg-green-200"
                >
                  <X size={10} />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Color Search */}
        <div className="relative mb-3">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={14} />
          <input
            type="text"
            placeholder="Search colors..."
            value={colorSearchTerm}
            onChange={(e) => setColorSearchTerm(e.target.value)}
            className="w-full pl-7 pr-8 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          {colorSearchTerm && (
            <button
              onClick={() => setColorSearchTerm('')}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Scrollable Color Grid */}
        <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-lg">
          <div className="grid grid-cols-2 gap-1 p-2">
            {filteredColors.map((colorOption) => (
              <button
                key={colorOption.name}
                onClick={() => toggleColor(colorOption.name)}
                className={`flex items-center gap-2 p-2 rounded-md border transition-all min-h-[2.5rem] ${
                  selectedColors.includes(colorOption.name)
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div
                  className={`w-3 h-3 rounded-full border flex-shrink-0 ${
                    colorOption.name === 'White' ? 'border-gray-400' : 'border-gray-300'
                  }`}
                  style={{ backgroundColor: colorOption.hex }}
                />
                <span className="text-xs text-gray-700 font-medium truncate text-left">{colorOption.name}</span>
              </button>
            ))}
          </div>
          
          {/* No Results Message */}
          {filteredColors.length === 0 && (
            <div className="text-center py-4 text-sm text-gray-500">
              No colors found for "{colorSearchTerm}"
            </div>
          )}
        </div>
      </div>

      {/* Brand Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-900">Brand</h3>
          {selectedBrands.length > 0 && (
            <button
              onClick={() => setSelectedBrands([])}
              className="text-xs text-red-500 hover:text-red-700 transition-colors"
            >
              Clear All
            </button>
          )}
        </div>
        
        {/* Selected Brands Display */}
        {selectedBrands.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {selectedBrands.map((brand) => (
              <span
                key={brand}
                className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs"
              >
                {brand}
                <button
                  onClick={() => toggleBrand(brand)}
                  className="w-3 h-3 flex items-center justify-center rounded-full hover:bg-green-200"
                >
                  <X size={10} />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Brand Search */}
        <div className="relative mb-3">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={14} />
          <input
            type="text"
            placeholder="Search brands..."
            value={brandSearchTerm}
            onChange={(e) => setBrandSearchTerm(e.target.value)}
            className="w-full pl-7 pr-8 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          {brandSearchTerm && (
            <button
              onClick={() => setBrandSearchTerm('')}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Scrollable Brand List */}
        <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-lg">
          <div className="p-2 space-y-1">
            {filteredBrands.map((brand) => (
              <label key={brand} className="flex items-center p-2 rounded-md hover:bg-gray-50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={selectedBrands.includes(brand)}
                  onChange={() => toggleBrand(brand)}
                  className="w-3 h-3 text-green-600 border-gray-300 rounded focus:ring-green-500 focus:ring-1"
                />
                <span className="ml-2 text-sm text-gray-700 flex-1">{brand}</span>
              </label>
            ))}
          </div>
          
          {/* No Results Message */}
          {filteredBrands.length === 0 && (
            <div className="text-center py-4 text-sm text-gray-500">
              {brandSearchTerm ? (
                <>No brands found for "{brandSearchTerm}"</>
              ) : (
                <>No clothing items in your closet yet</>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Garment Size Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-900">Garment Size</h3>
          {selectedSizes.length > 0 && (
            <button
              onClick={() => setSelectedSizes([])}
              className="text-xs text-red-500 hover:text-red-700 transition-colors"
            >
              Clear All
            </button>
          )}
        </div>
        
        {allGarmentSizes.length > 0 ? (
          <div className="space-y-2">
            {allGarmentSizes.map((size) => (
              <label key={size} className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedSizes.includes(size)}
                  onChange={() => toggleSize(size)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">{size}</span>
              </label>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-sm text-gray-500">
            No garment sizes in your closet yet
          </div>
        )}
      </div>

      {/* Accessory Size Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-900">Accessory Size</h3>
          {selectedAccessorySizes.length > 0 && (
            <button
              onClick={() => setSelectedAccessorySizes([])}
              className="text-xs text-red-500 hover:text-red-700 transition-colors"
            >
              Clear All
            </button>
          )}
        </div>
        
        {allAccessorySizes.length > 0 ? (
          <div className="space-y-2">
            {allAccessorySizes.map((size) => (
              <label key={size} className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedAccessorySizes.includes(size)}
                  onChange={() => toggleAccessorySize(size)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">{size}</span>
              </label>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-sm text-gray-500">
            No accessory sizes in your closet yet
          </div>
        )}
      </div>

      {/* Shoe Size Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-900">Shoe Size</h3>
          {selectedShoeSizes.length > 0 && (
            <button
              onClick={() => setSelectedShoeSizes([])}
              className="text-xs text-red-500 hover:text-red-700 transition-colors"
            >
              Clear All
            </button>
          )}
        </div>
        
        {allShoeSizes.length > 0 ? (
          <div className="space-y-2">
            {allShoeSizes.map((size) => (
              <label key={size} className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedShoeSizes.includes(size)}
                  onChange={() => toggleShoeSize(size)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">{size}</span>
              </label>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-sm text-gray-500">
            No shoe sizes in your closet yet
          </div>
        )}
      </div>

      {/* Filter Buttons */}
      <div className="space-y-2">
        <button 
          onClick={onApply}
          className="w-full bg-green-500 text-white py-2.5 rounded-lg font-medium hover:bg-green-600 transition-colors"
        >
          Apply Filters
        </button>
        <button
          onClick={onClearAll}
          className="w-full text-sm text-gray-600 hover:text-gray-700 hover:bg-gray-50 py-2 px-3 rounded-lg border border-gray-200 transition-colors"
        >
          🧹 Clear All
        </button>
      </div>
    </div>
  );
};

export default ClothesFilters;
