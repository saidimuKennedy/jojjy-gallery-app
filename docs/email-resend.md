# Email provider — Resend

**Status:** Accepted (2026-07-27)  
**Replaces:** SendGrid (dependency only; never used for sends) and SMTP/nodemailer for contact + order mail.

## Decision

All outbound email goes through **[Resend](https://resend.com)**.

| Flow | Status | Entry point |
| ---- | ------ | ----------- |
| Contact form | ✅ Resend | `pages/api/contact/send-contact-email.ts` |
| Order confirmation | ✅ Resend | `lib/email/order-confirmation.ts` |
| Audience / announcement blasts | ❌ Later | Plan 11 Phase 2–3 |

## Shared client

`lib/email/client.ts` — `sendEmail()`, `escapeHtml()`, config checks.

## Env

| Variable | Purpose |
| -------- | ------- |
| `RESEND_API_KEY` | API key from Resend dashboard |
| `EMAIL_FROM` | Verified sender, e.g. `Njenga Ngugi <hello@jojjygallery.com>` |
| `CONTACT_FORM_RECIPIENT_EMAIL` | Inbox for contact-form messages |

Removed (no longer used): `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_SECURE`, `EMAIL_USER`, `EMAIL_PASSWORD`, SendGrid keys.

## Setup checklist

1. Add and verify the sending domain in Resend
2. Create API key → set `RESEND_API_KEY` (local + Vercel)
3. Set `EMAIL_FROM` to an address on that domain
4. Set `CONTACT_FORM_RECIPIENT_EMAIL`
5. Remove old SMTP / SendGrid vars from Vercel if present

## Newsletter / announcements

Capture is live (Plan 11). Sending to subscribers still waits on Phase 2 campaigns / Phase 3 announcement notify — both should use this same Resend client, not a second provider.
