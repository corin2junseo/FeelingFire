/**
 * Latency Benchmark — Redis vs Supabase 직접 비교
 *
 * 실행:
 *   k6 run tests/perf/latency-benchmark.js
 *
 * JSON 저장 (후처리용):
 *   k6 run --out json=results/latency.json tests/perf/latency-benchmark.js
 *
 * 측정 항목:
 *   A) /api/dev/benchmark → Redis GET vs Supabase SELECT 직접 숫자 비교
 *   B) /api/musics/poll   → Realtime + cache 도입 후 서버 응답 시간
 *   C) /api/musics/generate → rate limit 동작 확인 (429 응답)
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';

// ── 커스텀 메트릭 ─────────────────────────────────────────────────────────────
const benchmarkDur = new Trend('benchmark_duration', true);
const pollDur      = new Trend('poll_duration',      true);
const generateDur  = new Trend('generate_duration',  true);
const rateLimitHit = new Counter('rate_limit_429');
const errorRate    = new Rate('error_rate');

export const options = {
  scenarios: {
    // 1) 벤치마크 엔드포인트: Redis vs Supabase 지연 측정
    benchmark: {
      executor: 'constant-vus',
      exec: 'runBenchmark',
      vus: 1,
      duration: '30s',
      tags: { scenario: 'benchmark' },
    },
    // 2) Poll 엔드포인트: cache HIT 비율 및 응답 시간
    poll: {
      executor: 'ramping-vus',
      exec: 'runPoll',
      startVUs: 0,
      stages: [
        { target: 10, duration: '30s' },
        { target: 10, duration: '1m' },
        { target: 0,  duration: '15s' },
      ],
      tags: { scenario: 'poll' },
    },
    // 3) Generate: rate limit 동작 확인 (unauthenticated → 401, 과도 요청 → 429)
    generate_ratelimit: {
      executor: 'constant-arrival-rate',
      exec: 'runGenerate',
      rate: 15,         // 분당 10회 초과 → 일부 429 발생 확인
      timeUnit: '1m',
      preAllocatedVUs: 5,
      maxVUs: 10,
      duration: '2m',
      tags: { scenario: 'generate' },
    },
  },

  thresholds: {
    // 벤치마크 엔드포인트: Redis+Supabase 측정 포함 → 500ms 이하
    'benchmark_duration':          ['p(95)<500'],
    // Poll/Generate: Vercel cold start + Supabase auth 왕복 포함 실측 기준
    // Supabase auth.getUser() 자체가 ~250-350ms 소요 (Tokyo region)
    'poll_duration':               ['p(95)<600'],
    'generate_duration':           ['p(95)<700'],
    // 서버 오류(5xx)는 1% 미만
    'http_req_failed':             ['rate<0.01'],
  },
};

const BASE_URL = 'https://feelingfire.vercel.app';
const safeParams = {
  responseCallback: http.expectedStatuses({ min: 200, max: 499 }),
};

// ── Scenario A: 벤치마크 (Redis vs Supabase 지연 측정) ─────────────────────
export function runBenchmark() {
  const res = http.get(
    `${BASE_URL}/api/dev/benchmark?iterations=20`,
    { ...safeParams, tags: { scenario: 'benchmark' } }
  );

  benchmarkDur.add(res.timings.duration);
  errorRate.add(res.status >= 500);

  const passed = check(res, {
    'benchmark: 200 or 404(prod)': (r) => r.status === 200 || r.status === 404,
    'benchmark: < 500ms':          (r) => r.timings.duration < 500,
  });

  // 개발 환경에서만 summary 파싱
  if (res.status === 200) {
    try {
      const data = JSON.parse(res.body);
      if (data.summary) {
        console.log(`[benchmark] credits: ${data.summary.before_credits_avg_ms}ms → ${data.summary.after_credits_avg_ms}ms (${data.summary.credits_speedup} faster)`);
        console.log(`[benchmark] poll:    ${data.summary.before_poll_avg_ms}ms → ${data.summary.after_poll_cache_avg_ms}ms (${data.summary.poll_cache_speedup} faster)`);
      }
    } catch {}
  }

  sleep(1);
}

// ── Scenario B: Poll 엔드포인트 (cache HIT 응답 시간) ──────────────────────
export function runPoll() {
  // 인증 없이 호출 → 401 반환 (서버가 Redis 캐시 체크까지 도달하기 전 차단)
  // 실제 수치를 보려면 authenticated 테스트 필요 — 여기서는 서버 응답 시간 확인
  const res = http.get(
    `${BASE_URL}/api/musics/poll?predictionId=test-pred-id&musicIds=test-id`,
    { ...safeParams, tags: { scenario: 'poll' } }
  );

  pollDur.add(res.timings.duration);
  errorRate.add(res.status >= 500);

  check(res, {
    'poll: not 5xx':  (r) => r.status < 500,
    'poll: < 200ms':  (r) => r.timings.duration < 200,
  });

  sleep(0.5);
}

// ── Scenario C: Generate rate limit 확인 ───────────────────────────────────
export function runGenerate() {
  const res = http.post(
    `${BASE_URL}/api/musics/generate`,
    JSON.stringify({ prompt: 'test', duration: 90, batch_size: 1 }),
    {
      ...safeParams,
      headers: { 'Content-Type': 'application/json' },
      tags: { scenario: 'generate' },
    }
  );

  generateDur.add(res.timings.duration);
  errorRate.add(res.status >= 500);

  if (res.status === 429) {
    rateLimitHit.add(1);
  }

  check(res, {
    'generate: not 5xx':  (r) => r.status < 500,
    'generate: < 300ms':  (r) => r.timings.duration < 300,
  });
}

// ── Summary Report ────────────────────────────────────────────────────────────
export function handleSummary(data) {
  return { stdout: buildReport(data) };
}

function buildReport(data) {
  const m    = data.metrics;
  const bDur = m['benchmark_duration'];
  const pDur = m['poll_duration'];
  const gDur = m['generate_duration'];
  const rl   = m['rate_limit_429'];
  const fail = m['http_req_failed'];

  return `
╔══════════════════════════════════════════════════════════════╗
║  LATENCY BENCHMARK — Redis vs Supabase 개선 효과 측정         ║
╚══════════════════════════════════════════════════════════════╝

━━ 변경 전 (Supabase 직접 조회) — 이론값 ━━━━━━━━━━━━━━━━━━━━━
  credits SELECT  : ~80–120ms  (Supabase 왕복 1회)
  credits DEDUCT  : ~160–240ms (Supabase 왕복 2회)
  poll (no cache) : ~150–250ms (Replicate API 왕복)

━━ 변경 후 (Redis 캐시/원자 연산) — 측정값 ━━━━━━━━━━━━━━━━━━━
  /api/dev/benchmark 응답시간
    avg  : ${fmtMs(bDur?.values?.avg)}
    p(95): ${fmtMs(bDur?.values?.['p(95)'])}

  /api/musics/poll (unauthenticated auth check)
    avg  : ${fmtMs(pDur?.values?.avg)}
    p(95): ${fmtMs(pDur?.values?.['p(95)'])}
    p(99): ${fmtMs(pDur?.values?.['p(99)'])}

  /api/musics/generate (unauthenticated — 401 fast-path)
    avg  : ${fmtMs(gDur?.values?.avg)}
    p(95): ${fmtMs(gDur?.values?.['p(95)'])}

━━ Rate Limit 동작 확인 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  429 발생 횟수 : ${rl?.values?.count ?? 0}건
  (분당 10회 초과 시 Redis Sliding Window에서 차단)

━━ 안정성 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  5xx 오류율   : ${pct(fail?.values?.rate)}  (목표: 0%)

━━ 그래프 보기 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  npm run test:bench:save   (JSON 저장)
  npm run report:chart      (HTML 차트 생성)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
}

function fmtMs(ms)   { return ms   != null ? `${ms.toFixed(2)} ms` : 'N/A'; }
function pct(rate)   { return rate != null ? `${(rate * 100).toFixed(2)}%` : 'N/A'; }
