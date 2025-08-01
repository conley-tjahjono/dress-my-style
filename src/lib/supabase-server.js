import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// 🚀 Server-side Supabase client for authentication
export async function createServerSupabaseClient() {
  const cookieStore = await cookies()

  // Check if we're in development and variables are missing
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('⚠️ Supabase environment variables not found for server client. Using demo mode.')
    
    // Return a mock client for demo purposes
    return {
      auth: {
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
        getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      },
      from: () => ({
        select: () => Promise.resolve({ data: [], error: null }),
        insert: () => Promise.resolve({ data: null, error: { message: 'Demo mode - no database connection' } }),
        update: () => Promise.resolve({ data: null, error: { message: 'Demo mode - no database connection' } }),
        delete: () => Promise.resolve({ data: null, error: { message: 'Demo mode - no database connection' } }),
        eq: function() { return this; },
        order: function() { return this; },
        single: function() { return this; }
      })
    }
  }

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name) {
        return cookieStore.get(name)?.value
      },
      set(name, value, options) {
        try {
          cookieStore.set({ name, value, ...options })
        } catch (error) {
          // Handle the error when called from a Server Component
          console.warn('🍪 Unable to set cookie in Server Component:', error)
        }
      },
      remove(name, options) {
        try {
          cookieStore.set({ name, value: '', ...options })
        } catch (error) {
          // Handle the error when called from a Server Component
          console.warn('🍪 Unable to remove cookie in Server Component:', error)
        }
      }
    }
  })
}

// 🔐 Helper function to get server session
export async function getServerSession() {
  const supabase = await createServerSupabaseClient()
  
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('❌ Error getting server session:', error)
      return null
    }
    
    return session
  } catch (error) {
    console.error('💥 Unexpected error getting server session:', error)
    return null
  }
}

// 👤 Helper function to get server user
export async function getServerUser() {
  const supabase = await createServerSupabaseClient()
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      console.error('❌ Error getting server user:', error)
      return null
    }
    
    return user
  } catch (error) {
    console.error('💥 Unexpected error getting server user:', error)
    return null
  }
}

export { createServerSupabaseClient as supabaseServer } 