# Architecture

## Overview

```
Next.js (Vercel) → Express API (Render) → MongoDB (Atlas)
                                        → Redis/BullMQ (Upstash)
```

## Data Flow

Cron triggers every hour → fetches active feeds from DB → pushes each feed URL to Redis queue → BullMQ worker picks it up (3 concurrent) → axios fetches XML → fast-xml-parser converts to JSON → normalizeJob maps fields → bulkWrite upserts into MongoDB in batches of 50 → ImportLog saved with counts.

## Collections

**jobs** — imported job listings. `sourceId` (MD5 of RSS guid) is unique indexed to prevent duplicates.

**importlogs** — one entry per feed per import run. Tracks status, totalFetched, newJobs, updatedJobs, failedJobs, and failure details.

**feedsources** — configurable feed URLs with name, isActive toggle, and lastFetchedAt timestamp.

**users** — simple auth with bcrypt-hashed passwords.

## Why These Choices

**bulkWrite + upsert** — instead of 1000 individual inserts, we batch 50 at a time. Each batch is one DB call. `upsert: true` means insert-if-new, update-if-exists. `ordered: false` means one bad record doesn't block the rest.

**BullMQ + Redis** — decouples feed fetching from the API server. Gives us parallel processing (3 workers), automatic retries with exponential backoff (5s → 10s → 20s), and fault isolation (one feed failing doesn't affect others).

**MD5 for sourceId** — RSS `<guid>` is usually a long URL. Hashing gives a fixed-length ID that's consistent across runs. Same guid = same hash = same sourceId = upsert matches correctly.

**FeedSource collection** — feed URLs are in the DB, not hardcoded. Add/remove/toggle feeds from the UI without redeploying.

**Configurable via env** — BATCH_SIZE, WORKER_CONCURRENCY, CRON_SCHEDULE are all environment variables. Tune without code changes.

## Auth

Cookie-based. Login sets a signed httpOnly cookie (`userId`). Auth middleware reads `req.signedCookies.userId` and looks up the user. Production uses `sameSite: "none"` + `secure: true` for cross-origin (Vercel ↔ Render).
