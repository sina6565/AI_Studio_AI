import { lookup } from 'dns/promises';
import { createHmac, randomUUID } from 'crypto';
import { isIP } from 'net';
import logger from '../utils/logger';

export type JobWebhookEvent = 'job.completed' | 'job.failed' | 'job.cancelled';

interface WebhookJob {
  id?: string;
  _id?: string;
  type?: string;
  status?: string;
  result?: Record<string, unknown>;
  error?: { code?: string; message?: string };
  progress?: Record<string, unknown>;
  webhookUrl?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

const REQUEST_TIMEOUT_MS = 5000;
const MAX_ATTEMPTS = 3;

function isPrivateIPv4(address: string): boolean {
  const parts = address.split('.').map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return true;
  const [a, b] = parts;
  return a === 0 || a === 10 || a === 127 || a >= 224 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && (b === 168 || b === 0)) ||
    (a === 198 && (b === 18 || b === 19 || b === 51)) ||
    (a === 203 && b === 0);
}

function isPrivateAddress(address: string): boolean {
  const version = isIP(address);
  if (version === 4) return isPrivateIPv4(address);
  if (version !== 6) return true;
  const normalized = address.toLowerCase().split('%')[0];
  if (normalized.startsWith('::ffff:')) {
    const mapped = normalized.slice(7);
    return isIP(mapped) === 4 ? isPrivateIPv4(mapped) : true;
  }
  return normalized === '::' || normalized === '::1' ||
    normalized.startsWith('fc') || normalized.startsWith('fd') ||
    /^fe[89ab]/.test(normalized) || normalized.startsWith('ff');
}

async function assertPublicHttpsDestination(rawUrl: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error('Webhook URL is invalid');
  }
  if (url.protocol !== 'https:' || url.username || url.password || url.hash) {
    throw new Error('Webhook destination must be a public HTTPS URL without credentials or fragments');
  }
  const host = url.hostname.replace(/^\[|\]$/g, '');
  const version = isIP(host);
  if (version) {
    if (isPrivateAddress(host)) throw new Error('Webhook destination resolves to a non-public IP address');
    return url;
  }
  const records = await lookup(host, { all: true, verbatim: true });
  if (!records.length || records.some((record) => isPrivateAddress(record.address))) {
    throw new Error('Webhook destination must resolve only to public IP addresses');
  }
  return url;
}

/**
 * Deliver a minimal, signed job lifecycle event. Job input and stack traces are
 * deliberately excluded. Redirects are disabled to prevent forwarding signed
 * payloads to an unvalidated destination.
 */
export async function dispatchJobWebhook(job: WebhookJob, event: JobWebhookEvent): Promise<boolean> {
  if (!job.webhookUrl) return false;
  const secret = process.env.WEBHOOK_SIGNING_SECRET;
  if (!secret || secret.length < 32) {
    logger.warn('[Webhook] Delivery skipped: WEBHOOK_SIGNING_SECRET must contain at least 32 characters');
    return false;
  }

  const jobId = String(job.id || job._id || '');
  if (!jobId) {
    logger.warn('[Webhook] Delivery skipped: job id is missing');
    return false;
  }

  const payload = {
    id: randomUUID(),
    event,
    createdAt: new Date().toISOString(),
    data: {
      jobId,
      type: job.type,
      status: job.status,
      result: job.result,
      error: job.error ? { code: job.error.code, message: job.error.message } : undefined,
      progress: job.progress,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
    },
  };
  const body = JSON.stringify(payload);
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = createHmac('sha256', secret).update(`${timestamp}.${body}`).digest('hex');
  const deliveryId = randomUUID();

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const url = await assertPublicHttpsDestination(job.webhookUrl);
      const response = await fetch(url.toString(), {
        method: 'POST',
        redirect: 'manual',
        headers: {
          'content-type': 'application/json',
          'x-sina-webhook-event': event,
          'x-sina-webhook-delivery': deliveryId,
          'x-sina-webhook-timestamp': timestamp,
          'x-sina-webhook-signature': `sha256=${signature}`,
        },
        body,
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      if (response.ok) {
        logger.info(`[Webhook] Delivered ${event} for job ${jobId} (attempt ${attempt})`);
        return true;
      }
      if (response.status < 500 && response.status !== 408 && response.status !== 429) {
        logger.warn(`[Webhook] Destination rejected ${event} for job ${jobId} with HTTP ${response.status}`);
        return false;
      }
      throw new Error(`Webhook destination returned HTTP ${response.status}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (attempt === MAX_ATTEMPTS) {
        logger.error(`[Webhook] Delivery failed for job ${jobId} after ${attempt} attempts: ${message}`);
        return false;
      }
      await new Promise((resolve) => setTimeout(resolve, attempt * 500));
    }
  }
  return false;
}
