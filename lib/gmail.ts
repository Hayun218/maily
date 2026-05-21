import { google } from "googleapis";
import { RawMessage } from "./detector";

export function createOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

export function getAuthUrl(client: InstanceType<typeof google.auth.OAuth2>) {
  return client.generateAuthUrl({
    access_type: "offline",
    scope: [
      "https://www.googleapis.com/auth/gmail.readonly",
      "https://www.googleapis.com/auth/userinfo.email",
    ],
    prompt: "consent",
  });
}

export async function fetchGmailMessages(
  accessToken: string,
  refreshToken: string,
  expiryDate: number
): Promise<RawMessage[]> {
  const auth = createOAuthClient();
  auth.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
    expiry_date: expiryDate,
  });

  const gmail = google.gmail({ version: "v1", auth });

  // Fetch up to 500 messages from inbox
  const listRes = await gmail.users.messages.list({
    userId: "me",
    maxResults: 500,
    labelIds: ["INBOX"],
  });

  const messageIds = listRes.data.messages ?? [];
  if (messageIds.length === 0) return [];

  // Batch fetch headers only
  const messages: RawMessage[] = [];

  // Process in chunks of 50 to avoid rate limits
  const chunkSize = 50;
  for (let i = 0; i < messageIds.length; i += chunkSize) {
    const chunk = messageIds.slice(i, i + chunkSize);
    const fetched = await Promise.all(
      chunk.map((m) =>
        gmail.users.messages.get({
          userId: "me",
          id: m.id!,
          format: "metadata",
          metadataHeaders: [
            "From",
            "Date",
            "List-Unsubscribe",
            "List-Unsubscribe-Post",
            "Precedence",
            "Subject",
          ],
        })
      )
    );

    for (const res of fetched) {
      const headers = res.data.payload?.headers ?? [];
      const get = (name: string) =>
        headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())
          ?.value ?? undefined;

      const from = get("From");
      const date = get("Date");
      if (!from || !date) continue;

      messages.push({
        from,
        date,
        listUnsubscribe: get("List-Unsubscribe"),
        listUnsubscribePost: get("List-Unsubscribe-Post"),
        precedence: get("Precedence"),
        subject: get("Subject"),
      });
    }
  }

  return messages;
}
