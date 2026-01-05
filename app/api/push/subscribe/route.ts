import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { subscription } = body

    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription data required' },
        { status: 400 }
      )
    }

    // Store subscription in database
    // You'll need to create a push_subscriptions table
    const { error } = await supabase.from('push_subscriptions').upsert({
      user_id: user.id,
      subscription: subscription,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    if (error) {
      console.error('Error saving subscription:', error)
      return NextResponse.json(
        { error: 'Failed to save subscription' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in push subscribe:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

