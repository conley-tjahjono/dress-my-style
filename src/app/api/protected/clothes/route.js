import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

// 👕 GET /api/protected/clothes - Get user's clothing items (protected)
export async function GET() {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      console.log('🚫 Unauthorized access to clothes')
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      )
    }

    // Get user's clothing items
    const { data: clothes, error: clothesError } = await supabase
      .from('clothes')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (clothesError) {
      console.error('❌ Error fetching clothes:', clothesError)
      return NextResponse.json(
        { error: 'Failed to fetch clothing items' },
        { status: 500 }
      )
    }

    console.log('✅ Clothes fetched server-side for:', user.email, '- Count:', clothes?.length || 0)

    return NextResponse.json({
      clothes: clothes || [],
      count: clothes?.length || 0
    })
  } catch (error) {
    console.error('💥 Unexpected error in clothes route:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// 📝 POST /api/protected/clothes - Add new clothing item (protected)
export async function POST(request) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      console.log('🚫 Unauthorized access to add clothes')
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { name, brand, category, size, color, tags, image_url, price_min, price_max } = body

    // Add clothing item to user's closet
    const { data: newClothing, error: insertError } = await supabase
      .from('clothes')
      .insert([{
        user_id: user.id,
        name,
        brand,
        category,
        size,
        color,
        tags,
        image_url,
        price_min,
        price_max
      }])
      .select()
      .single()

    if (insertError) {
      console.error('❌ Error adding clothing item:', insertError)
      return NextResponse.json(
        { error: 'Failed to add clothing item' },
        { status: 500 }
      )
    }

    console.log('✅ Clothing item added server-side for:', user.email)

    return NextResponse.json({
      message: 'Clothing item added successfully',
      clothing: newClothing
    }, { status: 201 })
  } catch (error) {
    console.error('💥 Unexpected error in add clothes route:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 