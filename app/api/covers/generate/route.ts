import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { coverRatelimit } from '@/lib/redis'
import { deductCredits, addToCache } from '@/services/credits'
import { getCachedUser } from '@/services/auth'
import Replicate from 'replicate'
import { NextRequest, NextResponse } from 'next/server'

const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN })

const COVER_CREDIT_COST = 1

const STYLE_SUFFIXES: Record<string, string> = {
  abstract: 'colorful abstract art, vibrant flowing shapes, artistic digital painting, high quality',
  photorealistic: 'photorealistic, cinematic lighting, ultra detailed photography, 4K, professional',
  anime: 'anime illustration, vibrant colors, detailed digital art, studio ghibli inspired',
  dark_fantasy: 'dark fantasy concept art, dramatic atmosphere, mystical, epic lighting, moody',
  minimalist: 'minimalist clean design, flat illustration, simple geometric shapes, limited color palette',
  neon_cyberpunk: 'neon cyberpunk aesthetic, synthwave retro-futuristic, glowing neon lights, night city',
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const user = await getCachedUser(supabase)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { success } = await coverRatelimit.limit(user.id)
    if (!success) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait before generating again.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { musicId, prompt, style, format } = body

    if (!musicId || typeof musicId !== 'string') {
      return NextResponse.json({ error: 'musicId is required' }, { status: 400 })
    }
    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    const selectedStyle = typeof style === 'string' && STYLE_SUFFIXES[style] ? style : 'abstract'
    const aspectRatio = format === 'youtube' ? '16:9' : '1:1'

    const { data: musicRecord, error: musicError } = await supabase
      .from('musics')
      .select('id')
      .eq('id', musicId)
      .eq('user_id', user.id)
      .single()

    if (musicError || !musicRecord) {
      console.error('[covers/generate] Music lookup failed:', musicError)
      return NextResponse.json({ error: 'Music not found' }, { status: 404 })
    }

    const { ok, remaining } = await deductCredits(user.id, COVER_CREDIT_COST)
    if (!ok) {
      return NextResponse.json(
        { error: 'Insufficient credits', required: COVER_CREDIT_COST, available: remaining },
        { status: 402 }
      )
    }

    const fullPrompt = `${prompt.trim()}, ${STYLE_SUFFIXES[selectedStyle]}, album cover art`

    try {
      console.log('[covers/generate] Starting Replicate prediction...')
      // flux-schnell: 1-4초 완료 (Kolors 30-60초 대비)
      const output = await replicate.run(
        'black-forest-labs/flux-schnell' as `${string}/${string}`,
        {
          input: {
            prompt: fullPrompt,
            aspect_ratio: aspectRatio,
            num_outputs: 1,
            output_format: 'webp',
            output_quality: 90,
          },
        }
      ) as unknown[]

      const rawOutput = Array.isArray(output) ? output[0] : output
      let imageUrl: string | null = null

      if (typeof rawOutput === 'string') {
        imageUrl = rawOutput
      } else if (rawOutput && typeof (rawOutput as { url?: () => string }).url === 'function') {
        imageUrl = (rawOutput as { url: () => string }).url()
      }

      if (!imageUrl) {
        throw new Error('No image URL returned from Replicate')
      }

      await supabase
        .from('musics')
        .update({ cover_image_url: imageUrl })
        .eq('id', musicId)
        .eq('user_id', user.id)

      return NextResponse.json({ coverUrl: imageUrl })
    } catch (err) {
      // 크레딧 환불
      try {
        const admin = createAdminClient()
        await Promise.all([
          admin.rpc('increment_user_credits', { p_user_id: user.id, p_amount: COVER_CREDIT_COST }),
          addToCache(user.id, COVER_CREDIT_COST),
        ])
      } catch (refundErr) {
        console.error('[covers/generate] Credit refund failed:', refundErr)
      }
      const message = err instanceof Error ? err.message : String(err)
      console.error('[covers/generate] Generation error:', err)
      return NextResponse.json({ error: message }, { status: 500 })
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[covers/generate] Unexpected error:', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
