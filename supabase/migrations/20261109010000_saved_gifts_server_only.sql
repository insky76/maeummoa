-- 받은 보드 보관은 서버가 선물 코드를 확인한 뒤에만 추가한다.
-- 클라이언트가 임의의 board_id 를 보관함에 넣지 못하도록 insert 정책을 제거한다.
drop policy if exists "saved_gifts: insert own" on public.saved_gifts;
