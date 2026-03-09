#!/usr/bin/env node
/**
 * k6 JSON → HTML 차트 변환기
 *
 * 사용법:
 *   node tests/perf/generate-chart.mjs <results.json> [output.html]
 *
 * 예시:
 *   npm run test:bench:save
 *   node tests/perf/generate-chart.mjs tests/perf/results/after.json
 *   → tests/perf/results/after.html 자동 생성
 */

import { readFileSync, writeFileSync } from 'fs'
import { resolve, basename, dirname, join } from 'path'

const inputPath  = process.argv[2]
const outputPath = process.argv[3] ?? join(dirname(inputPath), basename(inputPath, '.json') + '.html')

if (!inputPath) {
  console.error('Usage: node generate-chart.mjs <results.json> [output.html]')
  process.exit(1)
}

const raw   = readFileSync(resolve(inputPath), 'utf-8')
const lines = raw.trim().split('\n').filter(Boolean)

// ── 데이터 파싱 ───────────────────────────────────────────────────────────────
const durationPoints = []   // { time, value, scenario }
const reqRatePoints  = []   // { time, value }
const errorPoints    = []   // { time, value }

let startTime = null

for (const line of lines) {
  let entry
  try { entry = JSON.parse(line) } catch { continue }
  if (entry.type !== 'Point') continue

  const t = new Date(entry.data.time).getTime()
  if (!startTime) startTime = t
  const relSec = +((t - startTime) / 1000).toFixed(1)

  if (entry.metric === 'http_req_duration') {
    durationPoints.push({ x: relSec, y: +entry.data.value.toFixed(2), scenario: entry.data.tags?.scenario ?? 'default' })
  }
  if (entry.metric === 'http_reqs') {
    reqRatePoints.push({ x: relSec, y: 1 })
  }
  if (entry.metric === 'http_req_failed') {
    errorPoints.push({ x: relSec, y: entry.data.value ? 1 : 0 })
  }
}

// ── 1초 단위 버킷으로 집계 ─────────────────────────────────────────────────────
function bucket(points, agg = 'avg') {
  const buckets = {}
  for (const p of points) {
    const k = Math.floor(p.x)
    if (!buckets[k]) buckets[k] = []
    buckets[k].push(p.y)
  }
  return Object.entries(buckets)
    .sort(([a], [b]) => +a - +b)
    .map(([sec, vals]) => ({
      x: +sec,
      y: agg === 'avg' ? +(vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2)
        : agg === 'p95' ? +(vals.sort((a, b) => a - b)[Math.floor(vals.length * 0.95)] ?? 0).toFixed(2)
        : vals.length,
    }))
}

const durAvg   = bucket(durationPoints, 'avg')
const durP95   = bucket(durationPoints, 'p95')
const rps      = bucket(reqRatePoints, 'count')
const errCount = bucket(errorPoints, 'count')

const overallAvg = durAvg.length ? (durAvg.reduce((s, p) => s + p.y, 0) / durAvg.length).toFixed(2) : 'N/A'
const overallP95 = durationPoints.length
  ? durationPoints.map(p => p.y).sort((a, b) => a - b)[Math.floor(durationPoints.length * 0.95)].toFixed(2)
  : 'N/A'
const totalReqs  = reqRatePoints.length
const totalErrs  = errorPoints.filter(p => p.y).length

// ── HTML テンプレート ──────────────────────────────────────────────────────────
const html = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>k6 Performance Report — Feelingfire</title>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
         background: #0f1117; color: #e2e8f0; padding: 32px; }
  h1   { font-size: 1.6rem; font-weight: 700; margin-bottom: 4px; color: #f8fafc; }
  .sub { color: #94a3b8; font-size: 0.85rem; margin-bottom: 32px; }
  .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
              gap: 16px; margin-bottom: 40px; }
  .kpi { background: #1e2230; border: 1px solid #2d3249; border-radius: 12px;
         padding: 20px 24px; }
  .kpi-label { font-size: 0.75rem; color: #64748b; text-transform: uppercase;
               letter-spacing: .05em; margin-bottom: 8px; }
  .kpi-value { font-size: 2rem; font-weight: 700; color: #38bdf8; }
  .kpi-value.good { color: #4ade80; }
  .kpi-value.warn { color: #fbbf24; }
  .chart-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
  .chart-card { background: #1e2230; border: 1px solid #2d3249;
                border-radius: 12px; padding: 24px; }
  .chart-title { font-size: 0.9rem; font-weight: 600; color: #cbd5e1;
                 margin-bottom: 16px; }
  canvas { max-height: 260px; }
  @media (max-width: 900px) { .chart-grid { grid-template-columns: 1fr; } }
</style>
</head>
<body>
<h1>k6 Performance Report — Feelingfire</h1>
<p class="sub">Generated: ${new Date().toLocaleString('ko-KR')} &nbsp;|&nbsp; Source: ${basename(inputPath)}</p>

<div class="kpi-grid">
  <div class="kpi">
    <div class="kpi-label">avg Response Time</div>
    <div class="kpi-value ${+overallAvg < 200 ? 'good' : +overallAvg < 500 ? 'warn' : ''}">${overallAvg} ms</div>
  </div>
  <div class="kpi">
    <div class="kpi-label">p(95) Response Time</div>
    <div class="kpi-value ${+overallP95 < 300 ? 'good' : +overallP95 < 1000 ? 'warn' : ''}">${overallP95} ms</div>
  </div>
  <div class="kpi">
    <div class="kpi-label">Total Requests</div>
    <div class="kpi-value">${totalReqs.toLocaleString()}</div>
  </div>
  <div class="kpi">
    <div class="kpi-label">Error Count</div>
    <div class="kpi-value ${totalErrs === 0 ? 'good' : 'warn'}">${totalErrs}</div>
  </div>
</div>

<div class="chart-grid">
  <div class="chart-card">
    <div class="chart-title">Response Time over Time (avg &amp; p95)</div>
    <canvas id="durChart"></canvas>
  </div>
  <div class="chart-card">
    <div class="chart-title">Requests per Second</div>
    <canvas id="rpsChart"></canvas>
  </div>
</div>

<script>
const GRID  = { color: 'rgba(255,255,255,0.05)' }
const FONT  = { color: '#94a3b8', size: 11 }
const BASE  = { responsive: true, animation: false, plugins: { legend: { labels: { color: '#94a3b8', boxWidth: 12 } } },
                scales: { x: { ticks: FONT, grid: GRID }, y: { ticks: FONT, grid: GRID } } }

new Chart(document.getElementById('durChart'), {
  type: 'line',
  data: {
    datasets: [
      { label: 'avg (ms)', data: ${JSON.stringify(durAvg)},
        borderColor: '#38bdf8', backgroundColor: 'rgba(56,189,248,0.1)',
        pointRadius: 0, borderWidth: 2, fill: true, tension: 0.3, parsing: { xAxisKey: 'x', yAxisKey: 'y' } },
      { label: 'p95 (ms)', data: ${JSON.stringify(durP95)},
        borderColor: '#f472b6', backgroundColor: 'transparent',
        pointRadius: 0, borderWidth: 1.5, borderDash: [4,3], tension: 0.3, parsing: { xAxisKey: 'x', yAxisKey: 'y' } },
    ]
  },
  options: { ...BASE, scales: { ...BASE.scales,
    x: { ...BASE.scales.x, title: { display: true, text: 'seconds', color: '#64748b' } },
    y: { ...BASE.scales.y, title: { display: true, text: 'ms', color: '#64748b' } },
  }}
})

new Chart(document.getElementById('rpsChart'), {
  type: 'bar',
  data: {
    datasets: [{
      label: 'req/s', data: ${JSON.stringify(rps)},
      backgroundColor: 'rgba(74,222,128,0.7)', borderColor: '#4ade80', borderWidth: 1,
      parsing: { xAxisKey: 'x', yAxisKey: 'y' }
    }]
  },
  options: { ...BASE, scales: { ...BASE.scales,
    x: { ...BASE.scales.x, title: { display: true, text: 'seconds', color: '#64748b' } },
    y: { ...BASE.scales.y, title: { display: true, text: 'req/s', color: '#64748b' } },
  }}
})
</script>
</body>
</html>`

writeFileSync(resolve(outputPath), html)
console.log(`✅ Chart generated: ${outputPath}`)
console.log(`   Open in browser: start ${outputPath}`)
