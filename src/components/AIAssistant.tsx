'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Zap, MessageCircle, MapPin, Thermometer } from 'lucide-react';
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
  image_url?: string;
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
      
      // Send initial greeting with weather
      const greetingMessage: Message = {
        id: Date.now().toString(),
        type: 'assistant',
        content: `👋 Hey there! I'm your AI style assistant. 

I can see it's ${weather.temperature}°F and ${weather.description} in ${weather.city}${weather.isDemo ? ' (demo data)' : ''}. 

I'm here to help you pick the perfect outfit based on today's weather and your closet! Try asking me:

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

  // Helper function to extract recommended items from AI response
  const extractRecommendedItems = (aiContent: string, clothes: ClothingItem[]) => {
    const recommendedItems: ClothingItem[] = [];
    const contentLower = aiContent.toLowerCase();

    // Look for clothing items mentioned in the AI response
    clothes.forEach(item => {
      const itemName = item.name.toLowerCase();
      const itemBrand = item.brand.toLowerCase();
      
      // Check if the item name or brand is mentioned in the response
      if (contentLower.includes(itemName) || contentLower.includes(itemBrand)) {
        recommendedItems.push(item);
      }
    });

    // If no specific items found, return a few items from relevant categories
    if (recommendedItems.length === 0 && currentWeather) {
      const temp = currentWeather.temperature;
      if (temp <= 50) {
        // Cold weather - look for warm items
        const warmItems = clothes.filter(item => 
          item.category.includes('jacket') || 
          item.category.includes('sweater') || 
          item.name.toLowerCase().includes('coat') ||
          item.name.toLowerCase().includes('warm')
        );
        recommendedItems.push(...warmItems.slice(0, 3));
      } else if (temp >= 75) {
        // Hot weather - look for light items
        const lightItems = clothes.filter(item => 
          item.category.includes('t-shirt') || 
          item.category.includes('shorts') || 
          item.name.toLowerCase().includes('light') ||
          item.name.toLowerCase().includes('summer')
        );
        recommendedItems.push(...lightItems.slice(0, 3));
      }
    }

    return recommendedItems.slice(0, 4); // Limit to 4 items for display
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
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end">
      <div className="bg-white w-full max-w-md h-full flex flex-col shadow-xl">
        {/* Header */}
        <div className="bg-green-500 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <Zap size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">AI Assistant</h2>
              <p className="text-sm text-green-100">Your personal style advisor</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Weather Info */}
        {currentWeather && (
          <div className="bg-gray-50 p-3 border-b">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin size={16} />
              <span>{currentWeather.city}</span>
              <Thermometer size={16} />
              <span>{currentWeather.temperature}°F</span>
              <span className="capitalize">{currentWeather.description}</span>
              {currentWeather.isDemo && (
                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Demo</span>
              )}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="p-3 border-b bg-gray-50">
          <p className="text-xs text-gray-500 mb-2">Quick suggestions:</p>
          <div className="flex flex-wrap gap-2">
            {[
              "What should I wear today?",
              "Work outfit",
              "Casual outfit",
              "Date night look"
            ].map((action) => (
              <button
                key={action}
                onClick={() => handleQuickAction(action)}
                className="text-xs bg-white border border-gray-200 rounded-full px-3 py-1 hover:bg-gray-50 transition-colors"
                disabled={isLoading}
              >
                {action}
              </button>
            ))}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.type === 'user'
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <p className="text-sm whitespace-pre-line">{message.content}</p>
                
                {/* Recommended Items */}
                {message.recommendations && message.recommendations.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <p className="text-xs font-medium text-gray-600">Recommended items:</p>
                    <div className="grid grid-cols-2 gap-2">
                      {message.recommendations.slice(0, 4).map((item: ClothingItem) => (
                        <div key={item.id} className="bg-white rounded-lg p-2 shadow-sm">
                          <div className="aspect-square bg-gray-200 rounded-md mb-1 overflow-hidden">
                            {item.image_url ? (
                              <img 
                                src={item.image_url} 
                                alt={item.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400">
                                <MessageCircle size={16} />
                              </div>
                            )}
                          </div>
                          <p className="text-xs font-medium text-gray-900 truncate">{item.name}</p>
                          <p className="text-xs text-gray-500 truncate">{item.brand}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <p className="text-xs opacity-70 mt-2">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-lg px-4 py-2">
                <div className="flex items-center gap-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-xs text-gray-500">AI is thinking...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t bg-white">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me about outfits..."
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
              disabled={isLoading}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className="bg-green-500 text-white rounded-lg px-4 py-2 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant; 