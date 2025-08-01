import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

// 🔐 POST /api/auth/signin - Sign in user server-side
export async function POST(request) {
  try {
    const { email, password } = await request.json()
    
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    console.log('🔐 Server signin attempt for:', email)
    
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      console.error('❌ Server signin error:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    if (!data.user || !data.session) {
      console.error('❌ No user or session returned from signin')
      return NextResponse.json(
        { error: 'Invalid login credentials' },
        { status: 400 }
      )
    }

    console.log('✅ Server signin successful:', {
      userId: data.user.id,
      email: data.user.email
    })

    // Check if user profile exists, create if not
    try {
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single()

      if (profileError && profileError.code === 'PGRST116') {
        console.log('🆕 Creating user profile for:', data.user.email)
        const { error: insertError } = await supabase
          .from('users')
          .insert([{
            id: data.user.id,
            email: data.user.email,
            full_name: data.user.user_metadata?.full_name || 'User'
          }])

        if (insertError) {
          console.error('❌ Failed to create user profile:', insertError)
        } else {
          console.log('✅ User profile created successfully')
        }
      }
    } catch (profileError) {
      console.error('⚠️ Profile check/creation error:', profileError)
      // Don't fail login if profile creation fails
    }

    return NextResponse.json({
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
        full_name: data.user.user_metadata?.full_name || 'User'
      },
      session: data.session
    })

  } catch (error) {
    console.error('💥 Unexpected error in signin route:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 