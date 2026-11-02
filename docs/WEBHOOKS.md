# Job Webhooks

SINA AI STUDIO can send signed HTTPS callbacks when a job reaches a terminal state.

## Events

- `job.completed`
- `job.failed` (after the platform exhausts its execution retries)
- `job.cancelled`

Pass a callback URL when creating a job:

```http
POST /api/v1/jobs
Authorization: Bearer <user-token>
Content-Type: application/json
```

```json
{
  "type": "image_generation",
  "input": { "prompt": "A sunrise over a quiet mountain lake" },
  "webhookUrl": "https://your-domain.example/hooks/sina"
}
```

Callback URLs must use HTTPS and resolve only to public IP addresses. Localhost, private-network destinations, URL credentials, fragments, and redirects are not accepted. The dispatcher excludes job input and stack traces from callback payloads.

## Configure signing

Set `WEBHOOK_SIGNING_SECRET` in the backend runtime environment to a randomly generated secret of at least 32 characters. Keep it out of source control and never send it to the client.

Example generation command:

```bash
openssl rand -hex 32
```

Without a valid secret, callback delivery is skipped. No paid service or additional package is required.

## Verify signatures

Each callback includes:

- `X-Sina-Webhook-Event`
- `X-Sina-Webhook-Delivery` (stable across retries of that delivery)
- `X-Sina-Webhook-Timestamp` (Unix seconds)
- `X-Sina-Webhook-Signature` (`sha256=<hex>`)

The signature is HMAC-SHA256 over `<timestamp>.<raw-request-body>`. Verify against the raw request bytes using the same secret, compare signatures in constant time, and reject timestamps outside a short tolerance (for example, five minutes). Store delivery IDs to make the receiver idempotent.

## Delivery behavior and limits

The dispatcher makes up to three attempts for network errors, timeouts, HTTP 408, HTTP 429, and HTTP 5xx responses. Other 4xx responses are not retried. Each request has a five-second timeout.

This first implementation is best-effort and in-process: delivery attempts are not persisted in a durable outbox, so a process restart can interrupt a pending callback. The job's authoritative status remains available from `GET /api/v1/jobs/:jobId`. Do not treat a callback as the source of truth for job state.
