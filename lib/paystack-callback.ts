/**
 * Pure Paystack callback query helpers.
 *
 * Paystack can return `reference`, `trxref`, and duplicated params (arrays).
 * These helpers resolve a single authoritative reference deterministically and
 * are unit-tested to guard the "CONFIRMING PAYMENT… forever" regression where
 * a duplicated/mismatched query never triggered POST /api/paystack/verify.
 */

export type QueryValue = string | string[] | undefined;

/** First non-empty value of a query param that may be a string or string[]. */
export function firstQueryValue(value: QueryValue): string | undefined {
  if (typeof value === "string" && value.length > 0) return value;
  if (Array.isArray(value)) {
    const found = value.find((v) => typeof v === "string" && v.length > 0);
    return found;
  }
  return undefined;
}

/**
 * Resolve a callback reference, preferring `reference`, falling back to
 * `trxref`. If both are present but differ, refuse to guess (`mismatch`).
 */
export function resolveCallbackReference(query: {
  reference?: QueryValue;
  trxref?: QueryValue;
}): { reference?: string; mismatch?: boolean } {
  const fromReference = firstQueryValue(query.reference);
  const fromTrxref = firstQueryValue(query.trxref);
  if (fromReference && fromTrxref && fromReference !== fromTrxref) {
    return { mismatch: true };
  }
  return { reference: fromReference ?? fromTrxref };
}

/**
 * Music return path: collect every candidate from `reference` and `trxref`
 * (including duplicated array values), then accept only a single unique value.
 * Duplicated identical values resolve cleanly; genuinely conflicting values
 * return undefined so the caller can surface an explicit error (never hang).
 */
export function readMusicPaymentReference(
  reference: QueryValue,
  trxref: QueryValue
): string | undefined {
  const values = [reference, trxref]
    .flatMap((value) => (Array.isArray(value) ? value : [value ?? ""]))
    .map((value) => value.trim())
    .filter(Boolean);
  const uniqueValues = [...new Set(values)];
  return uniqueValues.length === 1 ? uniqueValues[0] : undefined;
}
