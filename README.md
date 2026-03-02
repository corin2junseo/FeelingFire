# Feelingfire — AI Music for YouTube Creators

YouTube 크리에이터를 위한 AI 음악 생성 플랫폼. 텍스트 프롬프트로 저작권 없는 배경음악을 수초 안에 만들 수 있습니다.

---

## 기술 스택

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4 |
| Animation | Framer Motion 12 |
| UI Components | Radix UI (Dialog, Tooltip) |
| Icons | Lucide React |
| Auth | Supabase Auth (Google OAuth) |
| Database | Supabase PostgreSQL |
| Storage | Supabase Storage |
| AI | Replicate (text-to-music) |

---

## 프로젝트 구조

```
feelingfire/
├── app/
│   ├── layout.tsx                    # 루트 레이아웃 (AuthProvider, MusicPlayerProvider)
│   ├── page.tsx                      # 랜딩 페이지
│   ├── workspace/
│   │   └── page.tsx                  # 메인 워크스페이스 (음악 생성 및 목록)
│   ├── auth/
│   │   ├── page.tsx                  # Google OAuth 로그인 페이지
│   │   └── callback/route.ts         # OAuth 콜백 핸들러
│   └── api/
│       └── musics/
│           ├── generate/route.ts     # POST: 음악 생성 요청
│           └── [id]/status/route.ts  # GET: Replicate 예측 상태 폴링
│
├── components/
│   ├── MinimalistHero.tsx            # 랜딩 히어로 섹션
│   ├── WorkspaceNavbar.tsx           # 상단 네비게이션 바
│   ├── PromptInputBox.tsx            # 음악 생성 입력창
│   ├── MusicCard.tsx                 # 개별 음악 카드 (재생 버튼)
│   ├── MusicList.tsx                 # 음악 카드 목록
│   ├── MusicPlayer.tsx               # 하단 고정 글로벌 뮤직 플레이어
│   └── GenerationStatus.tsx          # 생성 중 상태 표시
│
├── contexts/
│   ├── AuthContext.tsx               # 전역 인증 상태
│   └── MusicPlayerContext.tsx        # 전역 뮤직 플레이어 상태
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts                 # 브라우저 Supabase 클라이언트
│   │   └── server.ts                 # 서버 Supabase 클라이언트 (SSR)
│   ├── types/
│   │   └── musics.ts                 # Music 타입 정의
│   └── utils.ts                      # cn 유틸리티
│
└── middleware.ts                     # 세션 자동 갱신
```

---

## 핵심 기능

### 음악 생성 플로우

1. 사용자가 텍스트 프롬프트 입력
2. Replicate API에 생성 요청 전송
3. 4초 간격으로 상태 폴링 (최대 5분)
4. 완료 시 Supabase Storage에 MP3 업로드
5. 서명된 URL로 스트리밍 재생

### 글로벌 뮤직 플레이어 (`MusicPlayer` + `MusicPlayerContext`)

화면 하단에 고정된 Spotify/YouTube Music 스타일의 플레이어.

**구조:**
- 왼쪽: 현재 트랙 아이콘 + 제목
- 중앙: 이전/재생·정지/다음 버튼 + 시크바 + 시간 표시
- 오른쪽: 다운로드 버튼 + 볼륨 슬라이더

**동작:**
- 트랙이 재생될 때 하단에서 슬라이드 인 (Framer Motion)
- MusicCard의 재생 버튼 클릭 → 글로벌 플레이어에서 재생
- 같은 트랙 재클릭 → 재생/정지 토글
- `prev()` — 3초 이내면 이전 트랙, 이후면 처음으로 되감기
- `next()` — 다음 트랙, 마지막이면 첫 트랙으로 순환
- 재생 중인 카드는 테두리 강조 + 웨이브 애니메이션 표시
- PromptInputBox는 플레이어가 열릴 때 자동으로 위로 올라감

---

## 데이터베이스 스키마

### `public.users`
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | PK |
| email | text | 사용자 이메일 |
| full_name | text | 이름 |
| avatar_url | text | 프로필 이미지 URL |
| provider | text | OAuth 제공자 |
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
| file_path | text? | Storage 경로 |
| file_url | text? | 서명된 스트리밍 URL |
| status | enum | `pending` / `generating` / `completed` / `failed` |
| error_message | text? | 실패 시 에러 메시지 |
| created_at | timestamptz | 생성일 |
| updated_at | timestamptz | 수정일 |

**RLS:** 사용자는 자신의 데이터만 조회/수정 가능.

---

## 환경 변수

`.env.local` 파일에 아래 값을 설정하세요.

```env
NEXT_PUBLIC_SUPABASE_URL=https://<project-id>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
REPLICATE_API_TOKEN=<replicate-token>
```

---

## 시작하기

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

`http://localhost:3000` 에서 확인하세요.

---

## 인증

- Supabase Auth + Google OAuth
- 로그인 후 `/workspace` 로 리다이렉트
- `middleware.ts`가 모든 요청에서 세션을 자동 갱신
- 미인증 사용자는 `/auth` 로 리다이렉트

## Storage

- 버킷: `musics` (비공개)
- 경로 패턴: `{user_id}/{filename}.mp3`
- RLS: 사용자는 자신의 폴더(`foldername[1] = auth.uid()`)에만 접근 가능

결제 관련
1. 체크아웃

2.웹훅