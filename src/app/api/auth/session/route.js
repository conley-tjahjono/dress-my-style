import { createServerSupabaseClient } from '../../../lib/supabase-server'
import { NextResponse } from 'next/server'

// 🔐 GET /api/auth/session - Get current session
export async function GET() {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { session }, error } = await supabase.auth.getSession()

    if (error) {
      console.error('❌ Error getting session:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    console.log('✅ Session retrieved server-side:', {
      hasSession: !!session,
      user: session?.user?.email || 'none'
    })

    return NextResponse.json({ 
      session,
      user: session?.user || null 
    })
  } catch (error) {
    console.error('💥 Unexpected error in session route:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 