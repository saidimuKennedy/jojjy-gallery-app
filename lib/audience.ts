/** localStorage keys for Audience capture (Plan 11). */
export const AUDIENCE_SUBSCRIBED_KEY = "jojjy.audience.subscribed";
export const AUDIENCE_MODAL_DISMISSED_AT_KEY = "jojjy.audience.modalDismissedAt";

/** Dismiss cooldown: 14 days. */
export const AUDIENCE_MODAL_COOLDOWN_MS = 14 * 24 * 60 * 60 * 1000;

export function markAudienceSubscribed(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(AUDIENCE_SUBSCRIBED_KEY, "1");
  } catch {
    /* ignore quota / private mode */
  }
}

export function markAudienceModalDismissed(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      AUDIENCE_MODAL_DISMISSED_AT_KEY,
      String(Date.now())
    );
  } catch {
    /* ignore */
  }
}

export function shouldShowAudienceModal(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (window.localStorage.getItem(AUDIENCE_SUBSCRIBED_KEY) === "1") {
      return false;
    }
    const raw = window.localStorage.getItem(AUDIENCE_MODAL_DISMISSED_AT_KEY);
    if (!raw) return true;
    const dismissedAt = Number(raw);
    if (!Number.isFinite(dismissedAt)) return true;
    return Date.now() - dismissedAt >= AUDIENCE_MODAL_COOLDOWN_MS;
  } catch {
    return true;
  }
}

/** Routes where the scroll modal must never appear. */
export function isAudienceModalExcludedPath(pathname: string): boolean {
  if (pathname === "/subscribe") return true;
  if (pathname === "/login" || pathname === "/register") return true;
  if (pathname.startsWith("/account")) return true;
  if (pathname.startsWith("/api")) return true;
  if (pathname === "/shop/confirmation") return true;
  if (pathname.startsWith("/shop/confirmation")) return true;
  return false;
}

export function normalizeSubscriberEmail(email: string): string {
  return email.trim().toLowerCase();
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidSubscriberEmail(email: string): boolean {
  return EMAIL_RE.test(email);
}
