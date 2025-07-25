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

      // Build context about user's wardrobe
      const clothesDescription = userClothes.map(item => 
        `${item.name} by ${item.brand} (${item.category}, ${item.color}, tags: ${item.tags.join(', ')})`
      ).join('\n');

      // Create comprehensive prompt
      const systemPrompt = `You are a professional fashion stylist and personal shopping assistant. You have access to the user's complete wardrobe and current weather conditions. 

CRITICAL CONSTRAINTS:
- ONLY recommend items that are explicitly listed in the user's wardrobe
- DO NOT suggest items that are not in their collection
- If the user lacks essential items for an outfit, suggest they add those items to their wardrobe
- Always reference specific items by name and brand when available

Your role:
- Provide personalized outfit recommendations using ONLY their existing wardrobe items
- Consider color coordination, style compatibility, and seasonal appropriateness
- Give styling tips and fashion advice for their current pieces
- Be friendly, enthusiastic, and encouraging
- Use emojis appropriately to make responses engaging
- Keep responses concise but helpful (aim for 150-250 words)

When creating recommendations:
1. Start with items they actually own
2. If they're missing key pieces, say: "To complete this look, consider adding [specific item] to your wardrobe"
3. Focus on creative combinations of their existing items
4. Suggest layering and styling techniques for what they have

Always consider:
- Weather conditions and temperature
- Comfort and practicality
- Style and aesthetic appeal
- Occasion appropriateness
- Color combinations and patterns from their existing pieces`;

      const userPrompt = `Current Weather:
Temperature: ${weather.temperature}°F (feels like ${weather.feelsLike}°F)
Conditions: ${weather.description}
Location: ${weather.city}
Humidity: ${weather.humidity}%
Wind: ${weather.windSpeed} mph

User's Complete Wardrobe:
${clothesDescription || 'No items in wardrobe yet - suggest they start building their digital closet!'}

User Request: "${userQuery || 'What should I wear today?'}"

Please provide a personalized outfit recommendation with:
1. Specific items from their wardrobe ONLY (mention by name and brand)
2. Why these pieces work well together
3. Weather considerations
4. Styling tips for their existing pieces
5. If missing essential items, suggest what to add to their wardrobe

Remember: Only use items that are explicitly listed in their wardrobe above!`;

      // Make actual OpenAI API call
      console.log('📡 Calling OpenAI API...');
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini", // Using GPT-4o mini for better quality while maintaining cost efficiency
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        max_tokens: 400,
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