import React from "react";
import OptimizedImage from "@/components/ui/OptimizedImage";
import Select from "@/components/ui/Select";

/**
 * Shared checkout presentation architecture (Medusa clarity in JENGA language).
 * Presentation only: every monetary figure rendered here comes from
 * server-provided catalogue data. The KES Paystack charge is NEVER computed
 * client-side — it is disclosed as a currency notice and shown exactly on
 * the Paystack page and the confirmation screen.
 */

// ---------------------------------------------------------------------------
// ProductImage: real image or restrained typographic fallback (no fake photos)
// ---------------------------------------------------------------------------
export function ProductImage({
  src,
  alt,
  name,
  kind,
  aspect = "aspect-square",
}: {
  src?: string | null;
  alt: string;
  name: string;
  kind: string;
  aspect?: string;
}) {
  return (
    <div className={`relative ${aspect} overflow-hidden bg-neutral-100`}>
      {src ? (
        <OptimizedImage
          src={src}
          alt={alt}
          fill
          preset="hero"
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-contain bg-white"
        />
      ) : (
        <div className="flex h-full flex-col items-center justify-center gap-3 px-8 text-center">
          <p className="font-display text-xs uppercase tracking-[0.2em] text-neutral-500">
            {kind}
          </p>
          <p className="font-display text-2xl font-normal tracking-tight text-neutral-800">
            {name}
          </p>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// QuantitySelector: stepper (no raw number entry, mobile friendly)
// ---------------------------------------------------------------------------
export function QuantitySelector({
  id,
  value,
  max,
  onChange,
}: {
  id: string;
  value: number;
  max: number;
  onChange: (qty: number) => void;
}) {
  const clamp = (q: number) =>
    onChange(Math.min(Math.max(1, q), Math.max(1, max)));
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block font-display text-xs uppercase tracking-[0.2em] text-neutral-500"
      >
        Quantity
      </label>
      <div className="inline-flex items-stretch border border-neutral-300 bg-white">
        <button
          type="button"
          aria-label="Decrease quantity"
          onClick={() => clamp(value - 1)}
          disabled={value <= 1}
          className="flex w-11 items-center justify-center text-lg text-neutral-700 transition-colors hover:bg-neutral-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-neutral-900 disabled:opacity-30"
        >
          −
        </button>
        <input
          id={id}
          type="number"
          min={1}
          max={Math.max(1, max)}
          value={value}
          aria-live="polite"
          onChange={(e) => {
            const val = parseInt(e.target.value, 10);
            clamp(Number.isNaN(val) ? 1 : val);
          }}
          className="w-14 border-x border-neutral-300 py-2 text-center text-sm text-neutral-900 focus:outline-none"
        />
        <button
          type="button"
          aria-label="Increase quantity"
          onClick={() => clamp(value + 1)}
          disabled={value >= Math.max(1, max)}
          className="flex w-11 items-center justify-center text-lg text-neutral-700 transition-colors hover:bg-neutral-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-neutral-900 disabled:opacity-30"
        >
          +
        </button>
      </div>
      {max <= 5 && (
        <p className="mt-2 text-xs font-light text-neutral-600">
          Only {max} available
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// FulfilmentSelector: DELIVERY vs COLLECTION square radio controls
// ---------------------------------------------------------------------------
export type FulfilmentChoice = "DELIVERY" | "COLLECTION";

const FULFILMENT_OPTIONS: { value: FulfilmentChoice; label: string; hint: string }[] = [
  { value: "DELIVERY", label: "Delivery", hint: "We bring it to you" },
  { value: "COLLECTION", label: "Collection", hint: "Pick up in person" },
];

export function FulfilmentSelector({
  value,
  onChange,
}: {
  value: FulfilmentChoice;
  onChange: (v: FulfilmentChoice) => void;
}) {
  return (
    <div>
      <p className="mb-2 font-display text-xs uppercase tracking-[0.2em] text-neutral-500">
        Fulfilment
      </p>
      <div
        role="radiogroup"
        aria-label="Fulfilment method"
        className="grid grid-cols-2 gap-0"
      >
        {FULFILMENT_OPTIONS.map((opt) => {
          const active = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(opt.value)}
              className={`border px-4 py-3 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 ${
                active
                  ? "border-neutral-900 bg-neutral-900 text-white"
                  : "border-neutral-300 bg-white text-neutral-700 hover:border-neutral-500"
              } ${opt.value === "COLLECTION" ? "border-l-0" : ""}`}
            >
              <span className="block font-display text-xs uppercase tracking-[0.2em]">
                {opt.label}
              </span>
              <span
                className={`mt-1 block text-xs font-light ${
                  active ? "text-neutral-300" : "text-neutral-500"
                }`}
              >
                {opt.hint}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// CustomerDetails: fulfilment contact snapshot fields
// ---------------------------------------------------------------------------
export interface CustomerDetailsValue {
  name: string;
  phone: string;
  address: string;
  notes: string;
}

export function CustomerDetails({
  value,
  onChange,
  needAddress,
  idPrefix,
}: {
  value: CustomerDetailsValue;
  onChange: (v: CustomerDetailsValue) => void;
  needAddress: boolean;
  idPrefix: string;
}) {
  const set = (patch: Partial<CustomerDetailsValue>) =>
    onChange({ ...value, ...patch });
  const inputClass =
    "w-full border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-800 focus:outline-none focus:border-neutral-900";
  return (
    <div className="space-y-6">
      <div>
        <label
          htmlFor={`${idPrefix}-name`}
          className="mb-2 block font-display text-xs uppercase tracking-[0.2em] text-neutral-500"
        >
          Full name
        </label>
        <input
          id={`${idPrefix}-name`}
          type="text"
          autoComplete="name"
          value={value.name}
          onChange={(e) => set({ name: e.target.value })}
          placeholder="Who should we hand it to?"
          className={inputClass}
        />
      </div>
      <div>
        <label
          htmlFor={`${idPrefix}-phone`}
          className="mb-2 block font-display text-xs uppercase tracking-[0.2em] text-neutral-500"
        >
          Phone
        </label>
        <input
          id={`${idPrefix}-phone`}
          type="tel"
          autoComplete="tel"
          value={value.phone}
          onChange={(e) => set({ phone: e.target.value })}
          placeholder="+254 …"
          className={inputClass}
        />
      </div>
      {needAddress && (
        <div>
          <label
            htmlFor={`${idPrefix}-address`}
            className="mb-2 block font-display text-xs uppercase tracking-[0.2em] text-neutral-500"
          >
            Delivery location
          </label>
          <textarea
            id={`${idPrefix}-address`}
            value={value.address}
            onChange={(e) => set({ address: e.target.value })}
            rows={3}
            placeholder="Area, street, landmark, city…"
            className={inputClass}
          />
        </div>
      )}
      <div>
        <label
          htmlFor={`${idPrefix}-notes`}
          className="mb-2 block font-display text-xs uppercase tracking-[0.2em] text-neutral-500"
        >
          Notes <span className="normal-case tracking-normal">(optional)</span>
        </label>
        <textarea
          id={`${idPrefix}-notes`}
          value={value.notes}
          onChange={(e) => set({ notes: e.target.value })}
          rows={2}
          placeholder="Anything the courier should know…"
          className={inputClass}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// OrderSummary: catalogue totals from server data + KES charge disclosure.
// Never computes the KES figure client-side.
// ---------------------------------------------------------------------------
export interface OrderSummaryLine {
  label: string;
  detail?: string;
  amount: string;
}

export function OrderSummary({
  lines,
  total,
  currency,
  freeDelivery = true,
}: {
  lines: OrderSummaryLine[];
  total: string;
  currency: string;
  freeDelivery?: boolean;
}) {
  return (
    <div className="border-t border-neutral-200 pt-6">
      <p className="mb-4 font-display text-xs uppercase tracking-[0.2em] text-neutral-500">
        Order summary
      </p>
      <ul className="space-y-3">
        {lines.map((line) => (
          <li
            key={`${line.label}-${line.detail ?? ""}`}
            className="flex items-baseline justify-between gap-4 text-sm font-light text-neutral-700"
          >
            <span>
              {line.label}
              {line.detail && (
                <span className="text-neutral-500"> · {line.detail}</span>
              )}
            </span>
            <span className="whitespace-nowrap">{line.amount}</span>
          </li>
        ))}
        <li className="flex items-baseline justify-between gap-4 text-sm font-light text-neutral-700">
          <span>Delivery</span>
          <span className="whitespace-nowrap">
            {freeDelivery ? "Free" : "—"}
          </span>
        </li>
      </ul>
      <p className="mt-4 flex items-baseline justify-between gap-4 border-t border-neutral-200 pt-4">
        <span className="font-display text-xs uppercase tracking-[0.2em] text-neutral-500">
          Total ({currency})
        </span>
        <span className="font-display text-xl font-normal text-neutral-900">
          {total}
        </span>
      </p>
      <p className="mt-3 text-xs font-light leading-relaxed text-neutral-600">
        Payable in KES via Paystack. The exact KES charge is calculated
        securely at checkout and shown on the Paystack page before you
        authorize payment.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// PaymentAction: primary transaction button with pending state + error slot
// ---------------------------------------------------------------------------
export function PaymentAction({
  busy,
  disabled,
  onClick,
  label,
  pendingLabel = "Redirecting to payment…",
  error,
}: {
  busy: boolean;
  disabled?: boolean;
  onClick: () => void;
  label: string;
  pendingLabel?: string;
  error?: string | null;
}) {
  return (
    <div>
      <button
        type="button"
        onClick={onClick}
        disabled={busy || disabled}
        className="w-full border border-neutral-900 bg-neutral-900 py-4 font-display text-xs uppercase tracking-[0.28em] text-white transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {busy ? pendingLabel : label}
      </button>
      {error && (
        <p role="alert" className="mt-3 text-sm font-light text-red-800">
          {error}
        </p>
      )}
      <p className="mt-3 text-xs font-light leading-relaxed text-neutral-600">
        Secure checkout via Paystack. You&apos;ll return here after payment.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// DeliveryMethodSelect: themed wrapper binding server enum values
// ---------------------------------------------------------------------------
export const DELIVERY_METHOD_OPTIONS = [
  { value: "LOCAL_PICKUP", label: "Local pickup" },
  { value: "NAIROBI_DELIVERY", label: "Nairobi delivery" },
  { value: "KENYA_SHIPPING", label: "Kenya shipping" },
  { value: "INTERNATIONAL_SHIPPING", label: "International shipping" },
] as const;

export type DeliveryMethodValue =
  (typeof DELIVERY_METHOD_OPTIONS)[number]["value"];

export function DeliveryMethodSelect({
  id,
  value,
  onChange,
}: {
  id: string;
  value: DeliveryMethodValue;
  onChange: (v: DeliveryMethodValue) => void;
}) {
  return (
    <Select
      id={id}
      label="Delivery method"
      options={DELIVERY_METHOD_OPTIONS.map((o) => ({ ...o }))}
      value={value}
      onChange={(v) => onChange(v as DeliveryMethodValue)}
    />
  );
}
