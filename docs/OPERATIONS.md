# Operations Guide

Operational notes for running and deploying the AI Studio backend.

## Health and readiness probes

The backend exposes two kinds of probe, deliberately separated:

| Endpoint | Type | Behaviour |
| --- | --- | --- |
| `GET /health` | Liveness | Always `200` while the process can serve HTTP. Never depends on MongoDB/Redis. |
| `GET /health/live` | Liveness | Same as `/health`. |
| `GET /health/ready` | Readiness | `200` only when MongoDB is connected; `503` otherwise. |
| `GET /api/v1/health` | Liveness | Versioned equivalent of `/health`. |
| `GET /api/v1/health/ready` | Readiness | Versioned equivalent of `/health/ready`. |
| `GET /api/v1/health/detailed` | Detailed | Reports database, provider and queue status; `503` when the database is down. |

**Guidance:** point the platform *liveness* check at `/health` so the container is
not killed while a dependency is still starting, and point *readiness* at
`/health/ready` so traffic is only routed once MongoDB is usable. Never treat
`/health` alone as proof that the application is fully healthy.

## Startup sequence

1. The HTTP server starts listening **first**, so liveness responds immediately.
2. Database connection, index initialization and provider initialization run in
   the background.
3. If a dependency is unavailable, the failure is logged and the process stays
   up in a degraded state instead of exiting during startup.
4. After the database connects, `recoverStuckJobs()` marks jobs left in
   `processing` for more than 30 minutes by a restart as `failed`
   (`INTERRUPTED`).

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `MONGODB_URI` / `DATABASE_URL` | Yes (production) | MongoDB connection string. |
| `JWT_SECRET` | Yes (production) | Token signing. A default dev secret is rejected in production. |
| `REDIS_URL` | No | Bull job queue. Falls back to `redis://localhost:6379`. |
| `AGNES_ENABLED` | No | Enables the Agnes provider. |
| `AGNES_API_KEY` | No | Agnes provider credentials. |
| `PORT` / `HOST` | No | Defaults to `3000` / `0.0.0.0`. |

At startup the process logs which variables are present (presence only, never
values). Missing required variables are logged as errors; the server still
starts so readiness can report the real state.

## Job queue behaviour

- `enqueueJob` is bounded by a 5-second timeout, so a Redis outage cannot hang
  the request that created the job.
- Repeated Redis connection errors are throttled to one log line per 30 seconds.
- `GET /api/v1/jobs/stats` returns accurate per-status counts for the caller.

## Docker

The image uses `npm ci` in both stages for reproducible installs (the lockfile
is committed). The production stage installs runtime dependencies only
(`npm ci --omit=dev`). `HOST=0.0.0.0` and `PORT=3000` are set by default.

## CI

`.github/workflows/ci.yml` runs the backend build + tests and the frontend build
on push and pull request.

> **Note:** creating or updating files under `.github/workflows/` through the
> GitHub integration requires the app to hold the `workflows` permission. If the
> integration lacks it, the workflow file must be committed manually.

## Free-tier constraints

All tooling uses free tiers: GitHub Actions, `npm ci`, MongoDB Atlas free tier
(or a local instance), and Redis locally or via a free provider. No paid
dependency is required.
