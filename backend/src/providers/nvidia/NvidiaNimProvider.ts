import axios, { AxiosInstance } from 'axios';
import { randomUUID } from 'crypto';
import logger from '../../utils/logger';
import {
  IProvider, ProviderConfig, ImageGenParams, VideoGenParams, AudioGenParams,
  TTSParams, TextGenParams, GeneratedContent, RateLimitStatus, ValidationResult,
} from '../interfaces/IProvider';

/**
 * NVIDIA NIM OpenAI-compatible text provider.
 * Quota accounting is intentionally per model (not per API key).
 * The 40 RPM default is configurable and must be validated against the
 * account's live NVIDIA limits before being treated as guaranteed capacity.
 */
export const NVIDIA_NIM_MODELS = [
  'meta/llama-4-maverick-17b-128e-instruct',
  'meta/llama-3.1-8b-instruct',
  'openai/gpt-oss-20b',
  'nvidia/nvidia-nemotron-nano-9b-v2',
  'nvidia/llama-3.3-nemotron-super-49b-v1',
  'meta/llama-3.3-70b-instruct',
  'mistralai/mixtral-8x22b-instruct-v0.1',
  'openai/gpt-oss-120b',
] as const;

type ModelId = (typeof NVIDIA_NIM_MODELS)[number];
type WindowState = { startedAt: number; requests: number };

const DEFAULT_BASE_URL = 'https://integrate.api.nvidia.com/v1';
const DEFAULT_MODEL: ModelId = 'openai/gpt-oss-20b';

export class NvidiaNimProvider implements IProvider {
  name = 'nvidia-nim';
  capabilities = ['text_generation'];
  private client!: AxiosInstance;
  private defaultModel: string = DEFAULT_MODEL;
  private rpmLimit = 40;
  private windows = new Map<string, WindowState>();

  async initialize(config: ProviderConfig): Promise<void> {
    const apiKey = config.apiKey || process.env.NVIDIA_NIM_API_KEY || process.env.NVIDIA_API_KEY;
    if (!apiKey) throw new Error('NVIDIA_NIM_API_KEY is required when NVIDIA NIM is enabled');
    this.defaultModel = config.models?.text || process.env.NVIDIA_NIM_DEFAULT_MODEL || DEFAULT_MODEL;
    this.rpmLimit = Math.max(1, Number(process.env.NVIDIA_NIM_RPM_PER_MODEL || 40));
    this.client = axios.create({
      baseURL: (config.apiUrl || process.env.NVIDIA_NIM_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, ''),
      timeout: config.timeout || Number(process.env.NVIDIA_NIM_TIMEOUT || 120000),
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    });
  }

  private assertModel(model: string): asserts model is ModelId {
    if (!(NVIDIA_NIM_MODELS as readonly string[]).includes(model)) {
      throw Object.assign(new Error(`NVIDIA NIM model is not allowlisted: ${model}`), {
        statusCode: 400, code: 'NVIDIA_NIM_MODEL_NOT_ALLOWED',
      });
    }
  }

  private reserveModelRequest(model: string): void {
    const now = Date.now();
    const current = this.windows.get(model);
    if (!current || now - current.startedAt >= 60_000) {
      this.windows.set(model, { startedAt: now, requests: 1 });
      return;
    }
    if (current.requests >= this.rpmLimit) {
      const retryAfterMs = Math.max(1, 60_000 - (now - current.startedAt));
      throw Object.assign(new Error(`Local NVIDIA NIM model rate budget exhausted for ${model}`), {
        statusCode: 429, code: 'MODEL_RATE_LIMITED', retryAfterMs, model,
      });
    }
    current.requests += 1;
  }

  async generateText(params: TextGenParams): Promise<GeneratedContent> {
    const prompt = params.prompt?.trim();
    if (!prompt) throw Object.assign(new Error('A non-empty prompt is required'), { statusCode: 400 });
    const model = params.model || this.defaultModel;
    this.assertModel(model);
    this.reserveModelRequest(model);

    const response = await this.client.post('/chat/completions', {
      model,
      messages: [
        ...(params.systemInstruction ? [{ role: 'system', content: params.systemInstruction }] : []),
        { role: 'user', content: prompt },
      ],
      ...(params.temperature !== undefined ? { temperature: params.temperature } : {}),
      max_tokens: params.maxOutputTokens ?? 2048,
      stream: false,
    });
    const text = response.data?.choices?.[0]?.message?.content;
    if (typeof text !== 'string' || !text.trim()) throw new Error('NVIDIA NIM returned an empty text response');
    return {
      id: randomUUID(), url: '', format: 'text/plain', size: Buffer.byteLength(text, 'utf8'), text,
      metadata: { provider: this.name, model, usage: response.data?.usage, finishReason: response.data?.choices?.[0]?.finish_reason },
    };
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/models');
      return response.status === 200;
    } catch (error) {
      logger.warn('[NvidiaNimProvider] Health check failed', {
        message: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  async validateCredentials(): Promise<boolean> { return this.healthCheck(); }

  async getRateLimit(): Promise<RateLimitStatus> {
    const state = this.windows.get(this.defaultModel);
    const now = Date.now();
    if (!state || now - state.startedAt >= 60_000) {
      return { remaining: this.rpmLimit, resetTime: now + 60_000, limit: this.rpmLimit };
    }
    return {
      remaining: Math.max(0, this.rpmLimit - state.requests),
      resetTime: state.startedAt + 60_000,
      limit: this.rpmLimit,
    };
  }

  async validateInput(type: string, input: any): Promise<ValidationResult> {
    const errors: string[] = [];
    if (type !== 'text_generation') errors.push(`NVIDIA NIM text provider does not support ${type}`);
    if (!input || typeof input.prompt !== 'string' || !input.prompt.trim()) errors.push('Prompt is required');
    if (input?.model && !(NVIDIA_NIM_MODELS as readonly string[]).includes(input.model)) errors.push('Model is not in the NVIDIA NIM allowlist');
    return { valid: errors.length === 0, errors: errors.length ? errors : undefined };
  }

  private unsupported(capability: string): never { throw new Error(`NVIDIA NIM provider does not implement ${capability}`); }
  async generateImage(_params: ImageGenParams): Promise<GeneratedContent> { return this.unsupported('image generation'); }
  async generateVideo(_params: VideoGenParams): Promise<GeneratedContent> { return this.unsupported('video generation'); }
  async generateAudio(_params: AudioGenParams): Promise<GeneratedContent> { return this.unsupported('audio generation'); }
  async synthesizeSpeech(_params: TTSParams): Promise<GeneratedContent> { return this.unsupported('text-to-speech'); }
}

export default NvidiaNimProvider;
