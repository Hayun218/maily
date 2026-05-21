import { NextRequest, NextResponse } from "next/server";
import { createOAuthClient } from "@/lib/gmail";
import { getSession } from "@/lib/session";
import { google } from "googleapis";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.redirect(new URL("/?error=no_code", req.url));
  }

  const client = createOAuthClient();

  try {
    const { tokens } = await client.getToken(code);
    client.setCredentials(tokens);

    const oauth2 = google.oauth2({ version: "v2", auth: client });
    const { data } = await oauth2.userinfo.get();

    const session = await getSession();
    session.provider = "gmail";
    session.gmail = {
      accessToken: tokens.access_token!,
      refreshToken: tokens.refresh_token!,
      expiryDate: tokens.expiry_date ?? Date.now() + 3600 * 1000,
      email: data.email!,
    };
    await session.save();

    return NextResponse.redirect(new URL("/dashboard", req.url));
  } catch {
    return NextResponse.redirect(new URL("/?error=oauth_failed", req.url));
  }
}
