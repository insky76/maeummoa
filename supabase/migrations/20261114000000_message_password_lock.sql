-- 참여자 비밀번호 5회 실패 시 10분 잠금을 위한 컬럼
alter table public.messages
  add column pw_failed_count integer not null default 0,
  add column pw_locked_until timestamptz;

-- 개설자(authenticated)에게 노출하는 컬럼 목록은 그대로 둔다. (새 컬럼은 서버 전용)
