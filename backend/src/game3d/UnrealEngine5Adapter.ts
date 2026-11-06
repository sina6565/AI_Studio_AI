import { AppError } from '../types';
import { ValidationError } from '../types/errors';
import { game3DBuildInputSchema, type Game3DBuildInput } from './types';

export interface UE5BuildResult {
  buildId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  artifactUrl?: string;
  format?: string;
  size?: number;
  metadata?: Record<string, unknown>;
}

/**
 * Bridge to an owner-operated UE5 build worker.
 * Unreal Engine must run on a worker with a licensed UE5 installation.
 * No paid hosted build service is assumed by this adapter.
 */
export class UnrealEngine5Adapter {
  private readonly baseUrl = process.env.UE5_WORKER_URL?.replace(/\/$/, '');
  private readonly token = process.env.UE5_WORKER_TOKEN;

  isConfigured(): boolean {
    return Boolean(this.baseUrl);
  }

  async build(rawInput: Game3DBuildInput): Promise<UE5BuildResult> {
    const parsed = game3DBuildInputSchema.safeParse(rawInput);
    if (!parsed.success) {
      throw new ValidationError('Invalid Unreal Engine 5 room build input', {
        errors: parsed.error.issues.map(issue => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      });
    }
    const manifest = parsed.data.manifest;
    if (!manifest.pipeline.gates.functionApproved || !manifest.pipeline.gates.formApproved) {
      throw new AppError(
        'UE5_ROOM_GATES_NOT_APPROVED',
        'UE5 export is blocked until Function and Form gates have explicit approval.',
        409,
      );
    }
    if (!this.baseUrl) {
      throw new AppError(
        'UE5_WORKER_NOT_CONFIGURED',
        'Unreal Engine 5 worker is not configured. Set UE5_WORKER_URL on the self-hosted worker integration.',
        503,
      );
    }

    const response = await fetch(this.baseUrl + '/api/v1/ue5/builds', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(this.token ? { authorization: 'Bearer ' + this.token } : {}),
      },
      body: JSON.stringify({
        engine: { id: 'unreal_engine_5', majorVersion: 5 },
        manifest,
        authoring: {
          tool: 'blender',
          exportFormat: 'glb',
          preserveSourceProject: true,
          runGeometryAudit: true,
        },
        output: {
          includeUnrealProject: true,
          includePackagedBuild: false,
          requireRuntimeApproval: true,
        },
      }),
      signal: AbortSignal.timeout(120_000),
    });

    if (!response.ok) {
      const detail = (await response.text()).slice(0, 1000);
      throw new AppError('UE5_WORKER_FAILED', 'UE5 worker returned HTTP ' + response.status + ': ' + detail, 502);
    }

    const payload = await response.json() as Record<string, unknown>;
    if (typeof payload.buildId !== 'string' || !payload.buildId) {
      throw new AppError('UE5_WORKER_INVALID_RESPONSE', 'UE5 worker response is missing buildId.', 502);
    }
    const buildId = payload.buildId;
    let latest = payload;
    let status = latest.status;
    if (status !== 'queued' && status !== 'processing' && status !== 'completed' && status !== 'failed') {
      throw new AppError('UE5_WORKER_INVALID_RESPONSE', 'UE5 worker returned an unsupported initial build status.', 502);
    }
    const startedAt = Date.now();
    while (status === 'queued' || status === 'processing') {
      if (Date.now() - startedAt > 30 * 60 * 1000) {
        throw new AppError('UE5_WORKER_TIMEOUT', 'UE5 build did not finish within the 30-minute worker deadline.', 504);
      }
      await new Promise(resolve => setTimeout(resolve, 2000));
      const statusResponse = await fetch(
        this.baseUrl + '/api/v1/ue5/builds/' + encodeURIComponent(buildId),
        {
          headers: this.token ? { authorization: 'Bearer ' + this.token } : {},
          signal: AbortSignal.timeout(30_000),
        },
      );
      if (!statusResponse.ok) {
        throw new AppError('UE5_WORKER_STATUS_FAILED', 'Could not retrieve UE5 build status (HTTP ' + statusResponse.status + ').', 502);
      }
      latest = await statusResponse.json() as Record<string, unknown>;
      status = latest.status;
      if (status !== 'queued' && status !== 'processing' && status !== 'completed' && status !== 'failed') {
        throw new AppError('UE5_WORKER_INVALID_RESPONSE', 'UE5 worker returned an unsupported build status.', 502);
      }
    }
    if (status === 'failed') {
      throw new AppError(
        'UE5_BUILD_FAILED',
        typeof latest.error === 'string' ? latest.error : 'Unreal Engine 5 build failed.',
        502,
      );
    }

    return {
      buildId,
      status: 'completed',
      artifactUrl: typeof latest.artifactUrl === 'string' ? latest.artifactUrl : undefined,
      format: typeof latest.format === 'string' ? latest.format : undefined,
      size: typeof latest.size === 'number' ? latest.size : undefined,
      metadata: latest.metadata && typeof latest.metadata === 'object'
        ? latest.metadata as Record<string, unknown>
        : undefined,
    };
  }
}
