'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Zap, MessageCircle, MapPin, Thermometer, ImageIcon, Sun, Moon, Clock } from 'lucide-react';
import { weatherService } from '../lib/weatherService';
import { openaiService } from '../lib/openaiService';
// @ts-expect-error - Supabase client type issue in demo mode
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  recommendations?: ClothingItem[] | null;
}

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

// Temporary interface for recommendation scoring
interface ScoredClothingItem extends ClothingItem {
  matchScore?: number;
  attributeMatches?: string[];
}

interface AIAssistantProps {
  isOpen: boolean;
  onClose: () => void;
}

const AIAssistant: React.FC<AIAssistantProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentWeather, setCurrentWeather] = useState<any>(null);
  const [userClothes, setUserClothes] = useState<ClothingItem[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load user's clothes when component opens
  useEffect(() => {
    if (isOpen && user?.id) {
      loadUserClothes();
      loadWeatherAndGreet();
    }
  }, [isOpen, user]);

  const loadUserClothes = async () => {
    try {
      console.log('🤖 Loading user clothes for AI assistant...');
      // @ts-expect-error - Supabase client type issue in demo mode
      const { data, error } = await supabase
        .from('clothes')
        .select('*')
        .eq('user_id', user!.id);

      if (error) {
        console.error('❌ Error loading clothes for AI:', error);
        return;
      }

      const transformedData: ClothingItem[] = data?.map((item: any) => ({
        id: String(item.id),
        name: String(item.name || 'Untitled'),
        brand: String(item.brand || 'Unknown Brand'),
        image: String(item.image_url || '/api/placeholder/300/300'),
        color: String(item.color || '#gray'),
        tags: (item.tags as string[]) || [],
        category: (item.category as string)?.toLowerCase() || 'other',
        image_url: item.image_url
      })) || [];

      setUserClothes(transformedData);
      console.log('✅ Loaded', transformedData.length, 'clothes for AI assistant');
    } catch (error) {
      console.error('💥 Error loading clothes:', error);
    }
  };

  const loadWeatherAndGreet = async () => {
    try {
      setIsLoading(true);
      console.log('🌤️ AI Assistant loading weather...');
      
      const weather = await weatherService.getCurrentWeather();
      setCurrentWeather(weather);
      
      // Check API status
      const apiStatus = weatherService.getApiKeyStatus();
      console.log('🔑 Weather API Status:', apiStatus);
      
      // Send initial greeting with weather
      const greetingMessage: Message = {
        id: Date.now().toString(),
        type: 'assistant',
        content: `👋 Hey there! I'm your AI style assistant. 

I can see it's ${weather.temperature}°F and ${weather.description} in ${weather.city}${weather.isDemo ? ' (demo data)' : ''}. 

${weather.isDemo ? `
⚠️ **Using demo weather data**
For real weather recommendations, get your free API key from OpenWeatherMap and add it to your .env.local file as NEXT_PUBLIC_OPENWEATHER_API_KEY

` : ''}I'm here to help you pick the perfect outfit based on today's weather and your closet! Try asking me:

• "What should I wear today?"
• "Suggest something for work"
• "What's good for this weather?"
• "I need a casual outfit"

What can I help you with? 😊`,
        timestamp: new Date()
      };

      setMessages([greetingMessage]);
    } catch (error) {
      console.error('❌ Error loading weather for AI:', error);
      const errorMessage: Message = {
        id: Date.now().toString(),
        type: 'assistant',
        content: "👋 Hi! I'm your AI style assistant. I'm having trouble getting the weather right now, but I can still help you pick outfits! What kind of look are you going for today?",
        timestamp: new Date()
      };
      setMessages([errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Generate AI response
      const response = await generateResponse(inputMessage.trim());
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: response.content,
        timestamp: new Date(),
        recommendations: response.recommendations
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('❌ Error generating response:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: "I'm sorry, I'm having trouble right now. Could you try asking again? 🤔",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const generateResponse = async (userInput: string) => {
    console.log('🤖 Generating response for:', userInput);

    // Get current weather if not available
    let weather = currentWeather;
    if (!weather) {
      try {
        weather = await weatherService.getCurrentWeather();
        setCurrentWeather(weather);
      } catch (error) {
        console.error('Weather fetch failed:', error);
      }
    }

    try {
      // Use OpenAI for intelligent response generation
      const aiResponse = await openaiService.generateOutfitRecommendation(weather, userClothes, userInput);
      
      console.log('💰 API Cost:', aiResponse.cost, 'Tokens:', aiResponse.tokensUsed);
      
      // Extract recommended items from user's wardrobe based on AI response
      const recommendedItems = extractRecommendedItems(aiResponse.content, userClothes);
      
      return {
        content: aiResponse.content,
        recommendations: recommendedItems.length > 0 ? recommendedItems : null
      };
    } catch (error) {
      console.error('❌ AI response generation failed:', error);
      
      // Fallback to simple responses if AI fails
      return {
        content: "I'm having some trouble right now, but I'm here to help with outfit suggestions! What kind of look are you going for today? Maybe something casual, professional, or weather-appropriate? 🤔",
        recommendations: null
      };
    }
  };

  // Helper function to extract recommended items from AI response with precise attribute matching
  const extractRecommendedItems = (aiContent: string, clothes: ClothingItem[]) => {
    const recommendedItems: ScoredClothingItem[] = [];
    const contentLower = aiContent.toLowerCase();
    
    console.log('🔍 Extracting recommendations from AI content:', aiContent);
    console.log('👗 Available clothes:', clothes.map(item => `${item.name} by ${item.brand} (${item.color}, ${item.size || 'No size'})`));

    // Enhanced precision matching: Look for items with specific attributes mentioned
    clothes.forEach(item => {
      const itemName = item.name.toLowerCase().trim();
      const itemBrand = item.brand.toLowerCase().trim();
      const itemColor = item.color ? item.color.toLowerCase().trim() : '';
      const itemSize = item.size ? item.size.toLowerCase().trim() : '';
      const itemCategory = item.category ? item.category.toLowerCase().trim() : '';
      
      // Score-based matching system with attribute validation
      let matchScore = 0;
      const attributeMatches: string[] = [];
      
      // 1. EXACT ITEM NAME + BRAND MATCH (highest priority)
      const fullItemName = `${itemName} by ${itemBrand}`;
      const brandFirst = `${itemBrand} ${itemName}`;
      if (contentLower.includes(fullItemName) || contentLower.includes(brandFirst)) {
        matchScore += 20;
        attributeMatches.push('full-name-brand');
        console.log(`🎯 EXACT match "${item.name} by ${item.brand}": +20 points`);
      }
      
      // 2. ITEM NAME MATCH (enhanced with partial and fuzzy matching)
      let nameMatchFound = false;
      let nameIndex = contentLower.indexOf(itemName);
      
      // Try exact match first
      if (nameIndex !== -1) {
        matchScore += 15;
        attributeMatches.push('name-exact');
        nameMatchFound = true;
        console.log(`📝 EXACT name match "${item.name}": +15 points`);
      } else {
        // Try partial matching for complex item names
        const itemWords = itemName.split(' ').filter(word => word.length > 2); // Filter out short words like "by", "of"
        const significantWords = itemWords.filter(word => 
          !['the', 'and', 'or', 'for', 'with', 'in', 'on', 'at', 'to', 'by'].includes(word)
        );
        
        // Check if significant words from item name appear in AI content
        let wordMatches = 0;
        const matchPositions: number[] = [];
        
        significantWords.forEach(word => {
          const wordIndex = contentLower.indexOf(word);
          if (wordIndex !== -1) {
            wordMatches++;
            matchPositions.push(wordIndex);
          }
        });
        
        // If we found most of the significant words, consider it a partial match
        const matchPercentage = wordMatches / Math.max(significantWords.length, 1);
        if (matchPercentage >= 0.6 && wordMatches >= 2) { // At least 60% of words and minimum 2 words
          matchScore += 12; // Slightly lower than exact match
          attributeMatches.push('name-partial');
          nameMatchFound = true;
          nameIndex = Math.min(...matchPositions); // Use the earliest word position for context
          console.log(`📝 PARTIAL name match "${item.name}" (${wordMatches}/${significantWords.length} words): +12 points`);
          console.log(`🔤 Matched words: ${significantWords.filter(word => contentLower.includes(word)).join(', ')}`);
        }
        
        // Also try fuzzy matching for common variations
        const itemNameVariations = [
          itemName.replace(/trouser/g, 'trousers'), // Handle singular/plural
          itemName.replace(/trousers/g, 'trouser'),
          itemName.replace(/pant/g, 'pants'),
          itemName.replace(/pants/g, 'pant'),
          itemName.replace(/shoe/g, 'shoes'),
          itemName.replace(/shoes/g, 'shoe'),
          itemName.replace(/short/g, 'shorts'),
          itemName.replace(/shorts/g, 'short'),
          // Remove size info that might be in the item name
          itemName.replace(/\d+[a-z]*/g, '').trim(), // Remove size like "32L", "7\"", etc.
        ];
        
        if (!nameMatchFound) {
          for (const variation of itemNameVariations) {
            const varIndex = contentLower.indexOf(variation);
            if (varIndex !== -1 && variation !== itemName) {
              matchScore += 10;
              attributeMatches.push('name-variation');
              nameMatchFound = true;
              nameIndex = varIndex;
              console.log(`📝 VARIATION match "${variation}" for "${item.name}": +10 points`);
              break;
            }
          }
        }
      }
      
      if (nameMatchFound) {
        
        // Get context around the item name mention (±100 characters)
        const contextStart = Math.max(0, nameIndex - 100);
        const contextEnd = Math.min(contentLower.length, nameIndex + itemName.length + 100);
        const itemContext = contentLower.substring(contextStart, contextEnd);
        
        console.log(`🔍 Item context for "${item.name}": "${itemContext}"`);
        
        // 3. COLOR VALIDATION (critical for matching)
        if (itemColor && itemColor !== '#gray' && itemColor !== 'gray') {
          // Handle both hex colors and color names
          const colorName = itemColor.startsWith('#') ? itemColor.slice(1) : itemColor;
          const colorVariants = [colorName, itemColor];
          
          // Add common color variations
          if (colorName === 'black') colorVariants.push('dark');
          if (colorName === 'white') colorVariants.push('light', 'cream');
          if (colorName === 'blue') colorVariants.push('navy', 'denim');
          if (colorName === 'gray' || colorName === 'grey') colorVariants.push('gray', 'grey');
          
          const hasColorMatch = colorVariants.some(color => itemContext.includes(color));
          
          if (hasColorMatch) {
            matchScore += 10;
            attributeMatches.push('color');
            console.log(`🎨 Color match for "${item.name}" (${itemColor}): +10 points`);
          } else {
            // Color mismatch penalty - if AI mentions a color but it doesn't match
            const mentionsOtherColor = /\b(black|white|blue|red|green|gray|grey|navy|brown|pink|purple|yellow|orange)\b/.test(itemContext);
            if (mentionsOtherColor) {
              matchScore -= 15;
              console.log(`❌ Color MISMATCH for "${item.name}" - AI mentions different color: -15 points`);
            }
          }
        }
        
        // 4. SIZE VALIDATION (enhanced for various formats)
        if (itemSize) {
          const sizeVariants = [itemSize];
          
          // Add size variations for different formats
          if (itemSize.includes('x')) {
            sizeVariants.push(itemSize.replace('x', ' x '), itemSize.replace('x', ' x'));
          }
          
          // Handle length variations (32L, 34W, etc.)
          const sizeMatch = itemSize.match(/(\d+)([a-z]?)/i);
          if (sizeMatch) {
            const number = sizeMatch[1];
            const letter = sizeMatch[2]?.toLowerCase();
            
            // Add variations: "32", "32L", "32l", etc.
            sizeVariants.push(number);
            if (letter) {
              sizeVariants.push(`${number}${letter}`);
              sizeVariants.push(`${number}${letter.toUpperCase()}`);
            }
          }
          
          const hasSizeMatch = sizeVariants.some(size => itemContext.includes(size));
          
          if (hasSizeMatch) {
            matchScore += 8;
            attributeMatches.push('size');
            console.log(`📏 Size match for "${item.name}" (${itemSize}, variants: ${sizeVariants.join(', ')}): +8 points`);
          } else {
            // Check if AI mentions any size for this item type (but be more flexible)
            const mentionsSize = /\b(xs|small|medium|large|xl|xxl|\d+[a-z]*|\d+x\d+|size \w+)\b/.test(itemContext);
            if (mentionsSize) {
              // Only penalize if there's a clear size mismatch (not just different format)
              const aiSizes = itemContext.match(/\b(\d+[a-z]*|\d+x\d+|xs|small|medium|large|xl|xxl)\b/g);
              const hasConflictingSize = aiSizes && aiSizes.some(aiSize => {
                return !sizeVariants.some(variant => 
                  aiSize.toLowerCase().includes(variant.toLowerCase()) || 
                  variant.toLowerCase().includes(aiSize.toLowerCase())
                );
              });
              
              if (hasConflictingSize) {
                matchScore -= 5; // Reduced penalty for size format differences
                console.log(`⚠️ Size format difference for "${item.name}" - AI: ${aiSizes?.join(', ')}, Item: ${itemSize}: -5 points`);
              }
            }
          }
        } else {
          // If item has no size but AI mentions size in name, try to extract it
          const aiSizeInName = contentLower.match(/\b(\d+[a-z]*)\b/);
          if (aiSizeInName) {
            console.log(`🔍 AI mentions size "${aiSizeInName[1]}" but item "${item.name}" has no size info`);
            // Small bonus for items that might match the mentioned size context
            matchScore += 2;
            attributeMatches.push('size-context');
          }
        }
        
        // 5. CATEGORY/TYPE VALIDATION
        if (itemCategory) {
          const categoryVariants = [itemCategory];
          // Add category variations
          if (itemCategory === 'tops') categoryVariants.push('shirt', 'tank', 'tee');
          if (itemCategory === 'pants') categoryVariants.push('jeans', 'trousers');
          if (itemCategory === 'shoes') categoryVariants.push('sneakers', 'boots');
          
          const hasCategoryMatch = categoryVariants.some(cat => itemContext.includes(cat));
          
          if (hasCategoryMatch) {
            matchScore += 5;
            attributeMatches.push('category');
            console.log(`📂 Category match for "${item.name}" (${itemCategory}): +5 points`);
          }
        }
        
        // 6. BRAND VALIDATION (if mentioned separately)
        if (itemBrand && itemContext.includes(itemBrand)) {
          matchScore += 8;
          attributeMatches.push('brand');
          console.log(`🏷️ Brand match for "${item.name}" (${itemBrand}): +8 points`);
        }
      }
      
      // 7. KEYWORD MATCHES (lower priority, for partial matches)
      const productKeywords = itemName.split(' ').filter(word => word.length > 3);
      productKeywords.forEach(keyword => {
        if (contentLower.includes(keyword)) {
          matchScore += 2;
          console.log(`🔍 Keyword match "${keyword}" for "${item.name}": +2 points`);
        }
      });
      
      console.log(`📊 Final score for "${item.name} by ${item.brand}": ${matchScore} (matches: ${attributeMatches.join(', ')})`);
      
      // Adjusted threshold for more sophisticated matching - include good partial matches
      if (matchScore >= 12) {
        recommendedItems.push({ ...item, matchScore, attributeMatches });
        console.log(`✅ ADDED "${item.name} by ${item.brand}" to recommendations (score: ${matchScore})`);
      } else if (matchScore > 0) {
        console.log(`⚠️ EXCLUDED "${item.name} by ${item.brand}" - score too low (${matchScore})`);
      } else {
        console.log(`❌ NO MATCH for "${item.name} by ${item.brand}" - no relevant keywords found`);
      }
    });

    // Sort by match score (highest first) and then by attribute specificity
    recommendedItems.sort((a, b) => {
      const aScore = a.matchScore || 0;
      const bScore = b.matchScore || 0;
      if (bScore !== aScore) {
        return bScore - aScore;
      }
      // If scores are equal, prioritize items with more specific attribute matches
      const aSpecificity = a.attributeMatches?.length || 0;
      const bSpecificity = b.attributeMatches?.length || 0;
      return bSpecificity - aSpecificity;
    });

    // If no specific items found with high scores, provide context-aware fallback
    if (recommendedItems.length === 0) {
      console.log('⚠️ No precise matches found. Checking for category-based recommendations...');
      
      // Look for category mentions in AI content
      const categoryMatches = [];
      if (contentLower.includes('shirt') || contentLower.includes('top') || contentLower.includes('tank')) {
        categoryMatches.push(...clothes.filter(item => item.category.includes('tops')));
      }
      if (contentLower.includes('pants') || contentLower.includes('jeans') || contentLower.includes('shorts')) {
        categoryMatches.push(...clothes.filter(item => item.category.includes('pants') || item.category.includes('shorts')));
      }
      if (contentLower.includes('shoes') || contentLower.includes('sneakers')) {
        categoryMatches.push(...clothes.filter(item => item.category.includes('shoes')));
      }
      
      if (categoryMatches.length > 0) {
        recommendedItems.push(...categoryMatches.slice(0, 3));
        console.log('📂 Added category-based recommendations');
      } else if (currentWeather) {
        // Weather-based fallback only if no category matches
        console.log('🌤️ Using weather-based fallback recommendations');
        const temp = currentWeather.temperature;
        if (temp <= 50) {
          const warmItems = clothes.filter(item => 
            item.category.includes('jacket') || item.category.includes('sweater') || 
            item.name.toLowerCase().includes('coat') || item.name.toLowerCase().includes('warm')
          );
          recommendedItems.push(...warmItems.slice(0, 3));
        } else if (temp >= 75) {
          const lightItems = clothes.filter(item => 
            item.category.includes('t-shirt') || item.category.includes('shorts') || 
            item.name.toLowerCase().includes('light') || item.name.toLowerCase().includes('summer')
          );
          recommendedItems.push(...lightItems.slice(0, 3));
        } else {
          const athleticItems = clothes.filter(item =>
            item.category.includes('shorts') || item.category.includes('tank') || 
            item.category.includes('shoes') || item.name.toLowerCase().includes('athletic')
          );
          recommendedItems.push(...athleticItems.slice(0, 3));
        }
      }
    }

    // Clean up the objects before returning (remove our temporary scoring properties)
    const finalRecommendations = recommendedItems.map(item => {
      const cleanItem = { ...item };
      delete cleanItem.matchScore;
      delete cleanItem.attributeMatches;
      return cleanItem;
    });
    
    console.log('🎯 FINAL PRECISE RECOMMENDATIONS:', finalRecommendations.map(item => 
      `${item.name} by ${item.brand} (${item.color}, ${item.size || 'No size'})`
    ));
    
    return finalRecommendations;
  };

  const handleQuickAction = async (action: string) => {
    setInputMessage(action);
    // Trigger send message
    setTimeout(() => handleSendMessage(), 100);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
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
      <div className={`fixed right-0 top-0 h-full w-full max-w-md bg-white z-50 shadow-[0_0_50px_rgba(0,0,0,0.15)] border-l border-gray-100 transform transition-all duration-300 ease-in-out ${
        isOpen ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="bg-white p-6 border-b border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Personal Stylist AI</h2>
                <p className="text-sm text-gray-500">Ask anything to help you pick your clothes for the day</p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 p-2 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Weather Display */}
            {currentWeather && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <MapPin size={16} />
                    <span>{currentWeather.city}, {currentWeather.country}</span>
                    {currentWeather.isDemo && (
                      <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full">Demo</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Thermometer size={16} />
                    <span>{currentWeather.temperature}°F / {Math.round((currentWeather.temperature - 32) * 5/9)}°C</span>
                  </div>
                </div>
                
                {!currentWeather.isDemo && currentWeather.sunrise && currentWeather.sunset && (
                  <div className="flex items-center justify-between text-xs text-gray-500 bg-gray-50 rounded-lg p-2">
                    <div className="flex items-center gap-1">
                      <Sun size={14} />
                      <span>{new Date(currentWeather.sunrise * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Moon size={14} />
                      <span>{new Date(currentWeather.sunset * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      💧 <span>{currentWeather.humidity}%</span>
                    </div>
                    <div className="flex items-center gap-1">
                      🌬️ <span>{Math.round(currentWeather.windSpeed)} mph</span>
                    </div>
                  </div>
                )}
                
                {currentWeather.isDemo && (
                  <div className="text-xs text-orange-600 bg-orange-50 rounded-lg p-2">
                    💡 Get real weather data: Add your OpenWeatherMap API key to .env.local
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Zap size={24} className="text-purple-600" />
                </div>
                <p className="text-lg font-medium mb-2">Hi! I'm your AI stylist</p>
                {userClothes.length === 0 ? (
                  <div className="text-sm space-y-2">
                    <p>I'd love to help you create amazing outfits!</p>
                    <p className="text-purple-600 font-medium">Start by adding some clothes to your wardrobe, then I can give you personalized recommendations.</p>
                  </div>
                ) : (
                  <p className="text-sm">Ask me anything about your outfits and I'll help you look amazing using the {userClothes.length} items in your wardrobe!</p>
                )}
              </div>
            ) : (
              messages.map((message) => (
                <div key={message.id} className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {message.type === 'assistant' && (
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-sm font-medium">AI</span>
                    </div>
                  )}
                  
                  <div className={`max-w-[280px] ${message.type === 'user' ? 'order-first' : ''}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-gray-600">
                        {message.type === 'user' ? 'You' : 'AI'}
                      </span>
                      <span className="text-xs text-gray-400">
                        {message.timestamp.toLocaleTimeString([], { 
                          weekday: 'short',
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                    </div>
                    
                    <div className={`p-3 rounded-2xl ${
                      message.type === 'user' 
                        ? 'bg-purple-600 text-white rounded-br-md' 
                        : 'bg-gray-100 text-gray-800 rounded-bl-md'
                    }`}>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {message.content}
                      </p>
                    </div>

                    {/* Recommendations */}
                    {message.recommendations && message.recommendations.length > 0 && (
                      <div className="mt-3 space-y-2">
                        <p className="text-xs text-gray-500 font-medium">Recommended items:</p>
                        <div className="grid grid-cols-2 gap-2">
                          {message.recommendations.map((item: ClothingItem) => (
                            <div key={item.id} className="bg-white border border-gray-200 rounded-lg p-2">
                              <div className="aspect-square bg-gray-100 rounded-md mb-2 overflow-hidden">
                                {item.image_url || item.image ? (
                                  <img 
                                    src={item.image_url || item.image} 
                                    alt={item.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <ImageIcon size={20} className="text-gray-400" />
                                  </div>
                                )}
                              </div>
                              <p className="text-xs font-medium text-gray-800 truncate">{item.name}</p>
                              <p className="text-xs text-gray-500 truncate">{item.brand}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {message.type === 'user' && (
                    <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-sm font-medium">You</span>
                    </div>
                  )}
                </div>
              ))
            )}
            
            {isLoading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-sm font-medium">AI</span>
                </div>
                <div className="bg-gray-100 rounded-2xl rounded-bl-md p-3">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions */}
          <div className="p-4 border-t border-gray-100">
            <div className="flex flex-wrap gap-2 mb-4">
              {userClothes.length === 0 ? (
                // Show different actions when no clothes
                [
                  "Help me start my wardrobe",
                  "What basics should I add?",
                  "Style tips for beginners"
                ].map((action) => (
                  <button
                    key={action}
                    onClick={() => handleQuickAction(action)}
                    className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full px-4 py-2 transition-colors"
                    disabled={isLoading}
                  >
                    {action}
                  </button>
                ))
              ) : (
                // Show outfit suggestions when they have clothes
                [
                  "What should I wear today?",
                  "Date Night Outfit",
                  "Athletic Outfit"
                ].map((action) => (
                  <button
                    key={action}
                    onClick={() => handleQuickAction(action)}
                    className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full px-4 py-2 transition-colors"
                    disabled={isLoading}
                  >
                    {action}
                  </button>
                ))
              )}
            </div>

            {/* Input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Message"
                className="flex-1 border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                disabled={isLoading}
              />
              <button
                onClick={handleSendMessage}
                disabled={isLoading || !inputMessage.trim()}
                className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white rounded-lg p-3 transition-colors"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AIAssistant; 