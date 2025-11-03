import React from 'react';
import { ShoppingCart, MoreHorizontal, Edit, Trash2 } from 'lucide-react';

export interface ClothingItem {
  id: string;
  name: string;
  brand: string;
  image: string;
  color: string;
  tags: string[];
  category: string;
  size_type?: string;
  size?: string;
  price_min?: number;
  price_max?: number;
  image_url?: string;
  created_at?: string;
  updated_at?: string;
}

interface ClothesCardsProps {
  items: ClothingItem[];
  isLoading: boolean;
  authLoading: boolean;
  user: { id: string; email: string } | null;
  openDropdownId: string | null;
  onToggleDropdown: (itemId: string) => void;
  onEdit: (item: ClothingItem) => void;
  onDelete: (item: ClothingItem) => void;
  getColorClasses: (color: string) => string;
}

const ClothesCards: React.FC<ClothesCardsProps> = ({
  items,
  isLoading,
  authLoading,
  user,
  openDropdownId,
  onToggleDropdown,
  onEdit,
  onDelete,
  getColorClasses
}) => {
  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading your closet...</p>
          <p className="text-xs text-gray-400 mt-2">Auth: {authLoading ? 'loading' : 'ready'}, Data: {isLoading ? 'loading' : 'ready'}</p>
          <button
            onClick={() => {
              console.log('🔄 Manual refresh triggered');
              window.location.reload();
            }}
            className="mt-4 px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors"
          >
            Force Refresh
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="text-6xl mb-4">🔐</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Sign in to view your closet</h3>
          <p className="text-gray-500">Please sign in to add and manage your clothing items</p>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="col-span-full text-center py-12 text-gray-500">
        <div className="text-4xl mb-4">🔍</div>
        <h3 className="text-lg font-medium mb-2">No items found</h3>
        <p>Try adjusting your search or filters</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map((item) => (
        <div key={item.id} className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
          {/* Image Container */}
          <div className="relative aspect-square overflow-hidden bg-gray-100">
            {/* Image or Fallback */}
            {(item.image_url || item.image) ? (
              <img
                src={item.image_url || item.image}
                alt={item.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback to colored background if image fails to load
                  console.log('🖼️ Image failed to load for:', item.name);
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const fallback = target.nextElementSibling as HTMLElement;
                  if (fallback) {
                    fallback.style.display = 'flex';
                  }
                }}
              />
            ) : null}
            
            {/* Fallback content when no image or image fails */}
            <div 
              className={`absolute inset-0 ${getColorClasses(item.color)} flex items-center justify-center transition-all ${(item.image_url || item.image) ? 'hidden' : 'flex'}`}
              style={{ display: (item.image_url || item.image) ? 'none' : 'flex' }}
            >
              <div className="text-center">
                <ShoppingCart size={40} className="text-white mx-auto mb-2" />
                <div className="text-white text-sm font-medium px-2 text-center">
                  {item.name}
                </div>
              </div>
            </div>
            
            {/* Action Buttons - Always on top */}
            <div className="absolute top-3 right-3 flex gap-2">
              {/* Dropdown Menu Container */}
              <div className="relative dropdown-container">
                <button 
                  onClick={() => onToggleDropdown(item.id)}
                  className="w-8 h-8 bg-white bg-opacity-90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition-all"
                >
                  <MoreHorizontal size={16} className="text-gray-600" />
                </button>
                
                {/* Dropdown Menu */}
                {openDropdownId === item.id && (
                  <div className="absolute right-0 top-10 w-36 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                    <button
                      onClick={() => onEdit(item)}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"
                    >
                      <Edit size={14} className="text-blue-500" />
                      Edit
                    </button>
                    <button
                      onClick={() => onDelete(item)}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                    >
                      <Trash2 size={14} className="text-red-500" />
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Card Content */}
          <div className="p-4">
            <h3 className="font-medium text-gray-900 mb-1">{item.name}</h3>
            <p className="text-sm text-gray-500 mb-3">{item.brand}</p>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
              {item.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded whitespace-nowrap flex-shrink-0"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ClothesCards;
