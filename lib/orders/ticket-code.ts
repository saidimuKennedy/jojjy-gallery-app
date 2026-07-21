import crypto from "crypto";

export function generateTicketCode(): string {
  return crypto.randomBytes(4).toString("hex").toUpperCase();
}
