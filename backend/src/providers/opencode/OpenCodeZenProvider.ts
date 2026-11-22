import axios, { AxiosInstance } from 'axios';
import { randomUUID } from 'crypto';
import logger from '../../utils/logger';
import {
  IProvider, ProviderConfig, ImageGenParams, VideoGenParams, AudioGenParams,
  TTSParams, TextGenParams, GeneratedContent, RateLimitStatus, ValidationResult,
} from '../interfaces/IProvider';

/** OpenCode Zen adapter. Zen is an optional metered gateway; it is not assumed to be free. */
export class OpenCodeZenProvider implements IProvider {
  name = 'opencode-zen';
  capabilities = ['text_generation'];
  private client!: AxiosInstance;
  private model = 'minimax-m2.5-free';

  async initialize(config: ProviderConfig): Promise<void> {
    const apiKey = config.apiKey || process.env.OPENCODE_ZEN_API_KEY || '';
    if (!apiKey) throw new Error('OPENCODE_ZEN_API_KEY is required when OPENCODE_ZEN_ENABLED=true');
    this.model = config.models?.text || process.env.OPENCODE_ZEN_MODEL || this.model;
    this.client = axios.create({
      baseURL: (config.apiUrl || process.env.OPENCODE_ZEN_BASE_URL || 'https://opencode.ai/zen/v1').replace(/\/$/, ''),
      timeout: config.timeout || Number(process.env.OPENCODE_ZEN_TIMEOUT || 90000),
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    });
  }

  async generateText(params: TextGenParams): Promise<GeneratedContent> {
    const prompt = params.prompt?.trim();
    if (!prompt) throw Object.assign(new Error('A non-empty prompt is required'), { statusCode: 400 });
    const model = params.model || this.model;
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
    const value = response.data?.choices?.[0]?.message?.content;
    const text = typeof value === 'string' ? value : Array.isArray(value)
      ? value.map((part: any) => part?.text || '').join('') : '';
    if (!text.trim()) throw new Error('OpenCode Zen returned an empty text response');
    return {
      id: randomUUID(), url: '', format: 'text/plain', size: Buffer.byteLength(text, 'utf8'), text,
      metadata: { provider: this.name, model, usage: response.data?.usage },
    };
  }

  async healthCheck(): Promise<boolean> {
    try { const r = await this.client.get('/models'); return r.status === 200; }
    catch (error) {
      logger.warn('[OpenCodeZenProvider] Health check failed', { message: error instanceof Error ? error.message : 'Unknown error' });
      return false;
    }
  }
  async validateCredentials(): Promise<boolean> { return this.healthCheck(); }
  async getRateLimit(): Promise<RateLimitStatus> { return { remaining: 0, resetTime: 0, limit: 0 }; }
  async validateInput(type: string, input: any): Promise<ValidationResult> {
    const errors: string[] = [];
    if (type !== 'text_generation') errors.push(`OpenCode Zen does not support ${type}`);
    if (!input || typeof input.prompt !== 'string' || !input.prompt.trim()) errors.push('Prompt is required');
    return { valid: errors.length === 0, errors: errors.length ? errors : undefined };
  }
  private unsupported(name: string): never { throw new Error(`OpenCode Zen adapter does not implement ${name}`); }
  async generateImage(_p: ImageGenParams): Promise<GeneratedContent> { return this.unsupported('image generation'); }
  async generateVideo(_p: VideoGenParams): Promise<GeneratedContent> { return this.unsupported('video generation'); }
  async generateAudio(_p: AudioGenParams): Promise<GeneratedContent> { return this.unsupported('audio generation'); }
  async synthesizeSpeech(_p: TTSParams): Promise<GeneratedContent> { return this.unsupported('text-to-speech'); }
}
