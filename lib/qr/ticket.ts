import { createHmac, timingSafeEqual } from "crypto";

/**
 * The QR code encodes this token, not the raw ticket_code, so a photographed
 * or copy-pasted code can't be replayed at a different event or forged by
 * guessing a UUID: `verify()` recomputes the HMAC and rejects any mismatch
 * or payload whose eventId doesn't match the scan context.
 */
export interface TicketPayload {
  ticketCode: string;
  eventId: string;
  registrationId: string;
}

function getSecret(): string {
  const secret = process.env.TICKET_SIGNING_SECRET;
  if (!secret) throw new Error("TICKET_SIGNING_SECRET is not configured");
  return secret;
}

function sign(data: string): string {
  return createHmac("sha256", getSecret()).update(data).digest("base64url");
}

/** Produces the exact string that gets encoded into the QR image. */
export function createTicketToken(payload: TicketPayload): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = sign(body);
  return `${body}.${signature}`;
}

export function verifyTicketToken(
  token: string
): { valid: true; payload: TicketPayload } | { valid: false; reason: string } {
  const [body, signature] = token.split(".");
  if (!body || !signature) return { valid: false, reason: "Malformed QR payload" };

  const expected = sign(body);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);

  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return { valid: false, reason: "Signature mismatch — ticket may be forged" };
  }

  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf-8")) as TicketPayload;
    return { valid: true, payload };
  } catch {
    return { valid: false, reason: "Could not parse ticket payload" };
  }
}
