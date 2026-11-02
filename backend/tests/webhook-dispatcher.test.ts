import { lookup } from 'dns/promises';
import { dispatchJobWebhook } from '../src/webhooks/WebhookDispatcher';

jest.mock('dns/promises', () => ({
  lookup: jest.fn(async () => [{ address: '93.184.216.34', family: 4 }]),
}));

describe('dispatchJobWebhook', () => {
  const originalSecret = process.env.WEBHOOK_SIGNING_SECRET;
  const originalFetch = global.fetch;

  beforeEach(() => {
    process.env.WEBHOOK_SIGNING_SECRET = 'test-webhook-secret-with-at-least-32-chars';
    global.fetch = jest.fn(async () => ({ ok: true, status: 200 })) as any;
    (lookup as unknown as jest.Mock).mockResolvedValue([{ address: '93.184.216.34', family: 4 }]);
  });

  afterEach(() => {
    if (originalSecret === undefined) delete process.env.WEBHOOK_SIGNING_SECRET;
    else process.env.WEBHOOK_SIGNING_SECRET = originalSecret;
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  it('sends a signed event without including job input', async () => {
    const delivered = await dispatchJobWebhook({
      id: 'job-123',
      type: 'image_generation',
      status: 'completed',
      webhookUrl: 'https://hooks.example.com/sina',
      result: { contentUrl: 'https://cdn.example.com/result.png' },
    }, 'job.completed');

    expect(delivered).toBe(true);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [, options] = (global.fetch as jest.Mock).mock.calls[0];
    expect(options.headers['x-sina-webhook-signature']).toMatch(/^sha256=/);
    expect(options.headers['x-sina-webhook-event']).toBe('job.completed');
    expect(options.body).not.toContain('input');
  });

  it('rejects non-HTTPS destinations without making a request', async () => {
    const delivered = await dispatchJobWebhook({
      id: 'job-123',
      webhookUrl: 'http://hooks.example.com/callback',
    }, 'job.completed');

    expect(delivered).toBe(false);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('rejects private network destinations', async () => {
    (lookup as unknown as jest.Mock).mockResolvedValue([{ address: '127.0.0.1', family: 4 }]);
    const delivered = await dispatchJobWebhook({
      id: 'job-123',
      webhookUrl: 'https://localhost/callback',
    }, 'job.completed');

    expect(delivered).toBe(false);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('skips delivery when signing secret is not configured', async () => {
    delete process.env.WEBHOOK_SIGNING_SECRET;
    const delivered = await dispatchJobWebhook({
      id: 'job-123',
      webhookUrl: 'https://hooks.example.com/callback',
    }, 'job.completed');

    expect(delivered).toBe(false);
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
