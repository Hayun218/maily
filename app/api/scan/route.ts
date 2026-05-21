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
    return NextResponse.json(
      { error: "이메일 스캔 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
