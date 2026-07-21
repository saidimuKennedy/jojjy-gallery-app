# Plan 04 — Secure Media-Blog Write APIs

**Status:** Not started  
**Repo:** `jojjy-gallery-app`  
**Effort:** S (half day)  
**Blocks launch:** Yes (security)

---

## Goal

Close the critical gap where **anyone** can `POST`, `PUT`, or `DELETE` archive (media-blog) entries on the public gallery app. Archive mutations belong in the CRM only.

---

## Current state

| Route | Methods | Auth |
| ----- | ------- | ---- |
| `pages/api/media-blog/index.ts` | GET, POST | GET public; **POST open** |
| `pages/api/media-blog/[id].ts` | GET, PUT, DELETE | GET public; **PUT/DELETE open** |

Gallery middleware (`middleware.ts`) only sets cache headers — no auth.

CRM has its own media-blog management; public site should be **read-only** for this content.

---

## Options (pick one)

### Option A — Remove write methods (recommended)

Simplest and matches architecture: public site = read/checkout only.

1. Delete `POST` handler from `pages/api/media-blog/index.ts`.
2. Delete `PUT` and `DELETE` from `pages/api/media-blog/[id].ts`.
3. Keep GET + cache headers.

CRM continues to mutate via its own API routes (or direct DB if CRM has separate routes).

### Option B — Gate with shared secret / service token

If gallery API must accept writes from CRM server-to-server:

1. Add `CRM_API_SECRET` env var.
2. Require `Authorization: Bearer <secret>` on mutating methods.
3. CRM sends header on proxy calls.

More moving parts — only if CRM currently calls gallery APIs (verify first).

### Option C — Move routes to CRM entirely

If CRM already has `/pages/api/media-blog/*`, delete gallery write handlers and confirm CRM is sole writer.

---

## Recommended implementation (Option A)

### Step 1 — Audit CRM write path

Confirm `jojjy-gallery-crm` has working media-blog CRUD APIs. If not, implement there first (should already exist per handoff doc).

### Step 2 — Strip gallery write handlers

`pages/api/media-blog/index.ts`:

- Keep GET only; return 405 for POST with message pointing to CRM.

`pages/api/media-blog/[id].ts`:

- Keep GET only; return 405 for PUT/DELETE.

### Step 3 — Search for gallery-side callers

Grep gallery repo for `fetch('/api/media-blog'` with POST/PUT/DELETE. Remove any admin UI remnants.

### Step 4 — Add regression test note

Document in LAUNCH_CHECKLIST: archive CRUD = CRM only.

---

## Files to touch

| File | Change |
| ---- | ------ |
| `pages/api/media-blog/index.ts` | Remove POST |
| `pages/api/media-blog/[id].ts` | Remove PUT, DELETE |
| `LAUNCH_CHECKLIST.md` | Mark security item ✅ |

---

## Test plan

1. `curl -X POST /api/media-blog` → 405
2. `curl -X PUT /api/media-blog/1` → 405
3. `curl -X DELETE /api/media-blog/1` → 405
4. `GET /api/media-blog` → 200 unchanged
5. CRM can still create/edit archive entries

---

## Acceptance criteria

- [ ] No unauthenticated write access to archive on public domain
- [ ] Public GET APIs unchanged
- [ ] CRM archive management still works

---

## Related hardening (same sprint if time)

| Item | File | Fix |
| ---- | ---- | --- |
| Contact HTML injection | `pages/api/contact/send-contact-email.ts` | Escape HTML in email body |
| STK push unauthenticated | `pages/api/mpesa/stkpush.ts` | Require session or deprecate |
| Like/view spam | `pages/api/artworks/[id]/like.ts` | Rate limit (future plan) |
