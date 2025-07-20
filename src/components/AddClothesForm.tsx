'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { X, Upload, Plus, Image as ImageIcon, Link, Sparkles } from 'lucide-react';
// @ts-expect-error - Supabase client type issue in demo mode
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { imageAnalysisService } from '../lib/imageAnalysisService';

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

interface AddClothesFormProps {
  isOpen?: boolean;
  onClose?: () => void;
  editingItem?: ClothingItem | null;
  onEditSuccess?: (updatedItem: ClothingItem) => void;
  onAddSuccess?: (newItem: ClothingItem) => void;
  onCancel?: () => void;
}

const AddClothesForm: React.FC<AddClothesFormProps> = ({ 
  isOpen = false, 
  onClose, 
  editingItem = null, 
  onEditSuccess, 
  onAddSuccess,
  onCancel 
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'link'>('link');
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
  
  // Image upload state
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');

  // Auto-fill state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string>('');

  // User's existing brands state
  const [userBrands, setUserBrands] = useState<string[]>([]);

  // Populate form when editing an item
  useEffect(() => {
    if (editingItem) {
      console.log('🖊️ Populating form with editing item:', editingItem);
      
      // Parse colors from comma-separated string or use as array
      const colorsArray = typeof editingItem.color === 'string' 
        ? editingItem.color.split(',').map(c => c.trim()).filter(Boolean)
        : Array.isArray(editingItem.color) 
        ? editingItem.color 
        : [editingItem.color || 'Black'];
      
      // Convert category from lowercase to proper case to match dropdown options
      const properCaseCategory = editingItem.category 
        ? editingItem.category.charAt(0).toUpperCase() + editingItem.category.slice(1).toLowerCase()
        : '';
      
      console.log('🏷️ Category conversion:', editingItem.category, '→', properCaseCategory);
      
      setFormData({
        name: editingItem.name || '',
        category: properCaseCategory,
        brand: editingItem.brand || '',
        size: editingItem.size || '',
        price: editingItem.price_min ? editingItem.price_min.toString() : '',
        imageUrl: editingItem.image_url || editingItem.image || '',
        colors: colorsArray,
        tags: editingItem.tags || []
      });
      
      setBrandInput(editingItem.brand || '');
      setImagePreview(editingItem.image_url || editingItem.image || '');
      
      // Set active tab based on whether we have an image URL
      if (editingItem.image_url || editingItem.image) {
        setActiveTab('link');
      }
      
      console.log('✅ Form populated with data:', {
        name: editingItem.name,
        category: properCaseCategory,
        brand: editingItem.brand,
        size: editingItem.size,
        colors: colorsArray,
        tags: editingItem.tags
      });
    }
  }, [editingItem]);

  // Fetch user's existing brands
  useEffect(() => {
    const fetchUserBrands = async () => {
      if (!user) return;
      
      try {
        console.log('🏷️ Fetching user brands...');
        // @ts-expect-error - Supabase client type issue in demo mode
        const { data, error } = await supabase
          .from('clothes')
          .select('brand')
          .eq('user_id', user.id);

        if (error) {
          console.error('❌ Error fetching user brands:', error);
          return;
        }

        const uniqueUserBrands = [...new Set(data?.map((item: { brand: string }) => item.brand).filter(Boolean))] as string[];
        setUserBrands(uniqueUserBrands);
        console.log('✅ Loaded user brands:', uniqueUserBrands);
      } catch (error) {
        console.error('💥 Unexpected error fetching user brands:', error);
      }
    };

    fetchUserBrands();
  }, [user]);

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
    'Adidas', 'Aerie', 'American Eagle', 'ASOS', 'Banana Republic',
    'Burberry', 'Calvin Klein', 'Champion', 'Coach', 'Columbia',
    'Converse', 'Dickies', 'Fila', 'Forever 21', 'Gap',
    'Gucci', 'Gymshark', 'H&M', 'Hugo Boss', 'J.Crew',
    'Kate Spade', 'Lacoste', 'Levi\'s', 'Louis Vuitton', 'Lululemon',
    'Michael Kors', 'Nike', 'Old Navy', 'Patagonia', 'Polo Ralph Lauren',
    'Prada', 'Puma', 'Reebok', 'Target', 'The North Face',
    'Tommy Hilfiger', 'Under Armour', 'Uniqlo', 'Urban Outfitters', 'Vans',
    'Versace', 'Victoria\'s Secret', 'Walmart', 'Zara', 'Other'
  ];

  // Combine hardcoded brands with user's existing brands
  const allBrands = useMemo(() => {
    const combined = [...baseBrands, ...userBrands];
    return [...new Set(combined)].sort(); // Remove duplicates and sort
  }, [userBrands]);

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
  const filteredBrands = allBrands.filter(brand => 
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
    if (brandInput.trim() && !allBrands.includes(brandInput.trim())) {
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

  // Image upload functions
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files[0]);
    }
  };

  const handleFiles = (file: File) => {
    if (file.type.startsWith('image/')) {
      setUploadedFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setImagePreview(result);
        setFormData(prev => ({ ...prev, imageUrl: result }));
      };
      reader.readAsDataURL(file);
      
      console.log('📁 File selected:', file.name);
    } else {
      alert('Please select an image file (JPG, PNG, GIF, etc.)');
    }
  };

  const clearImage = () => {
    setUploadedFile(null);
    setImagePreview('');
    setFormData(prev => ({ ...prev, imageUrl: '' }));
  };

  // Handle URL input change
  const handleUrlChange = (url: string) => {
    setFormData(prev => ({ ...prev, imageUrl: url }));
    if (url.trim()) {
      setImagePreview(url);
      setUploadedFile(null); // Clear file if URL is being used
    } else {
      setImagePreview('');
    }
    // Clear any previous analysis errors
    setAnalysisError('');
  };

  // Auto-fill form using AI image analysis
  const handleAutoFill = async () => {
    const imageUrl = formData.imageUrl.trim();
    
    if (!imageUrl) {
      setAnalysisError('Please upload an image or enter an image URL first');
      return;
    }

    if (!imageAnalysisService.hasValidApiKey()) {
      setAnalysisError('OpenAI API key not configured. Auto-fill requires an OpenAI API key.');
      return;
    }

    try {
      setIsAnalyzing(true);
      setAnalysisError('');
      console.log('🧠 Starting auto-fill analysis for:', uploadedFile ? 'uploaded file' : 'URL');

      const analysis = await imageAnalysisService.analyzeClothingImage(imageUrl);
      console.log('✨ Auto-fill analysis result:', analysis);

      // Update form data with analysis results
      setFormData(prev => ({
        ...prev,
        name: analysis.name || prev.name,
        category: analysis.category || prev.category,
        brand: analysis.brand && analysis.brand !== 'Unknown' ? analysis.brand : prev.brand,
        colors: analysis.colors.length > 0 ? analysis.colors : prev.colors,
        tags: analysis.tags.length > 0 ? analysis.tags : prev.tags,
        price: analysis.estimatedPrice ? analysis.estimatedPrice.split('-')[0] : prev.price // Use lower end of price range
      }));

      // Update brand input if brand was detected
      if (analysis.brand && analysis.brand !== 'Unknown') {
        setBrandInput(analysis.brand);
      }

      console.log('💰 Auto-fill cost:', analysis.cost, 'Tokens:', analysis.tokensUsed);
      
    } catch (error) {
      console.error('❌ Auto-fill error:', error);
      setAnalysisError(error instanceof Error ? error.message : 'Failed to analyze image. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
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
      if (!e.relatedTarget || !e.currentTarget.contains(e.relatedTarget as Node)) {
        setShowBrandDropdown(false);
      }
    }, 100);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      console.log('🚀 Form submission started!');
      console.log('🧺 Submitting form data:', formData);
      console.log('🖼️ Image preview:', imagePreview);
      console.log('📁 Uploaded file:', uploadedFile);
      console.log('👤 User:', user);
      
      // Check if user is authenticated
      if (!user) {
        console.log('❌ User not authenticated');
        alert('Please sign in to add clothes');
        return;
      }
      console.log('✅ User authenticated');

      // Validate required fields
      console.log('🔍 Starting validation...');
      
      if (!formData.name.trim()) {
        console.log('❌ Validation failed: Name is empty');
        alert('❌ Please enter a name for the clothing item');
        return;
      }
      console.log('✅ Name validation passed');

      if (!formData.category) {
        console.log('❌ Validation failed: Category not selected');
        alert('❌ Please select a category');
        return;
      }
      console.log('✅ Category validation passed');

      if (!formData.brand.trim()) {
        console.log('❌ Validation failed: Brand is empty');
        alert('❌ Please enter or select a brand');
        return;
      }
      console.log('✅ Brand validation passed');

      if (!formData.size) {
        console.log('❌ Validation failed: Size not selected');
        alert('❌ Please select a size');
        return;
      }
      console.log('✅ Size validation passed');

      // Validate price is positive
      if (!formData.price.trim()) {
        console.log('❌ Validation failed: Price is empty');
        alert('❌ Please enter a price');
        return;
      }

      const price = parseFloat(formData.price);
      if (isNaN(price) || price <= 0) {
        console.log('❌ Validation failed: Price is invalid:', price);
        alert('❌ Price must be a positive number');
        return;
      }
      console.log('✅ Price validation passed');

      // Validate colors selection
      if (formData.colors.length === 0) {
        console.log('❌ Validation failed: No colors selected');
        alert('❌ Please select at least one color');
        return;
      }
      console.log('✅ Colors validation passed');

      // Validate image URL or uploaded file
      if (!formData.imageUrl.trim()) {
        console.log('❌ Validation failed: No image URL or file');
        alert('❌ Please upload an image or provide an image URL');
        return;
      }
      console.log('✅ Image validation passed');
      console.log('🎉 All validations passed!');

      // Prepare data for Supabase
      console.log('🔄 Preparing data for Supabase...');
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
      console.log('📦 Prepared data:', clothesData);

      // Insert or Update in Supabase
      const isEditing = !!editingItem;
      console.log(isEditing ? '💾 Updating in Supabase...' : '💾 Inserting into Supabase...');
      // @ts-expect-error - Supabase client type issue in demo mode
      console.log('🔗 Supabase client:', supabase);
      
      // First, check if user exists in public.users table
      console.log('👤 Checking if user exists in public.users...');
      // @ts-expect-error - Supabase client type issue in demo mode
      const { data: userCheck, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('id', user.id)
        .single();
      
      if (userError) {
        console.error('❌ User check error:', userError);
        alert('User authentication issue. Please sign out and sign back in.');
        return;
      }
      
      if (!userCheck) {
        console.error('❌ User not found in public.users table');
        alert('User profile not found. Please sign out and sign back in.');
        return;
      }
      console.log('✅ User exists in database');
      
      try {
        // Add timeout to prevent hanging
        let dbPromise;
        if (isEditing && editingItem) {
          console.log('🔄 Updating existing item with ID:', editingItem.id);
          // @ts-expect-error - Supabase client type issue in demo mode
          dbPromise = supabase
            .from('clothes')
            .update(clothesData)
            .eq('id', editingItem.id)
            .select();
        } else {
          console.log('➕ Creating new item');
          // @ts-expect-error - Supabase client type issue in demo mode
          dbPromise = supabase
            .from('clothes')
            .insert([clothesData])
            .select();
        }
        
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Database operation timed out')), 10000)
        );
        
        const result = await Promise.race([dbPromise, timeoutPromise]);
        
        console.log('📤 Supabase result:', result);
        const { data, error } = result;

        if (error) {
          console.error('❌ Supabase error details:', error);
          console.error('❌ Error code:', error.code);
          console.error('❌ Error message:', error.message);
          console.error('❌ Error details:', error.details);
          alert('Error saving clothes: ' + error.message);
          return;
        }

        console.log('✅ Clothes saved successfully:', data);
        
        if (isEditing) {
          alert('Clothes updated successfully! 🎉');
          // Call onEditSuccess with updated item if editing
          if (onEditSuccess && data && data[0]) {
            // Transform Supabase data to match ClothingItem interface (same as in Clothes.tsx)
            const updatedItem: ClothingItem = {
              id: String(data[0].id),
              name: String(data[0].name || 'Untitled'),
              brand: String(data[0].brand || 'Unknown Brand'), 
              image: String(data[0].image_url || '/api/placeholder/300/300'),
              color: String(data[0].color || '#gray'),
              tags: (data[0].tags as string[]) || [],
              category: (data[0].category as string)?.toLowerCase() || 'other',
              size_type: data[0].size_type,
              size: data[0].size,
              price_min: data[0].price_min,
              price_max: data[0].price_max,
              image_url: data[0].image_url,
              created_at: data[0].created_at,
              updated_at: data[0].updated_at
            };
            console.log('🔄 Calling onEditSuccess with updated item:', updatedItem);
            onEditSuccess(updatedItem);
          }
        } else {
          alert('Clothes added successfully! 🎉');
          if (onAddSuccess && data && data[0]) {
            const newItem: ClothingItem = {
              id: String(data[0].id),
              name: String(data[0].name || 'Untitled'),
              brand: String(data[0].brand || 'Unknown Brand'),
              image: String(data[0].image_url || '/api/placeholder/300/300'),
              color: String(data[0].color || '#gray'),
              tags: (data[0].tags as string[]) || [],
              category: (data[0].category as string)?.toLowerCase() || 'other',
              size_type: data[0].size_type,
              size: data[0].size,
              price_min: data[0].price_min,
              price_max: data[0].price_max,
              image_url: data[0].image_url,
              created_at: data[0].created_at,
              updated_at: data[0].updated_at
            };
            console.log('🔄 Calling onAddSuccess with new item:', newItem);
            onAddSuccess(newItem);
          }
        }
      } catch (dbError) {
        console.error('💥 Database connection error:', dbError);
        alert('Database connection failed. Please check your internet connection and try again.');
        return;
      }
      
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
      
      // Clear image states
      setUploadedFile(null);
      setImagePreview('');
      setDragActive(false);
      
      // Clear auto-fill states
      setIsAnalyzing(false);
      setAnalysisError('');
      
      // Call appropriate close callback
      if (isEditing && onCancel) {
        onCancel();
      } else if (onClose) {
        onClose();
      }
    } catch (error) {
      console.error('💥 Unexpected error:', error);
      alert('Unexpected error occurred. Please try again.');
    }
  };

  // Show sidebar when isOpen is true (both add and edit modes)
  if (!isOpen) return null;

  // Render the form content (shared between modal and sidebar modes)
  const formContent = (
          <div className="flex-1 overflow-y-auto px-6 pb-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Upload/Link Tabs */}
              <div>
                <div className="flex bg-gray-100 rounded-lg p-1 mb-3">
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
                  
                </div>

                {/* Upload Tab Content */}
                {activeTab === 'upload' && (
                  <div className="space-y-3">
                    {/* Drag & Drop Area */}
                    <div
                      className={`relative w-full border-2 border-dashed rounded-lg transition-all ${
                        dragActive 
                          ? 'border-green-500 bg-green-50' 
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                    >
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      
                      {imagePreview ? (
                        /* Image Preview */
                        <div className="relative p-4">
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="w-full h-48 object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={clearImage}
                            className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                          >
                            <X size={14} />
                          </button>
                          <div className="mt-2 text-center">
                            <p className="text-sm text-gray-600">
                              {uploadedFile ? `📁 ${uploadedFile.name}` : '🔗 Image from URL'}
                            </p>
                            <p className="text-xs text-gray-400">Click to change image</p>
                          </div>
                          
                          {/* Auto-fill Button for Upload - Below image */}
                          <div className="mt-3 flex flex-col gap-2">
                            <button
                              type="button"
                              onClick={handleAutoFill}
                              disabled={isAnalyzing}
                              className="flex items-center justify-center gap-2 w-full py-2 px-4 bg-purple-100 hover:bg-purple-200 disabled:bg-gray-100 text-purple-700 disabled:text-gray-400 rounded-lg font-medium transition-colors text-sm"
                            >
                              {isAnalyzing ? (
                                <>
                                  <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
                                  Analyzing...
                                </>
                              ) : (
                                <>
                                  <Sparkles size={16} />
                                  Auto-fill from image
                                </>
                              )}
                            </button>
                            
                            {/* Error Message */}
                            {analysisError && (
                              <div className="text-xs text-red-600 bg-red-50 rounded-lg p-2">
                                {analysisError}
                              </div>
                            )}
                            
                            {/* Success/Info Message */}
                            {!analysisError && !isAnalyzing && imageAnalysisService.hasValidApiKey() && (
                              <div className="text-xs text-purple-600 bg-purple-50 rounded-lg p-2">
                                💡 AI will analyze your {uploadedFile ? 'uploaded' : 'linked'} image and auto-fill details
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        /* Upload Area */
                        <div className="flex flex-col items-center justify-center py-12 px-4">
                          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <Upload size={24} className="text-gray-400" />
                          </div>
                          <h3 className="text-lg font-medium text-gray-900 mb-2">
                            {dragActive ? 'Drop image here' : 'Upload an image'}
                          </h3>
                          <p className="text-sm text-gray-500 text-center mb-4">
                            Drag and drop your image here, or click to browse
                          </p>
                          <div className="flex items-center gap-2 text-xs text-gray-400">
                            <ImageIcon size={14} />
                            <span>JPG, PNG, GIF up to 10MB</span>
                          </div>
                        </div>
                      )}
                    </div>


                  </div>
                )}

                {/* Link Tab Content */}
                {activeTab === 'link' && (
                  <div className="space-y-3">
                    {/* URL Input */}
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                        <Link size={16} className="text-gray-400" />
                      </div>
                      <input
                        type="url"
                        placeholder="https://example.com/image.jpg"
                        value={formData.imageUrl}
                        onChange={(e) => handleUrlChange(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>


                    
                    {/* Image Preview for URL */}
                    {imagePreview && (
                      <div className="space-y-3">
                        <div className="relative">
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="w-full h-48 object-cover rounded-lg"
                            onError={() => {
                              setImagePreview('');
                              console.log('❌ Failed to load image from URL');
                            }}
                          />
                          <button
                            type="button"
                            onClick={clearImage}
                            className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                          >
                            <X size={14} />
                          </button>
                          <div className="mt-2 text-center">
                            <p className="text-xs text-gray-400">🔗 Image from URL</p>
                          </div>
                        </div>

                        {/* Auto-fill Button for URL - Below image */}
                        <div className="flex flex-col gap-2">
                          <button
                            type="button"
                            onClick={handleAutoFill}
                            disabled={isAnalyzing}
                            className="flex items-center justify-center gap-2 w-full py-2 px-4 bg-purple-100 hover:bg-purple-200 disabled:bg-gray-100 text-purple-700 disabled:text-gray-400 rounded-lg font-medium transition-colors text-sm"
                          >
                            {isAnalyzing ? (
                              <>
                                <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
                                Analyzing...
                              </>
                            ) : (
                              <>
                                <Sparkles size={16} />
                                Auto-fill from image
                              </>
                            )}
                          </button>
                          
                          {/* Error Message */}
                          {analysisError && (
                            <div className="text-xs text-red-600 bg-red-50 rounded-lg p-2">
                              {analysisError}
                            </div>
                          )}
                          
                          {/* Success/Info Message */}
                          {!analysisError && !isAnalyzing && imageAnalysisService.hasValidApiKey() && (
                            <div className="text-xs text-purple-600 bg-purple-50 rounded-lg p-2">
                              💡 AI will analyze your {uploadedFile ? 'uploaded' : 'linked'} image and auto-fill details
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
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
                    {brandInput.trim() && !allBrands.some(brand => brand.toLowerCase() === brandInput.toLowerCase()) && (
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
                    {filteredBrands.length === 0 && brandInput.trim() && !allBrands.some(brand => brand.toLowerCase() === brandInput.toLowerCase()) && (
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
                {editingItem ? 'Update Item' : 'Add Item'}
              </button>
            </form>
          </div>
  );

  // Always return the sidebar mode
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
              <h2 className="text-xl font-semibold">
                {editingItem ? 'Edit Clothes' : 'Add Clothes'}
              </h2>
              <p className="text-sm text-gray-500">
                {editingItem ? 'Update your clothing item' : 'Fill in the necessary items'}
              </p>
            </div>
          </div>
          
          {formContent}
        </div>
      </div>
    </>
  );
};

export default AddClothesForm; 