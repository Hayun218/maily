import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { fetchGmailMessages } from "@/lib/gmail";
import { fetchImapMessages } from "@/lib/imap";
import { processMessages } from "@/lib/detector";

export const maxDuration = 60; // Vercel Pro: up to 60s

export async function GET() {
  const session = await getSession();

  if (!session.provider) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  try {
    let raw;

    if (session.provider === "gmail" && session.gmail) {
      raw = await fetchGmailMessages(
        session.gmail.accessToken,
        session.gmail.refreshToken,
        session.gmail.expiryDate
      );
    } else if (session.provider === "icloud" && session.icloud) {
      raw = await fetchImapMessages(
        session.icloud.email,
        session.icloud.password
      );
    } else {
      return NextResponse.json({ error: "인증 정보가 없습니다." }, { status: 401 });
    }

    const senders = processMessages(raw);
    return NextResponse.json({ senders, total: raw.length });
  } catch (err) {
    console.error("[scan]", err);
    const msg = err instanceof Error ? err.message : "";
    const isAuth =
      msg.includes("Authentication failed") ||
      msg.includes("AUTHENTICATIONFAILED") ||
      msg.includes("Invalid credentials");
    return NextResponse.json(
      {
        error: isAuth
          ? "인증 실패: 이메일 또는 앱 전용 비밀번호를 확인하세요."
          : "이메일 스캔 중 오류가 발생했습니다.",
      },
      { status: isAuth ? 401 : 500 }
    );
  }
}
