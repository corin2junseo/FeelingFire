/**
 * Stress Test — 최대 TPS 탐색
 *
 * ramping-arrival-rate: RPS를 직접 제어해 서버 한계를 찾는다.
 * 10 → 30 → 50 → 75 → 100 → 150 RPS 단계별로 올리며
 * 응답시간 p(95)와 에러율이 언제 임계치를 넘는지 관찰.
 *
 * 측정 대상:
 *   A) Landing  GET /              — CDN 캐시, 가장 가벼운 경로
 *   B) Checkout POST /api/checkout — Supabase auth 검증 포함, 가장 무거운 unauthenticated 경로
 */

import http from 'k6/http';
import { check } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const landingDur  = new Trend('landing_duration',  true);
const checkoutDur = new Trend('checkout_duration', true);
const errorRate   = new Rate('error_rate');

export const options = {
  scenarios: {
    landing_stress: {
      executor: 'ramping-arrival-rate',
      exec: 'landing',
      startRate: 5,
      timeUnit: '1s',
      preAllocatedVUs: 200,
      maxVUs: 500,
      stages: [
        { target: 10,  duration: '1m'  }, // 10 RPS warm-up
        { target: 30,  duration: '2m'  }, // 30 RPS
        { target: 50,  duration: '2m'  }, // 50 RPS
        { target: 75,  duration: '2m'  }, // 75 RPS
        { target: 100, duration: '2m'  }, // 100 RPS
        { target: 150, duration: '2m'  }, // 150 RPS — Vercel edge 한계 탐색
        { target: 0,   duration: '30s' }, // cool-down
      ],
    },
    checkout_stress: {
      executor: 'ramping-arrival-rate',
      exec: 'checkout',
      startRate: 2,
      timeUnit: '1s',
      preAllocatedVUs: 100,
      maxVUs: 300,
      stages: [
        { target: 5,  duration: '1m'  }, // 5 RPS warm-up
        { target: 15, duration: '2m'  }, // 15 RPS
        { target: 25, duration: '2m'  }, // 25 RPS
        { target: 40, duration: '2m'  }, // 40 RPS — Supabase auth 부하
        { target: 60, duration: '2m'  }, // 60 RPS
        { target: 80, duration: '2m'  }, // 80 RPS — 한계 탐색
        { target: 0,  duration: '30s' }, // cool-down
      ],
    },
  },

  // 느슨한 임계치 — 중단 없이 한계까지 관찰
  thresholds: {
    http_req_failed:   ['rate<0.5'],     // 50% 이상 실패 시 중단
    http_req_duration: ['p(95)<15000'],  // 15s 이상이면 중단 (timeout)
  },
};

const BASE_URL = 'https://feelingfire.vercel.app';
const safeParams = {
  responseCallback: http.expectedStatuses({ min: 200, max: 499 }),
};

// ── Scenario A: Landing Page ────────────────────────────────────────────────
export function landing() {
  const res = http.get(`${BASE_URL}/`, {
    ...safeParams,
    tags: { scenario: 'landing' },
  });

  landingDur.add(res.timings.duration);
  errorRate.add(res.status >= 500);

  check(res, {
    'landing: status 200':     (r) => r.status === 200,
    'landing: < 2000ms':       (r) => r.timings.duration < 2000,
  });
}

// ── Scenario B: Checkout API (unauthenticated → 401) ───────────────────────
export function checkout() {
  const res = http.post(
    `${BASE_URL}/api/checkout`,
    JSON.stringify({ plan: 'pro' }),
    {
      ...safeParams,
      headers: { 'Content-Type': 'application/json' },
      tags: { scenario: 'checkout' },
    }
  );

  checkoutDur.add(res.timings.duration);
  errorRate.add(res.status >= 500);

  check(res, {
    'checkout: not 5xx':  (r) => r.status < 500,
    'checkout: < 3000ms': (r) => r.timings.duration < 3000,
  });
}

// ── Summary ────────────────────────────────────────────────────────────────
export function handleSummary(data) {
  return { stdout: buildReport(data) };
}

function buildReport(data) {
  const m   = data.metrics;
  const dur = m['http_req_duration'];
  const fail= m['http_req_failed'];
  const reqs= m['http_reqs'];
  const land= m['landing_duration'];
  const chk = m['checkout_duration'];
  const err = m['error_rate'];

  const p95  = dur?.values?.['p(95)'];
  const p99  = dur?.values?.['p(99)'];
  const rps  = reqs?.values?.rate;
  const errR = err?.values?.rate ?? 0;

  // 최대 TPS 판정: p(95) < 1000ms 이고 에러율 < 1% 인 최고 RPS를 추정
  const passingP95  = p95  != null && p95  < 1000;
  const passingErr  = errR < 0.01;

  return `
╔══════════════════════════════════════════════════════════╗
║  STRESS TEST — 최대 TPS 탐색 결과                        ║
╚══════════════════════════════════════════════════════════╝

━━ 전체 요청 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  total req : ${reqs?.values?.count ?? 0} 건
  peak RPS  : ${fmt1(rps)} req/s
  error rate: ${pct(errR)}

━━ 응답 시간 (전체) ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  avg  : ${fmtMs(dur?.values?.avg)}
  med  : ${fmtMs(dur?.values?.med)}
  p(95): ${fmtMs(p95)}  ${passingP95 ? '✅ 쾌적 (< 1s)' : '⚠️  지연 발생'}
  p(99): ${fmtMs(p99)}
  max  : ${fmtMs(dur?.values?.max)}

━━ Landing Page (/  — CDN 경로) ━━━━━━━━━━━━━━━━━━━━━━━━
  avg  : ${fmtMs(land?.values?.avg)}
  p(95): ${fmtMs(land?.values?.['p(95)'])}
  p(99): ${fmtMs(land?.values?.['p(99)'])}
  max  : ${fmtMs(land?.values?.max)}

━━ Checkout API (/api/checkout — Supabase auth 경로) ━━━━
  avg  : ${fmtMs(chk?.values?.avg)}
  p(95): ${fmtMs(chk?.values?.['p(95)'])}
  p(99): ${fmtMs(chk?.values?.['p(99)'])}
  max  : ${fmtMs(chk?.values?.max)}

━━ 판정 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ${verdict(passingP95, passingErr, rps)}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
}

function verdict(p95ok, errOk, rps) {
  if (p95ok && errOk) {
    return `✅ 테스트 전 구간 통과 — 최소 ${fmt1(rps)} RPS 처리 가능`;
  }
  if (!errOk) {
    return `❌ 에러율 임계치 초과 — 해당 RPS에서 서버 과부하`;
  }
  return `⚠️  지연 발생 — p(95) 1초 초과, 최대 처리 한계에 근접`;
}

function fmtMs(ms)  { return ms   != null ? `${ms.toFixed(1)} ms`          : 'N/A  '; }
function fmt1(n)    { return n    != null ? n.toFixed(1)                    : 'N/A'; }
function pct(rate)  { return rate != null ? `${(rate * 100).toFixed(2)}%`   : 'N/A'; }
