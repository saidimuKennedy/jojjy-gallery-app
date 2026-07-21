# Plan 01 — Descriptive Cloudinary Image Names

**Status:** Not started  
**Repo:** `jojjy-gallery-crm` (primary)  
**Effort:** S (half day)  
**Blocks launch:** Yes (media architecture / SEO / ops clarity)

---

## Goal

Stop uploading images with random Cloudinary public_ids (`artwork_uploads/iubffyxdm2cffywrehvk`). Use **human-readable, stable names** derived from artwork/entity context — matching the seed pattern (`Dawn_km3ucm.jpg`).

---

## Current state

| Location | Behavior |
| -------- | -------- |
| `jojjy-gallery-crm/pages/api/upload/image.ts` | Uploads with `{ folder: "artwork_uploads" }` only — Cloudinary assigns random hash |
| Seeds (`prisma/seed.ts`, `seed-archive.ts`) | Descriptive URLs baked in manually |
| Gallery `lib/cloudinary.ts` | Transforms existing URLs — no upload logic |
| Schema | No `slug` on images; identity = full URL + optional `description` + `order` |

The integer `order` field (0, 1, 2…) is **sort order only**, not a slug. Do not conflate the two.

---

## Scope

### In scope

- Artwork primary image upload (CRM)
- Optional: music cover uploads if they share the same endpoint
- Slug helper (shared util)
- Collision handling when two artworks share a title
- CRM form: pass artwork title (or explicit slug) with upload request

### Out of scope (separate follow-up)

- Adding `slug` columns to `MediaBlogEntry` / `Artwork` for pretty routes (`/gallery/dawn`)
- Migrating existing random-hash URLs in production (optional backfill script)
- Series / event media upload UI (doesn't exist yet)

---

## Implementation steps

### Step 1 — Add slug utility

Create `jojjy-gallery-crm/lib/slugify.ts`:

```ts
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "image";
}
```

### Step 2 — Accept naming context in upload API

Update `pages/api/upload/image.ts`:

1. Parse optional fields from formidable: `publicId` or `artworkTitle`.
2. Compute `base = slugify(publicId || artworkTitle || "upload")`.
3. Upload with:

```ts
const cloudinaryResponse = await cloudinary.uploader.upload(filepath, {
  folder: "artwork_uploads",
  public_id: base,
  overwrite: false,
  unique_filename: true, // append suffix on collision
});
```

4. Return `{ imageUrl, publicId: cloudinaryResponse.public_id }` so the client can display/debug.

### Step 3 — Wire CRM artwork form

In `components/Admin/ArtworkManagement.tsx`:

- When uploading the primary image, send `artworkTitle` (from form state) as a form field alongside the file.
- If title is empty, fall back to filename without extension (`use_filename: true` as alternative).

### Step 4 — Media blog extra files (optional same sprint)

In `components/Admin/MediaBlogManagement.tsx`:

- Default `description` to filename or entry title.
- If adding file upload (today URLs are pasted), use `folder: "archive"` + slug from entry title + index.

### Step 5 — Document folder convention

| Folder | Use |
| ------ | --- |
| `artwork_uploads/` | Primary + extra artwork images |
| `archive/` | Media blog files |
| `events/` | Event hero + gallery (when upload UI added) |
| `music_covers/` | Release artwork |

---

## Files to touch

| File | Change |
| ---- | ------ |
| `jojjy-gallery-crm/lib/slugify.ts` | **New** |
| `jojjy-gallery-crm/pages/api/upload/image.ts` | Accept title/slug; set `public_id` |
| `jojjy-gallery-crm/components/Admin/ArtworkManagement.tsx` | Pass title on upload |
| `jojjy-gallery-crm/.env.example` | No new vars |

---

## Test plan

1. Upload artwork titled **"Dawn"** → URL contains `artwork_uploads/dawn` (may have Cloudinary suffix on collision).
2. Upload second artwork also titled **"Dawn"** → unique suffix, no overwrite error.
3. Upload with empty title → sensible fallback from filename.
4. Verify gallery `OptimizedImage` still renders transformed URLs.
5. Confirm `requireAnyPermission(["artworks:write", "music:write"])` still gates upload.

---

## Acceptance criteria

- [ ] New CRM uploads produce descriptive Cloudinary public_ids, not random hashes
- [ ] Collisions handled without silent overwrite
- [ ] Existing gallery URLs unchanged (backward compatible)
- [ ] No schema migration required

---

## Risks

| Risk | Mitigation |
| ---- | ---------- |
| Title changes after upload | URL stays stable (by design); re-upload if rename needed |
| Special characters in titles | `slugify` strips them |
| Existing production images keep hash names | Accept for v1; optional backfill later |
