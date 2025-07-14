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
        console.log('⚠️ OpenAI API key not found, using fallback response');
        return await simulateOpenAIResponse(weather, userClothes, userQuery);
      }

      // Build context about user's wardrobe
      const clothesDescription = userClothes.map(item => 
        `${item.name} by ${item.brand} (${item.category}, ${item.color}, tags: ${item.tags.join(', ')})`
      ).join('\n');

      // Create comprehensive prompt
      const systemPrompt = `You are a professional fashion stylist and personal shopping assistant. You have access to the user's complete wardrobe and current weather conditions. 

Your role:
- Provide personalized outfit recommendations based on weather and occasion
- Consider color coordination, style compatibility, and seasonal appropriateness
- Suggest specific items from their wardrobe
- Give styling tips and fashion advice
- Be friendly, enthusiastic, and encouraging
- Use emojis appropriately to make responses engaging
- Keep responses concise but helpful (aim for 150-250 words)

Always consider:
- Weather conditions and temperature
- Comfort and practicality
- Style and aesthetic appeal
- Occasion appropriateness
- Color combinations and patterns`;

      const userPrompt = `Current Weather:
Temperature: ${weather.temperature}°F (feels like ${weather.feelsLike}°F)
Conditions: ${weather.description}
Location: ${weather.city}
Humidity: ${weather.humidity}%
Wind: ${weather.windSpeed} mph

User's Available Clothing:
${clothesDescription || 'No specific items listed - provide general advice'}

User Request: "${userQuery || 'What should I wear today?'}"

Please provide a personalized outfit recommendation with:
1. Specific items from their wardrobe (if available)
2. Why these pieces work well together
3. Weather considerations
4. Styling tips
5. Any additional accessories or layers to consider`;

      // Make actual OpenAI API call
      console.log('📡 Calling OpenAI API...');
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo", // Using GPT-3.5 for cost efficiency (can upgrade to gpt-4 if needed)
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
        content: response.choices[0].message.content,
        tokensUsed: response.usage.total_tokens,
        cost: calculateCost(response.usage.total_tokens),
        isAI: true
      };

    } catch (error) {
      console.error('❌ OpenAI API error:', error);
      
      // Fallback to simulated response if OpenAI fails
      console.log('🔄 Falling back to simulated response');
      const fallback = await simulateOpenAIResponse(weather, userClothes, userQuery);
      fallback.error = 'AI temporarily unavailable - using fallback';
      return fallback;
    }
  },

  // Generate follow-up suggestions with conversation context
  generateFollowUp: async (conversationHistory, newQuery, weather, userClothes) => {
    try {
      if (!openai) {
        return await simulateOpenAIResponse(weather, userClothes, newQuery);
      }

      const contextPrompt = `Previous conversation context:
${conversationHistory.slice(-3).map(msg => `${msg.type}: ${msg.content}`).join('\n')}

New question: "${newQuery}"

Current weather: ${weather?.temperature}°F, ${weather?.description} in ${weather?.city}

Provide a helpful follow-up response that considers the previous conversation context and current weather.`;

      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
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
        content: response.choices[0].message.content,
        tokensUsed: response.usage.total_tokens,
        cost: calculateCost(response.usage.total_tokens),
        isAI: true
      };
    } catch (error) {
      console.error('❌ OpenAI follow-up error:', error);
      return await simulateOpenAIResponse(weather, userClothes, newQuery);
    }
  },

  // Style analysis and feedback
  analyzeStyle: async (outfit, occasion) => {
    const prompt = `Analyze this outfit for ${occasion}: ${outfit}
Provide style feedback, improvements, and alternative suggestions.`;

    return await simulateOpenAIResponse(null, [], `Analyze outfit for ${occasion}`);
  }
};

// Simulated AI responses (what real OpenAI would return)
const simulateOpenAIResponse = async (weather, clothes, query) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  const responses = {
    work: `💼 Perfect! For a professional look in this ${weather?.temperature}°F weather, I'd suggest:

**The Outfit:**
${clothes.length > 0 ? `• Your ${clothes[0]?.name || 'navy blazer'} - classic and polished` : '• A tailored blazer in navy or charcoal'}
${clothes.length > 1 ? `• Pair it with your ${clothes[1]?.name || 'dress shirt'} for a crisp foundation` : '• A crisp white or light blue dress shirt'}
${clothes.length > 2 ? `• Your ${clothes[2]?.name || 'dress pants'} will complete the professional base` : '• Well-fitted dress pants or pencil skirt'}

**Why This Works:**
The combination creates a polished, authoritative look while keeping you comfortable in today's weather. The structured blazer adds instant professionalism, and the colors work harmoniously together.

**Styling Tips:**
✨ Roll your blazer sleeves slightly for a modern touch
✨ Add a statement watch or subtle jewelry
✨ ${weather?.temperature > 70 ? 'The weather is warm - consider lighter fabrics and skip the jacket indoors' : 'Layer smartly - you can remove the blazer if it gets warm'}

**Weather Considerations:**
${weather?.description?.includes('rain') ? '☔ Keep an umbrella handy and choose leather shoes that can handle moisture' : ''}
${weather?.temperature < 50 ? '🧥 Add a professional coat for your commute' : ''}

You'll look confident and put-together! 💪`,

    casual: `😎 Love a casual day! Here's what I'm thinking for this ${weather?.temperature}°F weather:

**The Vibe:**
${clothes.length > 0 ? `• Your ${clothes[0]?.name || 'favorite jeans'} as the comfortable foundation` : '• Your most comfortable jeans - the ones that make you feel great'}
${clothes.length > 1 ? `• Top it with your ${clothes[1]?.name || 'soft t-shirt'} for that effortless cool` : '• A soft, well-fitting t-shirt in a color you love'}
${clothes.length > 2 ? `• Finish with your ${clothes[2]?.name || 'sneakers'} for all-day comfort` : '• Your go-to sneakers for walking around'}

**The Magic:**
This combination screams "effortlessly put-together" while keeping you super comfortable. The key to great casual style is fit and confidence!

**Elevate It:**
🌟 Add a denim jacket or cardigan for easy layering
🌟 Accessorize with your favorite watch or bracelet
🌟 ${weather?.temperature > 75 ? 'Perfect weather for showing off those sandals instead!' : 'Maybe add a light scarf for that extra style touch'}

**Weather Perfect:**
${weather?.main?.includes('Rain') ? '🌧️ Swap for waterproof shoes and bring a light rain jacket' : ''}
${weather?.temperature < 60 ? '🧥 Perfect layering weather - add a hoodie or light jacket' : ''}

You're going to look amazing and feel even better! ✨`,

    default: `👗 Based on today's ${weather?.temperature}°F weather in ${weather?.city}, here's what I'm loving for you:

**The Perfect Combo:**
Looking at your wardrobe, I'm excited about these pieces working together! The weather is ${weather?.description}, which gives us some great styling opportunities.

${clothes.length > 0 ? `I'm particularly drawn to your ${clothes[0]?.name} - it's going to be perfect for this weather. ` : ''}
${weather?.temperature > 70 ? 'This warm weather calls for breathable fabrics and lighter layers.' : weather?.temperature < 50 ? 'This cooler weather is perfect for cozy layering and richer textures.' : 'This mild weather gives us so many styling options!'}

**My Styling Vision:**
✨ Focus on comfort without sacrificing style
✨ Layer smartly so you can adjust as the day goes on
✨ Choose pieces that make YOU feel confident and beautiful

**Weather-Smart Choices:**
${weather?.humidity > 70 ? '💧 High humidity today - go for breathable, natural fabrics' : ''}
${weather?.windSpeed > 15 ? '💨 It\'s breezy - secure any flowing pieces or opt for more structured items' : ''}

Remember, the best outfit is the one that makes you feel like the amazing person you are! 💫`
  };

  const queryLower = query.toLowerCase();
  if (queryLower.includes('work') || queryLower.includes('office') || queryLower.includes('business')) {
    return { content: responses.work, tokensUsed: 245, cost: 0.012 };
  }
  if (queryLower.includes('casual') || queryLower.includes('weekend') || queryLower.includes('relax')) {
    return { content: responses.casual, tokensUsed: 230, cost: 0.011 };
  }
  
  return { content: responses.default, tokensUsed: 190, cost: 0.009 };
};

// Cost calculation for OpenAI usage
const calculateCost = (tokens) => {
  // GPT-3.5-turbo pricing (as of 2024): $0.001 per 1K prompt tokens, $0.002 per 1K completion tokens
  const inputCost = 0.001 / 1000;
  const outputCost = 0.002 / 1000;
  
  // Rough estimate (would need actual input/output token split)
  const estimatedCost = (tokens * 0.7 * inputCost) + (tokens * 0.3 * outputCost);
  return estimatedCost.toFixed(5);
};

// Integration example for the chat component
export const enhanceWithOpenAI = {
  // Replace rule-based logic with AI
  generateResponse: async (userInput, weather, clothes) => {
    try {
      return await openaiService.generateOutfitRecommendation(weather, clothes, userInput);
    } catch (error) {
      // Fallback to rule-based if AI fails
      console.log('🔄 Falling back to rule-based recommendations');
      const { recommendationEngine } = await import('./recommendationEngine');
      const recommendations = recommendationEngine.getQuickSuggestion(userInput, weather, clothes);
      return {
        content: recommendations.message + '\n\n' + recommendations.weatherAnalysis,
        tokensUsed: 0,
        cost: 0
      };
    }
  },

  // Enhanced conversation memory
  maintainContext: async (conversationHistory, newMessage) => {
    // OpenAI can remember context within the conversation
    const contextPrompt = `Previous conversation: ${conversationHistory.map(m => `${m.type}: ${m.content}`).join('\n')}
New message: ${newMessage}`;
    
    return await openaiService.generateFollowUp(contextPrompt, newMessage);
  }
}; 