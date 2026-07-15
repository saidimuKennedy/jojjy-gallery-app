# Music Storage & Streaming Architecture

> Version: 1.1
> Status: Draft
> Depends on: product-music.md, music-streaming.md, music-decisions.md (ADR-006)
> Note: Overlaps with music-streaming.md — streaming owns playback auth; this file owns asset validation and storage requirements. Prefer streaming.md when they conflict on playback.

---

# Purpose

This document defines the functional requirements for storing, processing and delivering music assets.

It intentionally avoids committing to a cloud provider or storage implementation.

---

# Goals

The storage system should

- protect unpublished content
- support authenticated playback
- scale with increasing catalogue size
- separate media storage from business logic

---

# Supported Assets

The Music module stores

- audio
- cover artwork

Future

- lyric PDFs
- music videos
- bonus content

---

# Audio Requirements

Supported formats

- MP3
- WAV
- FLAC (future)

Uploads should preserve the original source file.

---

# Artwork Requirements

Supported

- JPG
- PNG
- WEBP

Future

- AVIF

---

# Upload Workflow

Artist

↓

Upload

↓

Validation

↓

Storage

↓

Metadata Extraction

↓

Ready for Publishing

---

# Validation

Uploads should verify

- supported format
- file size
- duration
- corruption

Rejected uploads never enter the catalogue.

---

# Playback

Playback occurs through authenticated streaming.

Requirements

- secure requests
- authenticated users
- entitlement verification
- resumable playback

---

# Playback Flow

User

↓

Authentication

↓

Entitlement Check

↓

Playback Authorization

↓

Stream Audio

---

# Preview Playback

Paid tease is **play-count based** (default 3), not clip-seconds (see music-streaming.md / ADR-005).

Optional clip-seconds UX may be added later without changing the 3-play product rule.

---

# Security

Audio files should never be publicly browseable.

Requirements

- authenticated requests
- temporary playback authorization
- protected storage
- audit logging

---

# Performance

Streaming should minimise startup delay.

Preferred

- caching
- CDN delivery
- efficient seeking

---

# Storage Abstraction

Business logic should never depend on a specific storage provider.

Storage providers may change without affecting release management.

Possible providers

- S3-compatible / R2 for **private audio**
- Cloudinary (or existing image pipeline) for **cover artwork** (public — ADR-020)
- Local development storage

Track audio must remain private with expiring playback authorization (ADR-006).

---

# Backup

Requirements

- regular backups
- recovery procedures
- integrity verification

---

# Monitoring

Track

- upload failures
- playback failures
- storage usage
- bandwidth consumption

---

# Future Enhancements

- adaptive bitrate streaming
- waveform generation
- audio normalization
- DRM research
- multiple quality levels
- video streaming