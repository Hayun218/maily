export interface SenderInfo {
  email: string;
  name: string;
  domain: string;
  count: number;
  latestDate: Date;
  isSubscription: boolean;
  unsubscribeUrl?: string;
  unsubscribeEmail?: string;
}

export interface RawMessage {
  from: string; // "Name <email>" or "email"
  date: string;
  listUnsubscribe?: string;
  listUnsubscribePost?: string;
  precedence?: string;
  subject?: string;
}

const SUBSCRIPTION_DOMAINS = new Set([
  "mailchimp.com",
  "sendgrid.net",
  "klaviyo.com",
  "substack.com",
  "beehiiv.com",
  "convertkit.com",
  "constantcontact.com",
  "aweber.com",
  "campaignmonitor.com",
  "drip.com",
  "activecampaign.com",
  "hubspot.com",
  "salesforce.com",
  "marketo.com",
  "mailerlite.com",
  "sendinblue.com",
  "brevo.com",
  "ghost.io",
  "buttondown.email",
  "tinyletter.com",
  "mailgun.com",
  "postmarkapp.com",
]);

const SUBSCRIPTION_LOCAL_PATTERNS = [
  /^newsletter/i,
  /^noreply/i,
  /^no-reply/i,
  /^marketing/i,
  /^notifications?/i,
  /^updates?/i,
  /^digest/i,
  /^weekly/i,
  /^monthly/i,
  /^mailer/i,
  /^info$/i,
  /^hello$/i,
  /^team$/i,
  /^support$/i,
  /^news$/i,
  /^mail$/i,
  /^donotreply/i,
  /^do-not-reply/i,
];

function parseFrom(from: string): { name: string; email: string } {
  const match = from.match(/^"?([^"<]*)"?\s*<([^>]+)>$/);
  if (match) {
    return { name: match[1].trim() || match[2], email: match[2].toLowerCase() };
  }
  const email = from.trim().toLowerCase();
  return { name: email, email };
}

function getDomain(email: string): string {
  return email.split("@")[1] ?? "";
}

function parseUnsubscribe(header: string): {
  url?: string;
  email?: string;
} {
  const result: { url?: string; email?: string } = {};
  const parts = header.split(",").map((s) => s.trim().replace(/[<>]/g, ""));

  for (const part of parts) {
    if (part.startsWith("https://") || part.startsWith("http://")) {
      result.url = part;
    } else if (part.startsWith("mailto:")) {
      result.email = part.slice(7);
    }
  }
  return result;
}

function isSubscription(msg: RawMessage, domain: string): boolean {
  if (msg.listUnsubscribe) return true;
  if (msg.precedence?.toLowerCase() === "bulk") return true;
  if (msg.precedence?.toLowerCase() === "list") return true;
  if (SUBSCRIPTION_DOMAINS.has(domain)) return true;

  const local = msg.from.split("@")[0].replace(/.*</, "").trim();
  return SUBSCRIPTION_LOCAL_PATTERNS.some((p) => p.test(local));
}

export function processMessages(messages: RawMessage[]): SenderInfo[] {
  const map = new Map<string, SenderInfo>();

  for (const msg of messages) {
    const { name, email } = parseFrom(msg.from);
    const domain = getDomain(email);
    const date = new Date(msg.date);

    if (isNaN(date.getTime())) continue;

    const existing = map.get(email);
    const sub = isSubscription(msg, domain);

    const unsubData = msg.listUnsubscribe
      ? parseUnsubscribe(msg.listUnsubscribe)
      : {};

    if (existing) {
      existing.count++;
      if (date > existing.latestDate) existing.latestDate = date;
      if (!existing.isSubscription && sub) existing.isSubscription = true;
      if (!existing.unsubscribeUrl && unsubData.url)
        existing.unsubscribeUrl = unsubData.url;
      if (!existing.unsubscribeEmail && unsubData.email)
        existing.unsubscribeEmail = unsubData.email;
    } else {
      map.set(email, {
        email,
        name,
        domain,
        count: 1,
        latestDate: date,
        isSubscription: sub,
        ...unsubData,
      });
    }
  }

  return Array.from(map.values())
    .filter((s) => s.isSubscription)
    .sort((a, b) => b.count - a.count);
}
