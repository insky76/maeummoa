-- 마음모아 초기 스키마
-- 공개 접근(참여자·선물 열람자)은 모두 서버 API가 service role 로 처리한다.
-- 따라서 RLS 정책은 "로그인한 본인" 접근만 허용하고, 익명 정책은 두지 않는다.

create extension if not exists pgcrypto;

-- ─────────────────────────────────────────────
-- 공통: updated_at 자동 갱신
-- ─────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ─────────────────────────────────────────────
-- profiles: 개설자·주인공 계정
-- ─────────────────────────────────────────────
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  nickname    text,
  avatar_url  text,
  created_at  timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, nickname, avatar_url)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'name',
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'nickname',
      new.raw_user_meta_data ->> 'preferred_username'
    ),
    coalesce(
      new.raw_user_meta_data ->> 'avatar_url',
      new.raw_user_meta_data ->> 'picture'
    )
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─────────────────────────────────────────────
-- boards: 보드
-- ─────────────────────────────────────────────
create type public.board_status as enum ('collecting', 'closed', 'delivered');

create table public.boards (
  id                    uuid primary key default gen_random_uuid(),
  owner_id              uuid not null references public.profiles (id) on delete cascade,

  recipient_name        text not null check (char_length(recipient_name) between 1 and 30),
  occasion              text not null check (occasion in ('birthday', 'pass', 'leave', 'cheer', 'coworker', 'etc')),
  theme                 text not null check (theme in ('flower', 'star', 'note', 'light', 'letter')),
  title                 text not null check (char_length(title) between 1 and 60),
  intro                 text check (char_length(intro) <= 300),
  deadline_at           timestamptz not null,

  status                public.board_status not null default 'collecting',
  join_code             text not null unique,   -- 참여 링크 /w/{join_code}
  gift_code             text unique,            -- 선물 링크 /g/{gift_code}
  reveal_at             timestamptz,            -- 예약 공개 시각 (null 이면 즉시)
  delivered_at          timestamptz,

  -- 운영 정책
  opt_preview_messages  boolean not null default true,   -- 다른 사람 메시지 미리 보기
  opt_require_approval  boolean not null default false,  -- 승인 후 게시
  opt_surprise          boolean not null default true,   -- ON: 전달 시 선물 링크 생성 / OFF: 생성 즉시 선물 링크 발급(실시간 열람)
  opt_public_result     boolean not null default true,   -- 선물 링크를 가진 누구나 열람

  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index boards_owner_idx on public.boards (owner_id, created_at desc);

create trigger boards_updated_at
  before update on public.boards
  for each row execute function public.set_updated_at();

-- ─────────────────────────────────────────────
-- messages: 응원 메시지
-- ─────────────────────────────────────────────
create type public.message_status as enum ('visible', 'pending', 'hidden');

create table public.messages (
  id               uuid primary key default gen_random_uuid(),
  board_id         uuid not null references public.boards (id) on delete cascade,

  nickname         text not null check (char_length(nickname) between 1 and 20),
  body             text not null check (char_length(body) between 1 and 300),
  style            jsonb not null default '{}'::jsonb,   -- 테마별 꾸밈 정보 예: {"flower":"rose"}

  password_hash    text not null,                       -- bcrypt, 원문 저장 금지
  status           public.message_status not null default 'visible',
  edited_by_owner  boolean not null default false,
  report_count     integer not null default 0,
  client_hash      text,                                -- 연속 작성 제한용 (IP+UA 해시, 원문 저장 금지)

  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index messages_board_idx on public.messages (board_id, created_at);
create index messages_rate_idx on public.messages (board_id, client_hash, created_at);

create trigger messages_updated_at
  before update on public.messages
  for each row execute function public.set_updated_at();

-- ─────────────────────────────────────────────
-- reports: 신고
-- ─────────────────────────────────────────────
create table public.reports (
  id           uuid primary key default gen_random_uuid(),
  message_id   uuid not null references public.messages (id) on delete cascade,
  reason       text check (char_length(reason) <= 200),
  client_hash  text,
  created_at   timestamptz not null default now()
);

create index reports_message_idx on public.reports (message_id);

-- ─────────────────────────────────────────────
-- saved_gifts: 받은 보드 보관함
-- ─────────────────────────────────────────────
create table public.saved_gifts (
  user_id   uuid not null references public.profiles (id) on delete cascade,
  board_id  uuid not null references public.boards (id) on delete cascade,
  saved_at  timestamptz not null default now(),
  primary key (user_id, board_id)
);

-- ─────────────────────────────────────────────
-- RLS
-- ─────────────────────────────────────────────
alter table public.profiles    enable row level security;
alter table public.boards      enable row level security;
alter table public.messages    enable row level security;
alter table public.reports     enable row level security;
alter table public.saved_gifts enable row level security;

-- profiles: 본인만
create policy "profiles: read own"   on public.profiles for select using (auth.uid() = id);
create policy "profiles: update own" on public.profiles for update using (auth.uid() = id);

-- boards: 개설자 본인만 (참여·선물 페이지는 서버가 service role 로 조회)
create policy "boards: owner read"   on public.boards for select using (auth.uid() = owner_id);
create policy "boards: owner insert" on public.boards for insert with check (auth.uid() = owner_id);
create policy "boards: owner update" on public.boards for update using (auth.uid() = owner_id);
create policy "boards: owner delete" on public.boards for delete using (auth.uid() = owner_id);

-- messages: 보드 개설자만 직접 조회·관리 (작성은 서버 API 전용)
create policy "messages: owner read" on public.messages for select
  using (exists (select 1 from public.boards b where b.id = board_id and b.owner_id = auth.uid()));
create policy "messages: owner update" on public.messages for update
  using (exists (select 1 from public.boards b where b.id = board_id and b.owner_id = auth.uid()));
create policy "messages: owner delete" on public.messages for delete
  using (exists (select 1 from public.boards b where b.id = board_id and b.owner_id = auth.uid()));

-- password_hash·client_hash 는 개설자에게도 노출하지 않는다.
-- (테이블 단위 권한이 있으면 컬럼 revoke 가 먹지 않으므로, 테이블 권한을 거두고 필요한 컬럼만 다시 준다.
--  클라이언트에서 messages 를 조회할 때는 select('*') 대신 컬럼을 명시해야 한다.)
revoke select on public.messages from anon, authenticated;
grant select (id, board_id, nickname, body, style, status, edited_by_owner, report_count, created_at, updated_at)
  on public.messages to authenticated;

-- reports: 정책 없음 (service role 전용)

-- saved_gifts: 본인만
create policy "saved_gifts: read own"   on public.saved_gifts for select using (auth.uid() = user_id);
create policy "saved_gifts: insert own" on public.saved_gifts for insert with check (auth.uid() = user_id);
create policy "saved_gifts: delete own" on public.saved_gifts for delete using (auth.uid() = user_id);
