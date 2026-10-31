#!/usr/bin/env node
/**
 * SINA AI STUDIO live API smoke test.
 *
 * Safe by default: health/auth/project/job-list checks only.
 * Provider-backed generation is opt-in because it may consume external
 * provider quota or incur cost. Never put credentials in this file.
 *
 * Required:
 *   API_BASE_URL, SMOKE_EMAIL, SMOKE_USERNAME, SMOKE_PASSWORD
 * Optional:
 *   FRONTEND_URL
 *   SMOKE_RUN_PROVIDER_JOBS=true
 *   SMOKE_JOB_TYPES=image_generation,game_creation,game_build
 *
 * Run from any directory:
 *   node backend/scripts/live-smoke-test.mjs
 */
const baseUrl = (process.env.API_BASE_URL || 'http://127.0.0.1:3000').replace(/\/$/, '');
const email = process.env.SMOKE_EMAIL;
const username = process.env.SMOKE_USERNAME;
const password = process.env.SMOKE_PASSWORD;
const runProviderJobs = process.env.SMOKE_RUN_PROVIDER_JOBS === 'true';
const providerJobTypes = (process.env.SMOKE_JOB_TYPES || 'image_generation,game_creation,game_build')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);

const results = [];
let token;
let projectId;

function record(name, status, detail = '') {
  results.push({ name, status, detail });
  const suffix = detail ? ` — ${detail}` : '';
  console.log(`[${status}] ${name}${suffix}`);
}

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  const text = await response.text();
  let body;
  try { body = text ? JSON.parse(text) : {}; } catch { body = { raw: text.slice(0, 500) }; }
  return { response, body };
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function check(name, fn) {
  try {
    const detail = await fn();
    record(name, 'PASS', detail || '');
  } catch (error) {
    record(name, 'FAIL', error instanceof Error ? error.message : String(error));
  }
}

async function main() {
  console.log(`SINA AI STUDIO live smoke test → ${baseUrl}`);
  console.log(runProviderJobs
    ? 'Provider-backed jobs ENABLED: requests may consume provider quota.'
    : 'Safe mode: provider-backed generation is SKIPPED.');

  await check('GET /health (liveness)', async () => {
    const { response, body } = await request('/health');
    assert(response.status === 200 && body.status === 'ok', `HTTP ${response.status}; ${JSON.stringify(body)}`);
    return 'process responds independently of external services';
  });

  await check('GET /api/v1/health/detailed (dependency state)', async () => {
    const { response, body } = await request('/api/v1/health/detailed');
    assert([200, 503].includes(response.status), `unexpected HTTP ${response.status}`);
    assert(['healthy', 'degraded'].includes(body.status), `unexpected payload: ${JSON.stringify(body)}`);
    return `${body.status}; database=${body.database?.connected}; queue=${body.queue?.status ?? 'reported'}`;
  });

  await check('GET / (root probe)', async () => {
    const { response } = await request('/');
    assert(response.status === 200, `HTTP ${response.status}`);
    return 'HTTP 200';
  });

  if (!email || !username || !password) {
    record('Authentication + project checks', 'SKIP', 'set SMOKE_EMAIL, SMOKE_USERNAME and SMOKE_PASSWORD');
    printSummary();
    process.exitCode = 1;
    return;
  }

  await check('POST /api/v1/auth/register or login', async () => {
    let result = await request('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, username, password }),
    });
    if (result.response.status === 409) {
      result = await request('/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
    }
    assert(result.response.ok && result.body.success, `HTTP ${result.response.status}; ${JSON.stringify(result.body)}`);
    token = result.body.data?.token;
    assert(typeof token === 'string' && token.length > 10, 'token missing from auth response');
    return `authenticated as ${email}`;
  });

  if (!token) {
    record('Protected API checks', 'SKIP', 'authentication did not produce a token');
    printSummary();
    process.exitCode = 1;
    return;
  }

  await check('Protected endpoint rejects missing token', async () => {
    const savedToken = token;
    token = undefined;
    try {
      const { response } = await request('/api/v1/jobs');
      assert(response.status === 401, `expected 401, received ${response.status}`);
      return 'HTTP 401 as expected';
    } finally {
      token = savedToken;
    }
  });

  await check('POST /api/v1/projects (create project)', async () => {
    const { response, body } = await request('/api/v1/projects', {
      method: 'POST',
      body: JSON.stringify({
        name: `Live smoke test ${new Date().toISOString()}`,
        type: 'mixed_media',
        description: 'Disposable project created by the live smoke-test script.',
      }),
    });
    assert(response.status === 201 && body.success, `HTTP ${response.status}; ${JSON.stringify(body)}`);
    projectId = body.data?.id || body.data?._id;
    assert(typeof projectId === 'string', 'project ID missing');
    return `created project ${projectId}`;
  });

  await check('GET /api/v1/projects', async () => {
    const { response, body } = await request('/api/v1/projects');
    assert(response.status === 200 && body.success && Array.isArray(body.data), `HTTP ${response.status}`);
    return `${body.data.length} project(s) returned`;
  });

  await check('GET /api/v1/jobs', async () => {
    const { response, body } = await request('/api/v1/jobs');
    assert(response.status === 200 && body.success && Array.isArray(body.data), `HTTP ${response.status}`);
    return `${body.data.length} job(s) returned`;
  });

  if (runProviderJobs) {
    if (!projectId) {
      record('Provider-backed job creation', 'SKIP', 'project creation failed');
    } else {
      for (const type of providerJobTypes) {
        await check(`Create + inspect job (${type})`, async () => {
          let path;
          let payload;
          let acceptedStatuses;
          if (type === 'image_generation') {
            path = '/api/v1/generate/image';
            payload = {
              prompt: 'A simple abstract test image for SINA AI STUDIO smoke testing.',
              projectId,
              size: '512x512',
              quality: 'standard',
            };
            acceptedStatuses = [202];
          } else {
            path = '/api/v1/jobs';
            payload = {
              type,
              projectId,
              input: {
                title: 'Smoke Test Game',
                description: 'A minimal test scene for validating the asynchronous job lifecycle.',
                genre: 'puzzle',
                artStyle: 'simple geometric',
                scenes: [{ name: 'Test Scene', description: 'A small empty test arena.' }],
              },
            };
            acceptedStatuses = [201, 202];
          }

          const created = await request(path, {
            method: 'POST',
            body: JSON.stringify(payload),
          });
          assert(acceptedStatuses.includes(created.response.status) && created.body.success,
            `HTTP ${created.response.status}; ${JSON.stringify(created.body)}`);
          const jobId = created.body.data?.jobId || created.body.data?.id || created.body.data?._id;
          assert(typeof jobId === 'string', 'job ID missing');

          const inspected = await request(`/api/v1/jobs/${encodeURIComponent(jobId)}`);
          assert(inspected.response.status === 200 && inspected.body.success,
            `job lookup HTTP ${inspected.response.status}`);
          const status = inspected.body.data?.status;
          assert(['queued', 'processing', 'completed', 'failed', 'cancelled'].includes(status),
            `unexpected job status: ${status}`);

          let cancellation = 'not attempted (job already started or completed)';
          if (status === 'queued') {
            const cancelled = await request(`/api/v1/jobs/${encodeURIComponent(jobId)}/cancel`, {
              method: 'POST',
            });
            assert(cancelled.response.ok && cancelled.body.success,
              `cancel HTTP ${cancelled.response.status}; ${JSON.stringify(cancelled.body)}`);
            cancellation = 'cancel endpoint accepted queued job';
          }
          return `job=${jobId}; status=${status}; ${cancellation}`;
        });
      }
    }
  } else {
    record('Provider-backed generation + game jobs + lifecycle/cancel', 'SKIP',
      'set SMOKE_RUN_PROVIDER_JOBS=true only after confirming the configured provider is approved and no-cost');
  }

  if (process.env.FRONTEND_URL) {
    await check('Frontend HTTP entry point', async () => {
      const response = await fetch(process.env.FRONTEND_URL);
      assert(response.ok, `HTTP ${response.status}`);
      return `HTTP ${response.status}`;
    });
  } else {
    record('Frontend HTTP entry point', 'SKIP', 'set FRONTEND_URL to the deployed or local web-app URL');
  }

  printSummary();
  if (results.some((item) => item.status === 'FAIL')) process.exitCode = 1;
}

function printSummary() {
  const counts = results.reduce((acc, item) => {
    acc[item.status] = (acc[item.status] || 0) + 1;
    return acc;
  }, {});
  console.log('\nSmoke-test summary:', JSON.stringify(counts));
  console.log(JSON.stringify({ baseUrl, results }, null, 2));
}

main().catch((error) => {
  console.error('Fatal smoke-test error:', error);
  process.exitCode = 1;
});
