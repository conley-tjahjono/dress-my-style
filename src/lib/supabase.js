import { createClient } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Debug environment variables
console.log('🔍 Environment check:', {
  hasUrl: !!supabaseUrl,
  hasKey: !!supabaseAnonKey,
  urlPrefix: supabaseUrl?.substring(0, 20) + '...',
  keyPrefix: supabaseAnonKey?.substring(0, 20) + '...'
});

let supabase;

// Check if we're in development and variables are missing
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase environment variables not found. Using demo mode.');
  console.warn('Expected variables: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY');
  
  // Create a mock client for demo purposes
  supabase = {
    from: () => ({
      select: () => Promise.resolve({ data: [], error: null }),
      insert: () => Promise.resolve({ data: null, error: { message: 'Demo mode - no database connection' } }),
      update: () => Promise.resolve({ data: null, error: { message: 'Demo mode - no database connection' } }),
      delete: () => Promise.resolve({ data: null, error: { message: 'Demo mode - no database connection' } }),
      eq: function() { return this; },
      order: function() { return this; },
      single: function() { return this; }
    }),
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      signUp: () => Promise.resolve({ data: null, error: { message: 'Demo mode - no auth' } }),
      signInWithPassword: () => Promise.resolve({ data: null, error: { message: 'Demo mode - no auth' } }),
      signOut: () => Promise.resolve({ error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } })
    }
  };
} else {
  // Create real Supabase client
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true
      }
    });
    console.log('🚀 Supabase client initialized successfully!');
  } catch (error) {
    console.error('❌ Failed to create Supabase client:', error);
    throw error;
  }
}

export { supabase }; 