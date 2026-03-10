/**
 * GET /api/dev/benchmark?redis=50&supabase=10&concurrency=5&nocache=1
 *
 * Dev-only endpoint (returns 404 in production).
 * Measures Redis vs Supabase latency with concurrency control.
 *
 * redis=N       : Redis 순차 측정 횟수 (기본 50, 최대 200)
 * supabase=N    : Supabase 총 요청 수 (기본 10, 최대 30)
 * concurrency=K : 동시 발사 수 (기본 5). supabase=10&concurrency=5 → 2 batch × ~80ms
 *                 1 = 순차(최악), N = 전체 병렬(최선), 5 = 현실적 중간값
 * nocache=1     : 결과 캐시 bypass
 *
 * 캐시 TTL 전략 (lib/credits.ts 반영):
 *   credits:{userId}     → 300s  결제 등 외부 변경 고려, 5분마다 Supabase 재검증
 *   replicate:pred:{id}  →   3s  빠르게 변하는 상태
 *   ratelimit:*          →  자동  @upstash/ratelimit sliding window 관리
 *   benchmark:result:*   →  60s  결과 자체 캐시
 */
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redis } from '@/lib/redis'
import { NextRequest, NextResponse } from 'next/server'

const RESULT_CACHE_TTL = 60 // 결과 캐시 TTL (초)

// ── Helpers ───────────────────────────────────────────────────────────────────

interface Stat {
  avg: number; min: number; p50: number; p95: number; p99: number; max: number; samples: number
}

function calcStats(times: number[]): Stat {
  const s = [...times].sort((a, b) => a - b)
  const sum = s.reduce((a, b) => a + b, 0)
  const n = s.length
  const pct = (p: number) => +s[Math.min(Math.floor(n * p), n - 1)].toFixed(3)
  return {
    avg: +(sum / n).toFixed(3),
    min: +s[0].toFixed(3),
    p50: pct(0.5),
    p95: pct(0.95),
    p99: pct(0.99),
    max: +s[n - 1].toFixed(3),
    samples: n,
  }
}

/** 순차 실행 — Redis처럼 빠른 작업에 적합. 개별 call latency 정확히 측정. */
async function benchSeq(fn: () => PromiseLike<unknown>, n: number): Promise<number[]> {
  const times: number[] = []
  for (let i = 0; i < n; i++) {
    const t = performance.now()
    await fn()
    times.push(performance.now() - t)
  }
  return times
}

/**
 * 세마포어 기반 제한적 병렬 실행 (concurrency = K개 동시 발사).
 * - concurrency=1  → 순차 (최악, 단일 사용자)
 * - concurrency=N  → 전체 병렬 (최선, 무한 연결)
 * - concurrency=5  → 현실적 중간값 (Supabase free 커넥션 풀 ~15 고려)
 *
 * 각 batch의 총 소요시간과 개별 latency를 함께 반환.
 */
async function benchConcurrent(
  fn: () => PromiseLike<unknown>,
  n: number,
  concurrency: number
): Promise<{ times: number[]; totalMs: number; batches: number }> {
  const allTimes: number[] = []
  const wallStart = performance.now()
  const batches = Math.ceil(n / concurrency)

  for (let i = 0; i < n; i += concurrency) {
    const batchSize = Math.min(concurrency, n - i)
    const batchTimes = await Promise.all(
      Array.from({ length: batchSize }, async () => {
        const t = performance.now()
        await fn()
        return performance.now() - t
      })
    )
    allTimes.push(...batchTimes)
  }

  return {
    times: allTimes,
    totalMs: +(performance.now() - wallStart).toFixed(2),
    batches,
  }
}

// ── Route ─────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 404 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const redisN       = Math.min(parseInt(req.nextUrl.searchParams.get('redis')       ?? '50', 10), 200)
  const supabaseN    = Math.min(parseInt(req.nextUrl.searchParams.get('supabase')    ?? '10', 10), 30)
  const concurrency  = Math.min(parseInt(req.nextUrl.searchParams.get('concurrency') ?? '5',  10), supabaseN)
  const nocache      = req.nextUrl.searchParams.get('nocache') === '1'

  // ── 결과 캐시 HIT 확인 ────────────────────────────────────────────────────
  const resultCacheKey = `benchmark:result:${user.id}:r${redisN}:s${supabaseN}:c${concurrency}`
  if (!nocache) {
    const cached = await redis.get<object>(resultCacheKey)
    if (cached) {
      return NextResponse.json({ ...cached, cached: true, cache_ttl_sec: RESULT_CACHE_TTL })
    }
  }

  const admin = createAdminClient()
  const creditKey = `benchmark:credits:${user.id}`
  const predKey   = `benchmark:pred:test-${user.id}`

  await redis.set(creditKey, 100, { ex: 120 })
  await redis.set(predKey, 'processing', { ex: 120 })

  // ── A. Redis GET — 순차 (개별 latency 정밀 측정) ─────────────────────────
  const redisGetTimes = await benchSeq(() => redis.get(creditKey), redisN)

  // ── B. Redis DECRBY+INCRBY — 순차 (net-zero deduct 시뮬레이션) ───────────
  const redisDecrTimes = await benchSeq(async () => {
    await redis.decrby(creditKey, 1)
    await redis.incrby(creditKey, 1)
  }, redisN)

  // ── C. Redis cache HIT — 순차 ─────────────────────────────────────────────
  const redisCacheHitTimes = await benchSeq(() => redis.get(predKey), redisN)

  // ── D. Supabase SELECT credits — 제한적 병렬 (concurrency=K) ────────────
  // K개씩 배치 발사 → Supabase 커넥션 풀 과부하 방지
  const { times: supSelectTimes, totalMs: supSelectTotal, batches: supBatches } =
    await benchConcurrent(
      () => admin.from('users').select('credits').eq('id', user.id).single(),
      supabaseN,
      concurrency
    )

  // ── E. Supabase baseline (poll without cache) — 제한적 병렬 ─────────────
  const { times: supBaseTimes, totalMs: supBaseTotal } =
    await benchConcurrent(
      () => admin.from('users').select('id').eq('id', user.id).single(),
      supabaseN,
      concurrency
    )

  await Promise.all([redis.del(creditKey), redis.del(predKey)])

  const r = {
    A_redis_get_credits       : calcStats(redisGetTimes),
    B_redis_decrby_incrby     : calcStats(redisDecrTimes),
    C_redis_cache_hit_poll    : calcStats(redisCacheHitTimes),
    D_supabase_select_credits : { ...calcStats(supSelectTimes), parallel_total_ms: supSelectTotal },
    E_supabase_baseline_poll  : { ...calcStats(supBaseTimes),   parallel_total_ms: supBaseTotal  },
  }

  const creditsSpeedup = +(r.D_supabase_select_credits.avg / r.A_redis_get_credits.avg).toFixed(1)
  const pollSpeedup    = +(r.E_supabase_baseline_poll.avg  / r.C_redis_cache_hit_poll.avg).toFixed(1)

  const seqEstMs = +(r.D_supabase_select_credits.avg * supabaseN).toFixed(1)

  const result = {
    redis_iterations    : redisN,
    supabase_total      : supabaseN,
    concurrency         : concurrency,
    batches             : supBatches,
    cached              : false,
    results             : r,
    concurrency_analysis: {
      // 병렬화 효과: 동일한 N개 요청을 순차 vs 제한적 병렬로 처리했을 때 비교
      sequential_estimate_ms : seqEstMs,          // concurrency=1 예상치
      actual_wall_ms         : supSelectTotal,     // concurrency=K 실측치
      parallelism_gain_ms    : +(seqEstMs - supSelectTotal).toFixed(1),
      parallelism_speedup    : `${(seqEstMs / supSelectTotal).toFixed(1)}x`,
      // 커넥션 풀 가이드
      supabase_free_pool     : 15,                // Supabase free tier 최대 동시 연결
      recommended_concurrency: Math.min(5, 15),   // 풀의 1/3 이하 권장
    },
    summary: {
      before_credits_avg_ms   : r.D_supabase_select_credits.avg,
      after_credits_avg_ms    : r.A_redis_get_credits.avg,
      credits_speedup         : `${creditsSpeedup}x`,
      before_poll_avg_ms      : r.E_supabase_baseline_poll.avg,
      after_poll_cache_avg_ms : r.C_redis_cache_hit_poll.avg,
      poll_speedup            : `${pollSpeedup}x`,
      cache_ttl_strategy: {
        'credits:{userId}'    : '300s — 5분마다 Supabase 재검증',
        'replicate:pred:{id}' : '3s   — 상태 빠르게 변함',
        'ratelimit:*'         : 'auto — sliding window 관리',
        'benchmark:result:*'  : '60s  — 결과 캐시',
      },
    },
  }

  // ── 결과 캐시 저장 ────────────────────────────────────────────────────────
  await redis.set(resultCacheKey, result, { ex: RESULT_CACHE_TTL })

  return NextResponse.json(result)
}
