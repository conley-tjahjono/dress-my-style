import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function middleware(request) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Skip middleware if in demo mode
  if (!supabaseUrl || !supabaseAnonKey) {
    console.log('⚠️ Demo mode: Skipping auth middleware')
    return response
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name) {
        return request.cookies.get(name)?.value
      },
      set(name, value, options) {
        request.cookies.set({
          name,
          value,
          ...options,
        })
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        })
        response.cookies.set({
          name,
          value,
          ...options,
        })
      },
      remove(name, options) {
        request.cookies.set({
          name,
          value: '',
          ...options,
        })
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        })
        response.cookies.set({
          name,
          value: '',
          ...options,
        })
      },
    },
  })

  try {
    // Refresh session if expired - required for Server Components
    const { data: { session }, error } = await supabase.auth.getSession()
    
    console.log('🔐 Middleware - Session check:', {
      path: request.nextUrl.pathname,
      hasSession: !!session,
      user: session?.user?.email || 'none'
    })

    // Check if accessing protected routes
    const isProtectedRoute = request.nextUrl.pathname.startsWith('/api/protected')
    const isAuthRoute = request.nextUrl.pathname.startsWith('/api/auth')

    // Protect API routes that require authentication
    if (isProtectedRoute && !session) {
      console.log('🚫 Unauthorized access to protected route:', request.nextUrl.pathname)
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      )
    }

    // For auth routes, allow both authenticated and unauthenticated access
    if (isAuthRoute) {
      console.log('🔓 Auth route access:', request.nextUrl.pathname)
      return response
    }

    // Add user info to request headers for server components
    if (session?.user) {
      response.headers.set('x-user-id', session.user.id)
      response.headers.set('x-user-email', session.user.email || '')
    }

  } catch (error) {
    console.error('💥 Middleware error:', error)
    // Continue with request even if auth check fails
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
} 