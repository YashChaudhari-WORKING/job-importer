# Architecture

## System Overview

```
┌─────────────┐    ┌──────────────┐    ┌───────────┐
│  Next.js UI  │───▶│  Express API  │───▶│  MongoDB   │
│  (client)    │◀───│  (server)     │◀───│  (Atlas)   │
└─────────────┘    └──────┬───────┘    └───────────┘
                          │
                   ┌──────▼───────┐
                   │  Redis Queue  │
                   │  (Upstash)    │
                   └──────┬───────┘
                          │
                   ┌──────▼───────┐
                   │  BullMQ       │
                   │  Worker (x3)  │
                   └──────────────┘
```

## Data Flow

```
1. Cron (every hour) or Manual Trigger
         │
         ▼
2. Fetch active feeds from FeedSource collection

         │
         ▼
3. Add each feed URL to Redis queue (BullMQ)
         │
         ▼
4. Worker picks up job (concurrency: 3)
         │
         ├──▶ axios.get(feedUrl)         → fetch raw XML
         ├──▶ fast-xml-parser.parse()    → XML to JS object
         ├──▶ normalizeJob()             → map to Job schema
         │
         ▼
5. bulkWrite to MongoDB (batches of BATCH_SIZE)
         │
         ├──▶ sourceId exists  → UPDATE existing document
         └──▶ sourceId missing → INSERT new document
         │
         ▼
6. Save ImportLog with counts (new, updated, failed)
```

## MongoDB Collections

### jobs

Stores imported job listings. Deduplication via `sourceId` unique index.

| Field       | Type                     | Purpose                                    |
| ----------- | ------------------------ | ------------------------------------------ |
| sourceId    | String (unique, indexed) | MD5 hash of RSS guid — prevents duplicates |
| title       | String                   | Job title                                  |
| company     | String                   | Employer name                              |
| location    | String                   | Job location                               |
| jobType     | String                   | Full Time, Part Time, Contract, etc.       |
| category    | String                   | Job category from feed                     |
| description | String                   | Job description (HTML)                     |
| url         | String                   | Link to original job posting               |
| pubDate     | Date                     | Publication date from feed                 |
| sourceFeed  | String                   | Which feed URL this came from              |

### importlogs

Tracks each import run with counts and failure details.

| Field         | Type          | Purpose                                   |
| ------------- | ------------- | ----------------------------------------- |
| fileName      | String        | Feed URL that was processed               |
| status        | String (enum) | pending / processing / completed / failed |
| totalFetched  | Number        | Jobs found in feed                        |
| totalImported | Number        | Successfully imported (new + updated)     |
| newJobs       | Number        | Newly inserted jobs                       |
| updatedJobs   | Number        | Existing jobs that were updated           |
| failedJobs    | Number        | Jobs that failed to import                |
| failures      | Array         | Details of each failure (record, reason)  |

### feedsources

Configurable list of RSS feed URLs.

| Field         | Type            | Purpose                               |
| ------------- | --------------- | ------------------------------------- |
| url           | String (unique) | RSS feed URL                          |
| name          | String          | Display name                          |
| isActive      | Boolean         | Whether cron should process this feed |
| lastFetchedAt | Date            | Last successful fetch timestamp       |

### users

Simple cookie-based authentication.

| Field    | Type            | Purpose                |
| -------- | --------------- | ---------------------- |
| email    | String (unique) | Login email            |
| password | String          | bcrypt hashed password |
| name     | String          | Display name           |

## Key Design Decisions

### 1. bulkWrite with Upsert

Instead of inserting one record at a time, jobs are batched (default 50) and sent as a single `bulkWrite` call. Each operation uses `updateOne` with `upsert: true`, matching on `sourceId`. This means:

- No duplicate records regardless of how many times a feed is imported
- Existing records get updated with the latest data
- New records are inserted automatically
- `ordered: false` ensures one failed record doesn't block the rest

### 2. BullMQ + Redis as Job Queue

Feeds are not processed inline. Instead, each feed URL is added as a task to a Redis-backed queue. Benefits:

- **Parallel processing**: `WORKER_CONCURRENCY=3` processes 3 feeds simultaneously
- **Automatic retries**: Failed jobs retry 3 times with exponential backoff (5s, 10s, 20s)
- **Fault isolation**: One feed failing doesn't affect others
- **Decoupled**: The API server and worker can scale independently

### 3. MD5 Hash for sourceId

RSS feeds provide a `<guid>` element for each item (usually a URL). We hash this with MD5 to create a fixed-length, consistent identifier. Same guid always produces the same hash, enabling reliable upsert matching.

### 4. Configurable via Environment

All tuning parameters are environment variables:

- `BATCH_SIZE` — records per bulkWrite call (default: 50)
- `WORKER_CONCURRENCY` — parallel feed processing (default: 3)
- `CRON_SCHEDULE` — cron expression (default: hourly)

### 5. Separate FeedSource Collection

Feed URLs are stored in the database, not hardcoded. This allows adding, removing, or toggling feeds via the admin UI without any code changes or redeployment.

## Authentication

Simple cookie-based auth using signed httpOnly cookies. Passwords are hashed with bcrypt (10 salt rounds). The auth middleware checks `req.signedCookies.userId` on protected routes.

## Error Handling

- Global Express error handler catches all unhandled errors
- Mongoose ValidationError returns field-specific messages
- Duplicate key (code 11000) returns a user-friendly message
- BullMQ worker errors trigger automatic retries before marking as failed
