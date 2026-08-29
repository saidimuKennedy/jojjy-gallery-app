import { Resend } from "resend";

let client: Resend | null = null;

export function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  if (!client) client = new Resend(key);
  return client;
}

export function getEmailFrom(): string | null {
  return process.env.EMAIL_FROM?.trim() || null;
}

export function isEmailConfigured(): boolean {
  return Boolean(getResend() && getEmailFrom());
}

export type SendEmailInput = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
};

/**
 * Send via Resend. Returns false (and logs) when email is not configured,
 * so callers can skip without throwing in optional flows.
 */
export async function sendEmail(input: SendEmailInput): Promise<{
  ok: boolean;
  id?: string;
  skipped?: boolean;
  error?: string;
}> {
  const resend = getResend();
  const from = getEmailFrom();
  if (!resend || !from) {
    console.warn("Email not configured (RESEND_API_KEY / EMAIL_FROM) — skipping send");
    return { ok: false, skipped: true };
  }

  const { data, error } = await resend.emails.send({
    from,
    to: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text,
    replyTo: input.replyTo,
  });

  if (error) {
    console.error("Resend send failed:", error);
    return { ok: false, error: error.message };
  }

  return { ok: true, id: data?.id };
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
