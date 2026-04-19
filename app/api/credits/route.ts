import { createClient } from '@/lib/supabase/server'
import { getUserCredits } from '@/services/credits'
import { getCachedUser } from '@/services/auth'
import { NextResponse } from 'next/server'

/**
 * GET /api/credits
 * Redis-first 크레딧 조회. deductCredits와 동일한 캐시를 읽으므로
 * async Supabase sync 타이밍 문제 없이 정확한 잔액을 반환한다.
 */
export async function GET() {
  const supabase = await createClient()
  const user = await getCachedUser(supabase)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const credits = await getUserCredits(user.id)
  return NextResponse.json({ credits })
}
