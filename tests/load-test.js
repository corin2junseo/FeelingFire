/**
 * Load Test — vus 0→50 ramp up → 50 유지 5분 → ramp down
 * 예상 트래픽 처리 확인: 랜딩, 인증, 체크아웃 API
 */
import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';

const errorRate     = new Rate('server_error_rate');
const totalRequests = new Counter('total_requests');

export const options = {
  stages: [
    { duration: '1m',  target: 50 },  // 1분간 0→50명 증가
    { duration: '5m',  target: 50 },  // 5분간 50명 유지
    { duration: '30s', target: 0  },  // 30초간 감소
  ],

  thresholds: {
    http_req_duration:  ['p(95)<3000', 'p(99)<5000'],
    http_req_failed:    ['rate<0.01'],
    server_error_rate:  ['rate<0.01'],
  },
};

const BASE_URL = 'https://feelingfire.vercel.app';

const params = {
  responseCallback: http.expectedStatuses({ min: 200, max: 499 }),
};

export default function () {
  group('1. Landing Page', () => {
    const res = http.get(`${BASE_URL}/`, { ...params, tags: { endpoint: 'landing' } });
    totalRequests.add(1);

    check(res, {
      'landing: status 200':        (r) => r.status === 200,
      'landing: has body':          (r) => r.body && r.body.length > 100,
      'landing: response < 3000ms': (r) => r.timings.duration < 3000,
    });
    errorRate.add(res.status >= 500);
  });

  sleep(1);

  group('2. Auth Page', () => {
    const res = http.get(`${BASE_URL}/auth`, { ...params, tags: { endpoint: 'auth' } });
    totalRequests.add(1);

    check(res, {
      'auth: status 200':        (r) => r.status === 200,
      'auth: response < 3000ms': (r) => r.timings.duration < 3000,
    });
    errorRate.add(res.status >= 500);
  });

  sleep(1);

  group('3. Checkout API (비인증 → 401 예상)', () => {
    const res = http.post(
      `${BASE_URL}/api/checkout`,
      JSON.stringify({ planId: 'pro' }),
      {
        ...params,
        headers: { 'Content-Type': 'application/json' },
        tags: { endpoint: 'checkout' },
      }
    );
    totalRequests.add(1);

    check(res, {
      'checkout: not 5xx':           (r) => r.status < 500,
      'checkout: response < 5000ms': (r) => r.timings.duration < 5000,
    });
    errorRate.add(res.status >= 500);
  });

  sleep(1);
}

export function handleSummary(data) {
  return { stdout: formatSummary(data, 'LOAD TEST (vus=50, 5min)') };
}

function formatSummary(data, title) {
  const m    = data.metrics;
  const dur  = m['http_req_duration'];
  const fail = m['http_req_failed'];
  const reqs = m['http_reqs'];
  const vus  = m['vus'];
  const errR = m['server_error_rate'];

  const p95  = dur?.values?.['p(95)'] ?? null;
  const p99  = dur?.values?.['p(99)'] ?? null;

  const p95ok = p95 != null && p95 < 3000;
  const p99ok = p99 != null && p99 < 5000;
  const errOk = (fail?.values?.rate ?? 0) < 0.01;

  return `
╔══════════════════════════════════════════════════╗
║  ${title.padEnd(48)}║
╚══════════════════════════════════════════════════╝

📊 응답 시간 (http_req_duration)
   avg  : ${fmt(dur?.values?.avg)}
   min  : ${fmt(dur?.values?.min)}
   med  : ${fmt(dur?.values?.med)}
   p(95): ${fmt(p95)}  ${p95ok ? '✅ < 3000ms' : '❌ > 3000ms (임계치 초과)'}
   p(99): ${fmt(p99)}  ${p99ok ? '✅ < 5000ms' : '❌ > 5000ms (임계치 초과)'}
   max  : ${fmt(dur?.values?.max)}

❌ 실패율 (http_req_failed — 5xx/네트워크 오류)
   rate : ${pct(fail?.values?.rate)}  ${errOk ? '✅ < 1%' : '❌ 임계치 초과'}

🔴 서버 오류율 (5xx only)
   rate : ${pct(errR?.values?.rate)}

⚡ 처리량 (http_reqs)
   total: ${reqs?.values?.count ?? 0} 건
   RPS  : ${num(reqs?.values?.rate)} req/s

👥 동시 접속자 (vus)
   max  : ${vus?.values?.max ?? 0}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
결론: ${allPass(p95ok, p99ok, errOk)}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
}

function allPass(...flags) {
  return flags.every(Boolean)
    ? '✅ 모든 임계치 통과 — 서버 정상'
    : '❌ 일부 임계치 초과 — 성능 개선 필요';
}

function fmt(ms)   { return ms   != null ? `${ms.toFixed(2)} ms`         : 'N/A'; }
function pct(rate) { return rate != null ? `${(rate * 100).toFixed(2)}%`  : 'N/A'; }
function num(n)    { return n    != null ? n.toFixed(2)                   : 'N/A'; }
