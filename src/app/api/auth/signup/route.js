import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

// 🔐 POST /api/auth/signup - Sign up user server-side
export async function POST(request) {
  try {
    const { email, password, fullName } = await request.json()
    
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      )
    }

    console.log('🔐 Server signup attempt for:', email)
    
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName || 'User'
        }
      }
    })

    if (error) {
      console.error('❌ Server signup error:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    if (!data.user) {
      console.error('❌ No user returned from signup')
      return NextResponse.json(
        { error: 'Failed to create user account' },
        { status: 400 }
      )
    }

    console.log('✅ Server signup successful:', {
      userId: data.user.id,
      email: data.user.email,
      needsConfirmation: !data.session
    })

    // If user is immediately confirmed (no email confirmation required)
    if (data.session) {
      // Create user profile
      try {
        console.log('🆕 Creating user profile for:', data.user.email)
        const { error: insertError } = await supabase
          .from('users')
          .insert([{
            id: data.user.id,
            email: data.user.email,
            full_name: fullName || data.user.user_metadata?.full_name || 'User'
          }])

        if (insertError) {
          console.error('❌ Failed to create user profile:', insertError)
        } else {
          console.log('✅ User profile created successfully')
        }
      } catch (profileError) {
        console.error('⚠️ Profile creation error:', profileError)
        // Don't fail signup if profile creation fails
      }

      return NextResponse.json({
        success: true,
        user: {
          id: data.user.id,
          email: data.user.email,
          full_name: fullName || data.user.user_metadata?.full_name || 'User'
        },
        session: data.session,
        message: 'Account created and logged in successfully!'
      })
    } else {
      // Email confirmation required
      return NextResponse.json({
        success: true,
        user: {
          id: data.user.id,
          email: data.user.email,
          full_name: fullName || 'User'
        },
        session: null,
        message: 'Account created! Please check your email to confirm your account.'
      })
    }

  } catch (error) {
    console.error('💥 Unexpected error in signup route:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 