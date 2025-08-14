// Real OpenAI integration for AI-powered outfit recommendations
import OpenAI from 'openai';

const OPENAI_API_KEY = process.env.NEXT_PUBLIC_OPENAI_API_KEY;

// Initialize OpenAI client
const openai = OPENAI_API_KEY ? new OpenAI({
  apiKey: OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Only for demo - in production, use server-side API routes
}) : null;

// Real OpenAI service with actual ChatGPT integration
export const openaiService = {
  // Generate outfit recommendations using ChatGPT
  generateOutfitRecommendation: async (weather, userClothes, userQuery = '') => {
    try {
      console.log('🤖 Generating AI recommendation with OpenAI...');

      // Check if OpenAI is available
      if (!openai) {
        console.log('❌ OpenAI API key not found');
        return {
          content: '⚠️ AI Assistant is currently unavailable. Please check your OpenAI API key configuration.',
          error: 'OpenAI API key not configured',
          isAI: false
        };
      }

      // Build comprehensive context about user's wardrobe with all metadata
      const clothesDescription = userClothes.map(item => {
        const metadata = [];
        
        // Core info
        metadata.push(`Category: ${item.category}`);
        metadata.push(`Color: ${item.color}`);
        
        // Size info (if available)
        if (item.size) {
          metadata.push(`Size: ${item.size}`);
        }
        
        // Price info (if available) 
        if (item.price_min && item.price_max) {
          if (item.price_min === item.price_max) {
            metadata.push(`Price: $${item.price_min}`);
          } else {
            metadata.push(`Price: $${item.price_min}-$${item.price_max}`);
          }
        } else if (item.price_min) {
          metadata.push(`Price: $${item.price_min}`);
        }
        
        // Tags (style/occasion info)
        if (item.tags && item.tags.length > 0) {
          metadata.push(`Tags: ${item.tags.join(', ')}`);
        }
        
        // Purchase age (for styling context)
        if (item.created_at) {
          const purchaseDate = new Date(item.created_at);
          const monthsOld = Math.floor((Date.now() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 30));
          if (monthsOld > 0) {
            metadata.push(`Owned: ${monthsOld} months`);
          }
        }
        
        return `${item.name} by ${item.brand} (${metadata.join(', ')})`;
      }).join('\n');

      // Concise prompt focused on outfit + reasoning
      const systemPrompt = `You are a personal stylist. Recommend outfits using ONLY items from the user's wardrobe. Each item includes metadata like color, size, price, tags, and age. Consider this info for better styling decisions.

Format your response as:

**Outfit Recommendation:**
1. [Item Name] by [Brand]
2. [Item Name] by [Brand] 
3. [Item Name] by [Brand]

**Why this works:**
Brief explanation considering weather, color coordination, occasion fit, and price/style balance.

Keep responses under 100 words. Use item names and brands exactly as listed.`;

      const userPrompt = `Weather: ${weather.temperature}°F, ${weather.description}

Wardrobe:
${clothesDescription || 'No items available'}

Request: "${userQuery || 'What should I wear today?'}"

Recommend an outfit from their wardrobe items only.`;

      // Make actual OpenAI API call
      console.log('📡 Calling OpenAI API...');
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini", // Using GPT-4o mini for better quality while maintaining cost efficiency
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        max_tokens: 150,
        temperature: 0.7
      });
      
      console.log('✅ OpenAI response received');
      console.log('💰 Tokens used:', response.usage.total_tokens);
      
      return {
        content: response.choices[0].message.content || 'Sorry, I had trouble generating a response. Please try again.',
        tokensUsed: response.usage.total_tokens,
        cost: calculateCost(response.usage.total_tokens),
        isAI: true
      };

    } catch (error) {
      console.error('❌ OpenAI API error:', error);
      
      // Return clear error message instead of fallback
      return {
        content: `❌ Sorry, I'm having trouble connecting to the AI service right now. Please try again in a moment.\n\nError: ${error.message}`,
        error: error.message,
        isAI: false
      };
    }
  },

  // Generate follow-up suggestions with conversation context
  generateFollowUp: async (conversationHistory, newQuery, weather, userClothes) => {
    try {
      if (!openai) {
        return {
          content: '⚠️ AI Assistant is currently unavailable. Please check your OpenAI API key configuration.',
          error: 'OpenAI API key not configured',
          isAI: false
        };
      }

      const contextPrompt = `Previous conversation context:
${conversationHistory.slice(-3).map(msg => `${msg.type}: ${msg.content}`).join('\n')}

New question: "${newQuery}"

Current weather: ${weather?.temperature}°F, ${weather?.description} in ${weather?.city}

Provide a helpful follow-up response that considers the previous conversation context and current weather.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { 
            role: "system", 
            content: "You are a helpful fashion stylist assistant. Provide brief, contextual responses that build on previous conversation while considering current weather and user needs." 
          },
          { role: "user", content: contextPrompt }
        ],
        max_tokens: 300,
        temperature: 0.7
      });

      return {
        content: response.choices[0].message.content || 'Sorry, I had trouble generating a response. Please try again.',
        tokensUsed: response.usage.total_tokens,
        cost: calculateCost(response.usage.total_tokens),
        isAI: true
      };
    } catch (error) {
      console.error('❌ OpenAI follow-up error:', error);
      return {
        content: `❌ Sorry, I'm having trouble connecting to the AI service right now. Please try again in a moment.\n\nError: ${error.message}`,
        error: error.message,
        isAI: false
      };
    }
  },

  // Style analysis and feedback
  analyzeStyle: async (outfit, occasion) => {
    try {
      if (!openai) {
        return {
          content: '⚠️ AI Assistant is currently unavailable. Please check your OpenAI API key configuration.',
          error: 'OpenAI API key not configured',
          isAI: false
        };
      }

      const prompt = `Analyze this outfit for ${occasion}: ${outfit}
Provide style feedback, improvements, and alternative suggestions.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { 
            role: "system", 
            content: "You are a professional fashion stylist. Provide constructive feedback and styling suggestions." 
          },
          { role: "user", content: prompt }
        ],
        max_tokens: 300,
        temperature: 0.7
      });

      return {
        content: response.choices[0].message.content || 'Sorry, I had trouble generating a response. Please try again.',
        tokensUsed: response.usage.total_tokens,
        cost: calculateCost(response.usage.total_tokens),
        isAI: true
      };
    } catch (error) {
      console.error('❌ OpenAI style analysis error:', error);
      return {
        content: `❌ Sorry, I'm having trouble connecting to the AI service right now. Please try again in a moment.\n\nError: ${error.message}`,
        error: error.message,
        isAI: false
      };
    }
  }
};

// Cost calculation for OpenAI usage
const calculateCost = (tokens) => {
  // GPT-4o mini pricing (as of 2024): $0.00015 per 1K prompt tokens, $0.0006 per 1K completion tokens
  const inputCost = 0.00015 / 1000;
  const outputCost = 0.0006 / 1000;
  
  // Rough estimate (would need actual input/output token split)
  const estimatedCost = (tokens * 0.7 * inputCost) + (tokens * 0.3 * outputCost);
  return estimatedCost.toFixed(6);
};

// Enhanced OpenAI integration
export const enhanceWithOpenAI = {
  // Pure AI-powered responses only
  generateResponse: async (userInput, weather, clothes) => {
    return await openaiService.generateOutfitRecommendation(weather, clothes, userInput);
  },

  // Enhanced conversation memory
  maintainContext: async (conversationHistory, newMessage) => {
    return await openaiService.generateFollowUp(conversationHistory, newMessage);
  }
}; 