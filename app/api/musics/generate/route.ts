import { createClient } from '@/lib/supabase/server'
import Replicate from 'replicate'
import { NextRequest, NextResponse } from 'next/server'

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

  const supabaseClient = supabase

  // Create batchSize DB records concurrently
  const insertResults = await Promise.all(
    Array.from({ length: batchSize }).map(() =>
      supabaseClient
        .from('musics')
        .insert({ user_id: user.id, prompt: caption, status: 'generating' })
        .select()
        .single()
    )
  )

  const musicIds = insertResults
    .filter(({ data, error }) => data && !error)
    .map(({ data }) => data!.id as string)

  if (musicIds.length === 0) {
    return NextResponse.json({ error: 'Failed to create music records' }, { status: 500 })
  }

  // ONE Replicate prediction with batch_size — avoids rate-limiting from N separate calls
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

    // Return ordered items — items[i].musicId corresponds to output[i] from Replicate
    return NextResponse.json({
      predictionId: prediction.id,
      items: musicIds.map((musicId) => ({ musicId })),
    })
  } catch (err) {
    // Mark all created records as failed
    await Promise.all(
      musicIds.map((id) =>
        supabaseClient
          .from('musics')
          .update({ status: 'failed', error_message: String(err) })
          .eq('id', id)
      )
    )
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
