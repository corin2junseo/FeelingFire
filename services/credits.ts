import { redis } from '@/lib/redis'
import { createAdminClient } from '@/lib/supabase/admin'

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

function syncToSupabase(userId: string, credits: number): void {
  const admin = createAdminClient()
  admin
    .from('users')
    .update({ credits })
    .eq('id', userId)
    .then(({ error }) => {
      if (error) console.error('[credits] Supabase sync failed:', error)
    })
}

/** Redis-first credit read with Supabase fallback */
export async function getUserCredits(userId: string): Promise<number> {
  const cached = await redis.get<number>(key(userId))
  if (cached !== null) return cached
  return loadFromSupabase(userId)
}

/**
 * Lua script: GET + DECRBY를 원자적으로 실행해 TOCTOU 경합 조건 방지.
 *
 * Returns [code, value]:
 *   [0, 0]       → 키 없음 (Supabase 재로드 후 재시도 필요)
 *   [1, balance] → 잔액 부족 (balance = 현재 잔액)
 *   [2, balance] → 성공 (balance = 차감 후 잔액)
 */
const DEDUCT_SCRIPT = `
local k = KEYS[1]
local amount = tonumber(ARGV[1])
local ttl = tonumber(ARGV[2])
local current = redis.call('GET', k)
if current == false then
  return {0, 0}
end
local bal = tonumber(current)
if bal < amount then
  return {1, bal}
end
local new_bal = redis.call('DECRBY', k, amount)
redis.call('EXPIRE', k, ttl)
return {2, new_bal}
`

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

  const [code, balance] = (await redis.eval(
    DEDUCT_SCRIPT,
    [k],
    [String(amount), String(CREDITS_TTL)]
  )) as [number, number]

  // 키가 warmup과 eval 사이에 만료된 경우 — 재로드 후 1회 재시도 SET NX 패턴
  if (code === 0) {
    await loadFromSupabase(userId)
    const [code2, balance2] = (await redis.eval(
      DEDUCT_SCRIPT,
      [k],
      [String(amount), String(CREDITS_TTL)]
    )) as [number, number]
    if (code2 !== 2) {
      return { ok: false, remaining: balance2 }
    }
    syncToSupabase(userId, balance2)
    return { ok: true, remaining: balance2 }
  }

  if (code === 1) {
    return { ok: false, remaining: balance }
  }

  // 성공: Supabase 비동기 싱크
  syncToSupabase(userId, balance)
  return { ok: true, remaining: balance }
}

/**
 * Add credits to Redis cache after Supabase has already been updated (e.g. via RPC).
 * Atomically checks if the key exists before incrementing to avoid creating a stale key.
 * No-op if key isn't cached — next read will reload fresh from Supabase.
 */
const ADD_TO_CACHE_SCRIPT = `
local k = KEYS[1]
local amount = tonumber(ARGV[1])
if redis.call('EXISTS', k) == 1 then
  return redis.call('INCRBY', k, amount)
end
return 0
`

export async function addToCache(userId: string, amount: number): Promise<void> {
  await redis.eval(ADD_TO_CACHE_SCRIPT, [key(userId)], [String(amount)])
}
