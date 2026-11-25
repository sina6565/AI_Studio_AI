import axios, { AxiosInstance } from 'axios';
import { randomUUID } from 'crypto';
import {
  IProvider, ProviderConfig, ImageGenParams, VideoGenParams, AudioGenParams,
  TTSParams, TextGenParams, GeneratedContent, RateLimitStatus, ValidationResult,
} from '../interfaces/IProvider';

const DEFAULT_BASE_URL = 'https://api.groq.com/openai/v1';
const DEFAULT_MODEL = 'llama-3.3-70b-versatile';

export class GroqProvider implements IProvider {
  readonly name = 'groq';
  readonly capabilities = ['text_generation'];
  private apiKey = '';
  private model = DEFAULT_MODEL;
  private client!: AxiosInstance;

  async initialize(config: ProviderConfig): Promise<void> {
    this.apiKey = config.apiKey || '';
    this.model = config.models?.text || process.env.GROQ_MODEL || DEFAULT_MODEL;
    if (!this.apiKey) throw new Error('GROQ_API_KEY is required when GROQ_ENABLED=true');
    this.client = axios.create({
      baseURL: (config.apiUrl || DEFAULT_BASE_URL).replace(/\/$/, ''),
      timeout: config.timeout || 90000,
      headers: { Authorization: `Bearer ${this.apiKey}`, 'Content-Type': 'application/json' },
    });
  }

  async generateText(params: TextGenParams): Promise<GeneratedContent> {
    const prompt = params.prompt?.trim();
    if (!prompt) throw Object.assign(new Error('A non-empty prompt is required'), { statusCode: 400 });
    const response = await this.client.post('/chat/completions', {
      model: params.model || this.model,
      messages: [
        ...(params.systemInstruction ? [{ role: 'system', content: params.systemInstruction }] : []),
        { role: 'user', content: prompt },
      ],
      ...(params.temperature !== undefined ? { temperature: params.temperature } : {}),
      ...(params.maxOutputTokens !== undefined ? { max_tokens: params.maxOutputTokens } : {}),
    });
    const text = String(response.data?.choices?.[0]?.message?.content || '').trim();
    if (!text) throw new Error('Groq returned an empty completion');
    return {
      id: response.data?.id || randomUUID(), url: '', format: 'text/plain',
      size: Buffer.byteLength(text, 'utf8'), text,
      metadata: { provider: this.name, model: params.model || this.model, usage: response.data?.usage },
    };
  }

  async healthCheck(): Promise<boolean> {
    try { const r = await this.client.get('/models'); return r.status === 200; }
    catch { return false; }
  }
  async validateCredentials(): Promise<boolean> { return Boolean(this.apiKey) && this.healthCheck(); }
  async getRateLimit(): Promise<RateLimitStatus> { return { remaining: 0, resetTime: 0, limit: 0 }; }
  async validateInput(type: string, input: any): Promise<ValidationResult> {
    const errors: string[] = [];
    if (type !== 'text_generation') errors.push(`Groq does not support ${type}`);
    if (!input || typeof input.prompt !== 'string' || !input.prompt.trim()) errors.push('A non-empty prompt is required');
    return { valid: errors.length === 0, errors: errors.length ? errors : undefined };
  }
  private unsupported(capability: string): never { throw new Error(`Groq provider does not implement ${capability}`); }
  async generateImage(_params: ImageGenParams): Promise<GeneratedContent> { return this.unsupported('image generation'); }
  async generateVideo(_params: VideoGenParams): Promise<GeneratedContent> { return this.unsupported('video generation'); }
  async generateAudio(_params: AudioGenParams): Promise<GeneratedContent> { return this.unsupported('audio generation'); }
  async synthesizeSpeech(_params: TTSParams): Promise<GeneratedContent> { return this.unsupported('text-to-speech'); }
}
