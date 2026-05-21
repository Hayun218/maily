import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import nodemailer from "nodemailer";

export async function POST(req: NextRequest) {
  const { unsubscribeEmail, unsubscribeUrl, senderEmail } = await req.json();

  const session = await getSession();
  if (!session.provider) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  // Prefer URL-based unsubscribe (one-click via List-Unsubscribe-Post)
  if (unsubscribeUrl) {
    try {
      // RFC 8058 one-click: POST with List-Unsubscribe=One-Click
      const res = await fetch(unsubscribeUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: "List-Unsubscribe=One-Click",
      });
      if (res.ok) {
        return NextResponse.json({ ok: true, method: "post" });
      }
      // Fallback: GET request
      await fetch(unsubscribeUrl, { method: "GET" });
      return NextResponse.json({ ok: true, method: "get" });
    } catch {
      // If URL fails, try email
    }
  }

  // Email-based unsubscribe
  if (unsubscribeEmail) {
    let fromEmail: string;
    let transport: nodemailer.Transporter;

    if (session.provider === "gmail" && session.gmail) {
      fromEmail = session.gmail.email;
      transport = nodemailer.createTransport({
        service: "gmail",
        auth: {
          type: "OAuth2",
          user: fromEmail,
          accessToken: session.gmail.accessToken,
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          refreshToken: session.gmail.refreshToken,
        },
      });
    } else if (session.provider === "icloud" && session.icloud) {
      fromEmail = session.icloud.email;
      transport = nodemailer.createTransport({
        host: "smtp.mail.me.com",
        port: 587,
        secure: false,
        auth: {
          user: fromEmail,
          pass: session.icloud.password,
        },
      });
    } else {
      return NextResponse.json({ error: "인증 정보 없음" }, { status: 401 });
    }

    await transport.sendMail({
      from: fromEmail,
      to: unsubscribeEmail,
      subject: "Unsubscribe",
      text: "Please unsubscribe me from this mailing list.",
    });

    return NextResponse.json({ ok: true, method: "email" });
  }

  return NextResponse.json(
    { error: `수신거부 방법을 찾을 수 없습니다. ${senderEmail}에 직접 문의하세요.` },
    { status: 422 }
  );
}
