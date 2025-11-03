'use client';

import React, { useEffect, useMemo, useState } from 'react';
// @ts-expect-error - Supabase client type issue in demo mode
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useServerAuth } from '@/hooks/useServerAuth';
import AddClothesForm from '@/components/AddClothesForm';
import ClothesSearchBar from '@/components/tabs/parts/ClothesSearchBar';
import ClothesFilters from '@/components/tabs/parts/ClothesFilters';
import ClothesCards, { ClothingItem } from '@/components/tabs/parts/ClothesCards';

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

export default function ClothesPage(): React.ReactElement {
  const { user, loading: authLoading } = useAuth();
  const { deleteServerClothing } = useServerAuth();

  // Current filter selections (not yet applied)
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedAccessorySizes, setSelectedAccessorySizes] = useState<string[]>([]);
  const [selectedShoeSizes, setSelectedShoeSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100]);

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
  const [appliedPriceRange, setAppliedPriceRange] = useState<[number, number]>([0, 100]);

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
        
        const { data, error } = result as { data: any[]; error: any };

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
          image: String((item as any).image_url || '/api/placeholder/300/300'),
          color: String(item.color || '#gray'),
          tags: (item.tags as string[]) || [],
          category: (item.category as string)?.toLowerCase() || 'other',
          size_type: (item as any).size_type as any,
          size: (item as any).size as any,
          price_min: (item as any).price_min as any,
          price_max: (item as any).price_max as any,
          image_url: (item as any).image_url as any,
          created_at: (item as any).created_at as any,
          updated_at: (item as any).updated_at as any
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
  }, [user?.id, authLoading]);

  // Emergency timeout to prevent infinite loading
  useEffect(() => {
    if (authLoading || isLoading) {
      console.log('⏰ Setting emergency timeout for loading state');
      const timeout = setTimeout(() => {
        console.log('🚨 Emergency timeout: Force stopping loading state');
        setIsLoading(false);
      }, 15000);
      
      setLoadingTimeout(timeout);
      
      return () => {
        clearTimeout(timeout);
        setLoadingTimeout(null);
      };
    } else {
      setLoadingTimeout(prev => {
        if (prev) clearTimeout(prev);
        return null;
      });
    }
  }, [authLoading, isLoading]);

  // Get unique categories from clothing items
  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(clothingItems.map(item => item.category))];
    return ['all', ...uniqueCategories];
  }, [clothingItems]);

  // Filter clothing items based on search term, category, and APPLIED filters
  const filteredItems = useMemo(() => {
    let items = clothingItems;

    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      items = items.filter(item => (
        item.name.toLowerCase().includes(searchLower) ||
        item.brand.toLowerCase().includes(searchLower) ||
        item.category.toLowerCase().includes(searchLower) ||
        item.tags.some(tag => tag.toLowerCase().includes(searchLower))
      ));
    }

    if (selectedCategory !== 'all') {
      items = items.filter(item => item.category === selectedCategory);
    }

    items = items.filter(item => {
      if (appliedTags.length > 0) {
        const hasMatchingTag = item.tags.some(tag => appliedTags.includes(tag));
        if (!hasMatchingTag) return false;
      }

      if (appliedBrands.length > 0) {
        if (!appliedBrands.includes(item.brand)) return false;
      }

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

      const hasGarmentSizes = appliedSizes.length > 0;
      const hasAccessorySizes = appliedAccessorySizes.length > 0;
      const hasShoeSizes = appliedShoeSizes.length > 0;
      
      if (hasGarmentSizes || hasAccessorySizes || hasShoeSizes) {
        const itemCategory = item.category.toLowerCase();
        const garmentCategories = ['shirts', 'pants', 'dresses', 'jackets', 'sweaters'];
        let shouldShowItem = false;
        if (hasGarmentSizes && garmentCategories.includes(itemCategory)) {
          shouldShowItem = appliedSizes.includes(item.size || '');
        }
        if (hasAccessorySizes && itemCategory === 'accessories') {
          shouldShowItem = appliedAccessorySizes.includes(item.size || '');
        }
        if (hasShoeSizes && itemCategory === 'shoes') {
          shouldShowItem = appliedShoeSizes.includes(item.size || '');
        }
        if (!shouldShowItem) return false;
      }

      if (appliedPriceRange[1] < 100) {
        const itemPrice = (item.price_min as number) || 0;
        if (itemPrice > appliedPriceRange[1]) return false;
      }

      return true;
    });

    return items;
  }, [searchTerm, selectedCategory, appliedTags, appliedBrands, appliedColors, appliedSizes, appliedAccessorySizes, appliedShoeSizes, appliedPriceRange, clothingItems]);

  // Category counts (based on search only)
  const categoryCounts = useMemo(() => {
    let searchFilteredItems = clothingItems;
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      searchFilteredItems = clothingItems.filter(item => (
        item.name.toLowerCase().includes(searchLower) ||
        item.brand.toLowerCase().includes(searchLower) ||
        item.category.toLowerCase().includes(searchLower) ||
        item.tags.some(tag => tag.toLowerCase().includes(searchLower))
      ));
    }
    const counts = searchFilteredItems.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return { all: searchFilteredItems.length, ...counts } as Record<string, number>;
  }, [searchTerm, clothingItems]);

  // Update keywords
  useEffect(() => {
    const allKeywords = [
      ...(searchTerm.trim() ? [`Search: "${searchTerm}"`] : []),
      ...(selectedCategory !== 'all' ? [`Category: ${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}`] : []),
      ...appliedTags,
      ...appliedBrands,
      ...appliedSizes.map(size => `Size ${size}`),
      ...appliedAccessorySizes.map((size) => `Accessory ${size}`),
      ...appliedShoeSizes.map((size) => `Shoe ${size}`),
      ...appliedColors.map(color => color.charAt(0).toUpperCase() + color.slice(1)),
      ...(appliedPriceRange[1] < 100 ? [`Under $${appliedPriceRange[1]}`] : [])
    ];
    setKeywords(allKeywords as any);
  }, [searchTerm, selectedCategory, appliedTags, appliedBrands, appliedSizes, appliedAccessorySizes, appliedShoeSizes, appliedColors, appliedPriceRange]);

  const removeKeyword = (keyword: string) => {
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
      setAppliedColors(prev => prev.filter(c => c.toLowerCase() !== keyword.toLowerCase()));
      setSelectedColors(prev => prev.filter(c => c.toLowerCase() !== keyword.toLowerCase()));
    }
  };

  const handleCategoryClick = (category: string) => setSelectedCategory(category);

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
    setSelectedTags([]);
    setSelectedBrands([]);
    setSelectedSizes([]);
    setSelectedAccessorySizes([]);
    setSelectedShoeSizes([]);
    setSelectedColors([]);
    setPriceRange([0, 100]);
    setAppliedTags([]);
    setAppliedBrands([]);
    setAppliedSizes([]);
    setAppliedAccessorySizes([]);
    setAppliedShoeSizes([]);
    setAppliedColors([]);
    setAppliedPriceRange([0, 100]);
    setSearchTerm('');
    setSelectedCategory('all');
  };

  const toggleTag = (tag: string) => setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  const toggleBrand = (brand: string) => setSelectedBrands(prev => prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]);
  const toggleSize = (size: string) => setSelectedSizes(prev => prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]);
  const toggleAccessorySize = (size: string) => setSelectedAccessorySizes(prev => prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]);
  const toggleShoeSize = (size: string) => setSelectedShoeSizes(prev => prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]);

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

  const toggleDropdown = (itemId: string) => setOpenDropdownId(openDropdownId === itemId ? null : itemId);
  const handleEditItem = (item: ClothingItem) => { setOpenDropdownId(null); setEditingItem(item); setIsEditFormOpen(true); };
  const handleCloseEditForm = () => { setIsEditFormOpen(false); setEditingItem(null); };
  const handleEditSuccess = (updatedItem: ClothingItem) => {
    setClothingItems(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
    handleCloseEditForm();
  };
  const handleAddSuccess = (newItem: ClothingItem) => {
    setClothingItems(prev => [newItem, ...prev]);
    handleCloseEditForm();
  };
  const handleDeleteItem = async (item: ClothingItem) => {
    if (!confirm(`Are you sure you want to delete "${item.name}"?`)) return;
    try {
      const result = await deleteServerClothing(item.id);
      if (result.error) {
        alert('Failed to delete item. Please try again.');
        return;
      }
      setClothingItems(prev => prev.filter(i => i.id !== item.id));
    } catch (error) {
      alert('An unexpected error occurred. Please try again.');
    }
    setOpenDropdownId(null);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.dropdown-container')) setOpenDropdownId(null);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="flex gap-8 w-full">
      <ClothesFilters
        keywords={keywords}
        onRemoveKeyword={removeKeyword}
        onClearAll={clearAllFilters}
        selectedTags={selectedTags}
        setSelectedTags={setSelectedTags}
        toggleTag={toggleTag}
        selectedBrands={selectedBrands}
        setSelectedBrands={setSelectedBrands}
        toggleBrand={toggleBrand}
        brandSearchTerm={brandSearchTerm}
        setBrandSearchTerm={setBrandSearchTerm}
        filteredBrands={useMemo(() => {
          const allBrands = [...new Set(clothingItems.map(item => item.brand))].sort();
          if (!brandSearchTerm.trim()) return allBrands;
          const searchLower = brandSearchTerm.toLowerCase();
          return allBrands.filter(brand => brand.toLowerCase().includes(searchLower));
        }, [clothingItems, brandSearchTerm])}
        selectedSizes={selectedSizes}
        toggleSize={toggleSize}
        setSelectedSizes={setSelectedSizes}
        selectedAccessorySizes={selectedAccessorySizes}
        toggleAccessorySize={toggleAccessorySize}
        setSelectedAccessorySizes={setSelectedAccessorySizes}
        selectedShoeSizes={selectedShoeSizes}
        toggleShoeSize={toggleShoeSize}
        setSelectedShoeSizes={setSelectedShoeSizes}
        selectedColors={selectedColors}
        toggleColor={(colorName) => setSelectedColors(prev => prev.includes(colorName) ? prev.filter(c => c !== colorName) : [...prev, colorName])}
        setSelectedColors={setSelectedColors}
        colorSearchTerm={colorSearchTerm}
        setColorSearchTerm={setColorSearchTerm}
        filteredColors={useMemo(() => {
          const userColors = new Set<string>();
          clothingItems.forEach(item => {
            if (item.color) {
              String(item.color).split(',').map(c => c.trim()).filter(Boolean).forEach(c => userColors.add(c));
            }
          });
          const colorReference: Record<string, { name: string; hex: string }> = {
            black:{name:'Black',hex:'#000000'},white:{name:'White',hex:'#FFFFFF'},gray:{name:'Gray',hex:'#6B7280'},grey:{name:'Gray',hex:'#6B7280'},navy:{name:'Navy',hex:'#1E3A8A'},blue:{name:'Blue',hex:'#3B82F6'},red:{name:'Red',hex:'#EF4444'},green:{name:'Green',hex:'#10B981'},brown:{name:'Brown',hex:'#A16207'},beige:{name:'Beige',hex:'#D6D3D1'},pink:{name:'Pink',hex:'#EC4899'},purple:{name:'Purple',hex:'#8B5CF6'},yellow:{name:'Yellow',hex:'#EAB308'},orange:{name:'Orange',hex:'#F97316'},khaki:{name:'Khaki',hex:'#A3A380'},burgundy:{name:'Burgundy',hex:'#7C2D12'},cream:{name:'Cream',hex:'#FEF3C7'},gold:{name:'Gold',hex:'#FFD700'},silver:{name:'Silver',hex:'#C0C0C0'},bronze:{name:'Bronze',hex:'#CD7F32'},'rose gold':{name:'Rose Gold',hex:'#E8B4A0'},copper:{name:'Copper',hex:'#B87333'},platinum:{name:'Platinum',hex:'#E5E4E2'},pearl:{name:'Pearl',hex:'#F8F6F0'},diamond:{name:'Diamond',hex:'#F0F8FF'},crystal:{name:'Crystal',hex:'#E6E6FA'}
          };
          const colorObjects = Array.from(userColors).map(c => colorReference[c.toLowerCase()] || { name: c.charAt(0).toUpperCase()+c.slice(1), hex: '#6B7280' }).sort((a,b)=>a.name.localeCompare(b.name));
          if (!colorSearchTerm.trim()) return colorObjects;
          const s = colorSearchTerm.toLowerCase();
          return colorObjects.filter(c => c.name.toLowerCase().includes(s));
        }, [clothingItems, colorSearchTerm])}
        priceRange={priceRange}
        setPriceRange={setPriceRange}
        allGarmentSizes={useMemo(() => {
          const garmentCategories = ['shirts','pants','dresses','jackets','sweaters'];
          const sizes = clothingItems.filter(i => garmentCategories.includes(i.category.toLowerCase()) && i.size).map(i => i.size!).filter(Boolean);
          return [...new Set(sizes)].sort();
        }, [clothingItems])}
        allAccessorySizes={useMemo(() => {
          const sizes = clothingItems.filter(i => i.category.toLowerCase() === 'accessories' && i.size).map(i => i.size!).filter(Boolean);
          return [...new Set(sizes)].sort();
        }, [clothingItems])}
        allShoeSizes={useMemo(() => {
          const sizes = clothingItems.filter(i => i.category.toLowerCase() === 'shoes' && i.size).map(i => i.size!).filter(Boolean);
          return [...new Set(sizes)].sort();
        }, [clothingItems])}
        onApply={handleApplyFilters}
      />

      <div className="flex-1">
        <ClothesSearchBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          categories={categories}
          selectedCategory={selectedCategory}
          onCategoryClick={setSelectedCategory}
          categoryCounts={categoryCounts}
          filteredItemsCount={filteredItems.length}
          getCategoryDisplayName={(category) => category === 'all' ? 'All Items' : category.charAt(0).toUpperCase()+category.slice(1)}
        />

        <ClothesCards
          items={filteredItems}
          isLoading={isLoading}
          authLoading={authLoading}
          user={user}
          openDropdownId={openDropdownId}
          onToggleDropdown={toggleDropdown}
          onEdit={handleEditItem}
          onDelete={handleDeleteItem}
          getColorClasses={getColorClasses}
        />
      </div>

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
}

