import axios, { AxiosInstance } from 'axios';
import { randomUUID } from 'crypto';
import {
  IProvider, ProviderConfig, ImageGenParams, VideoGenParams, AudioGenParams,
  TTSParams, TextGenParams, GeneratedContent, RateLimitStatus, ValidationResult,
} from '../interfaces/IProvider';

const TEXT_API = 'https://text.pollinations.ai';
const IMAGE_API = 'https://image.pollinations.ai/prompt';

export class PollinationsProvider implements IProvider {
  readonly name = 'pollinations';
  readonly capabilities = ['text_generation', 'image_generation'];
  private timeout = 90000;
  private textClient!: AxiosInstance;
  private initialized = false;

  async initialize(config: ProviderConfig): Promise<void> {
    this.timeout = config.timeout || 90000;
    this.textClient = axios.create({
      baseURL: config.apiUrl || TEXT_API,
      timeout: this.timeout,
      headers: { Accept: 'text/plain' },
      maxRedirects: 5,
    });
    this.initialized = true;
  }

  async generateText(params: TextGenParams): Promise<GeneratedContent> {
    const prompt = params.prompt?.trim();
    if (!prompt) throw Object.assign(new Error('A non-empty prompt is required'), { statusCode: 400 });
    const response = await this.textClient.get(`/${encodeURIComponent(prompt)}`, {
      params: {
        ...(params.model ? { model: params.model } : {}),
        ...(params.systemInstruction ? { system: params.systemInstruction } : {}),
      },
      responseType: 'text',
    });
    const text = String(response.data ?? '').trim();
    if (!text) throw new Error('Pollinations returned an empty text response');
    return {
      id: randomUUID(), url: '', format: 'text/plain',
      size: Buffer.byteLength(text, 'utf8'), text,
      metadata: { provider: this.name, model: params.model || 'default', apiKeyRequired: false },
    };
  }

  async generateImage(params: ImageGenParams): Promise<GeneratedContent> {
    const prompt = params.prompt?.trim();
    if (!prompt) throw Object.assign(new Error('A non-empty image prompt is required'), { statusCode: 400 });
    const query = new URLSearchParams();
    if (params.size) {
      const dimensions = /^(\\d{2,5})x(\\d{2,5})$/.exec(params.size);
      if (dimensions) {
        query.set('width', dimensions[1]);
        query.set('height', dimensions[2]);
      }
    }
    if (params.seed !== undefined) query.set('seed', String(params.seed));
    if (params.model) query.set('model', params.model);
    query.set('nologo', 'true');
    const url = `${IMAGE_API}/${encodeURIComponent(prompt)}?${query.toString()}`;
    return {
      id: randomUUID(), url, format: 'image/jpeg', size: 0,
      metadata: { provider: this.name, model: params.model || 'default', apiKeyRequired: false },
    };
  }

  async healthCheck(): Promise<boolean> {
    if (!this.initialized) return false;
    try { const response = await this.textClient.get('/models'); return response.status === 200; }
    catch { return false; }
  }
  async validateCredentials(): Promise<boolean> { return this.initialized; }
  async getRateLimit(): Promise<RateLimitStatus> { return { remaining: 0, resetTime: 0, limit: 0 }; }

  async validateInput(type: string, input: any): Promise<ValidationResult> {
    if (!['text_generation', 'image_generation'].includes(type)) {
      return { valid: false, errors: [`Pollinations does not support ${type}`] };
    }
    if (!input || typeof input.prompt !== 'string' || !input.prompt.trim()) {
      return { valid: false, errors: ['A non-empty prompt is required'] };
    }
    return { valid: true };
  }

  private unsupported(capability: string): never {
    throw new Error(`Pollinations provider does not implement ${capability}`);
  }
  async generateVideo(_params: VideoGenParams): Promise<GeneratedContent> { return this.unsupported('video generation'); }
  async generateAudio(_params: AudioGenParams): Promise<GeneratedContent> { return this.unsupported('audio generation'); }
  async synthesizeSpeech(_params: TTSParams): Promise<GeneratedContent> { return this.unsupported('text-to-speech'); }
}
