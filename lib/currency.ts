/** Canonical currency for all catalogue display (shop, events, music). */
export const CATALOG_CURRENCY = "USD";

/** Paystack settlement currency for music (converted at checkout only). */
export const MUSIC_PAYMENT_CURRENCY = "KES";

/** KES per 1 USD — used when charging music via Paystack. */
export function kesPerUsd(): number {
  const raw = process.env.KES_PER_USD;
  const rate = raw ? Number.parseFloat(raw) : 130;
  if (!Number.isFinite(rate) || rate <= 0) return 130;
  return rate;
}

/** Convert a stored KES catalogue price to USD (legacy rows). */
export function kesToUsd(kes: number): number {
  return Math.round((kes / kesPerUsd()) * 100) / 100;
}

/** Convert USD to KES for Paystack. */
export function usdToKes(usd: number): number {
  return Math.round(usd * kesPerUsd() * 100) / 100;
}

/** Normalise a stored DB price to USD for display and checkout logic. */
export function normalizeToUsd(amount: number, storedCurrency: string): number {
  const c = storedCurrency.toUpperCase();
  if (c === "USD") return amount;
  if (c === "KES") return kesToUsd(amount);
  return amount;
}

export function formatDisplayPrice(amount: number): string {
  return `$ ${amount.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

/** Public music catalogue price — always USD regardless of env or stored currency. */
export function musicCatalogPrice(
  amount: number | null,
  storedCurrency = CATALOG_CURRENCY
): { price: number | null; currency: string } {
  if (amount == null) {
    return { price: null, currency: CATALOG_CURRENCY };
  }
  return {
    price: normalizeToUsd(amount, storedCurrency),
    currency: CATALOG_CURRENCY,
  };
}

/** KES amount to charge at Paystack for a USD catalogue price. */
export function musicPaymentAmount(usdPrice: number): number {
  return usdToKes(usdPrice);
}

/** @deprecated Use musicCatalogPrice */
export function musicDisplayPrice(
  amount: number | null,
  storedCurrency = CATALOG_CURRENCY
) {
  return musicCatalogPrice(amount, storedCurrency);
}

/** @deprecated Use CATALOG_CURRENCY */
export function displayCurrency(): string {
  return CATALOG_CURRENCY;
}
