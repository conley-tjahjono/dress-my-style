// Image analysis service for auto-filling clothing details
const OPENAI_API_KEY = process.env.NEXT_PUBLIC_OPENAI_API_KEY || 'demo_key';

export const imageAnalysisService = {
  // Check if we have a valid API key
  hasValidApiKey: () => {
    return OPENAI_API_KEY && OPENAI_API_KEY !== 'demo_key' && OPENAI_API_KEY.length > 20;
  },

  // Analyze clothing image and extract details
  analyzeClothingImage: async (imageUrl) => {
    if (!imageAnalysisService.hasValidApiKey()) {
      console.log('🚫 No valid OpenAI API key for image analysis');
      throw new Error('OpenAI API key not configured');
    }

    try {
      console.log('🔍 Analyzing clothing image:', imageUrl);

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: `Analyze this clothing item image and extract the following details in JSON format:
{
  "name": "descriptive name of the item",
  "category": "one of: Shirts, Pants, Dresses, Shoes, Accessories, Jackets, Sweaters",
  "brand": "brand name if visible, or 'Unknown' if not visible",
  "colors": ["primary color", "secondary color if any"],
  "tags": ["style tags like Casual, Formal, Summer, etc."],
  "estimatedPrice": "estimated price range like '25-35' or null if can't estimate"
}

Be specific but concise. For colors, use common color names like Black, White, Blue, Red, etc. For tags, include style, season, and occasion tags that would be relevant.`
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: imageUrl,
                    detail: 'low' // Use low detail for faster processing and lower cost
                  }
                }
              ]
            }
          ],
          max_tokens: 500,
          temperature: 0.3 // Lower temperature for more consistent results
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ OpenAI API error:', response.status, errorData);
        
        if (response.status === 401) {
          throw new Error('Invalid OpenAI API key');
        } else if (response.status === 429) {
          throw new Error('OpenAI API rate limit exceeded');
        } else {
          throw new Error(`OpenAI API error: ${response.status}`);
        }
      }

      const data = await response.json();
      console.log('🤖 OpenAI response:', data);

      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('Invalid response from OpenAI');
      }

      const content = data.choices[0].message.content;
      console.log('📝 Analysis content:', content);

      // Parse the JSON response
      try {
        // Extract JSON from the response (handle cases where there might be extra text)
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('No JSON found in response');
        }

        const analysisResult = JSON.parse(jsonMatch[0]);
        console.log('✅ Parsed analysis result:', analysisResult);

        // Validate and normalize the result
        const normalizedResult = {
          name: analysisResult.name || 'Clothing Item',
          category: validateCategory(analysisResult.category) || '',
          brand: analysisResult.brand || '',
          colors: Array.isArray(analysisResult.colors) ? analysisResult.colors : [],
          tags: Array.isArray(analysisResult.tags) ? analysisResult.tags : [],
          estimatedPrice: analysisResult.estimatedPrice || ''
        };

        console.log('🎯 Normalized result:', normalizedResult);
        
        // Calculate cost (approximate)
        const inputTokens = data.usage?.prompt_tokens || 0;
        const outputTokens = data.usage?.completion_tokens || 0;
        const cost = calculateImageAnalysisCost(inputTokens, outputTokens);
        
        return {
          ...normalizedResult,
          tokensUsed: inputTokens + outputTokens,
          cost: cost
        };

      } catch (parseError) {
        console.error('❌ Failed to parse AI response:', parseError);
        throw new Error('Failed to parse clothing analysis');
      }

    } catch (error) {
      console.error('❌ Image analysis error:', error);
      throw error;
    }
  }
};

// Helper function to validate category
const validateCategory = (category) => {
  const validCategories = ['Shirts', 'Pants', 'Dresses', 'Shoes', 'Accessories', 'Jackets', 'Sweaters'];
  if (!category) return '';
  
  // Try exact match first
  if (validCategories.includes(category)) return category;
  
  // Try case-insensitive match
  const normalizedCategory = category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
  if (validCategories.includes(normalizedCategory)) return normalizedCategory;
  
  // Try fuzzy matching for common variations
  const categoryLower = category.toLowerCase();
  if (categoryLower.includes('shirt') || categoryLower.includes('top') || categoryLower.includes('blouse')) return 'Shirts';
  if (categoryLower.includes('pant') || categoryLower.includes('jeans') || categoryLower.includes('trouser')) return 'Pants';
  if (categoryLower.includes('dress') || categoryLower.includes('gown')) return 'Dresses';
  if (categoryLower.includes('shoe') || categoryLower.includes('sneaker') || categoryLower.includes('boot')) return 'Shoes';
  if (categoryLower.includes('accessory') || categoryLower.includes('bag') || categoryLower.includes('hat') || categoryLower.includes('belt')) return 'Accessories';
  if (categoryLower.includes('jacket') || categoryLower.includes('coat') || categoryLower.includes('blazer')) return 'Jackets';
  if (categoryLower.includes('sweater') || categoryLower.includes('hoodie') || categoryLower.includes('cardigan')) return 'Sweaters';
  
  return '';
};

// Calculate cost for image analysis (GPT-4o-mini with vision)
const calculateImageAnalysisCost = (inputTokens, outputTokens) => {
  // GPT-4o-mini pricing (as of 2024)
  const inputCostPer1K = 0.00015;  // $0.00015 per 1K input tokens
  const outputCostPer1K = 0.0006;  // $0.0006 per 1K output tokens
  
  const inputCost = (inputTokens / 1000) * inputCostPer1K;
  const outputCost = (outputTokens / 1000) * outputCostPer1K;
  
  return Number((inputCost + outputCost).toFixed(6));
}; 