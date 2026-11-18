import { GeneratedContent, TextGenParams } from '../interfaces/IProvider';
import { NVIDIA_NIM_MODELS, NvidiaNimProvider } from './NvidiaNimProvider';

export interface ModelAttempt {
  model: string;
  outcome: 'success' | 'rate_limited' | 'provider_error';
  statusCode?: number;
}

export interface NvidiaNimPoolResult {
  output: GeneratedContent;
  attempts: ModelAttempt[];
}

/**
 * Per-model capacity pool. A model's quota exhaustion does not consume or
 * disable another model's budget. This is model-level failover, not key
 * rotation or quota circumvention; upstream 429s are respected.
 */
export class NvidiaNimModelPool {
  constructor(
    private readonly provider: NvidiaNimProvider,
    private readonly models: readonly string[] = NVIDIA_NIM_MODELS,
  ) {}

  async generateText(params: Omit<TextGenParams, 'model'> & { preferredModel?: string }): Promise<NvidiaNimPoolResult> {
    const ordered = [
      ...(params.preferredModel ? [params.preferredModel] : []),
      ...this.models.filter((model) => model !== params.preferredModel),
    ];
    const attempts: ModelAttempt[] = [];
    let lastError: unknown;

    for (const model of ordered) {
      try {
        const output = await this.provider.generateText({ ...params, model });
        attempts.push({ model, outcome: 'success' });
        output.metadata = { ...(output.metadata || {}), modelPool: { attempts: [...attempts] } };
        return { output, attempts };
      } catch (error) {
        lastError = error;
        const statusCode = Number((error as any)?.statusCode || (error as any)?.response?.status || 0);
        const code = String((error as any)?.code || '');
        // Invalid requests/auth failures are not repaired by changing models.
        if (statusCode === 400 || statusCode === 401 || statusCode === 403) throw error;
        attempts.push({
          model,
          outcome: statusCode === 429 || code === 'MODEL_RATE_LIMITED' ? 'rate_limited' : 'provider_error',
          ...(statusCode ? { statusCode } : {}),
        });
      }
    }

    const failure = new Error('All configured NVIDIA NIM models are currently unavailable');
    (failure as any).code = 'NVIDIA_NIM_POOL_EXHAUSTED';
    (failure as any).attempts = attempts;
    (failure as any).cause = lastError;
    throw failure;
  }
}
