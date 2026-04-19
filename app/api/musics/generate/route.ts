import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateRatelimit } from '@/lib/redis'
import { deductCredits, addToCache } from '@/services/credits'
import { getCachedUser } from '@/services/auth'
import { calcCreditCost } from '@/services/pricing'
import Replicate from 'replicate'
import { NextRequest, NextResponse } from 'next/server'

const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN })

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const user = await getCachedUser(supabase)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Rate limit: 유저당 분당 10회 제한 (credits 조회 전에 차단)
  const { success, limit, remaining: rlRemaining, reset } = await generateRatelimit.limit(user.id)
  if (!success) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait before generating again.' },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': String(limit),
          'X-RateLimit-Remaining': String(rlRemaining),
          'X-RateLimit-Reset': String(reset),
        },
      }
    )
  }

  const body = await request.json()
  const { prompt, lyrics, duration, batch_size } = body

  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
  }

  const caption = prompt.trim()
  const lyricsText = typeof lyrics === 'string' ? lyrics.trim() : ''
  const durationSecs =
    typeof duration === 'number' && duration >= 1 && duration <= 600
      ? Math.round(duration)
      : 90
  const batchSize =
    typeof batch_size === 'number' && batch_size >= 1 && batch_size <= 4
      ? Math.floor(batch_size)
      : 1

  const creditCost = calcCreditCost(durationSecs, batchSize)

  // ── Credit check & deduction (Redis atomic Lua script + async Supabase sync) ──
  const { ok, remaining } = await deductCredits(user.id, creditCost)
  if (!ok) {
    return NextResponse.json(
      { error: 'Insufficient credits', required: creditCost, available: remaining },
      { status: 402 }
    )
  }

  // ── Batch insert DB records (단일 쿼리) ───────────────────────────────────────
  const { data: insertedRecords, error: insertError } = await supabase
    .from('musics')
    .insert(
      Array.from({ length: batchSize }, () => ({
        user_id: user.id,
        prompt: caption,
        lyrics: lyricsText || null,
        status: 'generating',
        credits_used: creditCost,
      }))
    )
    .select()

  if (insertError || !insertedRecords || insertedRecords.length === 0) {
    const admin = createAdminClient()
    await Promise.all([
      admin.rpc('increment_user_credits', { p_user_id: user.id, p_amount: creditCost }),
      addToCache(user.id, creditCost),
    ])
    return NextResponse.json({ error: 'Failed to create music records' }, { status: 500 })
  }

  const musicIds = insertedRecords.map((r) => r.id as string)

  // ── Start Replicate prediction ─────────────────────────────────────────────

  const replicateInput: Record<string, unknown> = {
    caption,
    duration: durationSecs,
    batch_size: batchSize,
  }
  if (lyricsText) replicateInput.lyrics = lyricsText

  try {
    const prediction = await replicate.predictions.create({
      version: 'fd851baef553cb1656f4a05e8f2f8641672f10bc808718f5718b4b4bb2b07794',
      input: replicateInput,
    })

    return NextResponse.json({
      predictionId: prediction.id,
      items: musicIds.map((musicId) => ({ musicId })),
    })
  } catch (err) {
    // Mark all created records as failed and refund credits
    const admin = createAdminClient()
    await Promise.all([
      ...musicIds.map((id) =>
        supabase
          .from('musics')
          .update({ status: 'failed', error_message: String(err) })
          .eq('id', id)
      ),
      admin.rpc('increment_user_credits', { p_user_id: user.id, p_amount: creditCost }),
      addToCache(user.id, creditCost),
    ])
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
