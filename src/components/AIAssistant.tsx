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
              <div className="flex items-center justify-between text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <MapPin size={16} />
                  <span>{currentWeather.city}, {currentWeather.country}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Thermometer size={16} />
                  <span>{currentWeather.temperature}°F / {Math.round((currentWeather.temperature - 32) * 5/9)}°C</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <Sun size={16} />
                    <span>6:30 AM</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Moon size={16} />
                    <span>8:00 PM</span>
                  </div>
                </div>
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
                <p className="text-sm">Ask me anything about your outfits and I'll help you look amazing!</p>
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
                        {message.type === 'user' ? 'You' : 'Orlando Diggs'}
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
                          {message.recommendations.slice(0, 4).map((item: ClothingItem) => (
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
              {[
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
              ))}
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