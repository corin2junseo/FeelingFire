/**
 * Smoke Test — vus=5, duration=30s
 * 기본 동작 확인: 랜딩, 인증 페이지, 체크아웃 API
 * 4xx는 서버 정상 응답이므로 실패에서 제외 (5xx만 실패 처리)
 */
import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';

// 커스텀 메트릭
const errorRate     = new Rate('server_error_rate');   // 5xx만 오류로 집계
const totalRequests = new Counter('total_requests');

export const options = {
  vus: 5,
  duration: '30s',

  // 4xx (401, 400 등)는 정상 응답 → http_req_failed 에서 제외
  // k6 기본값: 2xx/3xx만 성공, 나머지 실패
  // expectedStatuses 로 2xx~4xx를 모두 "성공"으로 처리
  thresholds: {
    http_req_duration: ['p(95)<3000', 'p(99)<5000'],
    http_req_failed:   ['rate<0.01'],  // 5xx 네트워크 오류만
    server_error_rate: ['rate<0.01'],
  },
};

const BASE_URL = 'https://feelingfire.vercel.app';

// 2xx ~ 4xx 모두 정상 HTTP 응답으로 간주 (5xx/네트워크 오류만 실패)
const params = {
  responseCallback: http.expectedStatuses({ min: 200, max: 499 }),
};

export default function () {
  group('1. Landing Page', () => {
    const res = http.get(`${BASE_URL}/`, { ...params, tags: { endpoint: 'landing' } });
    totalRequests.add(1);

    const ok = check(res, {
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
  return { stdout: formatSummary(data, 'SMOKE TEST (vus=5, 30s)') };
}

function formatSummary(data, title) {
  const m   = data.metrics;
  const dur  = m['http_req_duration'];
  const fail = m['http_req_failed'];
  const reqs = m['http_reqs'];
  const vus  = m['vus'];
  const errR = m['server_error_rate'];

  return `
╔══════════════════════════════════════════════════╗
║  ${title.padEnd(48)}║
╚══════════════════════════════════════════════════╝

📊 응답 시간 (http_req_duration)
   avg  : ${fmt(dur?.values?.avg)}
   min  : ${fmt(dur?.values?.min)}
   med  : ${fmt(dur?.values?.med)}
   p(95): ${fmt(dur?.values?.['p(95)'])}
   p(99): ${fmt(dur?.values?.['p(99)'])}
   max  : ${fmt(dur?.values?.max)}

❌ 실패율 (http_req_failed — 5xx/네트워크 오류)
   rate : ${pct(fail?.values?.rate)}

🔴 서버 오류율 (5xx only)
   rate : ${pct(errR?.values?.rate)}

⚡ 처리량 (http_reqs)
   total: ${reqs?.values?.count ?? 0} 건
   RPS  : ${num(reqs?.values?.rate)} req/s

👥 동시 접속자 (vus)
   max  : ${vus?.values?.max ?? 0}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
}

function fmt(ms)   { return ms  != null ? `${ms.toFixed(2)} ms`        : 'N/A'; }
function pct(rate) { return rate != null ? `${(rate * 100).toFixed(2)}%` : 'N/A'; }
function num(n)    { return n   != null ? n.toFixed(2)                  : 'N/A'; }
