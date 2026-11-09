import { CreateWizard } from "./CreateWizard";
import { todayKST } from "@/lib/date";

export const metadata = { title: "보드 만들기" };
// 오늘 날짜(KST)를 요청마다 계산해야 하므로 정적 생성하지 않는다.
export const dynamic = "force-dynamic";

export default function NewBoardPage() {
  // 마감일 프리셋 계산 기준일. 서버에서 KST 로 정해 내려보내 클라이언트 시계 차이를 피한다.
  return <CreateWizard today={todayKST()} />;
}
