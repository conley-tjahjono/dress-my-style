// Weather service for getting current weather data
const WEATHER_API_KEY = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY || 'demo_key';
const WEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5';

export const weatherService = {
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
    try {
      console.log('🌤️ Fetching weather for coordinates:', lat, lon);
      
      const response = await fetch(
        `${WEATHER_BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=imperial`
      );

      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status}`);
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
        city: data.name,
        country: data.sys.country
      };
    } catch (error) {
      console.error('❌ Weather fetch error:', error);
      throw error;
    }
  },

  // Get weather by city name (fallback)
  getWeatherByCity: async (cityName) => {
    try {
      console.log('🌤️ Fetching weather for city:', cityName);
      
      const response = await fetch(
        `${WEATHER_BASE_URL}/weather?q=${cityName}&appid=${WEATHER_API_KEY}&units=imperial`
      );

      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status}`);
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
        city: data.name,
        country: data.sys.country
      };
    } catch (error) {
      console.error('❌ Weather fetch error:', error);
      throw error;
    }
  },

  // Get current weather (tries location first, fallback to demo data)
  getCurrentWeather: async () => {
    try {
      // Try to get user's location first
      const location = await weatherService.getCurrentLocation();
      return await weatherService.getWeatherByCoords(location.lat, location.lon);
    } catch (locationError) {
      console.log('📍 Location access failed, using demo weather data');
      
      // Return demo weather data if location fails
      return {
        temperature: 72,
        feelsLike: 75,
        humidity: 65,
        description: 'partly cloudy',
        main: 'Clouds',
        icon: '02d',
        windSpeed: 5,
        city: 'Demo City',
        country: 'US',
        isDemo: true
      };
    }
  }
}; 