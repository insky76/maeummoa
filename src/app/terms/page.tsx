import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, Section } from "@/components/LegalPage";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = { title: "이용약관" };

export default function TermsPage() {
  const L = LEGAL;
  return (
    <LegalPage title="이용약관" effectiveDate={L.effectiveDate}>
      <Section title="제1조 (목적)">
        <p>
          이 약관은 {L.operatorName}(이하 &ldquo;운영자&rdquo;)가 제공하는 {L.serviceName}({L.serviceUrl}, 이하 &ldquo;서비스&rdquo;)의
          이용 조건과 절차, 운영자와 이용자의 권리·의무를 정합니다.
        </p>
      </Section>

      <Section title="제2조 (서비스 내용)">
        <p>
          서비스는 한 사람(주인공)을 위한 응원 메시지를 여러 사람이 링크로 모아, 꽃다발·밤하늘·쪽지 벽 같은 화면으로 꾸며 전달하는 기능을
          무료로 제공합니다. 보드를 만들거나 선물을 보관하려면 카카오 또는 Google 로그인이 필요하고, 메시지를 남기는 참여자는 로그인 없이
          이용할 수 있습니다.
        </p>
      </Section>

      <Section title="제3조 (이용자의 의무)">
        <p>이용자는 다음 행위를 해서는 안 됩니다.</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>다른 사람을 비방·모욕하거나 명예를 훼손하는 내용, 욕설, 혐오 표현을 남기는 행위</li>
          <li>다른 사람의 개인정보를 동의 없이 올리거나, 다른 사람인 것처럼 꾸며 메시지를 남기는 행위</li>
          <li>음란물, 불법 정보, 광고·스팸을 올리는 행위</li>
          <li>자동화 도구로 메시지를 대량으로 남기거나 서비스 운영을 방해하는 행위</li>
          <li>그 밖에 법령이나 공공질서에 어긋나는 행위</li>
        </ul>
      </Section>

      <Section title="제4조 (게시물의 관리)">
        <ul className="list-disc space-y-1 pl-5">
          <li>메시지의 권리와 책임은 작성한 이용자에게 있습니다.</li>
          <li>
            보드 개설자는 자신의 보드에 남겨진 메시지를 숨기거나, 고치거나(&lsquo;개설자가 수정함&rsquo; 표시), 지울 수 있습니다.
          </li>
          <li>제3조를 어긴 메시지는 신고할 수 있으며, 운영자는 법령 위반이 명백한 게시물을 알리지 않고 삭제하거나 이용을 제한할 수 있습니다.</li>
        </ul>
      </Section>

      <Section title="제5조 (서비스의 변경과 중단)">
        <p>
          운영자는 서비스 개선을 위해 기능을 바꾸거나, 점검·장애·운영상 사정으로 서비스를 일시 중단할 수 있습니다. 서비스를 종료할 때는
          30일 전에 서비스 화면으로 알리고, 이용자가 자신의 보드와 메시지를 확인할 수 있는 기간을 둡니다.
        </p>
      </Section>

      <Section title="제6조 (책임의 제한)">
        <p>
          서비스는 무료로 제공되며, 운영자는 고의 또는 중대한 과실이 없는 한 서비스 이용 중 이용자 사이에 생긴 분쟁이나, 이용자가 올린
          게시물로 생긴 손해에 대해 책임을 지지 않습니다. 천재지변, 외부 서비스(호스팅·데이터베이스·로그인 제공자)의 장애 등 운영자가
          통제할 수 없는 사유로 생긴 손해도 같습니다.
        </p>
      </Section>

      <Section title="제7조 (개인정보 보호)">
        <p>
          운영자는 관련 법령에 따라 이용자의 개인정보를 보호하며, 자세한 내용은{" "}
          <Link href="/privacy" className="underline underline-offset-4">
            개인정보처리방침
          </Link>
          에 따릅니다.
        </p>
      </Section>

      <Section title="제8조 (약관의 변경)">
        <p>
          운영자는 필요한 경우 관련 법령을 어기지 않는 범위에서 약관을 바꿀 수 있으며, 바꾼 약관은 시행 7일 전부터 서비스 화면으로
          알립니다. 이용자에게 불리한 변경은 30일 전부터 알립니다.
        </p>
      </Section>

      <Section title="제9조 (문의와 분쟁 해결)">
        <p>
          서비스 이용 문의는 {L.contactEmail} 로 보내 주세요. 이 약관과 서비스 이용에 관한 분쟁은 대한민국 법을 따르며, 관할 법원은
          민사소송법에 따릅니다.
        </p>
      </Section>
    </LegalPage>
  );
}
