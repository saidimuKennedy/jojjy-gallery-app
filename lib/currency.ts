/** Display currency for catalog UI (shop, events, music). */
export function displayCurrency(): string {
  return process.env.NEXT_PUBLIC_CURRENCY?.replace(/^\$/, "USD") || "USD";
}

/** KES charged at Paystack for music stored in KES. */
export const MUSIC_PAYMENT_CURRENCY = "KES";

/** KES per 1 USD — used to show USD list prices for KES-backed music. */
export function kesPerUsd(): number {
  const raw = process.env.KES_PER_USD;
  const rate = raw ? Number.parseFloat(raw) : 130;
  if (!Number.isFinite(rate) || rate <= 0) return 130;
  return rate;
}

export function kesToUsd(kes: number): number {
  return Math.round((kes / kesPerUsd()) * 100) / 100;
}

export function formatDisplayPrice(
  amount: number,
  currency = displayCurrency()
): string {
  if (currency === "USD") {
    return `$ ${amount.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}`;
  }
  return `${currency} ${amount.toLocaleString()}`;
}

/** Map a KES catalogue price to USD for public display. */
export function musicDisplayPrice(kesAmount: number | null): {
  price: number | null;
  currency: string;
} {
  if (kesAmount == null) {
    return { price: null, currency: displayCurrency() };
  }
  return {
    price: kesToUsd(kesAmount),
    currency: displayCurrency(),
  };
}
