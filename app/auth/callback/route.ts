import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

const SIGNUP_BONUS_CREDITS = 4
const NEW_USER_WINDOW_MS = 30_000 // 30초 이내 생성된 계정을 신규 유저로 판별

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  const forwardedHost = request.headers.get('x-forwarded-host')
  const forwardedProto = request.headers.get('x-forwarded-proto') ?? 'https'
  const origin = forwardedHost
    ? `${forwardedProto}://${forwardedHost}`
    : requestUrl.origin

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    const { data: { session } } = await supabase.auth.exchangeCodeForSession(code)

    // 신규 가입자에게 무료 크레딧 4개 지급
    if (session?.user) {
      try {
        const admin = createAdminClient()
        const { data: userData } = await admin
          .from('users')
          .select('credits, created_at')
          .eq('id', session.user.id)
          .single()

        if (userData) {
          const isNewUser =
            userData.credits === 0 &&
            Date.now() - new Date(userData.created_at).getTime() < NEW_USER_WINDOW_MS

          if (isNewUser) {
            await admin.rpc('increment_user_credits', {
              p_user_id: session.user.id,
              p_amount: SIGNUP_BONUS_CREDITS,
            })
          }
        }
      } catch (err) {
        console.error('[auth/callback] signup bonus failed:', err)
      }
    }
  }

  // 로그인 완료 후 대시보드로 이동
  return NextResponse.redirect(`${origin}/workspace`)
}
