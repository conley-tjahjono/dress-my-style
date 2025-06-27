'use client';

import React, { useState } from 'react';
import { X, Upload, Plus } from 'lucide-react';
// @ts-expect-error - Supabase client type issue in demo mode
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface AddClothesFormProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddClothesForm: React.FC<AddClothesFormProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'link'>('upload');
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    brand: '',
    size: '',
    price: '',
    imageUrl: '',
    colors: [] as string[], // Changed to array for multiple colors
    tags: [] as string[]
  });
  
  // Brand input state
  const [showBrandDropdown, setShowBrandDropdown] = useState(false);
  const [brandInput, setBrandInput] = useState('');

  // Common clothing colors with names and hex values
  const colorOptions = [
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
    { name: 'Cream', hex: '#FEF3C7' }
  ];

  const categories = [
    'Choose Category',
    'Shirts', 
    'Pants',
    'Dresses',
    'Shoes',
    'Accessories',
    'Jackets',
    'Sweaters'
  ];

  const baseBrands = [
    'Nike',
    'Adidas', 
    'H&M',
    'Zara',
    'Uniqlo',
    'Gymshark',
    'Lululemon'
  ];

  // Organized tag categories
  const seasonalTags = [
    { name: 'Spring', color: '#10B981' },
    { name: 'Summer', color: '#F59E0B' },
    { name: 'Fall', color: '#D97706' },
    { name: 'Winter', color: '#3B82F6' }
  ];

  const occasionTags = [
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
  ];
  
  // Filter brands based on input
  const filteredBrands = baseBrands.filter(brand => 
    brand.toLowerCase().includes(brandInput.toLowerCase())
  );

  // Helper function to check if tag is selected
  const isTagSelected = (tagName: string) => {
    return formData.tags.includes(tagName);
  };

  // Helper function to toggle tag selection
  const toggleTag = (tagName: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tagName)
        ? prev.tags.filter(t => t !== tagName)
        : [...prev.tags, tagName]
    }));
  };



  // Dynamic size options based on category
  const getSizeOptions = (category: string) => {
    switch (category.toLowerCase()) {
      case 'shoes':
        return [
          'Select Size', 
          '6', '6.5', '7', '7.5', '8', '8.5', 
          '9', '9.5', '10', '10.5', '11', '11.5', '12'
        ];
      case 'accessories':
        return ['Select Size', 'S', 'M', 'L'];
      case 'shirts':
      case 'pants':
      case 'dresses':
      case 'jackets':
      case 'sweaters':
        return ['Select Size', 'XS', 'S', 'M', 'L', 'XL', 'XXL'];
      default:
        return ['Select Size'];
    }
  };

  const currentSizeOptions = getSizeOptions(formData.category);

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  // Brand management functions
  const handleBrandSelect = (brand: string) => {
    setFormData(prev => ({ ...prev, brand }));
    setBrandInput(brand);
    setShowBrandDropdown(false);
  };

  const handleBrandInputChange = (value: string) => {
    setBrandInput(value);
    setFormData(prev => ({ ...prev, brand: value }));
    setShowBrandDropdown(value.length > 0);
  };

  const handleAddNewBrand = () => {
    if (brandInput.trim() && !baseBrands.includes(brandInput.trim())) {
      setFormData(prev => ({ ...prev, brand: brandInput.trim() }));
      setShowBrandDropdown(false);
    }
  };

  // Color selection functions
  const toggleColor = (colorName: string) => {
    setFormData(prev => ({
      ...prev,
      colors: prev.colors.includes(colorName)
        ? prev.colors.filter(c => c !== colorName)
        : [...prev.colors, colorName]
    }));
  };

  const isColorSelected = (colorName: string) => {
    return formData.colors.includes(colorName);
  };

  const clearAllColors = () => {
    setFormData(prev => ({
      ...prev,
      colors: []
    }));
  };

  const clearAllTags = () => {
    setFormData(prev => ({
      ...prev,
      tags: []
    }));
  };

  // Get tag style based on category
  const getTagStyle = (tagName: string) => {
    const seasonalTag = seasonalTags.find(tag => tag.name === tagName);
    if (seasonalTag) {
      return isTagSelected(tagName) 
        ? { backgroundColor: seasonalTag.color + '20', borderColor: seasonalTag.color, color: seasonalTag.color }
        : { borderColor: '#D1D5DB', color: '#6B7280' };
    }
    
    const occasionTag = occasionTags.find(tag => tag.name === tagName);
    if (occasionTag) {
      return isTagSelected(tagName)
        ? { backgroundColor: occasionTag.color + '20', borderColor: occasionTag.color, color: occasionTag.color }
        : { borderColor: '#D1D5DB', color: '#6B7280' };
    }
    
    return { borderColor: '#D1D5DB', color: '#6B7280' };
  };

  // Close dropdown when clicking outside
  const handleBrandBlur = (e: React.FocusEvent) => {
    // Delay to allow for dropdown clicks
    setTimeout(() => {
      if (!e.currentTarget.contains(e.relatedTarget as Node)) {
        setShowBrandDropdown(false);
      }
    }, 100);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      console.log('🧺 Submitting form data:', formData);
      
      // Check if user is authenticated
      if (!user) {
        alert('Please sign in to add clothes');
        return;
      }

      // Validate price is positive
      const price = parseFloat(formData.price);
      if (isNaN(price) || price <= 0) {
        alert('❌ Price must be a positive number');
        return;
      }

      // Validate colors selection
      if (formData.colors.length === 0) {
        alert('❌ Please select at least one color');
        return;
      }

      // Prepare data for Supabase
      const clothesData = {
        user_id: user.id,
        name: formData.name,
        category: formData.category,
        brand: formData.brand,
        size_type: formData.category, // Use category as size_type for database compatibility
        size: formData.size,
        price_min: price, // Store as single price value for now
        price_max: price, // Store as single price value for now
        image_url: formData.imageUrl,
        color: formData.colors.join(','), // Store colors as comma-separated string in existing color field
        tags: formData.tags
      };

      // Insert into Supabase
      // @ts-expect-error - Supabase client type issue in demo mode
      const { data, error } = await supabase
        .from('clothes')
        .insert([clothesData])
        .select();

      if (error) {
        console.error('❌ Error saving clothes:', error);
        alert('Error saving clothes: ' + error.message);
        return;
      }

      console.log('✅ Clothes saved successfully:', data);
      alert('Clothes added successfully! 🎉');
      
      // Reset form
      setFormData({
        name: '',
        category: '',
        brand: '',
        size: '',
        price: '',
        imageUrl: '',
        colors: [] as string[],
        tags: [] as string[]
      });
      setBrandInput('');
      setShowBrandDropdown(false);
      
      onClose();
    } catch (error) {
      console.error('💥 Unexpected error:', error);
      alert('Unexpected error occurred. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop with enhanced blur effect for better focus */}
      <div 
        className={`fixed inset-0 z-40 transition-all duration-300 ${
          isOpen 
            ? 'backdrop-blur-md opacity-70' 
            : 'backdrop-blur-none opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />
      
      {/* Sidebar with smooth slide animation and enhanced focus */}
      <div className={`fixed right-0 top-0 h-full w-96 bg-white z-50 shadow-[0_0_50px_rgba(0,0,0,0.15)] border-l border-gray-100 transform transition-all duration-300 ease-in-out ${
        isOpen ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6">
            <div>
              <h2 className="text-xl font-semibold">Add Clothes</h2>
              <p className="text-sm text-gray-500">Fill in the necessary items</p>
            </div>
          </div>

          {/* Form Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Upload/Link Tabs */}
              <div>
                <div className="flex bg-gray-100 rounded-lg p-1 mb-4">
                  <button
                    type="button"
                    onClick={() => setActiveTab('upload')}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                      activeTab === 'upload' 
                        ? 'bg-white text-gray-900 shadow-sm' 
                        : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    Upload
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('link')}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                      activeTab === 'link' 
                        ? 'bg-white text-gray-900 shadow-sm' 
                        : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    Embed Link
                  </button>
                </div>

                {/* Upload Tab Content */}
                {activeTab === 'upload' && (
                  <button
                    type="button"
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
                  >
                    <Upload size={16} className="text-gray-400" />
                    <span className="text-sm text-gray-600">Upload File</span>
                  </button>
                )}

                {/* Link Tab Content */}
                {activeTab === 'link' && (
                  <input
                    type="url"
                    placeholder="Insert image Url"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                )}
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  placeholder="Type Name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    category: e.target.value,
                    size: '' // Reset size when category changes
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  {categories.map((category) => (
                    <option key={category} value={category === 'Choose Category' ? '' : category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              {/* Brand */}
              <div className="relative" onBlur={handleBrandBlur}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Brand
                </label>
                <input
                  type="text"
                  placeholder="Type or select a brand"
                  value={brandInput}
                  onChange={(e) => handleBrandInputChange(e.target.value)}
                  onFocus={() => setShowBrandDropdown(true)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                
                {/* Brand Dropdown */}
                {showBrandDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto">
                    {/* Existing brands that match input */}
                    {filteredBrands.map((brand) => (
                      <button
                        key={brand}
                        type="button"
                        onClick={() => handleBrandSelect(brand)}
                        className="w-full text-left px-3 py-2 hover:bg-gray-100 focus:bg-gray-100 transition-colors"
                      >
                        {brand}
                      </button>
                    ))}
                    
                    {/* Add new brand option */}
                    {brandInput.trim() && !baseBrands.some(brand => brand.toLowerCase() === brandInput.toLowerCase()) && (
                      <button
                        type="button"
                        onClick={handleAddNewBrand}
                        className="w-full text-left px-3 py-2 hover:bg-green-50 focus:bg-green-50 transition-colors border-t border-gray-100"
                      >
                        <div className="flex items-center gap-2">
                          <Plus size={14} className="text-green-600" />
                          <span className="text-green-600">Add &quot;{brandInput.trim()}&quot;</span>
                        </div>
                      </button>
                    )}
                    
                    {/* No results message */}
                    {filteredBrands.length === 0 && brandInput.trim() && baseBrands.some(brand => brand.toLowerCase() === brandInput.toLowerCase()) && (
                      <div className="px-3 py-2 text-gray-500 text-sm">
                        No matching brands found
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Size */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Size
                </label>
                <select
                  value={formData.size}
                  onChange={(e) => setFormData(prev => ({ ...prev, size: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  {currentSizeOptions.map((size) => (
                    <option key={size} value={size === 'Select Size' ? '' : size}>
                      {size}
                    </option>
                  ))}
                </select>
              </div>

              {/* Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price ($)
                </label>
                <input
                  type="number"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              {/* Colors */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Colors
                  </label>
                  {formData.colors.length > 0 && (
                    <button
                      type="button"
                      onClick={clearAllColors}
                      className="text-xs text-red-500 hover:text-red-700 transition-colors"
                    >
                      Clear All
                    </button>
                  )}
                </div>
                
                {/* Selected Colors Display */}
                {formData.colors.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {formData.colors.map((color) => (
                      <span
                        key={color}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs"
                      >
                        {color}
                        <button
                          type="button"
                          onClick={() => toggleColor(color)}
                          className="w-3 h-3 flex items-center justify-center rounded-full hover:bg-green-200"
                        >
                          <X size={10} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-3 gap-3">
                  {colorOptions.map((colorOption) => (
                    <button
                      key={colorOption.name}
                      type="button"
                      onClick={() => toggleColor(colorOption.name)}
                      className={`flex items-center gap-2 p-3 rounded-lg border transition-all ${
                        isColorSelected(colorOption.name)
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex-shrink-0 ${
                          colorOption.name === 'White' ? 'border-gray-400' : 'border-gray-300'
                        }`}
                        style={{ backgroundColor: colorOption.hex }}
                      />
                      <span className="text-sm text-gray-700 font-medium">{colorOption.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tags */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Tags
                  </label>
                  {formData.tags.length > 0 && (
                    <button
                      type="button"
                      onClick={clearAllTags}
                      className="text-xs text-red-500 hover:text-red-700 transition-colors"
                    >
                      Clear All
                    </button>
                  )}
                </div>
                
                {/* Selected Tags Display */}
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {formData.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border"
                        style={getTagStyle(tag)}
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
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
                    {seasonalTags.map(tag => (
                      <button
                        key={tag.name}
                        type="button"
                        onClick={() => toggleTag(tag.name)}
                        className="p-2 border rounded-md text-sm font-medium transition-all duration-200 hover:scale-105"
                        style={getTagStyle(tag.name)}
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
                    {occasionTags.map(tag => (
                      <button
                        key={tag.name}
                        type="button"
                        onClick={() => toggleTag(tag.name)}
                        className="p-2 border rounded-md text-sm font-medium transition-all duration-200 hover:scale-105"
                        style={getTagStyle(tag.name)}
                      >
                        {tag.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
              >
                Submit
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default AddClothesForm; 