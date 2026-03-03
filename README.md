# Job Importer

Scalable job import system that fetches listings from RSS/XML feeds, queues them via BullMQ + Redis, and stores in MongoDB using batch upserts. Includes an admin dashboard built with Next.js and shadcn/ui.

## Setup

### Prerequisites

- Node.js v18+
- MongoDB ([Atlas free tier](https://cloud.mongodb.com) works)
- Redis ([Upstash free tier](https://upstash.com) works)

### Install

```bash
# server
cd server
npm install

# client
cd ../client
npm install
```

### Environment Variables

**server/.env**

```
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/job-importer
REDIS_URL=redis://localhost:6379
COOKIE_SECRET=your-secret-key
BATCH_SIZE=50
WORKER_CONCURRENCY=3
CRON_SCHEDULE=0 */1 * * *
CLIENT_URL=http://localhost:3000
```

**client/.env.local**

```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### Seed & Run

```bash
# seed feeds + default admin (admin@admin.com / admin123)
cd server
npm run seed

# start server (terminal 1)
npm run dev

# start client (terminal 2)
cd ../client
npm run dev
```

Server: http://localhost:5000
Client: http://localhost:3000

## How It Works

1. Cron runs every hour (or click "Run Import Now")
2. Each active feed URL gets added to a Redis queue
3. BullMQ workers (3 concurrent) pick up feeds, fetch XML, parse with fast-xml-parser
4. Jobs are batch-inserted into MongoDB using `bulkWrite` with `upsert` (matched on `sourceId`)
5. Import results (new/updated/failed counts) are logged in the `importlogs` collection

Feeds can be added/removed/toggled from the admin UI without code changes.

## API

```
POST   /api/auth/register    - Register
POST   /api/auth/login       - Login
POST   /api/auth/logout      - Logout
GET    /api/auth/me          - Current user

GET    /api/feeds            - List feeds
POST   /api/feeds            - Add feed
PATCH  /api/feeds/:id        - Toggle active/inactive
DELETE /api/feeds/:id        - Delete feed

GET    /api/imports          - Import history (paginated)
GET    /api/imports/:id      - Single import detail
POST   /api/imports/trigger  - Manual import trigger

GET    /api/jobs             - Job listings (paginated, search)
GET    /api/cron-status      - Next scheduled run time
GET    /api/health           - Health check
```

## Project Structure

```
server/
  src/
    config/         - db, redis, env
    models/         - Job, ImportLog, FeedSource, User
    controllers/    - route handlers
    routes/         - express routes
    services/       - feedFetcher (XML parse), jobImporter (bulkWrite)
    queues/         - BullMQ queue + worker
    cron/           - hourly scheduler
    middleware/     - auth, error handler
    seed/           - seed feeds + admin user

client/
  src/
    app/            - pages (login, dashboard, feeds, jobs)
    components/     - sidebar, ui components
    context/        - auth context
    lib/            - axios instance
```
