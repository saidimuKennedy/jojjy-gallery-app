import crypto from "crypto";
import { getSiteBaseUrl } from "@/lib/site-url";

const PAYSTACK_BASE = "https://api.paystack.co";

export function paystackSecretKey(): string | undefined {
  return process.env.PAYSTACK_SECRET_KEY;
}

export function isPaystackConfigured(): boolean {
  return !!paystackSecretKey();
}

/** Convert decimal major units (e.g. 1500.00 KES) to Paystack subunits (cents/kobo). */
export function toPaystackAmount(amount: number): number {
  return Math.round(amount * 100);
}

export function buildPaystackReference(orderId: string): string {
  return `jojjy_${orderId.replace(/-/g, "")}`;
}

export interface PaystackInitializeResult {
  authorization_url: string;
  access_code: string;
  reference: string;
}

export async function initializeTransaction(params: {
  email: string;
  amount: number;
  currency: string;
  reference: string;
  callbackUrl: string;
  metadata?: Record<string, string>;
}): Promise<PaystackInitializeResult> {
  const secret = paystackSecretKey();
  if (!secret) {
    throw new Error("PAYSTACK_SECRET_KEY is not configured");
  }

  const res = await fetch(`${PAYSTACK_BASE}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: params.email,
      amount: toPaystackAmount(params.amount),
      currency: params.currency,
      reference: params.reference,
      callback_url: params.callbackUrl,
      metadata: params.metadata,
    }),
  });

  const body = await res.json();
  if (!res.ok || !body.status) {
    throw new Error(
      body.message || "Failed to initialize Paystack transaction"
    );
  }

  return body.data as PaystackInitializeResult;
}

export interface PaystackVerifyResult {
  status: string;
  reference: string;
  amount: number;
  currency: string;
  metadata?: { orderId?: string };
}

export async function verifyTransaction(
  reference: string
): Promise<PaystackVerifyResult> {
  const secret = paystackSecretKey();
  if (!secret) {
    throw new Error("PAYSTACK_SECRET_KEY is not configured");
  }

  const res = await fetch(
    `${PAYSTACK_BASE}/transaction/verify/${encodeURIComponent(reference)}`,
    {
      headers: { Authorization: `Bearer ${secret}` },
    }
  );

  const body = await res.json();
  if (!res.ok || !body.status) {
    throw new Error(body.message || "Failed to verify Paystack transaction");
  }

  const data = body.data;
  return {
    status: data.status as string,
    reference: data.reference as string,
    amount: data.amount as number,
    currency: data.currency as string,
    metadata: data.metadata as PaystackVerifyResult["metadata"],
  };
}

export function verifyWebhookSignature(
  rawBody: string,
  signatureHeader: string | undefined
): boolean {
  const secret = paystackSecretKey();
  if (!secret || !signatureHeader) return false;
  const hash = crypto
    .createHmac("sha512", secret)
    .update(rawBody)
    .digest("hex");
  return hash === signatureHeader;
}

export function paystackCallbackUrl(reference: string, returnPath?: string): string {
  const ref = `reference=${encodeURIComponent(reference)}`;
  if (returnPath && returnPath.startsWith("/music/") && !returnPath.includes("://")) {
    const sep = returnPath.includes("?") ? "&" : "?";
    return `${getSiteBaseUrl()}${returnPath}${sep}${ref}`;
  }
  return `${getSiteBaseUrl()}/shop/confirmation?${ref}`;
}
