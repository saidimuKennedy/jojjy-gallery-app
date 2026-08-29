# Plan 14 — Remove Legacy M-Pesa Operations

**Status:** Ready to implement  
**Repo:** `jojjy-gallery-app` (public) + schema sync in `jojjy-gallery-crm`  
**Effort:** M (~1–2 days)  
**Blocks launch:** No — cleanup / debt removal after Paystack end-to-end is the payment rail (Plan 02)
**Depends on:** [Plan 02 — Paystack payment end-to-end](./02-paystack-payment-end-to-end.md) (already done)

**Related:** [LAUNCH_CHECKLIST.md](../../LAUNCH_CHECKLIST.md) · [docs/scope-v1-tickets-merch-crm.md](../scope-v1-tickets-merch-crm.md) · `docs/plans/03-inventory-order-fulfillment.md` · `docs/plans/04-secure-media-blog-apis.md` · `docs/music-schema.md` · `docs/music-payment.md` · `docs/handoff-2026-07-12.md` · `docs/vision-and-roadmap.md` · `docs/app-overview-for-feedback.md`

---

## Thesis

The app now pays exclusively through **Paystack on the `Order` path** (`POST /api/orders/checkout` → Paystack redirect → webhook/verify → fulfillment). The original artwork cart paid through **Safaricom M-Pesa STK Push** and is dead weight:

- The M-Pesa flow is **sandbox-only, has no callback, and never finalizes** a purchase (`Transaction` stays `pending` forever).
- The artwork cart UI that feeds it is **orphaned** — `AddToCartButton` is never imported; `CartButton` renders on `/shop` pages but nothing ever adds an artwork to it.
- The `Transaction` model, M-Pesa API routes, payment modal, env vars, and the `MPESA` enum value all exist solely to support this broken path.

Remove it. Keep purchase history by repointing the account page at the modern `Order` records. The Paystack rail is untouched.

---

## What is NOT in scope

- Paystack (`lib/paystack.ts`, `pages/api/paystack/*`, `pages/api/orders/checkout.ts` Paystack path, `lib/orders/*`)
- The shop / tickets / music checkout UI (already uses Paystack)
- CRM functionality other than syncing the shared Prisma schema + `types/api.ts`

---

## Delete these files

| File | Why |
| ---- | --- |
| `pages/api/mpesa/stkpush.ts` | Legacy Safaricom STK push endpoint (sandbox, no callback) |
| `pages/api/payment/checkout.ts` | Legacy M-Pesa artwork-cart checkout; calls `stkpush` |
| `components/Payment/PaymentModal.tsx` | M-Pesa phone-number payment modal |
| `components/ui/CartDrawer.tsx` | Legacy artwork cart drawer (only consumer of `PaymentModal`) |
| `components/ui/CartButton.tsx` | Legacy cart button (renders empty on `/shop`) |
| `context/CartContext.tsx` | Legacy artwork cart state (only consumer of `CartButton`/`CartDrawer`) |
| `components/Art/AddToCartButton.tsx` | Orphaned — never imported anywhere |

`git rm` these.

---

## Modify these files

### 1. `pages/_app.tsx`
Remove the `CartProvider` import and wrapper (lines ~1, 15, 20).

### 2. `components/ui/Navbar.tsx`
Remove:
- imports: `useCart`, `CartDrawer`, `CartButton`
- `const { items, isCartOpen, closeCart } = useCart();`
- the route-change `useEffect` that calls `closeCart()`
- `const shouldShowCart = ...` and both `{shouldShowCart && <CartButton />}` render sites
- the `<CartDrawer isOpen={isCartOpen} onClose={closeCart} />` render at the bottom

Keep the mobile menu and all other links/logic. `Navbar` no longer touches cart state.

### 3. `types/api.ts`
Remove:
- `Transaction as PrismaTransaction` import (keep the rest)
- `export interface Transaction`
- `transactions?: Transaction[];` on `ArtworkWithRelations`
- `transactions?: (Transaction & { user?: User; })[];` on `ArtworkWithFullRelations`
- `PaymentSuccessData`, `PaymentResponse`, `PaymentErrorData`, `CartPaymentRequestData` interfaces
- `convertPrismaTransactionToAPI`
- the `transactions` mapping inside `convertPrismaArtworkWithRelationsToAPI` and its `transactions?: PrismaTransaction[]` parameter field

### 4. `pages/api/account/purchases.ts` — rewire to `Order`
Replace the `prisma.transaction.findMany` query with a query over paid orders:

```ts
const orders = await prisma.order.findMany({
  where: { userId, status: "PAID" },
  orderBy: { createdAt: "desc" },
  include: { items: true },
});

return res.status(200).json({
  success: true,
  data: orders.map((o) => ({
    id: o.id,
    status: o.status,
    amount: o.amount.toNumber(),
    currency: o.currency,
    timestamp: o.createdAt.toISOString(),
    itemTypes: [...new Set(o.items.map((i) => i.itemType))],
  })),
});
```

Keep it simple: no `Transaction` references, no legacy converter import.

### 5. `pages/account/index.tsx`
Update the `TransactionRow` interface to match the new payload (drop `phoneNumber`/`artworkIds`, add `currency`/`itemTypes`), and adjust the purchases rendering block to show order info instead of M-Pesa transaction fields. Copy can say **"Purchase history"** listing paid orders. If no paid orders exist, keep the empty state ("No purchases yet.").

### 6. `pages/api/orders/checkout.ts`
Remove the M-Pesa fallback. Replace:

```ts
const provider: PaymentProvider =
  paymentProvider === "MPESA" ? "MPESA" : "PAYSTACK";
```

with always-Paystack (`PAYSTACK`), since the MPESA branch below already falls through to a non-functional "complete payment to confirm" stub. This makes `PaymentProvider` import unused only if the enum still has it — see schema step. Concretely:

```ts
const provider: PaymentProvider = "PAYSTACK";
```

(Keep the `PaymentProvider` import if the enum type is still used; remove it once the enum is reduced — see step 7.)

### 7. `prisma/schema.prisma`
- Delete the `Transaction` model (lines ~158–171).
- Delete `Transaction Transaction[]` from `User` (line ~132).
- Update the `Order` doc comment that references the "legacy artwork `Transaction`/M-Pesa flow".
- Reduce the `PaymentProvider` enum to just `PAYSTACK` (remove `MPESA`). If you keep `MPESA` in the enum for now, flag it as leftover — recommended is full removal.

**Data handling before the enum change** — run in the same migration SQL:

```sql
-- Existing rows that used the legacy provider become PAYSTACK
ALTER TYPE "PaymentProvider" RENAME VALUE 'MPESA' TO 'PAYSTACK';
```

After the schema edit, generate a migration: `npx prisma migrate dev --name remove_legacy_mpesa`. Inspect the generated SQL — it should DROP the `transactions` table, drop the `User.transactionId`-side relation (none exists; relation is via `userId`), and handle the enum. Verify the enum drop is emitted; if Prisma can't emit `DROP VALUE` cleanly, add it manually in the migration:

```sql
ALTER TYPE "PaymentProvider" DROP VALUE IF EXISTS 'MPESA';
```

Note: the `transactions` table is `pending`-only dead data. If you must preserve it, back it up (`pg_dump -t transactions`) before migrating, but it holds no finalized sales.

### 8. `.env.example`
Delete the M-Pesa block (lines ~37–42).

### 9. `scripts/audit-env.mjs`
- Delete the `MPESA_CONSUMER_KEY`, `MPESA_CONSUMER_SECRET`, `MPESA_SHORTCODE`, `MPESA_PASSKEY`, `MPESA_CALLBACK_URL` manifest entries.
- Remove `"pages/api/payment/checkout.ts (M-Pesa callback base)"` from `NEXTAUTH_URL.usedBy`.

### 10. `jojjy-gallery-crm` (separate repo — shared schema)
The CRM repo shares the same Prisma schema + a mirrored `types/api.ts`. After the Gallery schema change:
- Copy the updated `prisma/schema.prisma` into `jojjy-gallery-crm/prisma/schema.prisma`.
- Run `npx prisma generate` there.
- Mirror the `types/api.ts` deletions in `jojjy-gallery-crm/types/api.ts` (Transaction interface, converter, `transactions` fields on artwork types, legacy payment types).
- Confirm no CRM code references `prisma.transaction` or the `MPESA` provider (currently only schema + types reference them).

### 11. Docs sweep
Update M-Pesa references so the repo no longer advertises a dead rail:
- `LAUNCH_CHECKLIST.md` — remove/adjust the "M-Pesa STK push" row (line ~94), the M-Pesa mention in the deployment row (line ~25), and the "fix M-Pesa" item (line ~174).
- `docs/app-overview-for-feedback.md` — replace "paid via M-Pesa" copy with Paystack (lines ~14, ~36).
- `docs/music-payment.md` — line ~60 "Inherit M-Pesa / Paystack" → "Inherit Paystack".
- `docs/music-schema.md` — PaymentProvider enum note (line ~55).
- `docs/scope-v1-tickets-merch-crm.md` — M-Pesa lines (~21–22).
- `docs/plans/03-inventory-order-fulfillment.md` — line ~35 M-Pesa note.
- `docs/plans/04-secure-media-blog-apis.md` — line ~116 (STK push) can be dropped/updated.
- `docs/handoff-2026-07-12.md`, `docs/vision-and-roadmap.md` — historical notes may stay but add "legacy M-Pesa removed (Plan 14)" or scrub; do a light touch, don't rewrite history docs.
- `docs/plans/02-paystack-payment-end-to-end.md` — historical; leave as-is (it documents the migration decision), optionally append a note that the legacy path was removed in Plan 14.

### 12. `docs/plans/README.md`
Add Plan 14 to the sprint table and to the repo-role notes if appropriate.

---

## Order of implementation

1. Delete the 7 dead files; update `_app.tsx`, `Navbar.tsx` (this alone restores a clean build).
2. Prune `types/api.ts`.
3. Rewire account purchases (`pages/api/account/purchases.ts` + `pages/account/index.tsx`).
4. Simplify `orders/checkout.ts` provider.
5. Schema + migration (Gallery), then sync CRM repo (schema + types + generate).
6. Env cleanup (`.env.example`, `scripts/audit-env.mjs`).
7. Docs sweep + register plan in README.

---

## Verification

- `npx prisma validate` and `npx prisma migrate dev --name remove_legacy_mpesa` succeed; inspect generated SQL (table drop + enum).
- `npx tsc --noEmit` and `npm run build` pass.
- `npm run audit:env` runs clean, no M-Pesa keys, and `NEXTAUTH_URL` no longer references the deleted route.
- `rg -n "mpesa|MPESA|Transaction|stkpush" . --glob '!docs/plans/02*' --glob '!docs/handoff-2026-07-12.md' --glob '!docs/vision-and-roadmap.md'` returns no source hits.
- Manual smoke (needs Paystack test keys): buy a shop item → Paystack redirect → webhook → order `PAID` → account purchase history shows the order. (Existing Paystack behavior; unchanged — regression check only.)
- CRM repo: `npx prisma generate` succeeds; no TS errors after `types/api.ts` sync.

---

## Risks / notes

- **Enum migration:** if any prod rows have `paymentProvider = 'MPESA'`, the `RENAME VALUE` runs before the drop; without it the `DROP VALUE` would fail on referencing rows.
- **CRM sync:** both repos must ship the schema change together or the shared DB diverges from one repo's client. Coordinate the migration (run once) then regenerate both clients.
- **`local_db_data.sql`** contains an old `transactions` dump — it's a throwaway local dev export; no action required.
- **Purchase history** is preserved via Orders; users who only ever "bought" through the broken M-Pesa path never had finalized purchases, so no real sales are lost.
