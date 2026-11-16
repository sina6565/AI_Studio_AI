import axios, { AxiosInstance } from 'axios';
import { randomUUID } from 'crypto';
import logger from '../../utils/logger';
import {
  IProvider,
  ProviderConfig,
  ImageGenParams,
  VideoGenParams,
  AudioGenParams,
  TTSParams,
  TextGenParams,
  GeneratedContent,
  RateLimitStatus,
  ValidationResult,
} from '../interfaces/IProvider';

const DEFAULT_API_URL = 'https://generativelanguage.googleapis.com/v1beta';
const DEFAULT_MODEL = 'gemini-2.5-flash';

export class GeminiProvider implements IProvider {
  name = 'gemini';
  capabilities = ['text_generation'];

  private apiKey = '';
  private apiUrl = DEFAULT_API_URL;
  private model = DEFAULT_MODEL;
  private timeout = 30000;
  private client!: AxiosInstance;

  async initialize(providerConfig: ProviderConfig): Promise<void> {
    this.apiKey = providerConfig.apiKey || '';
    this.apiUrl = (providerConfig.apiUrl || DEFAULT_API_URL).replace(/\/$/, '');
    this.model = providerConfig.models?.text || process.env.GEMINI_MODEL || DEFAULT_MODEL;
    this.timeout = providerConfig.timeout || 30000;

    if (!this.apiKey) {
      throw new Error('Google API key is required when GEMINI_ENABLED=true');
    }

    this.client = axios.create({
      baseURL: this.apiUrl,
      timeout: this.timeout,
      headers: { 'x-goog-api-key': this.apiKey },
    });
  }

  async generateText(params: TextGenParams): Promise<GeneratedContent> {
    const prompt = params.prompt?.trim();
    if (!prompt) throw new Error('A non-empty prompt is required');

    const response = await this.client.post(
      `/models/${params.model || this.model}:generateContent`,
      {
        ...(params.systemInstruction
          ? { systemInstruction: { parts: [{ text: params.systemInstruction }] } }
          : {}),
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          ...(params.temperature !== undefined ? { temperature: params.temperature } : {}),
          ...(params.maxOutputTokens !== undefined ? { maxOutputTokens: params.maxOutputTokens } : {}),
        },
      },
    );

    const text = (response.data?.candidates?.[0]?.content?.parts || [])
      .map((part: { text?: string }) => part.text || '')
      .join('')
      .trim();

    if (!text) {
      const reason = response.data?.promptFeedback?.blockReason || 'EMPTY_RESPONSE';
      throw new Error(`Gemini returned no text (${reason})`);
    }

    return {
      id: randomUUID(),
      url: '',
      format: 'text/plain',
      size: Buffer.byteLength(text, 'utf8'),
      text,
      metadata: {
        provider: this.name,
        model: params.model || this.model,
        finishReason: response.data?.candidates?.[0]?.finishReason,
        usage: response.data?.usageMetadata,
      },
    };
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/models');
      return response.status === 200 && Array.isArray(response.data?.models);
    } catch (error) {
      logger.warn('[GeminiProvider] Health check failed', error);
      return false;
    }
  }

  async validateCredentials(): Promise<boolean> {
    if (!this.apiKey) return false;
    return this.healthCheck();
  }

  async getRateLimit(): Promise<RateLimitStatus> {
    // Gemini quota values are project/model-specific and are not exposed by this endpoint.
    return { remaining: 0, resetTime: 0, limit: 0 };
  }

  async validateInput(type: string, input: any): Promise<ValidationResult> {
    const errors: string[] = [];
    if (type !== 'text_generation') errors.push(`Gemini does not support ${type}`);
    if (!input || typeof input.prompt !== 'string' || !input.prompt.trim()) {
      errors.push('Prompt is required for text generation');
    }
    return { valid: errors.length === 0, errors: errors.length ? errors : undefined };
  }

  private unsupported(capability: string): never {
    throw new Error(`Gemini provider does not implement ${capability}`);
  }

  async generateImage(_params: ImageGenParams): Promise<GeneratedContent> {
    return this.unsupported('image generation');
  }
  async generateVideo(_params: VideoGenParams): Promise<GeneratedContent> {
    return this.unsupported('video generation');
  }
  async generateAudio(_params: AudioGenParams): Promise<GeneratedContent> {
    return this.unsupported('audio generation');
  }
  async synthesizeSpeech(_params: TTSParams): Promise<GeneratedContent> {
    return this.unsupported('text-to-speech');
  }
}
