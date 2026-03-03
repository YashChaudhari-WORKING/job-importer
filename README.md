# Job Importer

A scalable job import system that fetches job listings from multiple RSS/XML feeds, processes them through a queue-based pipeline, and stores them in MongoDB. Includes an admin dashboard for managing feeds, viewing import history, and browsing jobs.

## Tech Stack

- **Backend:** Express.js, MongoDB (Mongoose), BullMQ, Redis
- **Frontend:** Next.js (App Router), shadcn/ui, Tailwind CSS
- **Queue:** BullMQ with Redis (Upstash compatible)
- **Cron:** node-cron (hourly schedule)

## Project Structure

```
├── server/
│   ├── index.js                  # Entry point
│   └── src/
│       ├── config/               # DB, Redis, env config
│       ├── models/               # Mongoose schemas (Job, ImportLog, FeedSource, User)
│       ├── controllers/          # Route handlers
│       ├── routes/               # Express routes
│       ├── services/
│       │   ├── feedFetcher.js    # Fetch XML, parse, normalize
│       │   └── jobImporter.js    # bulkWrite upsert logic
│       ├── queues/
│       │   ├── importQueue.js    # BullMQ queue definition
│       │   └── importWorker.js   # Worker with concurrency
│       ├── cron/
│       │   └── scheduler.js      # Hourly cron trigger
│       ├── middleware/            # Auth, error handler
│       └── seed/
│           └── seedFeeds.js      # Seed feeds + default admin
│
├── client/
│   └── src/
│       ├── app/
│       │   ├── page.js                   # Login / Register
│       │   └── dashboard/
│       │       ├── page.js               # Import History
│       │       ├── feeds/page.js         # Manage Feeds
│       │       └── jobs/page.js          # Browse Jobs
│       ├── components/
│       │   └── Sidebar.jsx               # Navigation + cron timer
│       ├── context/AuthContext.js         # Auth state
│       └── lib/api.js                    # Axios instance
```

## Prerequisites

- Node.js v18+
- MongoDB (local or [MongoDB Atlas](https://cloud.mongodb.com) free tier)
- Redis (local or [Upstash](https://upstash.com) free tier)

## Setup

### 1. Clone and install dependencies

```bash
git clone <repo-url>
cd knovator_tech

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 2. Configure environment variables

**Server** — create `server/.env`:

```env
PORT=5000
NODE_ENV=development

MONGODB_URI=mongodb://localhost:27017/job-importer
REDIS_URL=redis://localhost:6379

COOKIE_SECRET=your-secret-key-here

BATCH_SIZE=50
WORKER_CONCURRENCY=3
CRON_SCHEDULE=0 */1 * * *

CLIENT_URL=http://localhost:3000
```

For cloud services:
- **MongoDB Atlas**: Replace `MONGODB_URI` with your Atlas connection string
- **Upstash Redis**: Replace `REDIS_URL` with your Upstash URL (use `rediss://` prefix for TLS)

**Client** — create `client/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### 3. Seed the database

```bash
cd server
npm run seed
```

This creates:
- 9 RSS feed sources (Jobicy + HigherEdJobs)
- Default admin account: `admin@admin.com` / `admin123`

### 4. Start the application

```bash
# Terminal 1 — Start server
cd server
npm run dev

# Terminal 2 — Start client
cd client
npm run dev
```

- Server runs on `http://localhost:5000`
- Client runs on `http://localhost:3000`

### 5. First import

After logging in, click **"Run Import Now"** on the Import History page, or wait for the hourly cron to trigger automatically.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login (sets httpOnly cookie) |
| POST | `/api/auth/logout` | Logout (clears cookie) |
| GET | `/api/auth/me` | Get current user |
| GET | `/api/feeds` | List all feed sources |
| POST | `/api/feeds` | Add a new feed |
| PATCH | `/api/feeds/:id` | Toggle feed active/inactive |
| DELETE | `/api/feeds/:id` | Delete a feed |
| GET | `/api/imports` | Paginated import history |
| GET | `/api/imports/:id` | Single import log detail |
| POST | `/api/imports/trigger` | Manually trigger import |
| GET | `/api/jobs` | Paginated job listings (search supported) |
| GET | `/api/cron-status` | Next scheduled import time |
| GET | `/api/health` | Health check |

## Scalability

- **bulkWrite with upsert**: Processes jobs in configurable batches (default 50). Avoids duplicates via `sourceId` index. Handles 1M+ records efficiently.
- **BullMQ queue**: Decouples fetching from processing. Supports parallel workers (`WORKER_CONCURRENCY`), automatic retries with exponential backoff (3 attempts, 5s/10s/20s delays).
- **Configurable via environment**: `BATCH_SIZE`, `WORKER_CONCURRENCY`, and `CRON_SCHEDULE` are all tunable without code changes.
- **Ordered: false**: Bulk operations continue even if individual records fail, maximizing throughput.

## Available Scripts

### Server

| Script | Command | Description |
|--------|---------|-------------|
| `npm run dev` | `nodemon index.js` | Start with auto-reload |
| `npm start` | `node index.js` | Production start |
| `npm run seed` | `node src/seed/seedFeeds.js` | Seed feeds + admin user |

### Client

| Script | Command | Description |
|--------|---------|-------------|
| `npm run dev` | `next dev` | Development server |
| `npm run build` | `next build` | Production build |
| `npm start` | `next start` | Start production server |
