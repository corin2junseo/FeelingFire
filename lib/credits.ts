import { redis } from './redis'
import { createAdminClient } from './supabase/admin'

const key = (userId: string) => `credits:${userId}`

/**
 * TTL 전략:
 *   credits:{userId}         → 300s (5분)
 *     결제·환불 등 외부 변경이 있을 수 있으므로 주기적으로 Supabase 재검증.
 *     만료되면 다음 요청 시 Supabase에서 fresh 값을 로드해 캐시 갱신.
 *   replicate:pred:{id}      → 3s   (poll route에서 설정)
 *   ratelimit:*              → sliding window가 자동 관리
 *   benchmark:result:*       → 60s  (benchmark route에서 설정)
 */
const CREDITS_TTL = 300 // 5분

async function loadFromSupabase(userId: string): Promise<number> {
  const admin = createAdminClient()
  const { data } = await admin.from('users').select('credits').eq('id', userId).single()
  const credits = data?.credits ?? 0
  await redis.set(key(userId), credits, { ex: CREDITS_TTL })
  return credits
}

/** Redis-first credit read with Supabase fallback */
export async function getUserCredits(userId: string): Promise<number> {
  const cached = await redis.get<number>(key(userId))
  if (cached !== null) return cached
  return loadFromSupabase(userId)
}

/**
 * Atomically deduct credits from Redis, async-sync to Supabase.
 * Returns { ok: true, remaining } on success,
 * or { ok: false, remaining: currentBalance } if insufficient.
 */
export async function deductCredits(
  userId: string,
  amount: number
): Promise<{ ok: boolean; remaining: number }> {
  const k = key(userId)

  // Warm cache if cold
  if ((await redis.get<number>(k)) === null) {
    await loadFromSupabase(userId)
  }

  const remaining = await redis.decrby(k, amount)
  if (remaining < 0) {
    await redis.incrby(k, amount) // atomic rollback
    return { ok: false, remaining: remaining + amount }
  }

  // TTL 갱신: DECRBY는 TTL을 리셋하지 않으므로 활성 사용자는 TTL을 연장
  await redis.expire(k, CREDITS_TTL)

  // Async Supabase sync — fire and forget (latency improvement goal)
  const admin = createAdminClient()
  admin
    .from('users')
    .update({ credits: remaining })
    .eq('id', userId)
    .then(({ error }) => {
      if (error) console.error('[credits] Supabase sync failed:', error)
    })

  return { ok: true, remaining }
}

/**
 * Add credits to Redis cache after Supabase has already been updated (e.g. via RPC).
 * No-op if key isn't cached — next read will reload fresh from Supabase.
 */
export async function addToCache(userId: string, amount: number): Promise<void> {
  const k = key(userId)
  const existing = await redis.get<number>(k)
  if (existing !== null) {
    await redis.incrby(k, amount)
  }
}
