/** Presentation status for a ticket, from its authoritative lifecycle state. */
export type TicketStatusInfo = {
  label: string;
  detail?: string;
  /** Can this ticket still be scanned for entry? */
  usable: boolean;
  tone: "ok" | "used" | "void";
};

export const DEFAULT_TIME_ZONE = "Africa/Nairobi";

const TZ_ABBREVIATIONS: Record<string, string> = {
  "Africa/Nairobi": "EAT",
  "Africa/Kampala": "EAT",
  "Africa/Dar_es_Salaam": "EAT",
  "UTC": "UTC",
};

/** Short zone label for display, e.g. "EAT" or "GMT+1". */
export function tzLabel(timeZone: string, at: Date = new Date()): string {
  if (TZ_ABBREVIATIONS[timeZone]) return TZ_ABBREVIATIONS[timeZone];
  try {
    const part = new Intl.DateTimeFormat("en-US", {
      timeZone,
      timeZoneName: "short",
    })
      .formatToParts(at)
      .find((p) => p.type === "timeZoneName");
    return part?.value ?? timeZone;
  } catch {
    return timeZone;
  }
}

/** "10 Oct 2026, 14:32 (EAT)" in the given zone. */
export function formatStamp(
  iso: string,
  timeZone: string = DEFAULT_TIME_ZONE
): string {
  const d = new Date(iso);
  const date = d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone,
  });
  const time = d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone,
  });
  return `${date}, ${time} (${tzLabel(timeZone, d)})`;
}

export function ticketStatusInfo(
  status: string,
  checkedInAt?: string | null,
  timeZone: string = DEFAULT_TIME_ZONE
): TicketStatusInfo {
  if (status === "REFUNDED") {
    return { label: "Refunded", detail: "Not valid for entry", usable: false, tone: "void" };
  }
  if (status === "CANCELLED") {
    return { label: "Cancelled", detail: "Not valid for entry", usable: false, tone: "void" };
  }
  if (status === "CHECKED_IN" || checkedInAt) {
    return {
      label: "Checked in",
      detail: checkedInAt ? formatStamp(checkedInAt, timeZone) : undefined,
      usable: false,
      tone: "used",
    };
  }
  return { label: "Valid for entry", usable: true, tone: "ok" };
}
