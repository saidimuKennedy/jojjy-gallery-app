import test from "node:test";
import assert from "node:assert/strict";
import { formatStamp, ticketStatusInfo, tzLabel } from "./ticket-status";

test("a valid, unscanned ticket is usable", () => {
  const info = ticketStatusInfo("VALID", null);
  assert.equal(info.usable, true);
  assert.equal(info.tone, "ok");
});

test("refunded and cancelled tickets are void", () => {
  for (const s of ["REFUNDED", "CANCELLED"]) {
    const info = ticketStatusInfo(s, null);
    assert.equal(info.usable, false);
    assert.equal(info.tone, "void");
    assert.match(info.detail ?? "", /not valid/i);
  }
});

test("a checked-in ticket is used, even if status still reads VALID", () => {
  const info = ticketStatusInfo("VALID", "2026-10-12T16:00:00.000Z");
  assert.equal(info.usable, false);
  assert.equal(info.tone, "used");
  assert.match(info.detail ?? "", /19:00/);
});

test("refund wins over a recorded check-in", () => {
  assert.equal(
    ticketStatusInfo("REFUNDED", "2026-10-12T16:00:00.000Z").tone,
    "void"
  );
});

test("zone labels: Nairobi is EAT, others fall back to the offset name", () => {
  assert.equal(tzLabel("Africa/Nairobi"), "EAT");
  assert.match(tzLabel("Europe/London", new Date("2026-01-15T12:00:00Z")), /GMT/);
});

test("timestamps format in the event's own zone", () => {
  assert.equal(
    formatStamp("2026-10-10T11:32:00Z", "Africa/Nairobi"),
    "10 Oct 2026, 14:32 (EAT)"
  );
  assert.match(
    formatStamp("2026-10-10T11:32:00Z", "Europe/London"),
    /^10 Oct 2026, 12:32/
  );
});
