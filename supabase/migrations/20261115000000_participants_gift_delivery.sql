-- M3~M6: 참여자 작성·수정, 주인공 선물 페이지, 관리·전달, 신고
--
-- 모든 쓰기는 서버(service role)가 한다. 이 파일의 함수도 service role 전용이며
-- anon·authenticated 에게는 실행 권한을 주지 않는다 (PostgREST RPC 로 노출되지 않게).

-- ─────────────────────────────────────────────
-- messages: 비밀번호 잠금, 같은 네트워크 작성 제한
-- ─────────────────────────────────────────────
alter table public.messages
  add column if not exists pw_fail_count   integer not null default 0,   -- 연속으로 틀린 횟수
  add column if not exists pw_locked_until timestamptz,                  -- 잠금 해제 시각
  add column if not exists ip_hash         text;                         -- 같은 네트워크 작성 제한용 (IP 의 HMAC, 원문 저장 금지)

create index if not exists messages_ip_idx on public.messages (board_id, ip_hash, created_at);

-- authenticated 의 messages 조회 권한은 컬럼 단위로만 주어져 있으므로
-- 새 컬럼(pw_fail_count, pw_locked_until, ip_hash)은 개설자에게도 보이지 않는다.

-- ─────────────────────────────────────────────
-- boards: 비공개 선물의 주인공 계정, 개설자가 마지막으로 메시지를 확인한 시각
-- ─────────────────────────────────────────────
alter table public.boards
  add column if not exists recipient_user_id uuid references public.profiles (id) on delete set null,
  add column if not exists owner_seen_at     timestamptz;

-- ─────────────────────────────────────────────
-- reports: 같은 기기에서 같은 메시지를 여러 번 신고하지 못하게
-- ─────────────────────────────────────────────
create unique index if not exists reports_message_device_uniq
  on public.reports (message_id, client_hash)
  where client_hash is not null;

-- ─────────────────────────────────────────────
-- 함수 (service role 전용)
-- ─────────────────────────────────────────────

-- 비밀번호를 틀렸을 때: 실패 횟수를 원자적으로 올리고, p_max 회에 닿으면 잠근다.
-- 잠긴 시각(잠기지 않았으면 null)과 남은 시도 횟수를 돌려준다.
create or replace function public.mm_password_failed(p_message_id uuid, p_max integer, p_lock_minutes integer)
returns table (locked_until timestamptz, remaining integer)
language plpgsql
set search_path = public
as $$
declare
  v_count integer;
begin
  update public.messages
     set pw_fail_count = pw_fail_count + 1
   where id = p_message_id
  returning pw_fail_count into v_count;

  if v_count is null then
    return;
  end if;

  if v_count >= p_max then
    update public.messages
       set pw_fail_count = 0,
           pw_locked_until = now() + make_interval(mins => p_lock_minutes)
     where id = p_message_id;
    return query select now() + make_interval(mins => p_lock_minutes), 0;
  else
    return query select null::timestamptz, p_max - v_count;
  end if;
end;
$$;

-- 신고: 같은 기기는 한 번만. 새로 신고됐으면 report_count 를 올리고 true.
create or replace function public.mm_report_message(p_message_id uuid, p_client_hash text, p_reason text)
returns boolean
language plpgsql
set search_path = public
as $$
declare
  v_inserted integer;
begin
  insert into public.reports (message_id, client_hash, reason)
  values (p_message_id, p_client_hash, left(p_reason, 200))
  on conflict do nothing;
  get diagnostics v_inserted = row_count;

  if v_inserted > 0 then
    update public.messages set report_count = report_count + 1 where id = p_message_id;
    return true;
  end if;
  return false;
end;
$$;

-- 비공개 선물: 처음 연 로그인 사용자가 주인공이 된다 (이미 정해졌으면 바꾸지 않음).
-- 주인공으로 정해졌거나 이미 그 사람이면 true.
create or replace function public.mm_claim_gift(p_board_id uuid, p_user_id uuid)
returns boolean
language plpgsql
set search_path = public
as $$
declare
  v_owner uuid;
begin
  update public.boards
     set recipient_user_id = p_user_id
   where id = p_board_id
     and recipient_user_id is null
     and owner_id <> p_user_id;

  select recipient_user_id into v_owner from public.boards where id = p_board_id;
  return coalesce(v_owner = p_user_id, false);
end;
$$;

-- Supabase 는 public 스키마의 새 함수에 anon·authenticated 실행 권한을 기본으로 준다. 모두 거둔다.
revoke execute on function public.mm_password_failed(uuid, integer, integer) from public, anon, authenticated;
revoke execute on function public.mm_report_message(uuid, text, text)       from public, anon, authenticated;
revoke execute on function public.mm_claim_gift(uuid, uuid)                 from public, anon, authenticated;
grant  execute on function public.mm_password_failed(uuid, integer, integer) to service_role;
grant  execute on function public.mm_report_message(uuid, text, text)       to service_role;
grant  execute on function public.mm_claim_gift(uuid, uuid)                 to service_role;

-- 이전 마이그레이션의 함수들도 같은 기준으로 맞춘다 (트리거 전용이라 직접 호출할 일이 없다).
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.set_updated_at()  from public, anon, authenticated;
