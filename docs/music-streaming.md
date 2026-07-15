# Music Streaming Architecture

> Version: 1.2  
> Status: Engineering Design  
> Depends on:  
> - product-music.md  
> - music-domain.md  
> - music-schema.md  
> - music-gallery.md  
> - music-decisions.md (ADR-005, ADR-006, ADR-014, ADR-020)

---

# Purpose

Technical playback architecture for Music.

Stream releases according to entitlements (including anonymous Free and Paid tease) while preventing permanent public access to **track** audio files.

Separates playback from storage and commerce.

---

# Design Principles

- Never expose permanent public **track** audio URLs
- Verify entitlement / tease quota before playback
- Support Free, Paid tease, membership, and owned playback
- Remain storage-provider independent
- Allow future CDN integration

---

# High-Level Flow

```text
Upload Track → private storage → metadata
→ Publish
→ Fan requests play
→ Identify listener (User and/or anonymousKey)
→ Entitlement / tease check
→ Temporary playback authorization
→ Stream
```

---

# Playback Types

| Type | Rule |
| --- | --- |
| Free | Unlimited; anonymous OK (ADR-014) |
| Paid tease | Up to `paidPlayLimit` (default 3) starts without unlock, then paywall (ADR-005) |
| Members only | Active membership; no tease; browse badge |
| Owned (ReleaseUnlock) | Unlimited for that User |

---

# Playback Pipeline

1. Identify listener (session User and/or anonymousKey)
2. Locate Release; validate playable state
3. Resolve entitlement / tease (music-entitlements.md)
4. Issue expiring playback authorization
5. Stream (pause / seek / resume)

---

# Streaming Requirements

HTTP range requests · resumable playback · buffering · seeking  

Future: adaptive bitrate · quality variants

---

# Audio Storage

Provider-agnostic. Locate file → verify → secure streaming source.

Providers may include S3-compatible, Cloudflare R2, local dev.

**Track audio:** not permanent public Cloudinary URLs.  
**Covers:** public image pipeline (ADR-020).

---

# Security

- No permanent public track URLs
- Server-side entitlement / quota
- Expiring playback auth
- Protected audio buckets

---

# Playback Analytics

Play started (increments Paid tease) · completed · duration · failures · tease exhausted  

Must not block playback.

---

# Failure Handling

Missing media · expired auth · no entitlement / tease exhausted · storage timeout · unsupported format

---

# Future

Waveforms · ABR · DRM evaluation · offline research · cast · optional clip-seconds UX beside play-count tease
