# Plan 09 — Music Paid Unlock Checkout

**Status:** In progress (2026-07-21)  
**Repo:** `jojjy-gallery-app` (gallery); CRM unchanged for this slice  
**Effort:** M (1–2 days)  
**Blocks launch:** No (music module); blocks **paid music conversion**  
**Depends on:** [Plan 02 — Paystack end-to-end](./02-paystack-payment-end-to-end.md) (complete), [Plan 03 — Inventory & fulfillment](./03-inventory-order-fulfillment.md) (partial — music cases missing)

**Related specs:** [music-implementation.md](../music-implementation.md) Phase F · [music-payment.md](../music-payment.md) · [music-entitlements.md](../music-entitlements.md)

---

## Goal

Close the loop for **paid releases** after the 3-play tease:

1. Fan exhausts free preview → sees a real **Unlock** CTA (USD display price).
2. Checkout creates an `Order` with `OrderItem(RELEASE)` → Paystack in **KES**.
3. Payment fulfillment creates `ReleaseUnlock` → unlimited playback + Library entry.
4. Release page UI reflects access state before, during, and after purchase.

Until this plan ships, the gallery correctly returns `purchase_required` on play but offers no payment path and **does not grant unlocks** even if checkout is called manually.

---

## Current state

| Piece | Status |
| ----- | ------ |
| Tease quota (`PaidPlayQuota`, anonymous cookie) | ✅ Done |
| `resolvePlayAccess()` → `tease` / `purchase_required` | ✅ Done |
| `POST /api/music/play` — stream on allow, 403 on deny | ✅ Done |
| `POST /api/orders/checkout` — accepts `{ releaseId }`, charges KES | ✅ Done |
| Paystack initialize + verify + webhook | ✅ Done (shop/events) |
| `lib/orders/fulfill.ts` — `RELEASE` / `MEMBERSHIP_PASS` | ❌ **Missing** — hits `default: break` |
| `ReleaseUnlock` from Order payment | ❌ **Missing** |
| Release page purchase UI | ❌ **Missing** — static “purchase when checkout is live” copy |
| Access state on page load (owned / tease remaining / locked) | ❌ **Missing** |
| Paystack callback back to release page | ❌ **Missing** — hardcoded `/shop/confirmation` |
| Confirmation page — release line items + “back to music” | ❌ **Missing** |
| USD display / KES charge for music | ✅ Done (`lib/currency.ts`, `KES_PER_USD`) |

**Reference UI pattern:** ticket purchase in `pages/events/[slug].tsx` (sign in → checkout → Paystack redirect).

---

## Scope

### In scope

- Fulfillment for `OrderItemType.RELEASE` → `ReleaseUnlock(source=ORDER, orderItemId=…)`
- Fulfillment for `OrderItemType.MEMBERSHIP_PASS` → `grantOrExtendMembership()` (ADR-023 stacking)
- Access status on release detail (owned, tease remaining, locked, free, membership required)
- Release page: purchase CTA, sign-in gate, checkout handler, post-payment verify + refresh
- Music-specific Paystack return URL (`/music/[slug]?reference=…`)
- Confirmation page support for music orders (release title, link to library / release)
- UI state machine on release detail page

### Out of scope (follow-ups)

- Membership pass purchase UI on Music home (separate slice; same checkout pattern)
- Multi-item music cart (single release per checkout for v1)
- Mixed cart (music + shop/events) — already rejected at checkout API
- CRM changes (manual grants remain valid parallel path per ADR-019)
- Auto-revoke on refund (ADR-018)
- Downloads, recurring billing

---

## Access state model

The release detail page should derive one **access state** for the signed-in (or anonymous) viewer:

| State | Condition | Primary UI |
| ----- | --------- | ---------- |
| `free` | `accessMode === FREE` | Play always |
| `tease` | PAID, not owned, `playCount < paidPlayLimit` | “X of 3 free plays left” + Play |
| `locked` | PAID, not owned, tease exhausted | “Preview ended” + **Unlock · $ X** |
| `owned` | `ReleaseUnlock` for user | “In your library” + unlimited Play |
| `membership_required` | `MEMBERS_ONLY`, no active pass | Studio Pass CTA (Phase 1.5) |
| `checking_out` | Paystack redirect in flight | Disabled CTA |
| `confirming` | Return with `?reference=` | “Confirming payment…” |

Catalog cards (`/music`) stay badge-only for v1; stateful UX lives on `/music/[slug]`.

---

## Implementation steps

### Step 1 — Order fulfillment for music

Extend `lib/orders/fulfill.ts` inside the existing transaction:

**`RELEASE`**

```text
if ReleaseUnlock already exists for (userId, releaseId): skip (idempotent)
else create ReleaseUnlock {
  userId: order.userId,
  releaseId: item.releaseId,
  orderItemId: item.id,
  source: ORDER
}
```

**`MEMBERSHIP_PASS`**

```text
call grantOrExtendMembership({
  userId: order.userId,
  membershipPlanId: item.membershipPlanId,
  orderId: order.id
})
```

No inventory/stock checks for music items. Validate release is still `PUBLISHED` and `accessMode === PAID` at fulfillment time (or allow unlock even if later archived — see [music-schema.md](../music-schema.md)).

**Files:** `lib/orders/fulfill.ts`

---

### Step 2 — Access status API

Extend `GET /api/music/releases/[slug]` **or** add `GET /api/music/releases/[slug]/access`.

Recommended: extend the existing detail response to avoid an extra round trip:

```ts
{
  // …existing release fields…
  viewerAccess: {
    state: "free" | "owned" | "tease" | "locked" | "membership_required",
    owned: boolean,
    remainingTease: number | null,
    canPlay: boolean
  }
}
```

Resolution logic reuses `resolvePlayAccess()` from `lib/music/entitlements.ts`:

- Pass `userId` from session when present.
- Pass `anonymousKey` from `jg_music_aid` cookie when anonymous (for tease count).
- Map `PlayDecision` to `viewerAccess.state`.

**Files:** `pages/api/music/releases/[slug].ts`, optionally `lib/music/entitlements.ts` (helper `toViewerAccessState()`)

---

### Step 3 — Paystack callback URL for music

Extend `paystackCallbackUrl(reference, returnPath?)` in `lib/paystack.ts`:

```ts
paystackCallbackUrl(reference, `/music/${slug}`)
// → https://<site>/music/sunshine-live?reference=jojjy_…
```

Pass `returnPath` from checkout when the client sends `returnPath` in the checkout body (validate: must start with `/music/` to prevent open redirects).

Alternative: store `returnPath` on `Order` metadata or a nullable column — only needed if webhook-only confirmation is required; for v1, query param on initialize is enough.

**Files:** `lib/paystack.ts`, `pages/api/orders/checkout.ts`

---

### Step 4 — Release page purchase flow

Update `pages/music/[slug].tsx`:

1. **On load:** use `viewerAccess` from release API (not only after Play).
2. **Sign-in gate:** if locked and unauthenticated → `/login?callbackUrl=…` (same as events).
3. **Unlock handler:**
   ```ts
   POST /api/orders/checkout
   {
     items: [{ releaseId: release.id }],
     paymentProvider: "PAYSTACK",
     returnPath: `/music/${release.slug}`
   }
   ```
4. Redirect to `authorizationUrl`.
5. **On return** (`router.query.reference`):
   - Call `POST /api/paystack/verify` with `{ reference }`.
   - Re-fetch release (or mutate SWR) → `viewerAccess.state === "owned"`.
   - Show success copy; enable Play without hitting paywall.
   - Replace URL to drop `reference` query (shallow route).

6. **Replace dead-end copy** — remove “purchase when checkout is live”; show contextual CTAs per state.

7. **Play error handling:** when `reason === "purchase_required"`, set local state to `locked` and surface Unlock CTA (don't rely on red error text alone).

Use `react-hot-toast` for errors (consistent with shop/events).

**Files:** `pages/music/[slug].tsx`

---

### Step 5 — Confirmation page (music orders)

Update `pages/shop/confirmation.tsx` and/or `pages/api/paystack/verify.ts` serializer:

- Include `release` on `OrderItem` when `itemType === RELEASE` (title, slug).
- Show “Listen now →” link to `/music/[slug]`.
- Show “Your library →” link to `/music/library` when order contains music.

Music checkout may return to release page directly (Step 4); confirmation page remains fallback if Paystack uses default callback.

**Files:** `pages/shop/confirmation.tsx`, `pages/api/paystack/verify.ts`, `loadOrder()` include

---

### Step 6 — Types & env

- Extend checkout request/response types if needed (`returnPath?: string`).
- Document `KES_PER_USD` in `.env.example` (already added) — display USD, charge KES.
- Optional feature flag: `NEXT_PUBLIC_MUSIC_CHECKOUT_ENABLED=true` to gate CTAs in preview deploys.

**Files:** `types/api.ts` (if present), `.env.example`

---

## Files to touch

| File | Change |
| ---- | ------ |
| `lib/orders/fulfill.ts` | Handle `RELEASE` + `MEMBERSHIP_PASS` |
| `lib/music/entitlements.ts` | Optional `toViewerAccessState()` helper |
| `lib/paystack.ts` | Optional `returnPath` on callback URL |
| `pages/api/music/releases/[slug].ts` | Add `viewerAccess` to response |
| `pages/api/orders/checkout.ts` | Accept + validate `returnPath` for music |
| `pages/api/paystack/verify.ts` | Include release on order items |
| `pages/music/[slug].tsx` | State machine UI + checkout + post-pay refresh |
| `pages/shop/confirmation.tsx` | Music order summary links |

---

## Test plan

1. **Tease → locked:** Play paid release 3 times (anonymous) → 4th play denied → Unlock CTA visible with USD price.
2. **Sign-in gate:** Click Unlock while logged out → redirect to login → return to release → still locked with CTA.
3. **Happy path:** Sign in → Unlock → Paystack test card → verify → `ReleaseUnlock` row exists → Play succeeds unlimited.
4. **Library:** Paid release appears on `/music/library` after unlock.
5. **Idempotent fulfillment:** Replay webhook / verify twice → single `ReleaseUnlock`, order stays `PAID`.
6. **Already owned:** User with existing unlock → `viewerAccess.state === "owned"`, no purchase CTA; checkout should no-op or 409 if attempted.
7. **Currency:** UI shows USD; Paystack initialize uses KES amount from DB (e.g. 1200 KES for Sunshine — Live).
8. **Free release:** Unaffected — no purchase CTA, unlimited play.
9. **Members only:** Still shows membership CTA (not in this plan’s purchase path unless pass checkout added).

---

## Acceptance criteria

- [ ] After 3 tease plays, fan sees **Unlock** with USD price (not only an error message)
- [ ] Successful Paystack payment creates `ReleaseUnlock(source=ORDER)` for the buyer
- [ ] After payment, fan can play all tracks without quota limit
- [ ] Release appears in `/music/library` for the buyer
- [ ] Release page reflects `owned` state on reload (no stale “locked” UI)
- [ ] Fulfillment is idempotent (duplicate webhook safe)
- [ ] Anonymous users are prompted to sign in before checkout
- [ ] Payment amount is server-side KES from `AccessPolicy.price` (no client tampering)

---

## Dependencies & sequencing

```text
Step 1 (fulfillment)     ← blocker; must land first
Step 2 (access API)      ← enables correct UI on load
Step 3 (callback URL)    ← can parallel with Step 4
Step 4 (release page UI) ← depends on 1 + 2
Step 5 (confirmation)    ← polish; can follow Step 4
```

**Prerequisite:** Paystack keys configured (`PAYSTACK_SECRET_KEY`, `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`).

**CRM:** No schema changes. Staff manual grants (`CRM_MANUAL`) remain the fallback per [music-payment.md](../music-payment.md).

---

## Future follow-ups (not this plan)

| Item | Doc |
| ---- | --- |
| Studio Pass purchase on Music home | Extend Step 4 pattern with `membershipPlanId` |
| Persistent site-wide player | [music-streaming.md](../music-streaming.md) |
| CRM grant UI | [music-crm.md](../music-crm.md) |
| Analytics / conversion funnel | [music-roadmap.md](../music-roadmap.md) Phase 1.5 |

---

## Changelog

| Date | Note |
| ---- | ---- |
| 2026-07-21 | Plan created from gallery audit — tease works, purchase loop incomplete |
