import logger from '../utils/logger';
import {
  IProvider, ProviderConfig, ImageGenParams, VideoGenParams, AudioGenParams,
  TTSParams, TextGenParams, GeneratedContent, RateLimitStatus, ValidationResult,
} from './interfaces/IProvider';
import { NvidiaNimProvider } from './nvidia/NvidiaNimProvider';
import { NvidiaNimModelPool } from './nvidia/NvidiaNimModelPool';
import { NVIDIA_NIM_MODELS } from './nvidia/NvidiaNimProvider';

export interface ProviderPoolAttempt {
  provider: string;
  outcome: 'success' | 'quota_exhausted' | 'rate_limited' | 'transient_error';
  statusCode?: number;
}

const DEFAULT_ORDER = ['gemini', 'nvidia-nim', 'openrouter', 'ollama'];

function errorDetails(error: any): { statusCode: number; code: string } {
  const statusCode = Number(error?.statusCode || error?.response?.status || error?.status || 0);
  const code = String(
    error?.code ||
    error?.response?.data?.error?.status ||
    error?.response?.data?.error?.code ||
    '',
  ).toUpperCase();
  return { statusCode, code };
}

function isRetryable(error: any): boolean {
  const { statusCode, code } = errorDetails(error);
  if (statusCode === 429 || statusCode === 408 || statusCode >= 500) return true;
  return [
    'RESOURCE_EXHAUSTED', 'QUOTA_EXCEEDED', 'MODEL_RATE_LIMITED',
    'NVIDIA_NIM_POOL_EXHAUSTED', 'PROVIDER_POOL_EXHAUSTED',
    'ETIMEDOUT', 'ECONNABORTED', 'ECONNRESET', 'ECONNREFUSED',
    'EAI_AGAIN', 'ENOTFOUND', 'ERR_NETWORK',
  ].includes(code);
}

function classify(error: any): ProviderPoolAttempt['outcome'] {
  const { statusCode, code } = errorDetails(error);
  if (statusCode === 429 || [
    'RESOURCE_EXHAUSTED', 'QUOTA_EXCEEDED', 'MODEL_RATE_LIMITED',
    'NVIDIA_NIM_POOL_EXHAUSTED', 'PROVIDER_POOL_EXHAUSTED',
  ].includes(code)) return 'quota_exhausted';
  if (statusCode >= 500 || statusCode === 408 || [
    'ETIMEDOUT', 'ECONNABORTED', 'ECONNRESET', 'ECONNREFUSED',
    'EAI_AGAIN', 'ENOTFOUND', 'ERR_NETWORK',
  ].includes(code)) return 'transient_error';
  return 'rate_limited';
}

/** SINA's text Pool Provider: Gemini first, NVIDIA NIM next, then configured complementary routes. */
export class ProviderPool implements IProvider {
  readonly name = 'provider-pool';
  readonly capabilities = ['text_generation'];

  constructor(private readonly providers: readonly IProvider[] = []) {}

  async initialize(_config: ProviderConfig): Promise<void> {
    // Concrete adapters are initialized by ProviderRegistry.
  }

  private orderedProviders(): IProvider[] {
    const configured = (process.env.TEXT_PROVIDER_FALLBACK_ORDER || DEFAULT_ORDER.join(','))
      .split(',').map((name) => name.trim().toLowerCase()).filter(Boolean);
    const rank = new Map<string, number>(configured.map((name, index) => [name, index] as const));
    return this.providers
      .filter((provider) => provider.capabilities.includes('text_generation') && typeof provider.generateText === 'function')
      .map((provider, index) => ({ provider, index }))
      .sort((a, b) => (rank.get(a.provider.name.toLowerCase()) ?? Number.MAX_SAFE_INTEGER) -
        (rank.get(b.provider.name.toLowerCase()) ?? Number.MAX_SAFE_INTEGER) || a.index - b.index)
      .map(({ provider }) => provider);
  }

  async generateText(params: TextGenParams): Promise<GeneratedContent> {
    if (!params || typeof params.prompt !== 'string' || !params.prompt.trim()) {
      throw Object.assign(new Error('A non-empty prompt is required'), { statusCode: 400, code: 'INVALID_INPUT' });
    }

    const candidates = this.orderedProviders();
    if (!candidates.length) {
      throw Object.assign(new Error('No configured text provider is available'), { statusCode: 503, code: 'NO_TEXT_PROVIDERS' });
    }
    const configuredMax = Number(process.env.PROVIDER_POOL_MAX_ATTEMPTS || candidates.length);
    const maxAttempts = Number.isFinite(configuredMax) ? Math.max(1, Math.floor(configuredMax)) : candidates.length;
    const attempts: ProviderPoolAttempt[] = [];
    let lastError: unknown;

    for (const provider of candidates.slice(0, maxAttempts)) {
      const providerParams = { ...params };
      if (provider.name === 'gemini' && providerParams.model && !providerParams.model.startsWith('gemini-')) {
        providerParams.model = undefined;
      }
      if (provider.name === 'nvidia-nim' && providerParams.model &&
          !(NVIDIA_NIM_MODELS as readonly string[]).includes(providerParams.model)) {
        providerParams.model = undefined;
      }

      try {
        const validation = await provider.validateInput('text_generation', providerParams);
        if (!validation.valid) {
          throw Object.assign(new Error(validation.errors?.join('; ') || 'Invalid text generation input'), {
            statusCode: 400, code: 'INVALID_INPUT',
          });
        }

        let output: GeneratedContent;
        if (provider instanceof NvidiaNimProvider) {
          const preferredModel = providerParams.model || provider.getDefaultModel();
          output = (await new NvidiaNimModelPool(provider).generateText({
            prompt: providerParams.prompt,
            systemInstruction: providerParams.systemInstruction,
            temperature: providerParams.temperature,
            maxOutputTokens: providerParams.maxOutputTokens,
            preferredModel,
          })).output;
        } else {
          output = await provider.generateText!(providerParams);
        }

        attempts.push({ provider: provider.name, outcome: 'success' });
        output.metadata = {
          ...(output.metadata || {}),
          providerPool: { selectedProvider: provider.name, attempts: [...attempts] },
        };
        return output;
      } catch (error) {
        lastError = error;
        if (!isRetryable(error)) throw error;
        attempts.push({
          provider: provider.name,
          outcome: classify(error),
          ...(errorDetails(error).statusCode ? { statusCode: errorDetails(error).statusCode } : {}),
        });
        logger.warn('[ProviderPool] Advancing to next eligible text provider', {
          failedProvider: provider.name,
          outcome: attempts[attempts.length - 1].outcome,
        });
      }
    }

    const failure = new Error('All eligible text providers are exhausted or temporarily unavailable');
    (failure as any).code = 'PROVIDER_POOL_EXHAUSTED';
    (failure as any).attempts = attempts;
    (failure as any).cause = lastError;
    throw failure;
  }

  async healthCheck(): Promise<boolean> {
    const candidates = this.orderedProviders();
    const checks = await Promise.all(candidates.map(async (provider) => {
      try { return await provider.healthCheck(); } catch { return false; }
    }));
    return checks.some(Boolean);
  }

  async validateCredentials(): Promise<boolean> { return this.healthCheck(); }

  async getRateLimit(): Promise<RateLimitStatus> {
    // Quotas are provider/model scoped; do not invent an aggregate quota number.
    return { remaining: 0, resetTime: 0, limit: 0 };
  }

  async validateInput(type: string, input: any): Promise<ValidationResult> {
    if (type !== 'text_generation') return { valid: false, errors: ['Provider Pool supports text generation only'] };
    if (!input || typeof input.prompt !== 'string' || !input.prompt.trim()) {
      return { valid: false, errors: ['Prompt is required for text generation'] };
    }
    return { valid: true };
  }

  private unsupported(capability: string): never {
    throw new Error(`Provider Pool does not implement ${capability}; route to a capability-specific provider`);
  }
  async generateImage(_params: ImageGenParams): Promise<GeneratedContent> { return this.unsupported('image generation'); }
  async generateVideo(_params: VideoGenParams): Promise<GeneratedContent> { return this.unsupported('video generation'); }
  async generateAudio(_params: AudioGenParams): Promise<GeneratedContent> { return this.unsupported('audio generation'); }
  async synthesizeSpeech(_params: TTSParams): Promise<GeneratedContent> { return this.unsupported('text-to-speech'); }
}

export default ProviderPool;
