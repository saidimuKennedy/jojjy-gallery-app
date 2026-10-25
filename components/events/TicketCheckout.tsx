import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";

export interface TicketCheckoutTarget {
  eventId: number;
  eventSlug: string;
  eventTitle: string;
  venue: string | null;
  startsAt: string;
  currency: string;
  ticketTypeId: number;
  ticketTypeName: string;
  price: number;
  remaining: number;
}

interface Attendee {
  name: string;
  email: string;
}

/**
 * Guest ticket checkout. Collects the buyer contact and one attendee per
 * admission, then hands off to the server checkout (which reserves inventory
 * and redirects to Paystack, or issues free tickets immediately). No account
 * is created or required.
 */
export default function TicketCheckout({
  target,
  initialQuantity = 1,
  onClose,
}: {
  target: TicketCheckoutTarget;
  initialQuantity?: number;
  onClose: () => void;
}) {
  const { data: session } = useSession();
  const [quantity, setQuantity] = useState(
    Math.min(Math.max(1, initialQuantity), Math.max(1, target.remaining))
  );
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [attendees, setAttendees] = useState<Attendee[]>([{ name: "", email: "" }]);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);

  const isFree = target.price <= 0;

  useEffect(() => {
    if (session?.user?.email) setEmail((e) => e || session.user!.email!);
    if (session?.user?.name) setName((n) => n || session.user!.name!);
  }, [session]);

  useEffect(() => {
    setAttendees((prev) => {
      const next = prev.slice(0, quantity);
      while (next.length < quantity) next.push({ name: "", email: "" });
      return next;
    });
  }, [quantity]);

  const setAttendee = (i: number, patch: Partial<Attendee>) => {
    setAttendees((prev) =>
      prev.map((a, idx) => (idx === i ? { ...a, ...patch } : a))
    );
  };

  const total = target.price * quantity;

  const submit = async () => {
    if (!email.trim() || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
      toast.error("Enter a valid email so we can send your tickets.");
      return;
    }
    if (!consent) {
      toast.error("Please accept the ticket terms.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/orders/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [
            {
              ticketTypeId: target.ticketTypeId,
              quantity,
              attendees: attendees.map((a) => ({
                name: a.name.trim() || undefined,
                email: a.email.trim() || undefined,
              })),
            },
          ],
          guestName: name.trim(),
          guestEmail: email.trim(),
          guestPhone: phone.trim(),
          returnPath: session?.user
            ? undefined
            : `/tickets/retrieve?email=${encodeURIComponent(email.trim())}`,
        }),
      });
      const body = await res.json();
      if (!res.ok || !body.success) {
        toast.error(body.message || "Checkout failed");
        return;
      }
      if (body.data?.authorizationUrl) {
        window.location.href = body.data.authorizationUrl as string;
        return;
      }
      // Free tickets issued immediately.
      toast.success("Your tickets are ready.");
      if (session?.user) {
        window.location.href = "/account/tickets";
      } else if (body.data?.id) {
        window.location.href = `/tickets/retrieve?ref=${encodeURIComponent(
          body.data.id
        )}&email=${encodeURIComponent(email.trim())}`;
      } else {
        onClose();
      }
    } catch {
      toast.error("Checkout failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Buy ${target.ticketTypeName}`}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-6"
      onClick={onClose}
    >
      <div
        className="max-h-[92vh] w-full max-w-lg overflow-y-auto bg-white p-6 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="font-display text-xs uppercase tracking-[0.22em] text-neutral-500">
              Tickets
            </p>
            <h2 className="mt-2 font-display text-2xl font-normal tracking-tight text-neutral-900">
              {target.ticketTypeName}
            </h2>
            <p className="mt-1 font-archive-body text-sm text-neutral-500">
              {target.eventTitle}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-neutral-400 hover:text-neutral-900"
          >
            ✕
          </button>
        </div>

        <label className="block font-display text-[0.7rem] uppercase tracking-[0.2em] text-neutral-500">
          Quantity
        </label>
        <div className="mt-2 inline-flex items-stretch border border-neutral-300">
          <button
            type="button"
            aria-label="Fewer tickets"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            disabled={quantity <= 1}
            className="w-10 text-neutral-700 hover:bg-neutral-100 disabled:opacity-30"
          >
            −
          </button>
          <span className="w-12 border-x border-neutral-300 py-2 text-center">
            {quantity}
          </span>
          <button
            type="button"
            aria-label="More tickets"
            onClick={() => setQuantity((q) => Math.min(target.remaining, q + 1))}
            disabled={quantity >= target.remaining}
            className="w-10 text-neutral-700 hover:bg-neutral-100 disabled:opacity-30"
          >
            +
          </button>
        </div>

        <div className="mt-6 space-y-4">
          <Field label="Your name" value={name} onChange={setName} />
          <Field
            label="Email"
            type="email"
            required
            value={email}
            onChange={setEmail}
          />
          <Field label="Phone (optional)" value={phone} onChange={setPhone} />
        </div>

        <div className="mt-6">
          <p className="font-display text-[0.7rem] uppercase tracking-[0.2em] text-neutral-500">
            Attendees
          </p>
          <p className="mt-1 font-archive-body text-xs text-neutral-500">
            One ticket per attendee. Leave blank to use your details.
          </p>
          <div className="mt-3 space-y-3">
            {attendees.map((a, i) => (
              <div key={i} className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <input
                  value={a.name}
                  onChange={(e) => setAttendee(i, { name: e.target.value })}
                  placeholder={`Attendee ${i + 1} name`}
                  className="border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
                />
                <input
                  type="email"
                  value={a.email}
                  onChange={(e) => setAttendee(i, { email: e.target.value })}
                  placeholder={`Attendee ${i + 1} email`}
                  className="border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
                />
              </div>
            ))}
          </div>
        </div>

        <label className="mt-6 flex items-start gap-3 font-archive-body text-sm text-neutral-600">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-1"
          />
          <span>
            I understand tickets are non-transferable and are validated at the
            door by QR code.
          </span>
        </label>

        <div className="mt-6 flex items-center justify-between border-t border-neutral-200 pt-6">
          <span className="font-display text-lg font-normal text-neutral-900">
            {isFree
              ? "Free"
              : `${target.currency} ${total.toLocaleString()}`}
          </span>
          <button
            type="button"
            onClick={submit}
            disabled={busy}
            className="border border-neutral-900 bg-neutral-900 px-8 py-4 font-display text-xs uppercase tracking-[0.28em] text-white transition-colors hover:bg-white hover:text-neutral-900 disabled:opacity-40"
          >
            {busy ? "…" : isFree ? "Get free ticket" : "Continue to payment"}
          </button>
        </div>
        {!isFree && (
          <p className="mt-3 text-xs font-light text-neutral-500">
            Charged via Paystack — the exact amount is shown before you
            authorize.
          </p>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="font-display text-[0.7rem] uppercase tracking-[0.2em] text-neutral-500">
        {label}
        {required ? " *" : ""}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
      />
    </label>
  );
}
