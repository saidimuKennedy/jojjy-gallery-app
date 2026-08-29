# Plan 12 — Fix Announcement Publish Bug

**Status:** Complete (2026-07-27)  
**Repo:** `jojjy-gallery-crm`  
**Effort:** S (~30–60 min)  
**Blocks launch:** Soft — needed before a public news feed (next: Plan 13)  
**Depends on:** None  
**Follows:** User priority after Audience MVP — (1) this fix → (2) public announcements page → (3) Paystack smoke

**Related:** [LAUNCH_CHECKLIST.md](../../LAUNCH_CHECKLIST.md) (Announcements CRUD 🟡) · CRM `pages/api/announcements/[id].ts` · `pages/dashboard/announcements.tsx`

---

## Thesis

CRM “Publish” does not reliably set `publishedAt`. The list UI and create API speak `publish: true`; the update API ignores that flag and treats a missing `publishedAt` as **clear to null**. So the megaphone “Publish” action can leave (or force) a draft forever.

Fix the contract once. Then a public `/news` (or `/updates`) page can trust `publishedAt IS NOT NULL`.

---

## Bug (confirmed)

### UI — `publishExisting`

```ts
// pages/dashboard/announcements.tsx
await fetch(`/api/announcements/${row.id}`, {
  method: "PUT",
  body: JSON.stringify({
    title: row.title,
    body: row.body,
    eventId: row.eventId,
    publish: true, // ← sent
    // publishedAt NOT sent
  }),
});
```

### API — `PUT /api/announcements/[id]`

```ts
const { title, body, eventId, publishedAt } = req.body; // publish ignored

data: {
  ...
  publishedAt: publishedAt ? new Date(publishedAt) : null, // missing → null
}
```

| Action | Intended | Actual |
| ------ | -------- | ------ |
| List → Publish (megaphone) | Set `publishedAt = now` | Stays / becomes `null` (draft) |
| Modal → Save & publish | Often works (UI also sends `publishedAt` ISO) | OK by accident |
| Modal → Save draft on already-published | Keep or unpublish? | Keeps if UI sends old `publishedAt`; unclear |

### Create path is fine

`POST /api/announcements` already honors `publish`:

```ts
publishedAt: publish ? new Date() : publishedAt ? new Date(publishedAt) : null
```

Update must match create.

---

## Goal

1. `PUT` honors `publish: true` → set `publishedAt` to now if not already set (or always refresh — prefer **set now only when currently null**, keep existing timestamp if already published unless body sends a new date).
2. `PUT` does **not** clear `publishedAt` just because the field was omitted.
3. Optional explicit unpublish: `publish: false` or `unpublish: true` → `publishedAt = null`.
4. Align list “Publish” button with the fixed API (minimal UI change).

---

## Scope

### In scope

- Fix `pages/api/announcements/[id].ts` publish / `publishedAt` semantics
- Small UI payload cleanup if needed (`publishExisting` can keep sending `publish: true`)
- Smoke checklist in CRM

### Out of scope

- Public news page (next plan)
- Email / Resend / WhatsApp delivery
- Audience notify-on-publish
- Scheduling (`publishAt` in the future)
- New Announcement schema fields

---

## Recommended API semantics

```ts
// Pseudo
const { title, body, eventId, publishedAt, publish } = req.body;

let nextPublishedAt = existing.publishedAt;

if (publish === true) {
  nextPublishedAt = existing.publishedAt ?? new Date();
} else if (publish === false) {
  nextPublishedAt = null;
} else if (publishedAt !== undefined) {
  // explicit ISO or null from client
  nextPublishedAt = publishedAt ? new Date(publishedAt) : null;
}
// else: leave existing.publishedAt unchanged
```

**Rules**

| Body | Result |
| ---- | ------ |
| `publish: true` | Ensure published (`publishedAt ??= now`) |
| `publish: false` | Unpublish (`publishedAt = null`) |
| `publishedAt: "<iso>"` only | Set that timestamp |
| `publishedAt: null` only | Unpublish |
| Neither `publish` nor `publishedAt` | **Keep** existing `publishedAt` |

Mirror the same helper on `POST` if useful (optional DRY).

---

## Implementation steps

### Step 1 — Load existing row on PUT

Before update, `findUnique` (or use update only after resolving `nextPublishedAt` from existing). Needed so omit ≠ clear.

### Step 2 — Resolve `publishedAt` with rules above

Replace:

```ts
publishedAt: publishedAt ? new Date(publishedAt) : null
```

### Step 3 — UI (optional polish)

- `publishExisting`: keep `{ publish: true }` — sufficient once API is fixed
- Modal save: prefer `{ publish: true | false }` over hand-rolled ISO when possible, so create/update stay consistent
- Optional: **Unpublish** control for published rows (nice; not required for this bugfix)

### Step 4 — Smoke

1. Create draft → status Draft  
2. Megaphone Publish → status Published with date  
3. Edit title, Save as draft **without** unpublish flag → still Published (if we keep “omit = keep”)  
4. If unpublish implemented: Unpublish → Draft  
5. Create with Save & publish → Published immediately  

---

## Files to touch

| File | Change |
| ---- | ------ |
| `jojjy-gallery-crm/pages/api/announcements/[id].ts` | Fix `publishedAt` / `publish` handling |
| `jojjy-gallery-crm/pages/dashboard/announcements.tsx` | Optional payload / unpublish polish |
| `jojjy-gallery-crm/pages/api/announcements/index.ts` | Optional: extract shared resolve helper |

---

## Success criteria

1. List **Publish** on a draft sets `publishedAt` and shows Published.  
2. Editing a published announcement without `publish: false` does not wipe `publishedAt`.  
3. Create + Save & publish still works.  
4. No schema / migration changes.

---

## Next in queue (agreed)

| Order | Work | Plan |
| ----- | ---- | ---- |
| 1 (this) | Fix publish bug | Plan 12 |
| 2 | Public announcements page | [Plan 13](./13-public-announcements-updates.md) |
| 3 | Paystack end-to-end smoke | Plan 02 / checklist |
