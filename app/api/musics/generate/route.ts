import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import Replicate from 'replicate'
import { NextRequest, NextResponse } from 'next/server'

function calcCreditCost(durationSecs: number, batchSize: number): number {
  const durationCredits = durationSecs === 120 ? 2 : durationSecs === 180 ? 3 : 1
  return durationCredits * batchSize
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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

  // ── Credit check & deduction ──────────────────────────────────────────────
  const admin = createAdminClient()

  const { data: userData, error: userError } = await admin
    .from('users')
    .select('credits')
    .eq('id', user.id)
    .single()

  if (userError || !userData) {
    return NextResponse.json({ error: 'Failed to fetch user credits' }, { status: 500 })
  }

  if (userData.credits < creditCost) {
    return NextResponse.json(
      { error: 'Insufficient credits', required: creditCost, available: userData.credits },
      { status: 402 }
    )
  }

  const { error: deductError } = await admin
    .from('users')
    .update({ credits: userData.credits - creditCost })
    .eq('id', user.id)

  if (deductError) {
    return NextResponse.json({ error: 'Failed to deduct credits' }, { status: 500 })
  }

  // ── Create DB records ─────────────────────────────────────────────────────
  const insertResults = await Promise.all(
    Array.from({ length: batchSize }).map(() =>
      supabase
        .from('musics')
        .insert({
          user_id: user.id,
          prompt: caption,
          status: 'generating',
          credits_used: creditCost,
        })
        .select()
        .single()
    )
  )

  const musicIds = insertResults
    .filter(({ data, error }) => data && !error)
    .map(({ data }) => data!.id as string)

  if (musicIds.length === 0) {
    // Refund credits since we couldn't create records
    await admin
      .from('users')
      .update({ credits: userData.credits })
      .eq('id', user.id)
    return NextResponse.json({ error: 'Failed to create music records' }, { status: 500 })
  }

  // ── Start Replicate prediction ─────────────────────────────────────────────
  const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN })

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
    await Promise.all([
      ...musicIds.map((id) =>
        supabase
          .from('musics')
          .update({ status: 'failed', error_message: String(err) })
          .eq('id', id)
      ),
      admin
        .from('users')
        .update({ credits: userData.credits })
        .eq('id', user.id),
    ])
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
