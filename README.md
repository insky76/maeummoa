# 마음모아

한 사람을 위한 응원 보드. 링크 하나로 여러 사람의 응원 메시지를 모아 꽃다발·밤하늘·쪽지 벽으로 꾸며 선물한다.

- 기획 결정 사항: [`docs/PRODUCT.md`](docs/PRODUCT.md)
- 스택: Next.js 15 (App Router, TypeScript) · Tailwind CSS 4 · Supabase (Postgres, Auth) · Vercel

## 로컬 실행

```bash
npm install
cp .env.example .env.local   # 값 채우기 (아래 "외부 서비스 설정")
npm run dev                  # http://localhost:3000
```

Supabase 키가 없어도 화면은 뜬다. 로그인과 DB가 필요한 기능만 "키가 연결되지 않았어요" 안내가 나온다.

## 폴더 구조

```
src/
  app/
    page.tsx              홈
    login/                로그인 (카카오·구글)
    auth/callback/        OAuth 콜백 → 세션 교환
    auth/signout/         로그아웃
    new/                  보드 만들기 4단계 + 서버 액션
    me/                   내 보드 (만든 / 받은)
    boards/[id]/          보드 관리 (현황)
    boards/[id]/share/    완료 · 링크 공유 (복사, 카카오톡, QR)
  components/             공용 UI (로고, 아이콘, 테마 그림)
  lib/
    domain.ts             상황·테마·문구·제한값
    codes.ts              참여·선물 링크 코드 생성
    supabase/             server / client / admin(service role) 클라이언트
  middleware.ts           세션 갱신, 로그인 필요 경로 보호
supabase/migrations/      DB 스키마 (RLS 포함)
```

## 외부 서비스 설정

### 1. Supabase 프로젝트

1. https://supabase.com 에서 새 프로젝트를 만든다. 리전은 `Northeast Asia (Seoul)` 권장.
2. **SQL Editor**에서 `supabase/migrations/20261109000000_init.sql` 내용을 붙여 넣고 실행한다.
   (Supabase CLI를 쓴다면 `supabase link` 후 `supabase db push`)
3. **Project Settings › API**에서 아래 값을 `.env.local`에 넣는다.
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - service_role key → `SUPABASE_SERVICE_ROLE_KEY` (서버 전용, 절대 공개 금지)
4. **Authentication › URL Configuration**
   - Site URL: 배포 주소 (로컬 개발 중에는 `http://localhost:3000`)
   - Redirect URLs: `http://localhost:3000/**`, 배포 주소 `https://<도메인>/**`

### 2. 카카오 로그인

1. https://developers.kakao.com › 내 애플리케이션 › 애플리케이션 추가
2. **앱 설정 › 플랫폼 › Web**: 사이트 도메인에 `http://localhost:3000`과 배포 주소 등록
3. **제품 설정 › 카카오 로그인**: 활성화 ON, Redirect URI에 `https://<프로젝트>.supabase.co/auth/v1/callback` 등록
4. **동의항목**: 닉네임, 프로필 사진을 설정
   - 이메일(account_email)은 비즈 앱 전환이 필요하다. 앱은 닉네임·프로필 사진만 요청하도록 되어 있다.
5. **보안**: Client Secret 코드 생성 후 활성화
6. Supabase **Authentication › Providers › Kakao**를 켜고
   - Client ID = 카카오 **REST API 키**
   - Client Secret = 위에서 만든 코드
   - 이메일 없이 가입을 허용하는 옵션이 있다면 켠다. 없다면 카카오 비즈 앱 전환 후 이메일 동의항목을 추가해야 한다.

### 3. Google 로그인

1. https://console.cloud.google.com › API 및 서비스 › OAuth 동의 화면 설정
2. 사용자 인증 정보 › OAuth 클라이언트 ID (웹 애플리케이션)
   - 승인된 리디렉션 URI: `https://<프로젝트>.supabase.co/auth/v1/callback`
3. Supabase **Authentication › Providers › Google**에 Client ID / Secret 입력

### 4. Vercel 배포

1. GitHub 저장소를 Vercel에 Import
2. Environment Variables에 `.env.example`의 항목을 모두 넣고, `NEXT_PUBLIC_SITE_URL`은 배포 주소로
3. 배포 주소를 Supabase Redirect URLs, 카카오 사이트 도메인에 추가

## 보안 원칙

- 참여자(비로그인)의 작성·수정·삭제와 선물 페이지 조회는 모두 서버 API에서 service role로 처리한다. RLS에는 익명 정책을 두지 않는다.
- 메시지 비밀번호는 bcrypt 해시로만 저장한다. 개설자도 `password_hash`, `client_hash` 컬럼은 조회할 수 없다.
- 클라이언트에서 `messages`를 조회할 때는 `select('*')` 대신 컬럼을 명시한다.

## 개발 순서 (MVP)

- [x] M1 기반: 프로젝트 셋업, DB 스키마, 카카오·구글 로그인
- [x] M2 개설자: 보드 만들기 4단계, 내 보드, 링크 공유 (보드 관리는 현황 요약까지)
- [ ] M3 참여자: 참여 페이지, 작성·수정·삭제, 금칙어, 작성 횟수 제한
- [ ] M4 주인공: 오프닝, 테마 3종 장면, 목록 보기
- [ ] M5 관리·전달: 메시지 관리, 마감, 전달, 예약 공개
- [ ] M6 마무리: 카카오톡 미리보기 이미지, 이미지 저장, 신고, 배포
