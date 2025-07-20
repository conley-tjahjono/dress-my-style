# Dress My Style

An AI-powered closet management and style recommendation app built with Next.js, Supabase, and OpenAI.

## Features

- 👔 **Digital Closet**: Add and organize your clothing items with photos and tags
- ✨ **AI Auto-Fill**: Automatically extract clothing details from images using AI vision
- 🤖 **AI Style Assistant**: Get personalized outfit recommendations based on weather and your wardrobe
- 🌤️ **Real Weather Integration**: Outfit suggestions based on current weather conditions
- 📱 **Responsive Design**: Works seamlessly on desktop and mobile devices
- 🔐 **User Authentication**: Secure user accounts with Supabase Auth

## Setup Instructions

### 1. Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# OpenWeatherMap API (for real weather data)
NEXT_PUBLIC_OPENWEATHER_API_KEY=your_openweathermap_api_key_here

# Supabase Configuration (already configured)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# OpenAI API (for AI recommendations)
NEXT_PUBLIC_OPENAI_API_KEY=your_openai_api_key
```

### 2. Getting Your OpenWeatherMap API Key

1. **Sign up** at [OpenWeatherMap](https://openweathermap.org/api)
2. **Get your free API key** (1000 calls/day free tier)
3. **Add it to your `.env.local` file** as `NEXT_PUBLIC_OPENWEATHER_API_KEY`
4. **Restart your development server**

**Note**: Without an API key, the app will use demo weather data. The AI Assistant will show a warning and instructions to set up real weather data.

### 3. Installation & Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Open http://localhost:3000
```

## Tech Stack

- **Frontend**: Next.js 15, React, TailwindCSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **AI**: OpenAI GPT-4o mini
- **Weather**: OpenWeatherMap API
- **Icons**: Lucide React

## Features in Detail

### AI Style Assistant
- Analyzes current weather conditions
- Recommends outfits from your wardrobe
- Considers weather appropriateness
- Suggests missing items if needed

### Digital Closet
- Photo upload and URL support
- **AI Auto-Fill**: Paste an image URL and let AI extract clothing details
- Tag-based organization
- Advanced filtering (color, brand, size, price)
- Category-based organization

### Weather Integration
- Real-time weather data
- Location-based recommendations
- Temperature and condition awareness
- Sunrise/sunset times for outfit planning
