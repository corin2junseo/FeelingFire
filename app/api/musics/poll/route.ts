import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import Replicate from 'replicate'
import { NextRequest, NextResponse } from 'next/server'

const SIGNED_URL_EXPIRES = 60 * 60 * 24 * 365 // 1 year

/**
 * GET /api/musics/poll?predictionId=xxx&musicIds=id1,id2,id3
 *
 * Polls a single Replicate prediction and maps output[i] → musicIds[i].
 * Handles batch_size 1-4 from a single prediction.
 */
export async function GET(request: NextRequest) {
  const predictionId = request.nextUrl.searchParams.get('predictionId')
  const musicIdsParam = request.nextUrl.searchParams.get('musicIds')

  if (!predictionId || !musicIdsParam) {
    return NextResponse.json(
      { error: 'predictionId and musicIds are required' },
      { status: 400 }
    )
  }

  const musicIds = musicIdsParam.split(',').filter(Boolean)

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN })

  try {
    const prediction = await replicate.predictions.get(predictionId)

    if (prediction.status === 'succeeded') {
      const outputs: unknown[] = Array.isArray(prediction.output)
        ? prediction.output
        : [prediction.output]

      // Process each output in parallel — output[i] belongs to musicIds[i]
      const items = await Promise.all(
        musicIds.map(async (musicId, i) => {
          const rawOutput = outputs[i] ?? outputs[0]
          let replicateUrl: string | null = null

          if (typeof rawOutput === 'string') {
            replicateUrl = rawOutput
          } else if (rawOutput && typeof (rawOutput as { url?: () => string }).url === 'function') {
            replicateUrl = (rawOutput as { url: () => string }).url()
          }

          let fileUrl: string | null = replicateUrl
          let filePath: string | null = null

          if (replicateUrl) {
            try {
              const audioRes = await fetch(replicateUrl)
              const audioBuffer = await audioRes.arrayBuffer()
              const filename = `${Date.now()}-${i}.mp3`
              filePath = `${user.id}/${filename}`

              const { error: uploadError } = await supabase.storage
                .from('musics')
                .upload(filePath, audioBuffer, {
                  contentType: 'audio/mpeg',
                  upsert: false,
                })

              if (!uploadError) {
                const { data: signedData } = await supabase.storage
                  .from('musics')
                  .createSignedUrl(filePath, SIGNED_URL_EXPIRES)
                fileUrl = signedData?.signedUrl ?? replicateUrl
              } else {
                filePath = null
              }
            } catch {
              filePath = null
            }
          }

          await supabase
            .from('musics')
            .update({ status: 'completed', file_url: fileUrl, file_path: filePath })
            .eq('id', musicId)
            .eq('user_id', user.id)

          return { musicId, fileUrl }
        })
      )

      return NextResponse.json({ status: 'completed', items })
    }

    if (prediction.status === 'failed' || prediction.status === 'canceled') {
      const errorMsg = prediction.error ? String(prediction.error) : 'Generation failed'

      // Fetch credits_used from first music record (total for the batch)
      const { data: musicRecord } = await supabase
        .from('musics')
        .select('credits_used')
        .eq('id', musicIds[0])
        .eq('user_id', user.id)
        .single()

      await Promise.all(
        musicIds.map((id) =>
          supabase
            .from('musics')
            .update({ status: 'failed', error_message: errorMsg })
            .eq('id', id)
            .eq('user_id', user.id)
        )
      )

      // Refund credits
      if (musicRecord?.credits_used && musicRecord.credits_used > 0) {
        const admin = createAdminClient()
        const { data: userData } = await admin
          .from('users')
          .select('credits')
          .eq('id', user.id)
          .single()
        if (userData) {
          await admin
            .from('users')
            .update({ credits: userData.credits + musicRecord.credits_used })
            .eq('id', user.id)
        }
      }

      return NextResponse.json({ status: 'failed', error: errorMsg })
    }

    // Still processing (starting / processing)
    return NextResponse.json({ status: prediction.status })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
