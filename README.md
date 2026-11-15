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
    boards/[id]/          보드 관리 (현황·메시지·설정 탭, 마감, 전달) + 서버 액션
    boards/[id]/share/    완료 · 링크 공유 (복사, 카카오톡, QR)
    boards/[id]/preview/  결과 미리 보기 (개설자)
    w/[code]/             참여 (W-01) · write 작성 · done 완료 · mine 내 메시지 수정·삭제
    g/[code]/             선물 (오프닝 → 장면 ↔ 목록), image 결과 이미지 저장
    */opengraph-image     카카오톡·메신저 링크 미리보기 이미지
    actions/report.ts     신고
  components/             공용 UI (로고, 아이콘, 테마 그림, 시트), gift/ 선물 장면
  lib/
    domain.ts             상황·테마·문구·제한값
    variants.ts           꾸밈 (꽃 종류·별 색·쪽지 색)
    gift-access.ts        선물 공개 규칙 (서프라이즈·예약·비공개)
    scene-layout.ts       장면 배치 (보드 id 시드)
    moderation.ts         금칙어
    josa.ts               조사 (이/가, 을/를 …)
    codes.ts              참여·선물 링크 코드 생성
    server/               공개 조회, 기기·IP 해시, 내 메시지 쿠키, 이미지 그리기
    supabase/             server / client / admin(service role) 클라이언트
  middleware.ts           세션 갱신, 로그인 필요 경로 보호
supabase/migrations/      DB 스키마 (RLS 포함)
```

## 외부 서비스 설정

### 1. Supabase 프로젝트

1. https://supabase.com 에서 새 프로젝트를 만든다. 리전은 `Northeast Asia (Seoul)` 권장.
2. **SQL Editor**에서 `supabase/migrations/` 의 파일을 **모두, 파일 이름 순서대로** 붙여 넣고 실행한다.
   - `20261109000000_init.sql` → `20261109010000_saved_gifts_server_only.sql` → `20261114000000_owner_writes_server_only.sql` → `20261115000000_participants_gift_delivery.sql` → (이후 추가되는 파일)
   - 뒤의 파일에 보안 설정이 들어 있으므로 하나라도 빠뜨리면 안 된다.
   - Supabase CLI를 쓴다면 `supabase link` 후 `supabase db push` 로 한 번에 적용된다.
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

### 4. 카카오톡 공유 (선택)

1. 카카오 개발자 › 앱 키 › **JavaScript 키**를 `NEXT_PUBLIC_KAKAO_JS_KEY`에 넣는다.
2. **플랫폼 › Web** 사이트 도메인에 배포 주소가 있어야 공유가 된다.
3. 키가 없으면 공유 버튼은 기기 공유 시트 → 링크 복사로 동작한다.
4. 미리보기 카드는 링크 페이지의 OG 이미지(`/w/{code}/opengraph-image`)를 쓴다. 카카오는 미리보기를 캐시하므로, 바뀐 이미지가 안 보이면 [카카오 공유 디버거](https://developers.kakao.com/tool/debugger/sharing)에서 캐시를 지운다.

### 5. Vercel 배포

1. GitHub 저장소를 Vercel에 Import (Framework: Next.js, 설정 변경 없음)
2. **Settings › Environment Variables**에 `.env.example`의 항목을 모두 넣는다.
   - `NEXT_PUBLIC_SITE_URL`은 배포 주소 (예: `https://maeummoa.vercel.app`). 처음 배포라 주소를 모르면 이 항목을 아예 넣지 않아도 된다 (Vercel 배포 주소를 자동으로 쓴다). 나중에 도메인을 연결하면 그 주소로 넣는다.
   - `SUPABASE_SERVICE_ROLE_KEY`, `MM_SECRET`은 Production·Preview 모두에 넣되 공개 저장소에는 절대 올리지 않는다.
3. **Deploy**. 배포 주소를 Supabase **Redirect URLs**, 카카오 **사이트 도메인**에 추가한다.
4. 결과 이미지 저장(`/g/{code}/image`)은 메시지가 많으면 몇 초 걸린다. 라우트에 `maxDuration = 30`이 설정되어 있다.
5. 배포 후 확인: 보드 만들기 → 참여 링크로 메시지 작성 → 보드 관리에서 전달 → 선물 링크 열기 → 이미지 저장

## 보안 원칙

- 참여자(비로그인)의 작성·수정·삭제와 선물 페이지 조회는 모두 서버 API에서 service role로 처리한다. RLS에는 익명 정책을 두지 않는다.
- 개설자의 쓰기(보드 생성·수정, 메시지 관리, 마감·전달)도 서버에서 service role로 처리한다. 로그인 사용자(authenticated)에게는 `boards`·`messages`·`reports` 쓰기 권한이 없고, 조회만 RLS로 본인 것에 한해 허용한다. 서버는 `getUser()`로 확인한 id가 `boards.owner_id`와 같은지 먼저 확인한 뒤 쓴다.
- 메시지 비밀번호는 bcrypt 해시로만 저장한다. 개설자도 `password_hash`, `client_hash` 컬럼은 조회할 수 없다.
- 클라이언트에서 `messages`를 조회할 때는 `select('*')` 대신 컬럼을 명시한다.
- 참여자 기기·IP 는 `MM_SECRET` HMAC 해시로만 저장한다 (`messages.client_hash`, `ip_hash`, `reports.client_hash`).
- DB 함수(`mm_*`)는 service role 전용이다. anon·authenticated 에서는 실행 권한을 거뒀다.

## 운영 규칙 (코드 위치)

| 규칙 | 값 | 위치 |
|---|---|---|
| 비밀번호 | 숫자 4자리, bcrypt. 5회 틀리면 10분 잠금 | `LIMITS`, `mm_password_failed` |
| 같은 기기 작성 | 30초 간격, 보드당 하루 5개 | `LIMITS.deviceCooldownSec`, `devicePerDay` |
| 같은 네트워크 작성 | 보드당 한 시간 30개 | `LIMITS.ipPerHour` |
| 금칙어 | 띄어쓰기·기호 우회 정규화 후 포함 검사 | `lib/moderation.ts` |
| 신고 | 기기당 한 번, 관리 화면에 신고 수 표시 (자동 숨김 없음) | `mm_report_message` |
| 참여자 수정·삭제 | 모으는 중에만. 승인 후 게시 보드는 고치면 다시 확인 대기 | `w/[code]/actions.ts` |
| 선물 공개 | 서프라이즈 ON: 전달·예약 시각 이후 / OFF: 언제나 / 비공개: 처음 받은 로그인 계정 | `lib/gift-access.ts` |
| 선물 완성 | 서프라이즈 ON: "선물 완성하기" = 마감 + 선물 링크 열기 (실제 전달은 개설자가 링크를 보낼 때) / OFF: 선물 링크가 처음부터 열려 있어 "선물 링크 보내기"만, 마감일까지 계속 받음 | `boards/[id]/BoardControls.tsx` |
| 장면 확장 | 메시지 50개 이상이면 꽃밭·은하수·3열 쪽지 | `LIMITS.sceneExpandAt` |
| 결과 이미지 | 먼저 남긴 24개 메시지, 120자까지, 이모지 제외 | `lib/server/og-images.tsx` |

## 개발 순서 (MVP)

- [x] M1 기반: 프로젝트 셋업, DB 스키마, 카카오·구글 로그인
- [x] M2 개설자: 보드 만들기 4단계, 내 보드, 링크 공유 (보드 관리는 현황 요약까지)
- [x] M3 참여자: 참여 페이지, 작성·수정·삭제, 금칙어, 작성 횟수 제한
- [x] M4 주인공: 오프닝, 테마 3종 장면, 목록 보기
- [x] M5 관리·전달: 메시지 관리, 마감, 전달, 예약 공개
- [x] M6 마무리: 카카오톡 미리보기 이미지, 이미지 저장, 신고, 배포 안내
- [ ] 출시 전: 카카오·Google 로그인 설정, Vercel 배포, 실제 기기 카카오톡 공유 확인
