# Plan 05 — CRM Staff Management & Permission Cleanup

**Status:** Not started  
**Repo:** `jojjy-gallery-crm`  
**Effort:** L (2–4 days)  
**Blocks launch:** Yes

---

## Goal

1. Build staff CRUD: create, deactivate, assign role, remove role
2. Enforce `staff:*` and `tickets:*` permissions (or remove dead keys)
3. Hide nav modules users can't access
4. Fix stale JWT permissions (optional but recommended)

---

## Current state

| Feature | Status |
| ------- | ------ |
| Staff page | Read-only role/permission catalog (`pages/dashboard/staff.tsx`) |
| Staff APIs | **None** — bootstrap via `prisma/seed.ts` env vars only |
| `staff:read`, `staff:write` | Seeded, **never checked** |
| `tickets:read`, `tickets:write` | Seeded, **never checked** |
| Ticket APIs | Use `events:read` / `events:write` instead |
| Nav | `DashboardLayout.tsx` shows all modules to every user |
| Deactivate | `CrmUser.isActive` checked at login; no admin toggle |
| Permissions in JWT | Baked at login; role changes need re-login |

---

## Scope

### In scope

- `GET/POST /api/staff` — list, create staff
- `PATCH /api/staff/[id]` — deactivate, assign role, update name/email
- `DELETE /api/staff/[id]/role` or PATCH to clear role
- Enforce `staff:read` on staff page SSR; `staff:write` on mutations
- Switch ticket-types API to `tickets:read` / `tickets:write`
- Nav gating by permission keys
- Staff management UI on `pages/dashboard/staff.tsx`

### Out of scope

- Per-user permission override UI (`CrmUserPermission`) — phase 2
- Invite-by-email flow — manual password set v1
- Session invalidation on deactivate — document "takes effect on next login"

---

## Implementation steps

### Step 1 — Staff API routes

Create `pages/api/staff/index.ts`:

| Method | Permission | Action |
| ------ | ---------- | ------ |
| GET | `staff:read` | List `CrmUser` with roles |
| POST | `staff:write` | Create user + bcrypt password + assign role |

Create `pages/api/staff/[id].ts`:

| Method | Permission | Action |
| ------ | ---------- | ------ |
| PATCH | `staff:write` | Update `isActive`, `roleId`, name |
| DELETE | `staff:write` | Soft-delete: set `isActive: false` |

Use existing `requirePermission` from `lib/require-permission.ts`.

Password: accept `password` on create; hash with bcrypt (match existing auth pattern in `lib/auth-options.ts`).

### Step 2 — Staff UI

Extend `pages/dashboard/staff.tsx`:

- **Create staff** form: name, email, password, role dropdown
- **Staff list** table: name, email, role, active badge
- Actions: Deactivate / Reactivate, Change role
- Gate page with `staff:read` in `getServerSideProps`

### Step 3 — Wire ticket permissions

Update `pages/api/events/[id]/ticket-types.ts`:

```ts
// Before
requirePermission(req, res, "events:write");
// After
requirePermission(req, res, "tickets:write");
```

GET → `tickets:read`.

Update seed: ensure Admin role includes `tickets:*` and `staff:*` (likely already there).

### Step 4 — Nav gating

In `components/DashboardLayout.tsx`:

- Accept `permissions: string[]` from session
- Hide nav links when user lacks `{module}:read` key
- Map: Artworks → `artworks:read`, Events → `events:read`, Tickets → `tickets:read`, Staff → `staff:read`, etc.

### Step 5 — Permission decision on dead keys

**Recommended:** Enforce them (steps above). **Alternative:** Remove from seed if consolidating under `events:*` — but that blurs ticket ops vs event content.

### Step 6 — Fresh permissions (optional)

In `requirePermission`, optionally re-fetch permissions from DB every N minutes or on each request for write ops. Simpler v1: document that role changes require re-login.

---

## Files to touch

| File | Change |
| ---- | ------ |
| `pages/api/staff/index.ts` | **New** |
| `pages/api/staff/[id].ts` | **New** |
| `pages/dashboard/staff.tsx` | CRUD UI + SSR gate |
| `pages/api/events/[id]/ticket-types.ts` | Use `tickets:*` |
| `components/DashboardLayout.tsx` | Nav gating |
| `prisma/seed.ts` | Verify role permission sets |

---

## Test plan

1. User without `staff:read` → 403 on staff page/API.
2. Admin creates editor account → can log in with assigned role permissions.
3. Deactivate user → cannot log in; existing session works until expiry (document).
4. User with `tickets:write` but not `events:write` → can manage ticket types.
5. Nav hides Staff link without `staff:read`.

---

## Acceptance criteria

- [ ] Staff create / deactivate / assign role works via UI
- [ ] `staff:*` enforced on staff routes and page
- [ ] `tickets:*` enforced on ticket-type routes
- [ ] Nav respects permissions
- [ ] LAUNCH_CHECKLIST CRM staff row → ✅

---

## Security notes

- Only `staff:write` users can create other staff
- Prevent self-deactivation of last admin (guard in PATCH)
- Validate email uniqueness on create
