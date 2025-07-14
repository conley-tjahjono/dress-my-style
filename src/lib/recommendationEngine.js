// Smart recommendation engine for weather-based outfit suggestions
export const recommendationEngine = {
  // Analyze weather and return clothing recommendations
  getRecommendations: (weather, userClothes) => {
    console.log('🧠 Analyzing weather for recommendations:', weather);
    console.log('👕 Available clothes:', userClothes.length, 'items');

    const recommendations = {
      message: '',
      items: [],
      weatherAnalysis: '',
      tips: []
    };

    // Analyze weather conditions
    const temp = weather.temperature;
    const condition = weather.main?.toLowerCase() || '';
    const description = weather.description?.toLowerCase() || '';

    // Weather analysis
    recommendations.weatherAnalysis = recommendationEngine.analyzeWeather(weather);

    // Temperature-based recommendations
    if (temp <= 32) {
      recommendations.message = "🥶 It's freezing! You'll need serious layering today.";
      recommendations.items = recommendationEngine.filterClothes(userClothes, [
        'jacket', 'coat', 'sweater', 'hoodie', 'long pants', 'boots', 
        'scarf', 'gloves', 'hat'
      ]);
      recommendations.tips.push("Layer up! Start with a base layer, add insulation, then a windproof outer layer.");
      recommendations.tips.push("Don't forget extremities - hat, gloves, and warm socks are essential.");
    } else if (temp <= 50) {
      recommendations.message = "🧥 Cool weather ahead! Perfect for cozy layers.";
      recommendations.items = recommendationEngine.filterClothes(userClothes, [
        'jacket', 'sweater', 'hoodie', 'long pants', 'boots', 'sneakers'
      ]);
      recommendations.tips.push("A medium jacket or sweater should keep you comfortable.");
      recommendations.tips.push("Long pants and closed-toe shoes are your best bet.");
    } else if (temp <= 70) {
      recommendations.message = "😊 Nice and mild! Great weather for light layers.";
      recommendations.items = recommendationEngine.filterClothes(userClothes, [
        'light jacket', 'cardigan', 'long sleeve', 'jeans', 'sneakers', 'flats'
      ]);
      recommendations.tips.push("Perfect weather for a light layer you can easily remove.");
      recommendations.tips.push("Jeans or light pants with a breathable top work great.");
    } else if (temp <= 80) {
      recommendations.message = "☀️ Warm and pleasant! Time for comfortable casual wear.";
      recommendations.items = recommendationEngine.filterClothes(userClothes, [
        't-shirt', 'blouse', 'shorts', 'jeans', 'sneakers', 'sandals'
      ]);
      recommendations.tips.push("Light, breathable fabrics will keep you comfortable.");
      recommendations.tips.push("You can probably skip the jacket today!");
    } else {
      recommendations.message = "🔥 It's hot out there! Stay cool and protected.";
      recommendations.items = recommendationEngine.filterClothes(userClothes, [
        't-shirt', 'tank top', 'shorts', 'dress', 'sandals', 'hat'
      ]);
      recommendations.tips.push("Choose light colors and breathable fabrics.");
      recommendations.tips.push("Don't forget sun protection - hat and sunglasses!");
    }

    // Weather condition adjustments
    if (condition.includes('rain') || description.includes('rain')) {
      recommendations.tips.push("☔ Rain expected! Bring a waterproof jacket or umbrella.");
      const waterproofItems = recommendationEngine.filterClothes(userClothes, [
        'rain jacket', 'waterproof', 'boots'
      ]);
      recommendations.items = [...recommendations.items, ...waterproofItems];
    }

    if (condition.includes('snow')) {
      recommendations.tips.push("❄️ Snow forecast! Waterproof boots and warm layers are essential.");
      const snowItems = recommendationEngine.filterClothes(userClothes, [
        'boots', 'waterproof', 'coat', 'gloves', 'hat'
      ]);
      recommendations.items = [...recommendations.items, ...snowItems];
    }

    if (weather.windSpeed > 15) {
      recommendations.tips.push("💨 It's windy! A windbreaker or jacket will help.");
    }

    // Remove duplicates and limit recommendations
    recommendations.items = recommendationEngine.removeDuplicates(recommendations.items).slice(0, 8);

    // If no specific items found, provide general categories
    if (recommendations.items.length === 0) {
      recommendations.items = recommendationEngine.getGeneralRecommendations(userClothes, temp);
    }

    return recommendations;
  },

  // Analyze weather conditions and provide insights
  analyzeWeather: (weather) => {
    const temp = weather.temperature;
    const feelsLike = weather.feelsLike;
    const condition = weather.main;
    const city = weather.city;

    let analysis = `Currently ${temp}°F in ${city}`;
    
    if (feelsLike !== temp) {
      analysis += ` (feels like ${feelsLike}°F)`;
    }
    
    analysis += `. Conditions: ${weather.description}.`;

    if (weather.humidity > 70) {
      analysis += ' High humidity may make it feel warmer.';
    }

    return analysis;
  },

  // Filter clothes based on categories/keywords
  filterClothes: (clothes, keywords) => {
    return clothes.filter(item => {
      const searchText = `${item.name} ${item.category} ${item.tags?.join(' ')}`.toLowerCase();
      return keywords.some(keyword => searchText.includes(keyword.toLowerCase()));
    });
  },

  // Remove duplicate items
  removeDuplicates: (items) => {
    const seen = new Set();
    return items.filter(item => {
      if (seen.has(item.id)) {
        return false;
      }
      seen.add(item.id);
      return true;
    });
  },

  // Get general recommendations when specific items aren't found
  getGeneralRecommendations: (clothes, temperature) => {
    // Group clothes by category
    const categories = {};
    clothes.forEach(item => {
      const category = item.category || 'other';
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(item);
    });

    const recommendations = [];

    // Temperature-based category selection
    if (temperature <= 50) {
      // Cold weather priorities
      ['outerwear', 'sweaters', 'long pants', 'boots'].forEach(cat => {
        if (categories[cat] && categories[cat].length > 0) {
          recommendations.push(categories[cat][0]); // Add first item from category
        }
      });
    } else if (temperature <= 75) {
      // Mild weather priorities  
      ['jackets', 'tops', 'pants', 'shoes'].forEach(cat => {
        if (categories[cat] && categories[cat].length > 0) {
          recommendations.push(categories[cat][0]);
        }
      });
    } else {
      // Hot weather priorities
      ['tops', 'shorts', 'dresses', 'sandals'].forEach(cat => {
        if (categories[cat] && categories[cat].length > 0) {
          recommendations.push(categories[cat][0]);
        }
      });
    }

    return recommendations.slice(0, 6);
  },

  // Get quick suggestion based on user query
  getQuickSuggestion: (query, weather, userClothes) => {
    const lowerQuery = query.toLowerCase();

    if (lowerQuery.includes('work') || lowerQuery.includes('office') || lowerQuery.includes('business')) {
      return recommendationEngine.getWorkOutfit(weather, userClothes);
    }

    if (lowerQuery.includes('casual') || lowerQuery.includes('weekend') || lowerQuery.includes('relax')) {
      return recommendationEngine.getCasualOutfit(weather, userClothes);
    }

    if (lowerQuery.includes('date') || lowerQuery.includes('dinner') || lowerQuery.includes('nice')) {
      return recommendationEngine.getDateOutfit(weather, userClothes);
    }

    if (lowerQuery.includes('gym') || lowerQuery.includes('workout') || lowerQuery.includes('exercise')) {
      return recommendationEngine.getWorkoutOutfit(weather, userClothes);
    }

    // Default to general weather recommendation
    return recommendationEngine.getRecommendations(weather, userClothes);
  },

  // Specific outfit generators
  getWorkOutfit: (weather, clothes) => {
    const businessItems = recommendationEngine.filterClothes(clothes, [
      'blazer', 'dress shirt', 'blouse', 'slacks', 'dress pants', 'dress shoes', 'heels'
    ]);
    
    return {
      message: "💼 Here's a professional look for work:",
      items: businessItems.slice(0, 5),
      tips: ["Stick to neutral colors and classic cuts", "Make sure everything is wrinkle-free"]
    };
  },

  getCasualOutfit: (weather, clothes) => {
    const casualItems = recommendationEngine.filterClothes(clothes, [
      't-shirt', 'jeans', 'sneakers', 'hoodie', 'casual'
    ]);
    
    return {
      message: "😎 Perfect casual outfit for a relaxed day:",
      items: casualItems.slice(0, 5),
      tips: ["Comfort is key!", "Mix and match your favorite pieces"]
    };
  },

  getDateOutfit: (weather, clothes) => {
    const niceItems = recommendationEngine.filterClothes(clothes, [
      'dress', 'nice shirt', 'blouse', 'dark jeans', 'dress shoes', 'heels'
    ]);
    
    return {
      message: "✨ Looking great for your special occasion:",
      items: niceItems.slice(0, 5),
      tips: ["Choose something that makes you feel confident", "Don't forget to check the weather!"]
    };
  },

  getWorkoutOutfit: (weather, clothes) => {
    const activeItems = recommendationEngine.filterClothes(clothes, [
      'athletic', 'workout', 'sports', 'sneakers', 'gym'
    ]);
    
    return {
      message: "💪 Ready to crush your workout:",
      items: activeItems.slice(0, 4),
      tips: ["Choose moisture-wicking fabrics", "Don't forget comfortable shoes"]
    };
  }
}; 