import { createClient } from '@/lib/supabase/server'
import Replicate from 'replicate'
import { NextRequest, NextResponse } from 'next/server'

const SIGNED_URL_EXPIRES = 60 * 60 * 24 * 365 // 1 year in seconds

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const predictionId = request.nextUrl.searchParams.get('predictionId')

  if (!predictionId) {
    return NextResponse.json({ error: 'predictionId is required' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN })

  try {
    const prediction = await replicate.predictions.get(predictionId)

    if (prediction.status === 'succeeded') {
      // Extract URL from Replicate output
      const rawOutput = prediction.output?.[0]
      let replicateUrl: string | null = null
      if (typeof rawOutput === 'string') {
        replicateUrl = rawOutput
      } else if (rawOutput && typeof (rawOutput as { url?: () => string }).url === 'function') {
        replicateUrl = (rawOutput as { url: () => string }).url()
      }

      let fileUrl: string | null = replicateUrl
      let filePath: string | null = null

      // Download from Replicate and upload to Supabase Storage
      if (replicateUrl) {
        try {
          const audioRes = await fetch(replicateUrl)
          const audioBuffer = await audioRes.arrayBuffer()
          const filename = `${Date.now()}.mp3`
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
            // Storage upload failed — fall back to Replicate URL
            filePath = null
          }
        } catch {
          // Network/upload error — fall back to Replicate URL
          filePath = null
        }
      }

      await supabase
        .from('musics')
        .update({
          status: 'completed',
          file_url: fileUrl,
          file_path: filePath,
        })
        .eq('id', id)
        .eq('user_id', user.id)

      return NextResponse.json({ status: 'completed', fileUrl })
    }

    if (prediction.status === 'failed' || prediction.status === 'canceled') {
      const errorMsg = prediction.error ? String(prediction.error) : 'Generation failed'
      await supabase
        .from('musics')
        .update({ status: 'failed', error_message: errorMsg })
        .eq('id', id)
        .eq('user_id', user.id)

      return NextResponse.json({ status: 'failed', error: errorMsg })
    }

    // Still processing (starting, processing)
    return NextResponse.json({ status: prediction.status })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
