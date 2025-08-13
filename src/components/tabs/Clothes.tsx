import React, { useState, useEffect, useMemo } from 'react';
import { Search, MoreHorizontal, ShoppingCart, X, Edit, Trash2 } from 'lucide-react';
// @ts-expect-error - Supabase client type issue in demo mode
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useServerAuth } from '../../hooks/useServerAuth';
import AddClothesForm from '../AddClothesForm';

// Debug function to test Supabase connection
const testSupabaseConnection = async (userId: string) => {
  try {
    console.log('🧪 Testing Supabase connection...');
    // @ts-expect-error - Supabase client type issue in demo mode
    const result = await supabase.from('clothes').select('count').eq('user_id', userId);
    console.log('🧪 Connection test result:', result);
    return result;
  } catch (error) {
    console.error('🧪 Connection test failed:', error);
    return { error };
  }
};

interface ClothingItem {
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

const Clothes = (): React.ReactElement => {
  const { user, loading: authLoading } = useAuth();
  const { deleteServerClothing } = useServerAuth();
  
  // Current filter selections (not yet applied)
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedAccessorySizes, setSelectedAccessorySizes] = useState<string[]>([]);
  const [selectedShoeSizes, setSelectedShoeSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState([0, 100]);
  
  // Color search functionality
  const [colorSearchTerm, setColorSearchTerm] = useState<string>('');
  
  // Brand search functionality
  const [brandSearchTerm, setBrandSearchTerm] = useState<string>('');
  
  // Dropdown menu state for each clothing item
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  
  // Edit mode state
  const [editingItem, setEditingItem] = useState<ClothingItem | null>(null);
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  
  // Applied filters (used for actual filtering and keywords)
  const [appliedTags, setAppliedTags] = useState<string[]>([]);
  const [appliedBrands, setAppliedBrands] = useState<string[]>([]);
  const [appliedSizes, setAppliedSizes] = useState<string[]>([]);
  const [appliedAccessorySizes, setAppliedAccessorySizes] = useState<string[]>([]);
  const [appliedShoeSizes, setAppliedShoeSizes] = useState<string[]>([]);
  const [appliedColors, setAppliedColors] = useState<string[]>([]);
  const [appliedPriceRange, setAppliedPriceRange] = useState([0, 100]);
  
  const [keywords, setKeywords] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  // Real clothing data from Supabase
  const [clothingItems, setClothingItems] = useState<ClothingItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadingTimeout, setLoadingTimeout] = useState<NodeJS.Timeout | null>(null);

  // Load clothing data from Supabase
  useEffect(() => {
    let isCancelled = false;
    
    const fetchClothingItems = async () => {
      try {
        console.log('🔄 Starting clothes fetch - Auth loading:', authLoading, 'User:', user?.email || 'null', 'Cancelled:', isCancelled);
        
        // Don't fetch if auth is still loading
        if (authLoading) {
          console.log('⏳ Auth still loading, waiting...');
          return;
        }
        
        if (!user) {
          console.log('🔐 User not authenticated, skipping data load');
          if (!isCancelled) {
            setClothingItems([]);
            setIsLoading(false);
          }
          return;
        }
        
        console.log('👤 User authenticated, fetching clothing data for:', user.email);

        // Test connection first
        const connectionTest = await testSupabaseConnection(user.id);
        console.log('🔌 Connection test completed:', connectionTest);

        // Add timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Database query timed out')), 10000)
        );

        // @ts-expect-error - Supabase client type issue in demo mode
        const queryPromise = supabase
          .from('clothes')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        console.log('📡 Executing Supabase query for user:', user.id);
        const result = await Promise.race([queryPromise, timeoutPromise]);
        console.log('📨 Query result received:', result);
        
        if (isCancelled) {
          console.log('🚫 Request was cancelled, ignoring result');
          return;
        }
        
        const { data, error } = result;

        if (error) {
          console.error('❌ Error loading clothes:', error);
          console.error('❌ Error details:', { code: error.code, message: error.message, hint: error.hint });
          if (!isCancelled) {
            setIsLoading(false);
          }
          return;
        }

        // Transform Supabase data to match our interface
        const transformedData: ClothingItem[] = data?.map((item: Record<string, unknown>) => ({
          id: String(item.id),
          name: String(item.name || 'Untitled'),
          brand: String(item.brand || 'Unknown Brand'), 
          image: String(item.image_url || '/api/placeholder/300/300'),
          color: String(item.color || '#gray'),
          tags: (item.tags as string[]) || [],
          category: (item.category as string)?.toLowerCase() || 'other',
          size_type: item.size_type,
          size: item.size,
          price_min: item.price_min,
          price_max: item.price_max,
          image_url: item.image_url,
          created_at: item.created_at,
          updated_at: item.updated_at
        })) || [];

        if (!isCancelled) {
          setClothingItems(transformedData);
          console.log('✅ Loaded', transformedData.length, 'clothing items');
        }
      } catch (error) {
        console.error('💥 Unexpected error loading clothes:', error);
        if (error instanceof Error) {
          console.error('💥 Error message:', error.message);
          console.error('💥 Error stack:', error.stack);
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
          console.log('🏁 Clothes loading complete');
        }
      }
    };

    fetchClothingItems();
    
    return () => {
      isCancelled = true;
      console.log('🧹 Cleaning up clothes fetch');
    };
  }, [user?.id, authLoading]); // Only depend on user ID and auth loading state

  // Emergency timeout to prevent infinite loading
  useEffect(() => {
    if (authLoading || isLoading) {
      console.log('⏰ Setting emergency timeout for loading state');
      const timeout = setTimeout(() => {
        console.log('🚨 Emergency timeout: Force stopping loading state');
        setIsLoading(false);
      }, 15000); // 15 second emergency timeout
      
      setLoadingTimeout(timeout);
      
      return () => {
        clearTimeout(timeout);
        setLoadingTimeout(null);
      };
    } else {
      // Clear timeout when not loading
      setLoadingTimeout(prev => {
        if (prev) {
          clearTimeout(prev);
        }
        return null;
      });
    }
  }, [authLoading, isLoading]); // Removed loadingTimeout from dependencies

  // Get unique categories from clothing items
  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(clothingItems.map(item => item.category))];
    return ['all', ...uniqueCategories];
  }, [clothingItems]);

  // Filter clothing items based on search term, category, and APPLIED filters
  const filteredItems = useMemo(() => {
    let items = clothingItems;
    console.log('clothingItems', clothingItems)

    // Filter by search term
    if (searchTerm.trim()) {
      items = items.filter(item => {
        const searchLower = searchTerm.toLowerCase();
        return (
          item.name.toLowerCase().includes(searchLower) ||
          item.brand.toLowerCase().includes(searchLower) ||
          item.category.toLowerCase().includes(searchLower) ||
          item.tags.some(tag => tag.toLowerCase().includes(searchLower))
        );
      });
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      items = items.filter(item => item.category === selectedCategory);
    }

    // Apply sidebar filters only if they have been applied
    items = items.filter(item => {

      // Tag filter
      if (appliedTags.length > 0) {
        const hasMatchingTag = item.tags.some(tag => appliedTags.includes(tag));
        if (!hasMatchingTag) return false;
      }

      // Brand filter
      if (appliedBrands.length > 0) {
        if (!appliedBrands.includes(item.brand)) return false;
      }

      // Color filter - handle both comma-separated and single colors
      if (appliedColors.length > 0) {
        const itemColorString = String(item.color || '');
        const itemColors = itemColorString
          .split(',')
          .map(c => c.trim().toLowerCase())
          .filter(Boolean);
        
        const hasMatchingColor = appliedColors.some(filterColor => 
          itemColors.includes(filterColor.toLowerCase())
        );
        if (!hasMatchingColor) return false;
      }

      // Size filters - check different size types based on category
      // If any size filters are applied, we need to determine which categories to show
      const hasGarmentSizes = appliedSizes.length > 0;
      const hasAccessorySizes = appliedAccessorySizes.length > 0;
      const hasShoeSizes = appliedShoeSizes.length > 0;
      
      // If ANY size filter is applied, only show items from those specific categories
      if (hasGarmentSizes || hasAccessorySizes || hasShoeSizes) {
        const itemCategory = item.category.toLowerCase();
        const garmentCategories = ['shirts', 'pants', 'dresses', 'jackets', 'sweaters'];
        
        let shouldShowItem = false;
        
        // Check if item belongs to a category with active size filters
        if (hasGarmentSizes && garmentCategories.includes(itemCategory)) {
          shouldShowItem = appliedSizes.includes(item.size || '');
        }
        
        if (hasAccessorySizes && itemCategory === 'accessories') {
          shouldShowItem = appliedAccessorySizes.includes(item.size || '');
        }
        
        if (hasShoeSizes && itemCategory === 'shoes') {
          shouldShowItem = appliedShoeSizes.includes(item.size || '');
        }
        
        // If item doesn't match any active size filter categories, exclude it
        if (!shouldShowItem) return false;
      }

      // Price filter
      if (appliedPriceRange[1] < 100) {
        const itemPrice = item.price_min || 0;
        if (itemPrice > appliedPriceRange[1]) return false;
      }

      return true;
    });

    return items;
  }, [searchTerm, selectedCategory, appliedTags, appliedBrands, appliedColors, appliedSizes, appliedAccessorySizes, appliedShoeSizes, appliedPriceRange, clothingItems]);

  // Get category counts based on search term but not category filter
  const categoryCounts = useMemo(() => {
    let searchFilteredItems = clothingItems;
    
    // Apply search filter but not category filter for accurate counts
    if (searchTerm.trim()) {
      searchFilteredItems = clothingItems.filter(item => {
        const searchLower = searchTerm.toLowerCase();
        return (
          item.name.toLowerCase().includes(searchLower) ||
          item.brand.toLowerCase().includes(searchLower) ||
          item.category.toLowerCase().includes(searchLower) ||
          item.tags.some(tag => tag.toLowerCase().includes(searchLower))
        );
      });
    }

    const counts = searchFilteredItems.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      all: searchFilteredItems.length,
      ...counts,
    } as Record<string, number>;
  }, [searchTerm, clothingItems]);

  // Update keywords based on APPLIED filters and search/category
  useEffect(() => {
    const allKeywords = [
      ...(searchTerm.trim() ? [`Search: "${searchTerm}"`] : []),
      ...(selectedCategory !== 'all' ? [`Category: ${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}`] : []),
      ...appliedTags,
      ...appliedBrands,
      ...appliedSizes.map(size => `Size ${size}`),
      ...appliedAccessorySizes.map(size => `Accessory ${size}`),
      ...appliedShoeSizes.map(size => `Shoe ${size}`),
      ...appliedColors.map(color => color.charAt(0).toUpperCase() + color.slice(1)),
      ...(appliedPriceRange[1] < 100 ? [`Under $${appliedPriceRange[1]}`] : [])
    ];
    setKeywords(allKeywords);
  }, [searchTerm, selectedCategory, appliedTags, appliedBrands, appliedSizes, appliedAccessorySizes, appliedShoeSizes, appliedColors, appliedPriceRange]);

  const removeKeyword = (keyword: string) => {
    console.log('removeKeyword', keyword)
    // Remove from appropriate APPLIED filter based on keyword type
    if (keyword.startsWith('Search: "')) {
      setSearchTerm('');
    } else if (keyword.startsWith('Category: ')) {
      setSelectedCategory('all');
    } else if (appliedTags.includes(keyword)) {
      setAppliedTags(prev => prev.filter(t => t !== keyword));
      setSelectedTags(prev => prev.filter(t => t !== keyword));
    } else if (appliedBrands.includes(keyword)) {
      setAppliedBrands(prev => prev.filter(b => b !== keyword));
      setSelectedBrands(prev => prev.filter(b => b !== keyword));
    } else if (keyword.startsWith('Size ')) {
      const size = keyword.replace('Size ', '');
      setAppliedSizes(prev => prev.filter(s => s !== size));
      setSelectedSizes(prev => prev.filter(s => s !== size));
    } else if (keyword.startsWith('Accessory ')) {
      const size = keyword.replace('Accessory ', '');
      setAppliedAccessorySizes(prev => prev.filter(s => s !== size));
      setSelectedAccessorySizes(prev => prev.filter(s => s !== size));
    } else if (keyword.startsWith('Shoe ')) {
      const size = keyword.replace('Shoe ', '');
      setAppliedShoeSizes(prev => prev.filter(s => s !== size));
      setSelectedShoeSizes(prev => prev.filter(s => s !== size));
    } else if (keyword.startsWith('Under $')) {
      setAppliedPriceRange([0, 100]);
      setPriceRange([0, 100]);
    } else {
      // Handle color keywords - use case-insensitive comparison
      console.log('🎨 Removing color keyword:', keyword);
      setAppliedColors(prev => prev.filter(c => c.toLowerCase() !== keyword.toLowerCase()));
      setSelectedColors(prev => prev.filter(c => c.toLowerCase() !== keyword.toLowerCase()));
    }
  };

  const handleCategoryClick = (category: string) => {
    setSelectedCategory(category);
  };

  const handleApplyFilters = () => {
    setAppliedTags([...selectedTags]);
    setAppliedBrands([...selectedBrands]);
    setAppliedSizes([...selectedSizes]);
    setAppliedAccessorySizes([...selectedAccessorySizes]);
    setAppliedShoeSizes([...selectedShoeSizes]);
    setAppliedColors([...selectedColors]);
    setAppliedPriceRange([...priceRange]);
  };

  const clearAllFilters = () => {
    // Clear all selected filters (sidebar state)
    setSelectedTags([]);
    setSelectedBrands([]);
    setSelectedSizes([]);
    setSelectedAccessorySizes([]);
    setSelectedShoeSizes([]);
    setSelectedColors([]);
    setPriceRange([0, 100]);

    // Clear all applied filters (active state)
    setAppliedTags([]);
    setAppliedBrands([]);
    setAppliedSizes([]);
    setAppliedAccessorySizes([]);
    setAppliedShoeSizes([]);
    setAppliedColors([]);
    setAppliedPriceRange([0, 100]);

    // Clear search and category
    setSearchTerm('');
    setSelectedCategory('all');

    console.log('🧹 All filters cleared');
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const toggleBrand = (brand: string) => {
    setSelectedBrands(prev => 
      prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]
    );
  };

  const toggleSize = (size: string) => {
    setSelectedSizes(prev => 
      prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]
    );
  };

  const toggleAccessorySize = (size: string) => {
    setSelectedAccessorySizes(prev => 
      prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]
    );
  };

  const toggleShoeSize = (size: string) => {
    setSelectedShoeSizes(prev => 
      prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]
    );
  };

    // Color list matching AddClothesForm (including jewelry colors)
  const allColors = [
    // Base clothing colors
    { name: 'Black', hex: '#000000' },
    { name: 'White', hex: '#FFFFFF' },
    { name: 'Gray', hex: '#6B7280' },
    { name: 'Navy', hex: '#1E3A8A' },
    { name: 'Blue', hex: '#3B82F6' },
    { name: 'Red', hex: '#EF4444' },
    { name: 'Green', hex: '#10B981' },
    { name: 'Brown', hex: '#A16207' },
    { name: 'Beige', hex: '#D6D3D1' },
    { name: 'Pink', hex: '#EC4899' },
    { name: 'Purple', hex: '#8B5CF6' },
    { name: 'Yellow', hex: '#EAB308' },
    { name: 'Orange', hex: '#F97316' },
    { name: 'Khaki', hex: '#A3A380' },
    { name: 'Burgundy', hex: '#7C2D12' },
    { name: 'Cream', hex: '#FEF3C7' },
    // Jewelry/Accessory colors
    { name: 'Gold', hex: '#FFD700' },
    { name: 'Silver', hex: '#C0C0C0' },
    { name: 'Bronze', hex: '#CD7F32' },
    { name: 'Rose Gold', hex: '#E8B4A0' },
    { name: 'Copper', hex: '#B87333' },
    { name: 'Platinum', hex: '#E5E4E2' },
    { name: 'Pearl', hex: '#F8F6F0' },
    { name: 'Diamond', hex: '#F0F8FF' },
    { name: 'Crystal', hex: '#E6E6FA' }
  ];

  // Filter colors based on search term
  const filteredColors = useMemo(() => {
    if (!colorSearchTerm.trim()) return allColors;
    
    const searchLower = colorSearchTerm.toLowerCase();
    return allColors.filter(color => 
      color.name.toLowerCase().includes(searchLower)
    );
  }, [colorSearchTerm, allColors]);

  // Dynamic brand list from user's actual clothing items
  const allBrands = useMemo(() => {
    const uniqueBrands = [...new Set(clothingItems.map(item => item.brand))];
    return uniqueBrands.sort();
  }, [clothingItems]);

  // Dynamic size lists based on user's actual clothing items and their categories
  const allGarmentSizes = useMemo(() => {
    const garmentCategories = ['shirts', 'pants', 'dresses', 'jackets', 'sweaters'];
    const sizes = clothingItems
      .filter(item => garmentCategories.includes(item.category.toLowerCase()) && item.size)
      .map(item => item.size!)
      .filter(Boolean);
    return [...new Set(sizes)].sort();
  }, [clothingItems]);

  const allAccessorySizes = useMemo(() => {
    const sizes = clothingItems
      .filter(item => item.category.toLowerCase() === 'accessories' && item.size)
      .map(item => item.size!)
      .filter(Boolean);
    return [...new Set(sizes)].sort();
  }, [clothingItems]);

  const allShoeSizes = useMemo(() => {
    const sizes = clothingItems
      .filter(item => item.category.toLowerCase() === 'shoes' && item.size)
      .map(item => item.size!)
      .filter(Boolean);
    return [...new Set(sizes)].sort();
  }, [clothingItems]);

  // Filter brands based on search term
  const filteredBrands = useMemo(() => {
    if (!brandSearchTerm.trim()) return allBrands;
    
    const searchLower = brandSearchTerm.toLowerCase();
    return allBrands.filter(brand => 
      brand.toLowerCase().includes(searchLower)
    );
  }, [brandSearchTerm, allBrands]);

  const toggleColor = (colorName: string) => {
    setSelectedColors(prev =>
      prev.includes(colorName) ? prev.filter(c => c !== colorName) : [...prev, colorName]
    );
  };

  const getColorClasses = (color: string) => {
    const colorMap: { [key: string]: string } = {
      orange: 'bg-orange-400',
      yellow: 'bg-yellow-400', 
      teal: 'bg-teal-400',
      gray: 'bg-gray-600',
      blue: 'bg-blue-400',
      white: 'bg-gray-100',
      gold: 'bg-yellow-500',
      black: 'bg-gray-900',
      silver: 'bg-gray-300'
    };
    return colorMap[color] || 'bg-gray-200';
  };

  const getCategoryDisplayName = (category: string) => {
    if (category === 'all') return 'All Items';
    return category.charAt(0).toUpperCase() + category.slice(1);
  };

  // Handle dropdown toggle
  const toggleDropdown = (itemId: string) => {
    setOpenDropdownId(openDropdownId === itemId ? null : itemId);
  };

  // Handle edit clothing item
  const handleEditItem = (item: ClothingItem) => {
    console.log('🖊️ Edit item:', item);
    // Close dropdown
    setOpenDropdownId(null);
    // Set editing item and open edit form
    setEditingItem(item);
    setIsEditFormOpen(true);
  };

  // Handle closing edit form
  const handleCloseEditForm = () => {
    setIsEditFormOpen(false);
    setEditingItem(null);
  };

  // Handle successful edit update
  const handleEditSuccess = (updatedItem: ClothingItem) => {
    console.log('🔄 Handling edit success for item:', updatedItem.id);
    console.log('📝 Updated item data:', updatedItem);
    
    // Update the item in the local state
    setClothingItems(prev => {
      const updated = prev.map(item => 
        item.id === updatedItem.id ? updatedItem : item
      );
      console.log('✅ Clothing items updated in state');
      return updated;
    });
    
    // Close the edit form
    handleCloseEditForm();
  };

  // Handle successful add
  const handleAddSuccess = (newItem: ClothingItem) => {
    console.log('🔄 Handling add success for new item:', newItem.id);
    console.log('📝 New item data:', newItem);
    
    // Add the new item to the local state
    setClothingItems(prev => {
      const updated = [newItem, ...prev]; // Add to beginning to match created_at desc order
      console.log('✅ New clothing item added to state');
      return updated;
    });
    
    // Close the add form
    handleCloseEditForm();
  };

  // Handle delete clothing item
  const handleDeleteItem = async (item: ClothingItem) => {
    if (!confirm(`Are you sure you want to delete "${item.name}"?`)) {
      return;
    }

    try {
      console.log('🗑️ Deleting item via server API:', item);
      
      const result = await deleteServerClothing(item.id);

      if (result.error) {
        console.error('❌ Error deleting item:', result.error);
        alert('Failed to delete item. Please try again.');
        return;
      }

      // Remove from local state
      setClothingItems(prev => prev.filter(i => i.id !== item.id));
      console.log('✅ Item deleted successfully via server API');
      
    } catch (error) {
      console.error('💥 Unexpected error deleting item:', error);
      alert('An unexpected error occurred. Please try again.');
    }
    
    // Close dropdown
    setOpenDropdownId(null);
  };

  // Close dropdown when clicking outside
  const handleClickOutside = (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    if (!target.closest('.dropdown-container')) {
      setOpenDropdownId(null);
    }
  };

  // Add click outside listener
  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    
    // Listen for clothes added from Header component
    const handleClothesAdded = (event: CustomEvent) => {
      const newItem = event.detail;
      console.log('🔄 Received clothesAdded event:', newItem);
      // Add the new item to the local state
      setClothingItems(prev => {
        const updated = [newItem, ...prev];
        console.log('✅ New clothing item added to state from Header');
        return updated;
      });
    };
    
    window.addEventListener('clothesAdded', handleClothesAdded as EventListener);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('clothesAdded', handleClothesAdded as EventListener);
    };
  }, []);

  return (
    <div className="flex gap-8 w-full">
      {/* Sidebar Filters */}
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
                <button onClick={() => removeKeyword(keyword)} className="hover:text-red-500">
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
              onClick={clearAllFilters}
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
            onClick={handleApplyFilters}
            className="w-full bg-green-500 text-white py-2.5 rounded-lg font-medium hover:bg-green-600 transition-colors"
          >
            Apply Filters
          </button>
          <button
            onClick={clearAllFilters}
            className="w-full text-sm text-gray-600 hover:text-gray-700 hover:bg-gray-50 py-2 px-3 rounded-lg border border-gray-200 transition-colors"
          >
            🧹 Clear All
        </button>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1">
        {/* Search Bar - Full Width */}
        <div className="mb-6">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by name, brand, category, or tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
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
              onClick={() => handleCategoryClick(category)}
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
            {filteredItems.length === 0 
              ? `No items found${searchTerm ? ` for "${searchTerm}"` : ''}${selectedCategory !== 'all' ? ` in ${selectedCategory}` : ''}` 
              : `Showing ${filteredItems.length} item${filteredItems.length === 1 ? '' : 's'}${searchTerm ? ` for "${searchTerm}"` : ''}${selectedCategory !== 'all' ? ` in ${selectedCategory}` : ''}`
            }
          </div>
        )}

        {/* Clothing Grid */}
        {authLoading || isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
              <p className="text-gray-500">Loading your closet...</p>
              <p className="text-xs text-gray-400 mt-2">Auth: {authLoading ? 'loading' : 'ready'}, Data: {isLoading ? 'loading' : 'ready'}</p>
              <button
                onClick={() => {
                  console.log('🔄 Manual refresh triggered');
                  setIsLoading(false);
                  window.location.reload();
                }}
                className="mt-4 px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors"
              >
                Force Refresh
              </button>
            </div>
          </div>
        ) : !user ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="text-6xl mb-4">🔐</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Sign in to view your closet</h3>
              <p className="text-gray-500">Please sign in to add and manage your clothing items</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-500">
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="text-lg font-medium mb-2">No items found</h3>
              <p>Try adjusting your search or filters</p>
            </div>
          ) : (
            filteredItems.map((item) => (
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
                        onClick={() => toggleDropdown(item.id)}
                        className="w-8 h-8 bg-white bg-opacity-90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition-all"
                      >
                        <MoreHorizontal size={16} className="text-gray-600" />
                      </button>
                      
                      {/* Dropdown Menu */}
                      {openDropdownId === item.id && (
                        <div className="absolute right-0 top-10 w-36 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                          <button
                            onClick={() => handleEditItem(item)}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"
                          >
                            <Edit size={14} className="text-blue-500" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item)}
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
            ))
          )}
          </div>
        )}
      </div>
      
      {/* Edit Form Sidebar */}
      <AddClothesForm
        isOpen={isEditFormOpen}
        onClose={handleCloseEditForm}
        editingItem={editingItem}
        onEditSuccess={handleEditSuccess}
        onCancel={handleCloseEditForm}
        onAddSuccess={handleAddSuccess}
      />
    </div>
  );
};

export default Clothes; 