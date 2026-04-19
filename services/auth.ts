import { redis } from '@/lib/redis'
import type { SupabaseClient, User } from '@supabase/supabase-js'

const AUTH_CACHE_TTL = 60 // 60초

/**
 * JWT signature 세그먼트(마지막 32자)를 캐시 키로 사용.
 * JWT = header.payload.signature — signature는 HMAC-SHA256으로 세션마다 고유.
 * 토큰 갱신·로그아웃 시 signature가 바뀌어 자동 캐시 무효화.
 */
function tokenToKey(token: string): string {
  const sig = token.split('.')[2] ?? token
  return `auth:user:${sig.slice(-32)}`
}

/**
 * Redis-cached replacement for supabase.auth.getUser()
 *
 * 플로우:
 *   1. getSession() — 로컬 쿠키 읽기, 네트워크 없음 (~0ms)
 *      └ 세션 없음 → null 반환 (→ 401 fast-path)
 *   2. Redis GET   — HIT: 캐시된 User 반환 (~1ms)
 *   3. MISS        → getUser() Supabase 왕복 (~300ms)
 *                    → Redis SET (60s TTL) → User 반환
 *
 * 보안 노트:
 *   - 로그아웃 후 최대 60초간 캐시 유효 (실용적 허용 범위)
 *   - middleware가 매 요청마다 토큰을 갱신하므로 캐시 키도 자동 교체됨
 */
export async function getCachedUser(supabase: SupabaseClient): Promise<User | null> {
  try {
    // getSession(): 로컬 쿠키만 읽음, 네트워크 호출 없음
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) return null

    const key = tokenToKey(session.access_token)

    try {
      const cached = await redis.get<User>(key)
      if (cached) return cached
    } catch {
      // Redis 장애 시 Supabase 직접 검증으로 폴백
    }

    // Cache MISS — Supabase 서버 검증
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      try {
        await redis.set(key, user, { ex: AUTH_CACHE_TTL })
      } catch {
        // Redis 캐시 저장 실패는 무시
      }
    }
    return user ?? null
  } catch {
    return null
  }
}
