import crypto from "crypto";

/** How long a guest ticket-retrieval link stays valid. */
export const RETRIEVAL_TOKEN_DAYS = 90;

export function newRetrievalToken(): { token: string; expiresAt: Date } {
  return {
    token: crypto.randomBytes(32).toString("hex"),
    expiresAt: new Date(Date.now() + RETRIEVAL_TOKEN_DAYS * 24 * 60 * 60 * 1000),
  };
}
