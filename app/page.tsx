import Link from "next/link";

export default function Home({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-slate-900 mb-3">📬 Maily</h1>
          <p className="text-slate-500 text-lg">
            받은편지함을 스캔해서 구독 메일을 한 번에 정리하세요
          </p>
        </div>

        <ErrorBanner searchParams={searchParams} />

        {/* Connection Options */}
        <div className="flex flex-col gap-4">
          {/* Gmail */}
          <a
            href="/api/auth/gmail"
            className="group flex items-center gap-5 rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm transition-all hover:border-blue-400 hover:shadow-md"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-50 text-2xl">
              <GmailIcon />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-slate-900">Gmail로 계속하기</p>
              <p className="text-sm text-slate-500 mt-0.5">
                Google OAuth로 안전하게 연결 — 비밀번호 불필요
              </p>
            </div>
            <svg
              className="h-5 w-5 text-slate-300 transition-colors group-hover:text-blue-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </a>

          {/* iCloud */}
          <Link
            href="/connect/icloud"
            className="group flex items-center gap-5 rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm transition-all hover:border-sky-400 hover:shadow-md"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-2xl">
              <ICloudIcon />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-slate-900">iCloud Mail 연결</p>
              <p className="text-sm text-slate-500 mt-0.5">
                앱 전용 비밀번호로 IMAP 연결 (iCloud 2단계 인증 필요)
              </p>
            </div>
            <svg
              className="h-5 w-5 text-slate-300 transition-colors group-hover:text-sky-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </Link>
        </div>

        <p className="mt-8 text-center text-xs text-slate-400">
          메일 데이터는 서버에 저장되지 않습니다. 세션 내에서만 처리됩니다.
        </p>
      </div>
    </main>
  );
}

async function ErrorBanner({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  if (!error) return null;

  const messages: Record<string, string> = {
    no_code: "Google 인증이 취소되었습니다.",
    oauth_failed: "Google 로그인에 실패했습니다. 다시 시도해 주세요.",
  };

  return (
    <div className="mb-6 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
      {messages[error] ?? "오류가 발생했습니다."}
    </div>
  );
}

function GmailIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" aria-hidden="true">
      <path
        d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z"
        fill="#EA4335"
      />
    </svg>
  );
}

function ICloudIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" aria-hidden="true">
      <path
        d="M19.45 9.87A5.5 5.5 0 0 0 14 6a5.49 5.49 0 0 0-4.9 3.02A4.5 4.5 0 0 0 4.5 13.5a4.5 4.5 0 0 0 4.5 4.5h10a3.5 3.5 0 0 0 .45-6.97z"
        fill="#0071E3"
      />
    </svg>
  );
}
