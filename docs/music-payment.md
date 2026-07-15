# Music Payments Integration

> Version: 1.2  
> Status: Engineering Design  
> Depends on:  
> - [product-music.md](./product-music.md)  
> - [music-schema.md](./music-schema.md)  
> - [music-decisions.md](./music-decisions.md)

---

# Purpose

How Music integrates with existing commerce — and how MVP works **before** shared Order fulfillment is live.

Music **MUST NOT** introduce a parallel payment system long-term (ADR-008).

---

# MVP path (now)

Per ADR-019:

1. Staff configure Releases, prices, MembershipPlans in CRM.
2. Fan may still see purchase / pass CTAs in gallery (copy can say “request access” / checkout when ready).
3. **CRM manually grants** `ReleaseUnlock` and/or `Membership` for entitled Fans.
4. When shared Paystack/webhook fulfillment ships, Order lines create the same entitlement rows automatically.

Refunds: **no auto-revoke** (ADR-018). Staff revoke manually if needed.

---

# Target commerce flow (Release)

```text
Fan → Checkout → Order + OrderItem(RELEASE)
  → Payment → Order PAID → ReleaseUnlock(source=ORDER)
  → Library + full playback
```

Membership pass: `OrderItem(MEMBERSHIP_PASS)` → Membership row.

---

# Order Integration

| itemType | FK | Meaning |
| --- | --- | --- |
| `RELEASE` | `releaseId` | Permanent unlock |
| `MEMBERSHIP_PASS` | `membershipPlanId` | Prepaid pass |

Price on Paid releases is **editable anytime** (ADR-021); Order lines keep `unitPrice` at purchase time.

Studio Pass price/duration: **artist-configured** MembershipPlan (ADR-016).

---

# Payment Providers (when live)

Inherit M-Pesa / Paystack. No Music-specific branching.

---

# Pass stacking (ADR-023)

When granting a new prepaid pass while Membership is ACTIVE:

```text
expiresAt = max(now, currentExpiresAt) + durationDays
```

Cancelled/Expired memberships start fresh: `now + durationDays`.

---

# Reporting

OrderItems RELEASE / MEMBERSHIP_PASS when automated.  
CRM grant log for manual period.

---

# Future

Bundles, gifts, promos, coupons, recurring memberships, automated refund revoke.
