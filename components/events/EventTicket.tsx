import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import QRCode from "qrcode";
import { Calendar, CircleAlert, CircleCheck, Download, MapPin, Ticket } from "lucide-react";
import OptimizedImage from "@/components/ui/OptimizedImage";
import { SITE_LOGO_URL } from "@/lib/cloudinary";
import {
  DEFAULT_TIME_ZONE,
  formatStamp,
  ticketStatusInfo,
  tzLabel,
} from "@/lib/ticketing/ticket-status";

export type EventTicketStatus =
  | "VALID"
  | "CHECKED_IN"
  | "CANCELLED"
  | "REFUNDED";

export interface EventTicketProps {
  eventTitle: string;
  eventImageUrl?: string | null;
  startsAt: string;
  endsAt?: string | null;
  /** Full venue string, e.g. "The Studio, Westlands, Nairobi". */
  venue?: string | null;
  /** Overrides the location line; otherwise derived from `venue`. */
  location?: string | null;
  ticketType: string;
  price?: number | null;
  currency?: string;
  /** Optional access label, e.g. "General Access". Hidden when absent. */
  entryLabel?: string | null;
  /** Small label beside the wordmark, e.g. "Live event". Hidden when absent. */
  category?: string | null;
  /** One-line tagline over the artwork, e.g. "People. Art. Sound. Together." */
  tagline?: string | null;
  /** IANA zone the event runs in. Defaults to Nairobi. */
  timezone?: string | null;
  /** Premium tiers get the gold accent. Driven by the ticket type's own flag. */
  premium?: boolean;
  /** Show a "Download ticket" action (prints / saves this ticket as PDF). */
  downloadable?: boolean;
  attendeeName?: string | null;
  code: string;
  /** Defaults to `code` — the value door staff scan. */
  qrValue?: string;
  orderRef?: string | null;
  purchasedAt?: string | null;
  status: EventTicketStatus | string;
  checkedInAt?: string | null;
  /** Page background behind the ticket; the perforation notches are painted in it. */
  notchColor?: string;
  className?: string;
}

/** Fixed composition width; smaller containers scale the whole ticket down. */
const DESIGN_WIDTH = 1100;

/** Printed ticket sheet: who issued it, and a short word from the artist. */
const ISSUED_BY = "Njenga Ngugi";
const ARTIST_NOTE =
  "Thank you for being in the room with the work. Show this QR code at the door and keep this ticket safe. — Njenga";

function formatDate(iso: string, timeZone: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone,
  });
}

function formatTime(iso: string, timeZone: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone,
  });
}

function splitVenue(venue?: string | null, location?: string | null) {
  if (!venue) return { name: null as string | null, place: location ?? null };
  const [name, ...rest] = venue.split(",");
  return {
    name: name.trim(),
    place: location ?? (rest.join(",").trim() || null),
  };
}

function StubField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-[0.16em] text-neutral-300">
        {label}
      </dt>
      <dd className="mt-1 break-words text-base text-white">{value}</dd>
    </div>
  );
}

/**
 * The canonical JENGA event ticket. Presentation only: callers fetch data and
 * pass it in. Desktop is a horizontal ticket (info | artwork | admission stub);
 * on small screens the same parts stack, and the perforation turns horizontal.
 */
export default function EventTicket({
  eventTitle,
  eventImageUrl,
  startsAt,
  endsAt,
  venue,
  location,
  ticketType,
  price,
  currency = "KES",
  entryLabel,
  category,
  tagline,
  timezone,
  premium = false,
  downloadable = false,
  attendeeName,
  code,
  qrValue,
  orderRef,
  purchasedAt,
  status,
  checkedInAt,
  notchColor = "#000",
  className = "",
}: EventTicketProps) {
  const [qr, setQr] = useState<string | null>(null);
  const ticketRef = useRef<HTMLElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [designHeight, setDesignHeight] = useState<number | null>(null);
  const [qrOpen, setQrOpen] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [squareArt, setSquareArt] = useState(false);
  const tz = timezone || DEFAULT_TIME_ZONE;
  const info = ticketStatusInfo(status, checkedInAt, tz);
  const accentText = premium ? "text-[#e0b85c]" : "text-[#6fcf8a]";
  const accentBg = premium
    ? "bg-[#e0b85c] text-black"
    : "bg-[#6fcf8a] text-black";
  const accentRule = premium ? "bg-[#e0b85c]" : "bg-[#6fcf8a]";
  const value = qrValue ?? code;
  const { name: venueName, place } = splitVenue(venue, location);
  const timeRange = `${formatTime(startsAt, tz)}${
    endsAt ? ` – ${formatTime(endsAt, tz)}` : ""
  } (${tzLabel(tz, new Date(startsAt))})`;
  const taglineLines = tagline
    ? tagline
        .split(/(?<=[.!?])\s+/)
        .map((l) => l.trim())
        .filter(Boolean)
    : [];
  const titleSize =
    eventTitle.length > 26
      ? "text-4xl"
      : eventTitle.length > 14
        ? "text-5xl"
        : "text-6xl";

  // The ticket keeps one fixed composition and is scaled to fit its container,
  // so phones see the same horizontal ticket, just smaller.
  useEffect(() => {
    const frame = frameRef.current;
    const ticket = ticketRef.current;
    if (!frame || !ticket) return;
    const measure = () => {
      setScale(Math.min(1, frame.clientWidth / DESIGN_WIDTH));
      setDesignHeight(ticket.offsetHeight);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(frame);
    ro.observe(ticket);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!qrOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setQrOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [qrOpen]);

  useEffect(() => {
    if (!info.usable && info.tone === "void") {
      setQr(null);
      return;
    }
    let cancelled = false;
    QRCode.toDataURL(value, {
      margin: 2,
      width: 360,
      errorCorrectionLevel: "M",
      color: { dark: "#000000", light: "#ffffff" },
    })
      .then((url) => {
        if (!cancelled) setQr(url);
      })
      .catch(() => {
        if (!cancelled) setQr(null);
      });
    return () => {
      cancelled = true;
    };
  }, [value, info.usable, info.tone]);

  const small = scale < 0.8;
  const StatusIcon = info.tone === "ok" ? CircleCheck : CircleAlert;

  const face = (
    ref: React.Ref<HTMLElement> | undefined,
    style: React.CSSProperties
  ) => (
    <article
      ref={ref}
      style={style}
      aria-label={`Ticket for ${eventTitle}, ${ticketType}`}
      className={`relative grid overflow-hidden rounded-2xl bg-[#0c0f0d] shadow-[0_24px_60px_rgba(0,0,0,0.45)] grid-cols-[44%_31%_25%]`}
    >
      {/* Left: event information */}
      <div className="flex flex-col bg-[#f7f5ef] p-9 text-neutral-900">
        <div className="flex items-start justify-between gap-4">
          <span className="font-display text-2xl font-medium tracking-[0.35em]">
            JENGA
          </span>
          {category && (
            <span className="border-b-2 border-[#6fcf8a] pb-1 text-xs font-medium uppercase tracking-[0.24em] text-neutral-700">
              {category}
            </span>
          )}
        </div>

        <h3
          className={`mt-8 break-words font-archive-body font-extrabold uppercase leading-[0.95] tracking-tight ${titleSize}`}
        >
          {eventTitle}
        </h3>

        <div className="mt-8 space-y-5">
          <div className="flex gap-4">
            <Calendar className="mt-0.5 h-6 w-6 shrink-0" strokeWidth={1.5} aria-hidden />
            <div>
              <p className="text-lg font-semibold">{formatDate(startsAt, tz)}</p>
              <p className="text-sm text-neutral-700">{timeRange}</p>
            </div>
          </div>
          {(venueName || place) && (
            <div className="flex gap-4">
              <MapPin className="mt-0.5 h-6 w-6 shrink-0" strokeWidth={1.5} aria-hidden />
              <div>
                {venueName && (
                  <p className="text-lg font-semibold">{venueName}</p>
                )}
                {place && <p className="text-sm text-neutral-700">{place}</p>}
              </div>
            </div>
          )}
        </div>

        <dl className="mt-auto grid grid-cols-[auto_auto_auto] border-t border-neutral-300 pt-6">
          <div className="pr-6">
            <dt className="text-xs font-medium uppercase tracking-[0.16em] text-neutral-600">
              Ticket type
            </dt>
            <dd className="mt-1 text-base font-semibold">{ticketType}</dd>
          </div>
          {price != null && (
            <div className="border-l border-neutral-300 px-6">
              <dt className="text-xs font-medium uppercase tracking-[0.16em] text-neutral-600">
                Price
              </dt>
              <dd className="mt-1 text-base font-semibold">
                {price > 0
                  ? `${currency} ${price.toLocaleString()}`
                  : "Free"}
              </dd>
            </div>
          )}
          {entryLabel && (
            <div className="border-l border-neutral-300 pl-6">
              <dt className="text-xs font-medium uppercase tracking-[0.16em] text-neutral-600">
                Entry
              </dt>
              <dd className="mt-1 text-base font-semibold">{entryLabel}</dd>
            </div>
          )}
        </dl>
      </div>

      {/* Centre: event artwork */}
      <div className="relative bg-neutral-900">
        {eventImageUrl ? (
          <>
            {/* Square art (e.g. a poster) is shown whole over a soft copy of itself */}
            {squareArt && (
              <OptimizedImage
                src={eventImageUrl}
                alt=""
                aria-hidden="true"
                fill
                preset="card"
                sizes="31vw"
                className="scale-125 object-cover opacity-90 blur-2xl"
              />
            )}
            <OptimizedImage
              src={eventImageUrl}
              alt={`${eventTitle} — event artwork`}
              fill
              preset="card"
              sizes="(max-width: 768px) 100vw, 31vw"
              className={squareArt ? "object-contain" : "object-cover"}
              onLoad={(e) => {
                const img = e.currentTarget;
                const ratio = img.naturalWidth / img.naturalHeight;
                setSquareArt(ratio > 0.8 && ratio < 1.3);
              }}
            />
          </>
        ) : (
          <div
            aria-hidden="true"
            className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-neutral-800 via-neutral-900 to-black"
          >
            <Ticket className="h-12 w-12 text-neutral-600" strokeWidth={1} />
          </div>
        )}
        <div
          className={`absolute inset-0 bg-gradient-to-t via-transparent to-transparent ${
            squareArt ? "from-transparent" : "from-black/70"
          }`}
        />
        {taglineLines.length > 0 && (
          <p className={`absolute bottom-6 left-6 text-sm font-semibold uppercase leading-relaxed tracking-[0.2em] ${accentText}`}>
            {taglineLines.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
            <span aria-hidden="true" className={`mt-2 block h-0.5 w-10 ${accentRule}`} />
          </p>
        )}
      </div>

      {/* Right: admission stub */}
      <div className="relative flex flex-col bg-[#0c0f0d] p-7 text-white">
        {/* Perforation: dashed line stops short of the notches so nothing crosses them */}
        <span
          aria-hidden="true"
          className="absolute bottom-6 left-0 top-6 border-l-2 border-dashed border-white/30"
        />
        <span
          aria-hidden="true"
          className="ticket-notch absolute -left-5 -top-5 h-10 w-10 rounded-full"
          style={{ backgroundColor: notchColor }}
        />
        <span
          aria-hidden="true"
          className="ticket-notch absolute -bottom-5 -left-5 h-10 w-10 rounded-full"
          style={{ backgroundColor: notchColor }}
        />
        <p className={`text-center text-xs font-semibold uppercase tracking-[0.28em] ${accentText}`}>
          {ticketType}
        </p>
        <span aria-hidden="true" className={`mx-auto mt-2 block h-px w-3/4 ${accentRule}`} />
        <p className="mt-3 text-center text-sm font-semibold uppercase tracking-[0.2em]">
          {eventTitle}
        </p>
        <p className="mt-1 text-center text-sm uppercase tracking-[0.2em] text-neutral-200">
          {formatDate(startsAt, tz)}
        </p>

        <div className="mx-auto mt-5 w-40">
          {info.tone === "void" ? (
            <div className="flex aspect-square items-center justify-center border border-dashed border-white/30 p-4 text-center text-sm text-neutral-200">
              Ticket not valid
            </div>
          ) : qr ? (
            <button
              type="button"
              onClick={() => small && setQrOpen(true)}
              disabled={!small}
              aria-label={
                small
                  ? `Enlarge QR code for ticket ${code}`
                  : `QR code for ticket ${code}`
              }
              className="block w-full disabled:cursor-default"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qr}
                alt={`QR code for ticket ${code}. Show it at the door to enter.`}
                width={160}
                height={160}
                className={`aspect-square w-full bg-white ${
                  info.tone === "used" ? "opacity-60" : ""
                }`}
              />
            </button>
          ) : (
            <div className="flex aspect-square items-center justify-center bg-white/10 text-xs text-neutral-300">
              Loading QR…
            </div>
          )}
        </div>

        <p
          className={`mx-auto mt-4 w-full rounded-md px-3 py-2 text-center font-mono text-sm font-semibold tracking-[0.18em] ${
            info.usable || info.tone === "used"
              ? accentBg
              : "bg-neutral-700 text-neutral-100 line-through"
          }`}
        >
          {code}
        </p>

        <p
          role="status"
          className={`mt-3 flex items-center justify-center gap-2 text-sm font-medium ${
            info.tone === "ok"
              ? accentText
              : info.tone === "used"
                ? "text-neutral-200"
                : "text-red-300"
          }`}
        >
          <StatusIcon className="h-4 w-4 shrink-0" aria-hidden />
          <span>
            {info.label}
            {info.detail ? ` — ${info.detail}` : ""}
          </span>
        </p>

        <dl className="mt-5 space-y-4 border-t border-white/15 pt-5">
          {orderRef && <StubField label="Order" value={`#${orderRef}`} />}
          {attendeeName && <StubField label="Name" value={attendeeName} />}
          {purchasedAt && (
            <StubField label="Purchased" value={formatStamp(purchasedAt, tz)} />
          )}
        </dl>
      </div>
    </article>
  );

  // "Download ticket" prints a single-page sheet: a header from the artist
  // above the same ticket, with everything else removed from the page.
  const handleDownload = () => setPrinting(true);

  useEffect(() => {
    if (!printing) return;
    const body = document.body;
    body.setAttribute("data-printing-ticket", "true");
    const cleanup = () => {
      body.removeAttribute("data-printing-ticket");
      setPrinting(false);
    };
    window.addEventListener("afterprint", cleanup, { once: true });
    // Let the print sheet mount before the print dialog snapshots the page.
    const id = window.requestAnimationFrame(() =>
      window.requestAnimationFrame(() => window.print())
    );
    return () => {
      window.cancelAnimationFrame(id);
      window.removeEventListener("afterprint", cleanup);
      body.removeAttribute("data-printing-ticket");
    };
  }, [printing]);

  return (
    <div>
    <div
      ref={frameRef}
      className="ticket-frame relative w-full overflow-hidden"
      style={{
        height: designHeight != null ? designHeight * scale : 320,
      }}
    >
    {face(ticketRef, {
      position: "absolute",
      left: 0,
      top: 0,
      width: DESIGN_WIDTH,
      transform: `scale(${scale})`,
      transformOrigin: "top left",
    })}
    </div>
    {qrOpen && qr && (
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Ticket QR code for ${code}`}
        className="fixed inset-0 z-[1000] flex flex-col items-center justify-center gap-6 bg-black/90 p-6"
        onClick={() => setQrOpen(false)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={qr}
          alt={`Large QR code for ticket ${code}`}
          className="aspect-square w-full max-w-[22rem] bg-white"
        />
        <p className="font-mono text-base tracking-[0.18em] text-white">{code}</p>
        <button
          type="button"
          autoFocus
          onClick={() => setQrOpen(false)}
          className="min-h-[3rem] rounded-md border border-neutral-400 px-8 font-archive-body text-sm font-medium text-white"
        >
          Close
        </button>
      </div>
    )}
    {downloadable && (
      <div className="mt-5 flex justify-center">
        <button
          type="button"
          onClick={handleDownload}
          className="inline-flex min-h-[3rem] items-center gap-2 rounded-md border border-neutral-500 px-6 font-archive-body text-sm font-medium text-white transition-colors hover:border-white hover:bg-white hover:text-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          <Download className="h-4 w-4" aria-hidden />
          Download ticket
        </button>
      </div>
    )}
    {printing &&
      createPortal(
        <div className="ticket-print-root">
          <header className="print-head">
            <div>
              <h1>This is your ticket</h1>
              <p>Issued by {ISSUED_BY}</p>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={SITE_LOGO_URL} alt={ISSUED_BY} className="print-signature" />
          </header>
          {/* Same fixed composition as on screen, zoomed to fit the sheet */}
          {face(undefined, { width: DESIGN_WIDTH, zoom: 0.8 })}
          <p className="print-note">{ARTIST_NOTE}</p>
        </div>,
        document.body
      )}
    </div>
  );
}
