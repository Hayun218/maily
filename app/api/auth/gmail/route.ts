import { NextResponse } from "next/server";
import { createOAuthClient, getAuthUrl } from "@/lib/gmail";

export async function GET() {
  const client = createOAuthClient();
  const url = getAuthUrl(client);
  return NextResponse.redirect(url);
}
