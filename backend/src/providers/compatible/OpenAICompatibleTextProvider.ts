import axios, { AxiosInstance } from 'axios';
import { randomUUID } from 'crypto';
import logger from '../../../utils/logger';
import {
  AudioGenParams, GeneratedContent, IProvider, ImageGenParams,
  ProviderConfig, RateLimitStatus, TextGenParams, TTSParams,
  ValidationResult, VideoGenParams,
} from '../interfaces/IProvider';

/** Shared adapter for providers exposing the documented OpenAI Chat Completions shape. */
export class OpenAICompatibleTextProvider implements IProvider {
  readonly capabilities = ['text_generation'];
  protected client!: AxiosInstance;
  protected apiKey = '';
  protected model = '';
  protected timeout = 30000;

  constructor(
    readonly name: string,
    private readonly defaultBaseUrl: string,
    private readonly defaultModel: string,
    private readonly extraHeaders: Record<string, string> = {},
  ) {}

  async initialize(config: ProviderConfig): Promise<void> {
    this.apiKey = config.apiKey || '';
    this.model = config.models?.text || this.defaultModel;
    this.timeout = config.timeout || 30000;
    const baseURL = (config.apiUrl || this.defaultBaseUrl).replace(/\/+$/, '');
    if (!this.apiKey) throw new Error(`${this.name} API key is required when enabled`);
    if (!this.model) throw new Error(`${this.name} text model must be configured when enabled`);
    this.client = axios.create({
      baseURL,
      timeout: this.timeout,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...this.extraHeaders,
      },
    });
  }

  async generateText(params: TextGenParams): Promise<GeneratedContent> {
    const prompt = params.prompt?.trim();
    if (!prompt) throw new Error('A non-empty prompt is required');
    const response = await this.client.post('/chat/completions', {
      model: params.model || this.model,
      messages: [
        ...(params.systemInstruction ? [{ role: 'system', content: params.systemInstruction }] : []),
        { role: 'user', content: prompt },
      ],
      ...(params.temperature !== undefined ? { temperature: params.temperature } : {}),
      ...(params.maxOutputTokens !== undefined ? { max_tokens: params.maxOutputTokens } : {}),
    });
    const text = response.data?.choices?.[0]?.message?.content;
    if (typeof text !== 'string' || !text.trim()) {
      throw new Error(`${this.name} returned an empty or unsupported chat response`);
    }
    return {
      id: String(response.data?.id || randomUUID()),
      url: '',
      format: 'text/plain',
      size: Buffer.byteLength(text, 'utf8'),
      text,
      metadata: {
        provider: this.name,
        model: response.data?.model || params.model || this.model,
        usage: response.data?.usage || null,
        usageAvailable: Boolean(response.data?.usage),
      },
    };
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/models');
      return response.status >= 200 && response.status < 300;
    } catch (error) {
      logger.warn(`[${this.name}] health check failed`, {
        status: axios.isAxiosError(error) ? error.response?.status : undefined,
      });
      return false;
    }
  }

  async validateCredentials(): Promise<boolean> {
    return Boolean(this.apiKey) && this.healthCheck();
  }

  /** Provider quota is unknown unless a documented quota endpoint is integrated. */
  async getRateLimit(): Promise<RateLimitStatus> {
    return { remaining: 0, resetTime: 0, limit: 0 };
  }

  async validateInput(type: string, input: any): Promise<ValidationResult> {
    const errors: string[] = [];
    if (type !== 'text_generation') errors.push(`${this.name} adapter currently supports text_generation only`);
    if (!input || typeof input.prompt !== 'string' || !input.prompt.trim()) {
      errors.push('A non-empty prompt is required');
    }
    return { valid: errors.length === 0, errors: errors.length ? errors : undefined };
  }

  private unsupported(capability: string): never {
    throw new Error(`${this.name} adapter does not implement ${capability}`);
  }
  async generateImage(_params: ImageGenParams): Promise<GeneratedContent> { return this.unsupported('image generation'); }
  async generateVideo(_params: VideoGenParams): Promise<GeneratedContent> { return this.unsupported('video generation'); }
  async generateAudio(_params: AudioGenParams): Promise<GeneratedContent> { return this.unsupported('audio generation'); }
  async synthesizeSpeech(_params: TTSParams): Promise<GeneratedContent> { return this.unsupported('text-to-speech'); }
}
