import Link from "next/link";
import { Wordmark } from "@/components/Logo";
import { ThemeTile } from "@/components/ThemeTile";

const STEPS = [
  { title: "보드 만들기", desc: "주인공과 어울리는 테마를 골라요" },
  { title: "링크 공유", desc: "친구들은 가입 없이 바로 메시지를 남겨요" },
  { title: "선물 전달", desc: "완성된 페이지를 주인공에게 보내요" },
];

export default function Home() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-[480px] flex-col bg-white">
      <header className="flex h-14 shrink-0 items-center justify-between px-5">
        <Wordmark />
        <Link href="/me" className="px-1 py-3 text-sm font-medium text-ink-sub">
          내 보드
        </Link>
      </header>

      <main className="flex flex-1 flex-col gap-8 px-6 pb-8 pt-4">
        <section className="flex flex-col gap-3.5">
          <span className="self-start rounded-full bg-brand-soft px-2.5 py-1.5 text-xs font-bold text-brand">
            한 사람을 위한 응원 보드
          </span>
          <h1 className="font-display text-[30px] font-bold leading-snug tracking-tight">
            흩어진 마음을 모아
            <br />한 사람에게 선물해요
          </h1>
          <p className="text-[15px] leading-relaxed text-ink-sub">
            링크 하나로 친구들의 응원 메시지를 모으고, 꽃다발·밤하늘·쪽지 벽으로 꾸며 전해요.
          </p>
        </section>

        <section className="grid grid-cols-3 gap-2.5" aria-label="테마 예시">
          {(
            [
              ["flower", "꽃다발"],
              ["star", "밤하늘"],
              ["note", "쪽지 벽"],
            ] as const
          ).map(([key, label]) => (
            <figure key={key} className="flex flex-col gap-2">
              <ThemeTile theme={key} />
              <figcaption className="text-center text-[13px] font-bold">{label}</figcaption>
            </figure>
          ))}
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-[17px] font-bold">이렇게 만들어요</h2>
          <ol className="flex flex-col gap-4">
            {STEPS.map((s, i) => (
              <li key={s.title} className="flex items-start gap-3.5">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink text-[13px] font-bold text-white">
                  {i + 1}
                </span>
                <div className="flex flex-col gap-0.5">
                  <strong className="text-[15px]">{s.title}</strong>
                  <span className="text-sm leading-normal text-ink-sub">{s.desc}</span>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </main>

      <div className="sticky bottom-0 border-t border-line-soft bg-white px-5 pb-6 pt-3">
        <Link
          href="/new"
          className="flex h-[54px] items-center justify-center rounded-2xl bg-brand text-base font-bold text-white"
        >
          보드 만들기
        </Link>
      </div>
    </div>
  );
}
