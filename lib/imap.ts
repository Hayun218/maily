import { ImapFlow } from "imapflow";
import { RawMessage } from "./detector";

function parseRawHeaders(buf: Buffer | undefined): Record<string, string> {
  if (!buf) return {};
  const text = buf.toString("utf-8");
  const result: Record<string, string> = {};
  // Unfold multi-line headers then split on CRLF or LF
  const unfolded = text.replace(/\r?\n[ \t]+/g, " ");
  for (const line of unfolded.split(/\r?\n/)) {
    const colon = line.indexOf(":");
    if (colon < 1) continue;
    const key = line.slice(0, colon).trim().toLowerCase();
    const val = line.slice(colon + 1).trim();
    if (key && !(key in result)) result[key] = val;
  }
  return result;
}

export async function fetchImapMessages(
  email: string,
  password: string
): Promise<RawMessage[]> {
  const client = new ImapFlow({
    host: "imap.mail.me.com",
    port: 993,
    secure: true,
    auth: { user: email, pass: password },
    logger: false,
  });

  await client.connect();

  const messages: RawMessage[] = [];

  try {
    const lock = await client.getMailboxLock("INBOX");
    try {
      const status = await client.status("INBOX", { messages: true });
      const total = status.messages ?? 0;
      if (total === 0) return [];

      // Fetch the most recent 500 messages (headers only)
      const start = Math.max(1, total - 499);
      const range = `${start}:${total}`;

      for await (const msg of client.fetch(range, {
        envelope: true,
        headers: ["list-unsubscribe", "list-unsubscribe-post", "precedence"],
      })) {
        const env = msg.envelope;
        if (!env) continue;

        const fromAddr = env.from?.[0];
        if (!fromAddr) continue;

        const fromEmail = fromAddr.address ?? "";
        const fromName = fromAddr.name ?? fromEmail;
        const from = fromName ? `${fromName} <${fromEmail}>` : fromEmail;
        const date = env.date?.toISOString() ?? "";

        // Parse raw Buffer headers into key→value map
        const hdrs = parseRawHeaders(msg.headers);

        messages.push({
          from,
          date,
          listUnsubscribe: hdrs["list-unsubscribe"],
          listUnsubscribePost: hdrs["list-unsubscribe-post"],
          precedence: hdrs["precedence"],
        });
      }
    } finally {
      lock.release();
    }
  } finally {
    await client.logout();
  }

  return messages;
}
