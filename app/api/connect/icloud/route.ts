import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: "이메일과 비밀번호를 입력하세요." }, { status: 400 });
  }

  const session = await getSession();
  session.provider = "icloud";
  session.icloud = { email, password };
  await session.save();

  return NextResponse.json({ ok: true });
}
