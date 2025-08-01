import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

// 🚪 POST /api/auth/signout - Sign out user server-side
export async function POST() {
  try {
    const supabase = await createServerSupabaseClient()
    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error('❌ Error signing out:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    console.log('👋 User signed out server-side')

    return NextResponse.json({ 
      message: 'Signed out successfully' 
    })
  } catch (error) {
    console.error('💥 Unexpected error in signout route:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 