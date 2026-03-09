import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { addToCache } from '@/lib/credits'
import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/musics/refund
 * Called when client-side polling times out (MAX_POLL_ATTEMPTS exceeded).
 * Marks all batch records as failed and refunds credits atomically.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { musicIds } = (await req.json()) as { musicIds: string[] }
  if (!Array.isArray(musicIds) || musicIds.length === 0) {
    return NextResponse.json({ error: 'musicIds required' }, { status: 400 })
  }

  // Fetch credits_used from the first record (shared cost across the batch)
  const { data: musicRecord, error: recordError } = await supabase
    .from('musics')
    .select('credits_used')
    .eq('id', musicIds[0])
    .eq('user_id', user.id)
    .single()

  if (recordError) {
    console.error('[refund] Failed to fetch credits_used:', recordError)
  }

  // Mark all records as failed
  await Promise.all(
    musicIds.map((id) =>
      supabase
        .from('musics')
        .update({ status: 'failed', error_message: 'Generation timed out' })
        .eq('id', id)
        .eq('user_id', user.id)
    )
  )

  // Refund credits via RPC (atomic — no read-then-write race condition)
  if (musicRecord?.credits_used && musicRecord.credits_used > 0) {
    const admin = createAdminClient()
    const { error: refundError } = await admin.rpc('increment_user_credits', {
      p_user_id: user.id,
      p_amount: musicRecord.credits_used,
    })
    if (refundError) {
      console.error('[refund] Credit refund failed:', refundError)
    } else {
      await addToCache(user.id, musicRecord.credits_used)
    }
  }

  return NextResponse.json({ ok: true })
}
