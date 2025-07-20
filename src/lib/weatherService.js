// Weather service for getting current weather data
const WEATHER_API_KEY = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY || 'demo_key';
const WEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5';

// Check if we have a valid API key (not demo)
const hasValidApiKey = () => {
  return WEATHER_API_KEY && WEATHER_API_KEY !== 'demo_key' && WEATHER_API_KEY.length > 10;
};

export const weatherService = {
  // Check API key status
  getApiKeyStatus: () => {
    return {
      hasKey: hasValidApiKey(),
      keyPreview: WEATHER_API_KEY ? `${WEATHER_API_KEY.substring(0, 8)}...` : 'none',
      isDemo: !hasValidApiKey()
    };
  },

  // Get user's current location
  getCurrentLocation: () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lon: position.coords.longitude
          });
        },
        (error) => {
          reject(new Error(`Geolocation error: ${error.message}`));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    });
  },

  // Get weather by coordinates
  getWeatherByCoords: async (lat, lon) => {
    if (!hasValidApiKey()) {
      console.log('🌤️ No valid API key, using demo weather data');
      throw new Error('No valid API key configured');
    }

    try {
      console.log('🌤️ Fetching weather for coordinates:', lat, lon);
      console.log('🔑 Using API key:', `${WEATHER_API_KEY.substring(0, 8)}...`);
      
      const response = await fetch(
        `${WEATHER_BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=imperial`
      );

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Invalid API key - please check your OpenWeatherMap API key');
        } else if (response.status === 429) {
          throw new Error('Weather API rate limit exceeded - please try again later');
        } else {
          throw new Error(`Weather API error: ${response.status} - ${response.statusText}`);
        }
      }

      const data = await response.json();
      console.log('🌤️ Weather data received:', data);

      return {
        temperature: Math.round(data.main.temp),
        feelsLike: Math.round(data.main.feels_like),
        humidity: data.main.humidity,
        description: data.weather[0].description,
        main: data.weather[0].main, // Clear, Clouds, Rain, etc.
        icon: data.weather[0].icon,
        windSpeed: data.wind?.speed || 0,
        pressure: data.main.pressure,
        visibility: data.visibility ? Math.round(data.visibility / 1000) : null, // Convert to km
        sunrise: data.sys.sunrise,
        sunset: data.sys.sunset,
        city: data.name,
        country: data.sys.country,
        isDemo: false
      };
    } catch (error) {
      console.error('❌ Weather fetch error:', error);
      throw error;
    }
  },

  // Get weather by city name (fallback)
  getWeatherByCity: async (cityName) => {
    if (!hasValidApiKey()) {
      console.log('🌤️ No valid API key, using demo weather data');
      throw new Error('No valid API key configured');
    }

    try {
      console.log('🌤️ Fetching weather for city:', cityName);
      
      const response = await fetch(
        `${WEATHER_BASE_URL}/weather?q=${cityName}&appid=${WEATHER_API_KEY}&units=imperial`
      );

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Invalid API key - please check your OpenWeatherMap API key');
        } else if (response.status === 404) {
          throw new Error(`City "${cityName}" not found`);
        } else if (response.status === 429) {
          throw new Error('Weather API rate limit exceeded - please try again later');
        } else {
          throw new Error(`Weather API error: ${response.status} - ${response.statusText}`);
        }
      }

      const data = await response.json();
      console.log('🌤️ Weather data received:', data);

      return {
        temperature: Math.round(data.main.temp),
        feelsLike: Math.round(data.main.feels_like),
        humidity: data.main.humidity,
        description: data.weather[0].description,
        main: data.weather[0].main,
        icon: data.weather[0].icon,
        windSpeed: data.wind?.speed || 0,
        pressure: data.main.pressure,
        visibility: data.visibility ? Math.round(data.visibility / 1000) : null,
        sunrise: data.sys.sunrise,
        sunset: data.sys.sunset,
        city: data.name,
        country: data.sys.country,
        isDemo: false
      };
    } catch (error) {
      console.error('❌ Weather fetch error:', error);
      throw error;
    }
  },

  // Get current weather (tries location first, fallback to demo data)
  getCurrentWeather: async () => {
    try {
      // Check API key status first
      const apiStatus = weatherService.getApiKeyStatus();
      console.log('🔑 API Key Status:', apiStatus);
      
      if (!apiStatus.hasKey) {
        console.log('🌤️ No valid OpenWeatherMap API key found, using demo weather data');
        console.log('💡 To get real weather data:');
        console.log('   1. Sign up at https://openweathermap.org/api');
        console.log('   2. Get your free API key');
        console.log('   3. Add NEXT_PUBLIC_OPENWEATHER_API_KEY to your .env.local file');
        
        return {
          temperature: 72,
          feelsLike: 75,
          humidity: 65,
          description: 'partly cloudy',
          main: 'Clouds',
          icon: '02d',
          windSpeed: 5,
          pressure: 1013,
          visibility: 10,
          sunrise: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
          sunset: Math.floor(Date.now() / 1000) + 7200,  // 2 hours from now
          city: 'Demo City',
          country: 'US',
          isDemo: true
        };
      }

      // Try to get user's location first
      try {
        const location = await weatherService.getCurrentLocation();
        return await weatherService.getWeatherByCoords(location.lat, location.lon);
      } catch (locationError) {
        console.log('📍 Location access failed, trying default city...');
        
        // Fallback to a default city (New York)
        try {
          return await weatherService.getWeatherByCity('New York');
        } catch (cityError) {
          console.log('🌤️ City weather failed, using demo data');
          throw cityError;
        }
      }
    } catch (error) {
      console.error('❌ All weather methods failed:', error);
      
      // Final fallback to demo data
      return {
        temperature: 72,
        feelsLike: 75,
        humidity: 65,
        description: 'partly cloudy (demo)',
        main: 'Clouds',
        icon: '02d',
        windSpeed: 5,
        pressure: 1013,
        visibility: 10,
        sunrise: Math.floor(Date.now() / 1000) - 3600,
        sunset: Math.floor(Date.now() / 1000) + 7200,
        city: 'Demo City',
        country: 'US',
        isDemo: true,
        error: error.message
      };
    }
  }
}; 