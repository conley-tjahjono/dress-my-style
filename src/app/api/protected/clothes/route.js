import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

// 👕 GET /api/protected/clothes - Get user's clothing items (protected)
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
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
    const supabase = await createServerSupabaseClient()
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

// 📝 PUT /api/protected/clothes - Update clothing item (protected)
export async function PUT(request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      console.log('🚫 Unauthorized access to update clothes')
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { id, name, brand, category, size, color, tags, image_url, price_min, price_max } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Clothing item ID is required' },
        { status: 400 }
      )
    }

    // Update clothing item in user's closet
    const { data: updatedClothing, error: updateError } = await supabase
      .from('clothes')
      .update({
        name,
        brand,
        category,
        size,
        color,
        tags,
        image_url,
        price_min,
        price_max,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', user.id) // Ensure user can only update their own items
      .select()
      .single()

    if (updateError) {
      console.error('❌ Error updating clothing item:', updateError)
      return NextResponse.json(
        { error: 'Failed to update clothing item' },
        { status: 500 }
      )
    }

    console.log('✅ Clothing item updated server-side for:', user.email)

    return NextResponse.json({
      message: 'Clothing item updated successfully',
      clothing: updatedClothing
    })
  } catch (error) {
    console.error('💥 Unexpected error in update clothes route:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// 🗑️ DELETE /api/protected/clothes - Delete clothing item (protected)
export async function DELETE(request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      console.log('🚫 Unauthorized access to delete clothes')
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      )
    }

    const url = new URL(request.url)
    const id = url.searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Clothing item ID is required' },
        { status: 400 }
      )
    }

    // Delete clothing item from user's closet
    const { error: deleteError } = await supabase
      .from('clothes')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id) // Ensure user can only delete their own items

    if (deleteError) {
      console.error('❌ Error deleting clothing item:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete clothing item' },
        { status: 500 }
      )
    }

    console.log('✅ Clothing item deleted server-side for:', user.email)

    return NextResponse.json({
      message: 'Clothing item deleted successfully'
    })
  } catch (error) {
    console.error('💥 Unexpected error in delete clothes route:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 