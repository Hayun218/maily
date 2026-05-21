import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { ImapFlow } from "imapflow";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: "이메일과 비밀번호를 입력하세요." }, { status: 400 });
  }

  // Verify credentials before saving
  const client = new ImapFlow({
    host: "imap.mail.me.com",
    port: 993,
    secure: true,
    auth: { user: email, pass: password },
    logger: false,
    connectionTimeout: 10000,
  });

  try {
    await client.connect();
    await client.logout();
  } catch {
    return NextResponse.json(
      { error: "iCloud 연결 실패. 이메일과 앱 전용 비밀번호를 확인하세요." },
      { status: 401 }
    );
  }

  const session = await getSession();
  session.provider = "icloud";
  session.icloud = { email, password };
  await session.save();

  return NextResponse.json({ ok: true });
}
