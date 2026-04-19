# Feelingfire — AI Music for YouTube Creators

> YouTube 크리에이터를 위한 AI 음악 생성 SaaS 플랫폼.
> 텍스트 프롬프트 하나로 저작권 없는 배경음악을 즉시 생성합니다.

---

## 목차

- [서비스 개요](#서비스-개요)
- [기술 스택](#기술-스택)
- [프로젝트 구조](#프로젝트-구조)
- [서비스 아키텍처](#서비스-아키텍처)
- [핵심 기능](#핵심-기능)
- [성능 최적화](#성능-최적화)
- [데이터베이스 스키마](#데이터베이스-스키마)
- [API 엔드포인트](#api-엔드포인트)
- [크레딧 & 결제 시스템](#크레딧--결제-시스템)
- [환경 변수](#환경-변수)
- [시작하기](#시작하기)

---

## 서비스 개요

**Feelingfire**는 YouTube 크리에이터가 영상에 사용할 배경음악을 AI로 즉시 생성할 수 있는 플랫폼입니다.

- **저작권 걱정 없이** — 모든 음악은 플랫폼이 생성, 상업적 사용 허가
- **텍스트로 제어** — 무드, 장르, 분위기를 프롬프트로 표현
- **멀티 배리에이션** — 최대 4가지 버전을 한 번에 생성해 최적 트랙 선택
- **가변 길이** — 1분 / 2분 / 3분 선택
- **크레딧 기반 과금** — 생성량만큼 지불 (Pro: $1/30크레딧, Ultra: $10/330크레딧)

---

## 기술 스택

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 16.1.6 |
| Language | TypeScript | 5 |
| Styling | Tailwind CSS | v4 |
| Animation | Framer Motion | 12 |
| 3D Visualization | React Three Fiber + Three.js | 9 / 0.183 |
| UI Primitives | Radix UI (Dialog, Tooltip) | latest |
| Icons | Lucide React | 0.575 |
| Auth | Supabase Auth (Google OAuth) | — |
| Database | Supabase PostgreSQL + Realtime | — |
| Storage | Supabase Storage | — |
| Cache / Rate Limit | Upstash Redis + @upstash/ratelimit | 1.36 / 2.0 |
| AI Model | Replicate (text-to-music) | 1.4 |
| Payments | Polar.sh | SDK 0.45 |
| Deployment | Vercel (Edge + Serverless) | — |

---

## 프로젝트 구조

```
feelingfire/
├── app/                                # [라우팅 레이어] Next.js App Router — 최대한 얇게 유지
│   ├── layout.tsx                      # 루트 레이아웃: AuthProvider, MusicPlayerProvider
│   ├── page.tsx                        # 랜딩 페이지 (EN)
│   ├── ko/page.tsx                     # 랜딩 페이지 (KO)
│   ├── workspace/
│   │   └── page.tsx                    # 메인 워크스페이스 (음악 생성 + 목록)
│   ├── auth/
│   │   ├── page.tsx                    # Google OAuth 로그인 페이지
│   │   └── callback/route.ts          # OAuth 콜백 핸들러 → /workspace 리다이렉트
│   ├── privacy/page.tsx                # 개인정보처리방침
│   ├── terms/page.tsx                  # 이용약관
│   └── api/
│       ├── checkout/route.ts          # POST: Polar.sh 체크아웃 세션 (Edge Runtime ⚡)
│       ├── credits/route.ts           # GET: Redis-first 크레딧 잔액 조회
│       ├── musics/
│       │   ├── generate/route.ts      # POST: 음악 생성 (Rate limit → Credits → Replicate)
│       │   ├── poll/route.ts          # GET: 생성 상태 폴링 (Redis 캐시 → Replicate)
│       │   └── refund/route.ts        # POST: 타임아웃 환불 처리
│       ├── webhooks/
│       │   └── polar/route.ts         # POST: 결제 완료 웹훅 → 크레딧 지급
│       └── dev/
│           └── benchmark/route.ts     # GET: Redis vs Supabase 레이턴시 벤치마크 (dev only)
│
├── components/                         # [UI 레이어] 도메인별 그룹화
│   ├── ui/                             # 범용 프리미티브 (Button, Modal 등 — 확장 예정)
│   │
│   ├── layout/                         # 페이지 뼈대를 이루는 레이아웃 컴포넌트
│   │   ├── WorkspaceNavbar.tsx         # 상단 바: 검색, 크레딧 표시, 유저 메뉴
│   │   └── Footer.tsx                  # 푸터 (소셜 링크, 네비, 브랜드)
│   │
│   ├── marketing/                      # 랜딩페이지 전용 컴포넌트 (워크스페이스와 무관)
│   │   ├── MinimalistHero.tsx          # 히어로 섹션 (로고, 네비, 이미지)
│   │   ├── FeaturesSection.tsx         # 기능 소개 카드 그리드
│   │   ├── ExampleSection.tsx          # 예시 트랙 쇼케이스 (인-브라우저 재생)
│   │   ├── PricingSection.tsx          # Pro / Ultra 요금제 카드
│   │   ├── CTASection.tsx              # 하단 CTA 섹션
│   │   └── Silk.tsx                    # React Three Fiber 3D 실크 배경 애니메이션
│   │
│   ├── music/                          # 음악 도메인 UI (생성·재생·목록)
│   │   ├── MusicCard.tsx               # 개별 음악 카드 (재생, 다운로드, 이름 변경, 삭제)
│   │   ├── MusicList.tsx               # 음악 카드 목록 + 빈 상태 처리
│   │   ├── MusicPlayer.tsx             # 하단 고정 글로벌 뮤직 플레이어
│   │   ├── PromptInputBox.tsx          # 음악 생성 입력창 (프롬프트, 가사, 길이, 수량)
│   │   └── GenerationStatus.tsx        # 생성 중 로딩 / 오류 인디케이터
│   │
│   └── credits/                        # 크레딧·결제 관련 UI
│       └── CreditModal.tsx             # 크레딧 구매 모달 (Pro / Ultra 선택)
│
├── contexts/                           # [전역 상태] React Context Provider
│   ├── AuthContext.tsx                 # 인증 상태 + useAuth hook (user, credits, signIn…)
│   └── MusicPlayerContext.tsx          # 플레이어 상태 + useMusicPlayer hook
│
├── services/                           # [비즈니스 서비스 레이어] 도메인 로직 — lib와 분리
│   ├── credits.ts                      # getUserCredits · deductCredits · addToCache (Redis + Supabase)
│   ├── auth.ts                         # getCachedUser — JWT 서명 기반 Redis 인증 캐시
│   └── pricing.ts                      # calcCreditCost — 길이 × 배리에이션 비용 계산
│
├── lib/                                # [인프라 레이어] 외부 서비스 클라이언트만
│   ├── supabase/
│   │   ├── client.ts                   # 브라우저 Supabase 클라이언트
│   │   ├── server.ts                   # 서버 Supabase 클라이언트 (SSR + 쿠키)
│   │   ├── admin.ts                    # 관리자 Supabase 클라이언트 (service role)
│   │   └── edge.ts                     # Edge Runtime 전용 Supabase 클라이언트
│   ├── redis.ts                        # Upstash Redis 클라이언트 + generateRatelimit
│   └── utils.ts                        # cn() — clsx + tailwind-merge 유틸리티
│
├── types/                              # [타입 정의] 루트 레벨 전역 타입
│   └── music.ts                        # Music, MusicStatus, MusicInsert, MusicUpdate
│
├── hooks/                              # [재사용 훅] 커스텀 훅 확장 예정
│
├── tests/
│   ├── smoke-test.js
│   ├── load-test.js
│   ├── stress-test.js
│   └── perf/
│       ├── latency-benchmark.js        # k6 레이턴시 벤치마크 시나리오
│       ├── compare-report.mjs          # Before/After 성능 비교 리포트 생성기
│       └── generate-chart.mjs          # k6 JSON → HTML 차트 변환기
│
└── middleware.ts                        # 세션 자동 갱신 (/workspace/*, /api/* 에서만 실행)
```

---

## 폴더 구조 설계 원칙

### 핵심 기준: 관심사의 분리 (Separation of Concerns)

코드를 어디에 두어야 하는지 판단할 때 **"이 코드는 무엇을 책임지는가"** 라는 단 하나의 질문을 기준으로 삼았습니다.

---

### 1. `app/` — 라우팅만 담당, 비즈니스 로직 최소화

Next.js App Router는 **파일 경로 = URL 경로**라는 강한 제약을 갖습니다.
`app/` 디렉토리는 "어떤 URL에서 무엇을 렌더링할지"만 결정하고,
실제 로직은 `services/`, `components/`, `contexts/`에 위임합니다.

이렇게 하면 `app/` 안의 파일이 얇아져, 라우팅 변경이 비즈니스 로직에 영향을 주지 않습니다.

---

### 2. `components/` — 도메인별 그룹화 (기능 분리)

리팩토링 전 `components/`는 14개 파일이 하나의 평탄한 목록으로 나열되어 있었습니다.
`MinimalistHero.tsx`(랜딩 전용)와 `MusicPlayer.tsx`(워크스페이스 전용)가 같은 레벨에 있어,
어느 컴포넌트가 어느 페이지에 속하는지 파일명 없이는 알 수 없었습니다.

**분리 기준:**

| 폴더 | 기준 | 이유 |
|------|------|------|
| `marketing/` | 랜딩페이지에서만 사용 | 워크스페이스 개발 시 이 폴더를 건드릴 이유가 없음 |
| `layout/` | 페이지 구조를 구성 (Navbar, Footer) | UI 컴포넌트이지만 도메인 로직이 아닌 레이아웃 책임 |
| `music/` | 음악 생성·재생 도메인 | 핵심 비즈니스 도메인을 반영한 명확한 그룹 |
| `credits/` | 결제·크레딧 도메인 | 음악과 다른 관심사 — 나중에 결제 흐름이 복잡해져도 격리됨 |
| `ui/` | 도메인 무관 프리미티브 | Button, Modal 등 재사용 컴포넌트를 추가할 준비된 공간 |

`Silk.tsx`는 `CTASection.tsx`에서만 사용하는 시각 효과이므로
`marketing/`에 함께 배치해 상호 의존성을 폴더 안에 완결시켰습니다.

---

### 3. `services/` vs `lib/` — 비즈니스 로직과 인프라의 분리

리팩토링 전 `lib/`에는 두 종류의 코드가 섞여 있었습니다.

```
lib/
  redis.ts        ← 외부 서비스 클라이언트 (인프라)
  supabase/       ← 외부 서비스 클라이언트 (인프라)
  credits.ts      ← 크레딧 차감 로직 (비즈니스) ← 여기 있으면 안 됨
  auth-cache.ts   ← 인증 캐싱 전략 (비즈니스)   ← 여기 있으면 안 됨
  pricing.ts      ← 가격 계산 규칙 (비즈니스)    ← 여기 있으면 안 됨
```

**`lib/`은 순수 인프라입니다.** Supabase 클라이언트, Redis 연결처럼
외부 서비스에 접속하는 방법만 알고 있어야 합니다.
"몇 크레딧을 어떻게 차감할지"는 비즈니스 규칙이고, 이것은 `services/`에 속합니다.

이 분리 덕분에:
- Upstash를 다른 Redis로 교체하면 `lib/redis.ts`만 수정하면 됩니다.
- 크레딧 차감 정책이 바뀌면 `services/credits.ts`만 수정하면 됩니다.
- 두 관심사가 서로를 모릅니다.

---

### 4. `types/` — 루트 레벨 승격

리팩토링 전 타입은 `lib/types/musics.ts`에 있었습니다.
타입 정의는 인프라도, 서비스도, UI도 아닙니다. **프로젝트 전체가 공유하는 계약**입니다.

`lib/` 안에 넣으면 "이 타입은 인프라 계층에 속한다"는 잘못된 신호를 줍니다.
루트의 `types/music.ts`로 승격함으로써 어느 계층에서든 동등하게 import할 수 있습니다.

또한 `index.ts`를 통한 re-export(배럴 파일)는 추가하지 않았습니다.
Next.js App Router에서 배럴 파일은 트리 쉐이킹을 방해해 불필요한 번들 크기를 유발합니다.
직접 `import type { Music } from '@/types/music'`으로 참조하는 것이 더 명확하고 안전합니다.

---

### 5. 보류한 변경: `app/(marketing)/` Route Group

Next.js의 Route Group은 **그룹 전용 `layout.tsx`가 필요할 때** 의미가 있습니다.
현재 랜딩 페이지들은 모두 루트 `layout.tsx`를 그대로 공유하므로,
`(marketing)/` 폴더를 만들어도 기능 차이가 없고 import 경로만 길어집니다.
마케팅 페이지가 독립적인 레이아웃(다른 폰트, 다른 메타데이터 전략 등)을 갖게 되면
그때 도입하는 것이 적절합니다.

---

## 서비스 아키텍처

```
┌─────────────────────────────────────────────────────────────────┐
│                     CLIENT (Browser)                            │
│                                                                 │
│  Landing Page    Auth Page    Workspace (/workspace)            │
│                                │                               │
│              AuthContext       │     MusicPlayerContext         │
│         (user/credits/session) │    (HTML5 Audio 플레이어)      │
└────────────────────────────────┼───────────────────────────────┘
                                 │ HTTPS
┌────────────────────────────────▼───────────────────────────────┐
│                  NEXT.JS 16 (Vercel)                            │
│                                                                 │
│  middleware.ts ← /workspace/*, /api/* 에서만 세션 갱신          │
│                                                                 │
│  /api/musics/generate   /api/musics/poll   /api/musics/refund  │
│  /api/checkout ⚡Edge   /api/webhooks/polar                    │
│                                                                 │
│  lib/redis.ts           lib/credits.ts                         │
│  (generateRatelimit)    (getUserCredits/deductCredits)         │
└───────┬──────────────────────┬──────────────────┬─────────────┘
        │                      │                  │
        ▼                      ▼                  ▼
┌──────────────┐   ┌──────────────────┐   ┌──────────────────┐
│ Upstash Redis│   │    Supabase      │   │ External Services│
│              │   │                  │   │                  │
│ credits:*    │   │ PostgreSQL (RLS) │   │ Replicate API    │
│   TTL 300s   │   │ users/musics/    │   │ (text-to-music)  │
│ ratelimit:*  │   │ payments         │   │                  │
│  10 req/min  │   │                  │   │ Polar.sh         │
│ pred:*       │   │ Storage: musics  │   │ (결제 · Webhook)  │
│   TTL 3s     │   │ (MP3 파일)        │   │                  │
└──────────────┘   │ ⚡ Realtime       │   └──────────────────┘
                   │ (WebSocket push) │
                   └──────────────────┘
```

### 음악 생성 데이터 흐름

```
① 사용자 프롬프트 입력
      ↓
② POST /api/musics/generate
   ├─ Redis Sliding Window rate limit (초과 시 429, ~1ms 차단)
   ├─ Redis DECRBY credits:{userId} (원자적 선차감)
   │    └─ async Supabase UPDATE (fire-and-forget, 응답 지연 미포함)
   ├─ Supabase musics INSERT (status=generating)
   └─ Replicate predictions.create → { predictionId }
      ↓
③ 클라이언트 4초마다 GET /api/musics/poll 폴링 (최대 75회 = 5분)
   ├─ Redis GET replicate:pred:{id} (TTL 3s)
   │    └─ 캐시 HIT → Replicate API 미호출, 즉시 반환
   └─ 캐시 MISS → Replicate predictions.get
      ↓
④ 완료(succeeded) 시
   ├─ Replicate CDN에서 MP3 다운로드
   ├─ Supabase Storage 업로드 ({user_id}/{timestamp}.mp3)
   ├─ Signed URL 발급 (1년 만료)
   └─ Supabase musics UPDATE (status=completed, file_url)
      ↓
⑤ Supabase Realtime이 musics 변경을 즉시 Client에 push
      ↓
⑥ 실패/타임아웃 시 → POST /api/musics/refund
   ├─ Supabase RPC increment_user_credits (원자적 환불)
   └─ Redis addToCache (INCRBY 동기화)
```

### 결제 데이터 흐름

```
CreditModal → POST /api/checkout (⚡ Edge Runtime)
   └─ polar.checkouts.create → Checkout URL 반환
         ↓ 브라우저 리다이렉트
      Polar.sh 결제 페이지
         ↓ 결제 완료
      POST /api/webhooks/polar
         ├─ POLAR_WEBHOOK_SECRET 서명 검증
         ├─ payments INSERT (polar_order_id UNIQUE 중복 방지)
         ├─ RPC increment_user_credits (원자적 크레딧 적립)
         └─ Redis addToCache (INCRBY 동기화)
```

---

## 핵심 기능

### 1. 음악 생성 (`PromptInputBox`)

| 옵션 | 설명 |
|------|------|
| **프롬프트** | 자유 텍스트 (무드, 장르, 악기 등) |
| **가사** | 선택적 구조화 가사 입력 (모달) |
| **길이** | 1분 / 2분 / 3분 (크레딧: 1 / 2 / 3) |
| **배리에이션** | ×1 ~ ×4 (단일 Replicate prediction으로 처리) |
| **비용 미리보기** | 입력 즉시 소모 크레딧 배지 표시 |

### 2. 글로벌 뮤직 플레이어 (`MusicPlayer` + `MusicPlayerContext`)

HTML5 Audio 기반 Spotify 스타일 하단 고정 플레이어.

- **모바일**: 컴팩트 레이아웃 (재생/정지, 제목)
- **데스크톱**: 트랙 정보 + 컨트롤 + 프로그레스바 + 볼륨 + 다운로드
- `prev()` — 3초 이내: 이전 트랙 / 이후: 현재 트랙 처음으로
- `next()` — 다음 트랙, 마지막이면 첫 트랙으로 순환
- 재생 중인 카드에 테두리 강조 + 웨이브 애니메이션 표시

### 3. 음악 카드 (`MusicCard`)

- 상태 배지: `Generating` / `Failed` / 완료
- 인라인 제목 수정 (클릭하여 편집)
- 다운로드 (Signed URL)
- 삭제 (DB + Storage 동시 처리)

### 4. 크레딧 & 결제 (`CreditModal`)

| 플랜 | 가격 | 크레딧 | 단가 |
|------|------|--------|------|
| Pro | $1 | 30 | $0.033/크레딧 |
| Ultra | $10 | 330 | $0.030/크레딧 |

---

## 성능 최적화

### 개선 전/후 수치 비교 (실측 기준)

| 항목 | 변경 전 | 변경 후 | 개선 |
|------|---------|---------|------|
| credits 조회 | Supabase SELECT ~80ms | Redis GET ~44ms | ~2x 빠름 |
| credits 차감 | Supabase SELECT+UPDATE ~188ms avg, ~350ms p95 | Redis DECRBY ~87ms + async sync | ~2x 빠름 |
| credits race condition | 동시 요청 시 double-spend 가능 | DECRBY 원자적 연산 — **구조적 불가** | 안전성 확보 |
| poll 상태 조회 | 매 4초마다 Replicate API 직접 호출 | Redis 캐시 HIT 시 ~44ms (3s TTL) | ~4x 빠름 |
| rate limit 차단 | 없음 (Supabase·Replicate까지 도달) | Redis ~1ms 내 429 즉시 반환 | 보안 레이어 추가 |
| /api/checkout cold start | Vercel Lambda 최대 24,224ms | Edge Runtime ~0ms | cold start 제거 |
| 미들웨어 Supabase 호출 | 전체 경로 (랜딩·약관 포함) | /workspace/*, /api/* 에서만 | 불필요 왕복 제거 |

### Redis 키 & TTL 전략

```
credits:{userId}          TTL 300s   결제 등 외부 변경 고려, 5분마다 재검증
replicate:pred:{id}       TTL 3s     빠르게 변하는 예측 상태 캐시
ratelimit:generate:*      자동 관리   @upstash/ratelimit Sliding Window
benchmark:result:*        TTL 60s    개발 전용 벤치마크 결과 캐시
```

### Redis 크레딧 시스템 (`lib/credits.ts`)

```typescript
// 1. 조회: Redis-first, 캐시 미스 시 Supabase fallback + 캐시 갱신
export async function getUserCredits(userId: string): Promise<number>

// 2. 차감: DECRBY 원자적 차감, 음수 시 즉시 rollback
//    Supabase UPDATE는 async fire-and-forget (응답 지연 미포함)
export async function deductCredits(userId, amount): Promise<{ ok, remaining }>

// 3. 적립: 환불/결제 완료 후 Redis 동기화
export async function addToCache(userId: string, amount: number): Promise<void>
```

### Rate Limiting (`lib/redis.ts`)

```typescript
// 유저당 분당 10회 음악 생성 제한
// Credits 조회 이전에 차단 → Supabase·Replicate 불필요 호출 차단
export const generateRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 m'),
  prefix: 'ratelimit:generate',
})
```

### Edge Runtime (`/api/checkout`)

- `export const runtime = 'edge'` 선언으로 Vercel Lambda 대신 Edge Worker 실행
- `lib/supabase/edge.ts`: Node.js `cookies()` 대신 `NextRequest.cookies`를 직접 읽는 Edge 전용 Supabase 클라이언트
- cold start 없음, 전 세계 Edge PoP 배포

### 개발 벤치마크 (`GET /api/dev/benchmark`)

Redis vs Supabase 레이턴시를 직접 비교하는 dev-only 엔드포인트.

```
GET /api/dev/benchmark?redis=50&supabase=10&concurrency=5&nocache=1
```

| 파라미터 | 설명 | 기본값 |
|---------|------|--------|
| `redis` | Redis 순차 측정 횟수 | 50 (최대 200) |
| `supabase` | Supabase 총 요청 수 | 10 (최대 30) |
| `concurrency` | 동시 발사 수 | 5 |
| `nocache` | 결과 캐시 bypass | — |

---

## 데이터베이스 스키마

### `public.users`

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | PK (= auth.users.id) |
| email | text | 사용자 이메일 |
| full_name | text | 이름 |
| avatar_url | text | 프로필 이미지 URL |
| provider | text | OAuth 제공자 (`google`) |
| credits | int | 보유 크레딧 (기본값: 0) |
| created_at | timestamptz | 생성일 |
| updated_at | timestamptz | 수정일 |

### `public.musics`

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | PK |
| user_id | UUID | FK → users |
| prompt | text | 생성 프롬프트 |
| title | text? | 트랙 제목 |
| status | enum | `pending` / `generating` / `completed` / `failed` |
| file_path | text? | Supabase Storage 경로 |
| file_url | text? | Signed URL (1년 만료) |
| credits_used | int | 차감된 크레딧 (환불 기준) |
| error_message | text? | 실패 원인 |
| created_at | timestamptz | 생성일 |
| updated_at | timestamptz | 수정일 (트리거 자동 갱신) |

### `public.payments`

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | PK |
| user_id | UUID | FK → users |
| polar_order_id | text | Polar.sh 주문 ID (UNIQUE — 중복 방지) |
| amount | int | 결제 금액 (센트) |
| credits | int | 지급 크레딧 수 |
| status | text | 결제 상태 (기본값: `completed`) |
| created_at | timestamptz | 결제일 |

**RLS 정책**: 모든 테이블에서 사용자는 자신의 행만 조회/수정 가능.

**DB 트리거**:
- `on_auth_user_created`: `auth.users` INSERT 시 `public.users`에 자동 삽입
- `on_musics_updated`: `musics` 업데이트 시 `updated_at` 자동 갱신

**DB RPC**:
- `increment_user_credits(p_user_id, p_amount)`: 크레딧 원자적 증감 (환불·결제 완료 시 사용)

---

## API 엔드포인트

### `POST /api/musics/generate`

음악 생성 요청. Rate limit → Credits 차감 → Replicate 예측 시작.

**Request Body:**
```json
{
  "prompt": "chill lo-fi hip hop, rainy day vibes",
  "duration": 60,
  "batch_size": 2,
  "lyrics": "(optional)"
}
```

**Response:**
```json
{
  "predictionId": "abc123",
  "items": [{ "musicId": "uuid-1" }, { "musicId": "uuid-2" }]
}
```

**Response Headers (Rate Limit):**
```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 7
X-RateLimit-Reset: 1741500000000
```

**Error Codes:**
- `401` — 미인증
- `402` — 크레딧 부족 `{ required, available }`
- `429` — Rate limit 초과 (분당 10회)
- `500` — 서버 오류

---

### `GET /api/musics/poll`

Replicate 예측 상태 폴링. Redis 캐시 우선 확인 후 Replicate API 호출.

**Query Params:**
- `predictionId` — Replicate 예측 ID
- `musicIds` — 쉼표로 구분된 music UUID 목록

**Response (완료):**
```json
{
  "status": "completed",
  "items": [
    { "musicId": "uuid-1", "fileUrl": "https://..." }
  ]
}
```

---

### `POST /api/musics/refund`

클라이언트 타임아웃(75회 폴링 초과) 시 호출. DB 실패 처리 + 크레딧 환불.

**Request Body:**
```json
{ "musicIds": ["uuid-1", "uuid-2"] }
```

---

### `POST /api/checkout` ⚡ Edge Runtime

Polar.sh 체크아웃 세션 생성.

**Request Body:**
```json
{ "plan": "pro" }
```

**Response:**
```json
{ "url": "https://checkout.polar.sh/..." }
```

---

### `POST /api/webhooks/polar`

Polar.sh 결제 완료 웹훅. 서명 검증 후 크레딧 지급.

- `order.paid` 이벤트 처리
- 멱등성 보장 (`polar_order_id` UNIQUE 제약)
- Pro → 30크레딧, Ultra → 330크레딧

---

## 크레딧 & 결제 시스템

### 크레딧 소모 공식

```
소모 크레딧 = 길이 크레딧 × 배리에이션 수

길이 크레딧:
  1분 = 1 크레딧
  2분 = 2 크레딧
  3분 = 3 크레딧

예: 2분 × 3배리에이션 = 6 크레딧
```

### 안전한 크레딧 처리

1. **Rate limit 먼저** — Redis Sliding Window로 분당 10회 초과 시 즉시 차단
2. **원자적 선차감** — Redis DECRBY로 race condition 없이 차감, 음수 시 자동 rollback
3. **비동기 Supabase sync** — 크레딧 차감 후 DB UPDATE는 응답에 포함하지 않음 (fire-and-forget)
4. **자동 환불** — Replicate 실패/타임아웃 시 RPC + Redis addToCache로 즉시 복구
5. **중복 결제 방지** — `polar_order_id` UNIQUE 제약으로 멱등성 보장

---

## 환경 변수

`.env.local` 파일에 아래 값을 설정하세요.

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://<project-id>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>

# Replicate (AI 음악 생성)
REPLICATE_API_TOKEN=<replicate-token>

# Polar.sh (결제)
POLAR_PRO_PRODUCT_ID=<pro-product-id>
POLAR_ULTRA_PRODUCT_ID=<ultra-product-id>
POLAR_API_TOKEN=<polar-api-token>
POLAR_WEBHOOK_SECRET=<polar-webhook-secret>

# Upstash Redis (캐시 · Rate Limit)
UPSTASH_REDIS_REST_URL=https://<redis-id>.upstash.io
UPSTASH_REDIS_REST_TOKEN=<redis-token>

# 앱 URL
PUBLIC_APP_URL=https://yourdomain.com/
```

---

## 시작하기

```bash
# 1. 의존성 설치
npm install

# 2. 환경 변수 설정
cp .env.example .env.local
# .env.local 편집

# 3. 개발 서버 실행
npm run dev
```

`http://localhost:3000` 에서 확인하세요.

### 성능 테스트

```bash
# 레이턴시 벤치마크 (Redis vs Supabase 직접 비교)
# 브라우저 로그인 후 접속:
# http://localhost:3000/api/dev/benchmark?redis=50&supabase=10&concurrency=5

# k6 벤치마크 (k6 설치 필요)
npm run test:bench

# k6 결과 저장 후 Before/After 비교 리포트
npm run test:bench:save
npm run report:compare

# HTML 차트 생성
npm run report:chart
```

### Supabase 설정

1. Supabase 프로젝트 생성
2. Google OAuth 제공자 활성화 (Authentication → Providers)
3. `public.users`, `public.musics`, `public.payments` 테이블 생성
4. RLS 정책 적용
5. `musics` 스토리지 버킷 생성 (비공개)
6. DB 트리거 및 RPC 함수 등록

### Polar.sh 설정

1. Polar.sh 계정 생성 및 Organization 설정
2. Pro / Ultra 상품 생성
3. 웹훅 엔드포인트 등록: `https://yourdomain.com/api/webhooks/polar`
4. `order.paid` 이벤트 구독

### Upstash Redis 설정

1. [Upstash Console](https://console.upstash.com) 에서 Redis 데이터베이스 생성
2. REST URL과 Token을 `.env.local`에 입력
3. 리전은 Vercel 배포 리전과 동일하게 선택 (레이턴시 최소화)

---

## Storage 구조

- **버킷명**: `musics` (비공개)
- **경로 패턴**: `{user_id}/{timestamp}-{index}.mp3`
- **RLS**: 사용자는 자신의 폴더(`foldername[1] = auth.uid()`)에만 접근 가능
- **Signed URL**: 1년 만료 (생성 완료 시 발급)

---

## 배포

Vercel 배포 권장.

```bash
vercel --prod
```

환경 변수는 Vercel 대시보드 → Settings → Environment Variables에서 설정.

> **Edge Runtime 주의**: `/api/checkout`은 Edge Runtime을 사용합니다.
> `lib/supabase/edge.ts`의 `createEdgeClient`는 Node.js `cookies()` 대신
> `NextRequest.cookies`를 직접 읽도록 구현되어 있습니다.

---

## 코드리뷰 이력

### 2026-03-13

#### 수정 완료

| 심각도 | 항목 | 파일 |
|--------|------|------|
| 🔴 Critical | **이중 환불 버그**: 동시 폴링 / 타임아웃 경쟁 시 크레딧 중복 환불 가능 | `poll/route.ts`, `refund/route.ts` |
| 🔴 Critical | **TOCTOU 경합 조건**: Redis TTL 만료 타이밍에 따라 잔액 있어도 차감 실패 | `lib/credits.ts` |
| 🟡 Medium | **개별 DB 인서트 → 배치 인서트**: batch_size N번 쿼리 → 단일 쿼리 | `generate/route.ts` |
| 🟡 Medium | **`handleRename` `user_id` 필터 누락**: RLS 보호는 있지만 방어적 코딩 불일치 | `workspace/page.tsx` |
| 🟡 Medium | **`refreshCredits` Redis 우회**: async Supabase sync 미완료 시 구크레딧 표시 | `AuthContext.tsx` |
| 🟡 Medium | **`addToCache` 비원자적 GET→INCRBY**: 두 Redis 명령 사이에 상태 변경 가능 | `lib/credits.ts` |
| 🟡 Medium | **`Replicate` 인스턴스 매 요청 생성**: 모듈 레벨로 이동해 재사용 | `generate/route.ts`, `poll/route.ts` |
| 🟢 Minor | **`useEffect` 의존성 배열 누락**: ESLint 규칙 위반 | `AuthContext.tsx` |
| 🟢 Minor | **인덴테이션 불일치**: 4스페이스 → 2스페이스 통일 | `webhooks/polar/route.ts` |
| 🟢 Minor | **데드 코드 삭제**: 사용처 없는 단일 트랙 상태 조회 엔드포인트 제거 | `[id]/status/route.ts` |

#### 주요 수정 상세

**① 이중 환불 방지 (poll, refund)**

`.in('status', ['pending', 'generating'])` 조건으로 업데이트하고, 실제 변경된 row가 있을 때만 환불 RPC 호출. 동시 요청에서 "first writer wins" 패턴으로 환불이 정확히 1회만 실행된다.

```typescript
// Before: 항상 환불 실행 → 동시 요청 시 이중 환불 가능
await supabase.from('musics').update({ status: 'failed' }).eq('id', id)
await admin.rpc('increment_user_credits', ...)

// After: terminal 상태 아닌 row만 업데이트, 실제 변경 건수로 환불 여부 결정
const updateResults = await Promise.all(
  musicIds.map((id) =>
    supabase.from('musics')
      .update({ status: 'failed', error_message: errorMsg })
      .eq('id', id).eq('user_id', user.id)
      .in('status', ['pending', 'generating'])  // 멱등성 가드
      .select('id')
  )
)
const actuallyUpdated = updateResults.flatMap((r) => r.data ?? [])
if (actuallyUpdated.length > 0) {
  await admin.rpc('increment_user_credits', ...)
}
```

**② TOCTOU 경합 조건 제거 (lib/credits.ts)**

Redis Lua 스크립트로 GET → 잔액 확인 → DECRBY → EXPIRE를 단일 원자 연산으로 처리. 키 TTL 만료로 인한 false negative를 완전히 제거.

```lua
-- DEDUCT_SCRIPT: Redis 단일 스레드에서 중단 없이 실행
local current = redis.call('GET', k)
if current == false then return {0, 0} end  -- 캐시 미스 → Supabase 재로드 후 재시도
local bal = tonumber(current)
if bal < amount then return {1, bal} end    -- 잔액 부족
local new_bal = redis.call('DECRBY', k, amount)
redis.call('EXPIRE', k, ttl)
return {2, new_bal}                         -- 성공
```

**③ Redis 기반 크레딧 조회 신설 (`GET /api/credits`)**

`refreshCredits`가 Supabase 직접 쿼리 대신 `/api/credits`를 경유하도록 변경. `deductCredits`의 비동기 Supabase sync 완료 여부와 무관하게 Redis의 정확한 잔액을 표시.

```
Before: refreshCredits → Supabase (sync 미완료 시 구크레딧 반환 가능)
After:  refreshCredits → /api/credits → Redis (항상 최신 잔액 반환)
        └─ 네트워크 오류 시 Supabase 직접 조회로 폴백
```

#### 추가 개선 권고 (미적용)

| 항목 | 설명 | 파일 |
|------|------|------|
| `handleDelete` `user_id` 필터 누락 | `handleRename`과 동일한 패턴. `.eq("user_id", user.id)` 추가 권장 | `workspace/page.tsx` |
| Signed URL 만료 처리 없음 | 1년 만료 URL이 DB에 저장되지만 자동 갱신 메커니즘 없음. 만료 후 재생 불가 | `poll/route.ts` |
| 폴링 요청 중복 누적 | fire-and-forget 폴링이 서버 응답 지연 시 인터벌(4s)마다 요청이 쌓임. 진행 중 요청 추적으로 dedup 필요 | `workspace/page.tsx` |
| `handleDelete` 낙관적 업데이트 | DB 삭제 실패해도 UI에서 항목이 사라짐. 에러 체크 후 롤백 필요 | `workspace/page.tsx` |
| `MusicPlayerContext` 오디오 에러 핸들러 없음 | `Audio.onerror` 리스너 없어 URL 오류 시 UI 피드백 없음 | `MusicPlayerContext.tsx` |
| 가사(lyrics) 서버 길이 검증 없음 | 클라이언트에서만 제한. Replicate API 제한을 초과하는 가사가 서버에 그대로 전달 | `generate/route.ts` |
| `/api/credits` rate limit 없음 | 현재 사용 패턴에서는 문제없지만, 클라이언트 폴링 로직 추가 시 Redis 비용 증가 가능 | `app/api/credits/route.ts` |

---

© 2026 Feelingfire. All rights reserved.
