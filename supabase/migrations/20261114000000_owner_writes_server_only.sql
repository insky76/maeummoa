-- 개설자 쓰기도 서버 전용으로 바꾼다.
--
-- 지금까지는 개설자가 공개 anon 키 + 자기 로그인 토큰으로 boards·messages 에 직접 쓸 수 있었다.
-- 그러면 서버 검증(zod, 서프라이즈 규칙, 출시 테마, 마감 60일 등)을 건너뛰고
--   - boards.status / gift_code / join_code / delivered_at 을 마음대로 바꾸거나
--   - 메시지 본문을 고치면서 edited_by_owner("개설자가 수정함" 표시)를 빼거나
--   - 참여자 메시지의 password_hash 를 덮어쓸 수 있었다.
--
-- 이제 boards·messages·reports 의 쓰기는 서버(service role)만 한다.
-- 서버는 getUser() 로 확인한 사용자 id 와 boards.owner_id 를 비교한 뒤에만 쓴다.
-- 조회(select)는 그대로 RLS 로 "본인 것만" 허용한다.

-- 1) 쓰기 권한 회수
revoke insert, update, delete on public.boards   from anon, authenticated;
revoke insert, update, delete on public.messages from anon, authenticated;
revoke insert, update, delete on public.reports  from anon, authenticated;
-- saved_gifts 추가는 이미 서버 전용(insert 정책 없음). 권한도 맞춰 둔다. 보관 해제(delete)는 본인이 할 수 있게 남긴다.
revoke insert, update on public.saved_gifts from anon, authenticated;
-- profiles 는 본인 닉네임·사진 수정만 허용한다.
revoke insert, delete on public.profiles from anon, authenticated;
revoke update on public.profiles from anon, authenticated;
grant update (nickname, avatar_url) on public.profiles to authenticated;

-- TRUNCATE 는 RLS 를 적용받지 않으므로 앱 역할에서 모두 거둔다 (PostgREST 로는 노출되지 않지만 방어용).
revoke truncate, references, trigger on all tables in schema public from anon, authenticated;

-- 2) 더 이상 쓰이지 않는 쓰기 정책 정리 (권한이 없으니 정책만 남아 있으면 헷갈린다)
drop policy if exists "boards: owner insert"   on public.boards;
drop policy if exists "boards: owner update"   on public.boards;
drop policy if exists "boards: owner delete"   on public.boards;
drop policy if exists "messages: owner update" on public.messages;
drop policy if exists "messages: owner delete" on public.messages;
