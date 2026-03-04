# Feelingfire — AI Music for YouTube Creators

> YouTube 크리에이터를 위한 AI 음악 생성 SaaS 플랫폼.
> 텍스트 프롬프트 하나로 저작권 없는 배경음악을 즉시 생성합니다.

---

## 목차

- [서비스 개요](#서비스-개요)
- [기술 스택](#기술-스택)
- [프로젝트 구조](#프로젝트-구조)
- [핵심 기능](#핵심-기능)
- [아키텍처](#아키텍처)
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
| Database | Supabase PostgreSQL | — |
| Storage | Supabase Storage | — |
| AI Model | Replicate (text-to-music) | 1.4 |
| Payments | Polar.sh | SDK 0.45 |
| Deployment | Vercel | — |

---

## 프로젝트 구조

```
feelingfire/
├── app/
│   ├── layout.tsx                      # 루트 레이아웃: AuthProvider, MusicPlayerProvider
│   ├── page.tsx                        # 랜딩 페이지 (히어로, 기능, 가격, CTA)
│   ├── workspace/
│   │   └── page.tsx                    # 메인 워크스페이스 (음악 생성 + 목록)
│   ├── auth/
│   │   ├── page.tsx                    # Google OAuth 로그인 페이지
│   │   └── callback/
│   │       └── route.ts               # OAuth 콜백 핸들러 → /workspace 리다이렉트
│   ├── privacy/
│   │   └── page.tsx                    # 개인정보처리방침
│   ├── terms/
│   │   └── page.tsx                    # 이용약관
│   └── api/
│       ├── checkout/
│       │   └── route.ts               # POST: Polar.sh 체크아웃 세션 생성
│       ├── musics/
│       │   ├── generate/
│       │   │   └── route.ts           # POST: 음악 생성 요청 (크레딧 차감 + Replicate)
│       │   ├── poll/
│       │   │   └── route.ts           # GET: 생성 상태 폴링 + 스토리지 업로드
│       │   └── [id]/status/
│       │       └── route.ts           # GET: 개별 음악 상태 조회
│       └── webhooks/
│           └── polar/
│               └── route.ts           # POST: 결제 완료 웹훅 → 크레딧 지급
│
├── components/
│   ├── — 랜딩 페이지 —
│   ├── MinimalistHero.tsx              # 히어로 섹션 (로고, 네비, 3D 배경)
│   ├── FeaturesSection.tsx             # 6개 기능 소개 카드 그리드
│   ├── ExampleSection.tsx              # 예시 쇼케이스
│   ├── PricingSection.tsx              # Pro / Ultra 요금제 카드
│   ├── CTASection.tsx                  # 하단 CTA
│   ├── Footer.tsx                      # 푸터 (링크 포함)
│   ├── Silk.tsx                        # React Three Fiber 3D 실크 애니메이션
│   ├── — 워크스페이스 —
│   ├── WorkspaceNavbar.tsx             # 상단 바: 검색, 크레딧 표시, 유저 메뉴
│   ├── PromptInputBox.tsx              # 음악 생성 입력창 (프롬프트, 가사, 길이, 수량)
│   ├── MusicList.tsx                   # 음악 카드 그리드 + 빈 상태 처리
│   ├── MusicCard.tsx                   # 개별 음악 카드 (재생, 다운로드, 이름 변경, 삭제)
│   ├── MusicPlayer.tsx                 # 하단 고정 글로벌 뮤직 플레이어
│   ├── GenerationStatus.tsx            # 생성 중 로딩 / 오류 인디케이터
│   └── CreditModal.tsx                 # 크레딧 구매 모달
│
├── contexts/
│   ├── AuthContext.tsx                 # 전역 인증 상태 + useAuth hook
│   └── MusicPlayerContext.tsx          # 전역 플레이어 상태 + useMusicPlayer hook
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts                   # 브라우저 Supabase 클라이언트 (anon key)
│   │   ├── server.ts                   # 서버 Supabase 클라이언트 (SSR + 쿠키)
│   │   └── admin.ts                    # 관리자 Supabase 클라이언트 (service role)
│   ├── types/
│   │   └── musics.ts                   # Music, MusicInsert, MusicUpdate, MusicStatus 타입
│   └── utils.ts                        # cn() — clsx + tailwind-merge 유틸리티
│
└── middleware.ts                        # 세션 자동 갱신 (모든 요청)
```

---

## 핵심 기능

### 1. 음악 생성 (`PromptInputBox`)

프롬프트 기반으로 AI 음악을 생성합니다.

| 옵션 | 설명 |
|------|------|
| **프롬프트** | 자유 텍스트 (무드, 장르, 악기 등) |
| **가사** | 선택적 구조화 가사 입력 (모달) |
| **길이** | 1분 / 2분 / 3분 (크레딧: 1 / 2 / 3) |
| **배리에이션** | ×1 ~ ×4 (동시에 여러 버전 생성) |
| **비용 미리보기** | 입력 즉시 소모 크레딧 배지 표시 |

### 2. 글로벌 뮤직 플레이어 (`MusicPlayer` + `MusicPlayerContext`)

Spotify 스타일의 하단 고정 플레이어.

- **모바일**: 컴팩트 가로 레이아웃 (재생/정지, 제목)
- **데스크톱**: 트랙 정보 + 컨트롤 + 프로그레스바 + 볼륨 + 다운로드
- `play()` — 특정 트랙 재생 또는 현재 트랙 재개
- `pause()` — 현재 트랙 일시정지
- `prev()` — 3초 이내: 이전 트랙 / 이후: 현재 트랙 처음으로
- `next()` — 다음 트랙, 마지막이면 첫 트랙으로 순환
- 재생 중인 카드에 테두리 강조 + 웨이브 애니메이션 표시
- 플레이어가 열리면 `PromptInputBox`가 자동으로 위로 이동

### 3. 음악 카드 (`MusicCard`)

- 상태 배지: `Generating` / `Failed` / 빈 상태(완료)
- 인라인 제목 수정 (클릭하여 편집)
- 다운로드 (서명된 URL)
- 삭제 (DB + Storage 동시 처리)
- 생성 중 웨이브폼 애니메이션

### 4. 크레딧 & 결제 (`CreditModal`)

- Pro: $1 → 30 크레딧
- Ultra: $10 → 330 크레딧
- Polar.sh 체크아웃 리다이렉트 방식

---

## 아키텍처

### 인증 플로우

```
사용자 → /auth (Google OAuth 버튼 클릭)
     → Supabase OAuth 리다이렉트
     → Google 로그인
     → /auth/callback (코드 교환)
     → 세션 저장
     → /workspace 리다이렉트
```

- `AuthContext`가 세션 상태를 전역으로 관리
- `middleware.ts`가 모든 요청에서 세션 자동 갱신
- DB 트리거 `on_auth_user_created`가 `auth.users` INSERT 시 `public.users`에 자동 행 삽입

### 음악 생성 파이프라인

```
1. PromptInputBox 제출
      ↓
2. POST /api/musics/generate
   - 크레딧 확인 (부족 시 402 → CreditModal)
   - DB에 music 레코드 생성 (status: 'pending' → 'generating')
   - 크레딧 차감 (생성 전 선차감)
   - Replicate API 호출 (비동기, 예측 ID 반환)
      ↓
3. 프론트엔드 폴링 (4초 간격, 최대 75회 = 5분)
   GET /api/musics/poll?predictionId=xxx&musicIds=id1,id2
      ↓
4. Replicate 완료 시:
   - 오디오 파일 다운로드 (Replicate CDN)
   - Supabase Storage 업로드 ({user_id}/{filename}.mp3)
   - 서명된 URL 생성 (1년 유효)
   - DB 업데이트 (status: 'completed', file_url 저장)
      ↓
5. Replicate 실패 시:
   - DB 업데이트 (status: 'failed', error_message 저장)
   - RPC `increment_user_credits`로 크레딧 환불
      ↓
6. 프론트엔드 상태 업데이트 → MusicCard에 즉시 반영
```

### 결제 플로우

```
사용자 → CreditModal (Pro / Ultra 선택)
      → POST /api/checkout (Polar.sh 체크아웃 세션 생성)
      → Polar.sh 결제 페이지 리다이렉트
      → 결제 완료
      → POST /api/webhooks/polar (서버 수신)
         - 서명 검증
         - payments 테이블 INSERT (idempotent: 중복 방지)
         - RPC increment_user_credits 호출
      → 크레딧 지급 완료
```

### Replicate 모델

- **Model ID**: `fd851baef553cb1656f4a05e8f2f8641672f10bc808718f5718b4b4bb2b07794`
- **Input**: `{ caption: string, duration: number, batch_size: number, lyrics?: string }`
- **Output**: 오디오 파일 URL 배열 (배리에이션별 1개)

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
| mood | text? | 무드 |
| genre | text? | 장르 |
| duration | int? | 재생 시간 (초) |
| file_path | text? | Supabase Storage 경로 |
| file_url | text? | 서명된 스트리밍 URL |
| status | enum | `pending` / `generating` / `completed` / `failed` |
| error_message | text? | 실패 원인 |
| created_at | timestamptz | 생성일 |
| updated_at | timestamptz | 수정일 (트리거 자동 갱신) |

### `public.payments`

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | PK |
| user_id | UUID | FK → users |
| polar_order_id | text | Polar.sh 주문 ID (UNIQUE, 중복 방지) |
| amount | int | 결제 금액 (센트) |
| credits | int | 지급 크레딧 수 |
| status | text | 결제 상태 (기본값: `completed`) |
| created_at | timestamptz | 결제일 |

**RLS 정책**: 모든 테이블에서 사용자는 자신의 행만 조회/수정 가능.

**DB 트리거**:
- `on_auth_user_created`: `auth.users` INSERT 시 `public.users`에 자동 삽입
- `on_musics_updated`: `musics` 업데이트 시 `updated_at` 자동 갱신

**DB RPC**:
- `increment_user_credits(p_user_id, p_amount)`: 크레딧 원자적 증감

---

## API 엔드포인트

### `POST /api/musics/generate`

음악 생성 요청. 크레딧 차감 후 Replicate 예측 시작.

**Request Body:**
```json
{
  "prompt": "chill lo-fi hip hop, rainy day vibes",
  "duration": 60,
  "batchSize": 2,
  "lyrics": "(optional) verse lyrics here"
}
```

**Response:**
```json
{
  "predictionId": "abc123",
  "musicIds": ["uuid-1", "uuid-2"]
}
```

**Error Codes:**
- `401` — 미인증
- `402` — 크레딧 부족
- `500` — 서버 오류

---

### `GET /api/musics/poll`

Replicate 예측 상태 폴링. 완료 시 Storage 업로드.

**Query Params:**
- `predictionId` — Replicate 예측 ID
- `musicIds` — 쉼표로 구분된 music UUID 목록

**Response:**
```json
{
  "status": "succeeded",
  "musics": [
    { "id": "uuid-1", "status": "completed", "file_url": "https://..." },
    { "id": "uuid-2", "status": "completed", "file_url": "https://..." }
  ]
}
```

---

### `POST /api/checkout`

Polar.sh 체크아웃 세션 생성.

**Request Body:**
```json
{ "planId": "pro" }
```

**Response:**
```json
{ "checkoutUrl": "https://checkout.polar.sh/..." }
```

---

### `POST /api/webhooks/polar`

Polar.sh 결제 완료 웹훅. 서명 검증 후 크레딧 지급.

- `order.paid` 이벤트 처리
- 멱등성 보장 (polar_order_id UNIQUE 제약)
- Pro(30cr) / Ultra(330cr) 자동 매핑

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

1. 생성 요청 시 **선차감** (Replicate 호출 전)
2. Replicate 실패 시 **자동 환불** (`increment_user_credits` RPC)
3. 결제 완료 시 **원자적 증가** (RPC 사용으로 레이스 컨디션 방지)
4. 결제 중복 처리 방지 (`polar_order_id` UNIQUE 제약)

### 요금제

| 플랜 | 가격 | 크레딧 | 단가 |
|------|------|--------|------|
| Pro | $1 | 30 | $0.033/크레딧 |
| Ultra | $10 | 330 | $0.030/크레딧 |

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

---

## Storage 구조

- **버킷명**: `musics` (비공개)
- **경로 패턴**: `{user_id}/{timestamp}-{uuid}.mp3`
- **RLS**: 사용자는 자신의 폴더(`foldername[1] = auth.uid()`)에만 접근 가능
- **서명된 URL**: 1년 유효 (생성 시 갱신)

---

## 배포

Vercel 배포 권장.

```bash
# Vercel CLI 배포
vercel --prod
```

환경 변수는 Vercel 대시보드 → Settings → Environment Variables에서 설정.

---

## 라이선스

© 2024 Feelingfire. All rights reserved.
