import type { Metadata } from "next";
import { LegalPage, Section } from "@/components/LegalPage";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = { title: "개인정보처리방침" };

const th = "border border-line px-3 py-2 text-left align-top font-bold bg-surface";
const td = "border border-line px-3 py-2 align-top";

export default function PrivacyPage() {
  const L = LEGAL;
  return (
    <LegalPage title="개인정보처리방침" effectiveDate={L.effectiveDate}>
      <p>
        {L.serviceName}({L.serviceUrl}, 이하 &ldquo;서비스&rdquo;)는 「개인정보 보호법」에 따라 이용자의 개인정보를 보호하고, 관련
        고충을 신속하게 처리하기 위해 다음과 같이 개인정보처리방침을 둡니다.
      </p>

      <Section title="1. 처리하는 개인정보 항목">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className={th}>구분</th>
                <th className={th}>항목</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className={td}>로그인 이용자 (보드를 만드는 사람, 선물을 보관하는 사람)</td>
                <td className={td}>
                  카카오 또는 Google 계정 식별값, 닉네임(이름), 프로필 사진 주소. Google 로그인 시 이메일 주소. 로그인 기록
                </td>
              </tr>
              <tr>
                <td className={td}>참여자 (로그인 없이 메시지를 남기는 사람)</td>
                <td className={td}>
                  작성 시 입력한 이름, 메시지 내용, 꾸밈 선택, 비밀번호(복원할 수 없게 암호화해 저장)
                </td>
              </tr>
              <tr>
                <td className={td}>자동으로 생성·수집되는 정보</td>
                <td className={td}>
                  기기 구분용 임의 식별 쿠키, 접속 IP와 기기 식별값을 원래 값으로 되돌릴 수 없게 변환한 값(해시), 내가 쓴 메시지를 기억하는
                  쿠키, 로그인 유지 쿠키, 신고 시 신고 사유, 서비스 이용 기록
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-sm text-ink-sub">접속 IP 원문과 비밀번호 원문은 저장하지 않습니다.</p>
      </Section>

      <Section title="2. 처리 목적">
        <ul className="list-disc space-y-1 pl-5">
          <li>보드 만들기·관리, 메시지 작성·수정·삭제, 선물 전달과 보관 등 서비스 제공</li>
          <li>로그인과 본인 확인 (참여자는 비밀번호로 본인 메시지 확인)</li>
          <li>같은 기기·네트워크의 연속 작성 제한, 신고 처리 등 악용 방지</li>
          <li>문의 응대와 서비스 개선</li>
        </ul>
      </Section>

      <Section title="3. 보유 및 이용 기간">
        <ul className="list-disc space-y-1 pl-5">
          <li>로그인 이용자 정보: 탈퇴(삭제) 요청 시까지. 요청을 받으면 지체 없이 삭제합니다.</li>
          <li>보드와 메시지: 개설자가 보드를 삭제하면 그 보드의 메시지·신고 기록과 함께 즉시 삭제합니다.</li>
          <li>참여자 메시지: 참여자가 직접 삭제하거나, 개설자가 메시지 또는 보드를 삭제할 때까지 보관합니다.</li>
          <li>쿠키: 로그인 유지 쿠키는 로그아웃 시, 기기 식별 쿠키는 최대 1년, 내가 쓴 메시지 쿠키는 최대 180일 후 만료됩니다.</li>
          <li>법령에서 보관 기간을 정한 경우에는 그 기간 동안 보관합니다.</li>
        </ul>
      </Section>

      <Section title="4. 개인정보의 공개와 제3자 제공">
        <p>
          서비스는 이용자의 개인정보를 제3자에게 판매하거나 제공하지 않습니다. 다만 서비스의 성격상, 참여자가 남긴 이름과 메시지는 보드
          개설자에게 보이고, 선물 링크를 받은 사람(주인공)과 개설자가 공개로 설정한 경우 선물 링크를 가진 사람에게 보입니다. 개설자가
          &lsquo;다른 사람 메시지 미리 보기&rsquo;를 켠 경우 참여 링크를 가진 사람에게도 보입니다.
        </p>
      </Section>

      <Section title="5. 처리 위탁 및 국외 이전">
        <p>서비스 운영을 위해 아래 업체에 개인정보 처리를 맡기고 있으며, 일부는 국외에서 처리됩니다.</p>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className={th}>받는 자</th>
                <th className={th}>맡기는 업무</th>
                <th className={th}>이전 국가·방법</th>
                <th className={th}>항목·보유 기간</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className={td}>Supabase Inc.</td>
                <td className={td}>데이터베이스 저장, 로그인 처리</td>
                <td className={td}>{L.dataRegion} 소재 서버에 서비스 이용 시 네트워크로 전송</td>
                <td className={td}>1번의 모든 항목, 위 보유 기간과 같음</td>
              </tr>
              <tr>
                <td className={td}>Vercel Inc.</td>
                <td className={td}>웹 서비스 호스팅, 화면 제공</td>
                <td className={td}>미국 등 Vercel 서버 소재 국가, 서비스 이용 시 네트워크로 전송</td>
                <td className={td}>요청 처리에 필요한 접속 정보, 처리 후 서버 기록 보관 기간 동안</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-sm text-ink-sub">
          카카오·Google 로그인을 선택하면 해당 회사의 인증 절차를 거치며, 그 과정의 개인정보 처리는 각 회사의 방침을 따릅니다.
        </p>
      </Section>

      <Section title="6. 개인정보의 파기 절차와 방법">
        <p>
          보유 기간이 끝나거나 처리 목적을 이룬 개인정보는 지체 없이 파기합니다. 전자 파일 형태의 정보는 복구할 수 없는 방법으로
          삭제합니다.
        </p>
      </Section>

      <Section title="7. 이용자의 권리와 행사 방법">
        <ul className="list-disc space-y-1 pl-5">
          <li>이용자는 언제든지 자신의 개인정보 열람, 정정, 삭제, 처리 정지를 요청할 수 있습니다.</li>
          <li>참여자는 작성할 때 정한 비밀번호로 보드가 마감되기 전까지 직접 메시지를 고치거나 지울 수 있습니다.</li>
          <li>로그인 이용자는 보드를 직접 삭제할 수 있으며, 계정 삭제는 아래 연락처로 요청하면 처리합니다.</li>
          <li>요청은 {L.contactEmail} 로 보내 주시면 지체 없이 조치하고 결과를 알려 드립니다.</li>
        </ul>
      </Section>

      <Section title="8. 안전성 확보 조치">
        <ul className="list-disc space-y-1 pl-5">
          <li>비밀번호는 복원할 수 없는 방식(bcrypt)으로 암호화해 저장합니다.</li>
          <li>기기·IP 정보는 원래 값으로 되돌릴 수 없는 해시값으로만 저장합니다.</li>
          <li>데이터베이스 접근 권한을 본인 데이터로 제한하고, 쓰기는 서버에서만 합니다.</li>
          <li>모든 통신은 HTTPS 로 암호화합니다.</li>
        </ul>
      </Section>

      <Section title="9. 쿠키의 사용">
        <p>
          서비스는 로그인 유지, 기기 구분(연속 작성 제한·중복 신고 방지), 내가 쓴 메시지 기억을 위해 쿠키를 사용합니다. 광고나 행태
          분석 목적의 쿠키는 사용하지 않습니다. 브라우저 설정에서 쿠키를 거부할 수 있지만, 그 경우 로그인과 일부 기능을 쓸 수 없습니다.
        </p>
      </Section>

      <Section title="10. 만 14세 미만 아동">
        <p>서비스는 만 14세 미만 아동의 로그인 가입을 받지 않습니다.</p>
      </Section>

      <Section title="11. 개인정보 보호책임자">
        <p>
          성명: {L.operatorName}
          <br />
          연락처: {L.contactEmail}
        </p>
        <p className="text-sm text-ink-sub">
          개인정보 침해에 대한 상담이 필요하면 개인정보침해신고센터(privacy.kisa.or.kr, 국번 없이 118), 개인정보분쟁조정위원회
          (kopico.go.kr, 1833-6972)에 문의할 수 있습니다.
        </p>
      </Section>

      <Section title="12. 방침의 변경">
        <p>이 방침은 {L.effectiveDate}부터 적용됩니다. 내용이 바뀌면 시행 7일 전부터 서비스 화면을 통해 알립니다.</p>
      </Section>
    </LegalPage>
  );
}
