import axios, { AxiosInstance } from 'axios';
import {
  IProvider,
  ProviderConfig,
  ImageGenParams,
  VideoGenParams,
  AudioGenParams,
  TTSParams,
  GeneratedContent,
  RateLimitStatus,
  ValidationResult,
} from '../interfaces/IProvider';

/**
 * OpenRouter is an OpenAI-compatible text-generation gateway.
 * It is deliberately registered only for text_generation; it does not claim
 * image, video, audio, or speech capabilities.
 */
export class OpenRouterProvider implements IProvider {
  name = 'openrouter';
  capabilities = ['text_generation'];
  private apiKey = '';
  private model = process.env.OPENROUTER_MODEL || 'openrouter/free';
  private client: AxiosInstance = axios.create();

  async initialize(providerConfig: ProviderConfig): Promise<void> {
    this.apiKey = providerConfig.apiKey || process.env.OPENROUTER_API_KEY || '';
    this.model = providerConfig.models?.text || process.env.OPENROUTER_MODEL || this.model;
    const apiUrl = (providerConfig.apiUrl || process.env.OPENROUTER_API_URL || 'https://openrouter.ai/api/v1').replace(/\/$/, '');
    this.client = axios.create({
      baseURL: apiUrl,
      timeout: providerConfig.timeout || Number(process.env.OPENROUTER_TIMEOUT || 120000),
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...(process.env.OPENROUTER_SITE_URL ? { 'HTTP-Referer': process.env.OPENROUTER_SITE_URL } : {}),
        'X-Title': process.env.OPENROUTER_APP_NAME || 'SINA AI STUDIO',
      },
    });
  }

  async generateText(params: { prompt: string; model?: string; systemPrompt?: string; temperature?: number; maxTokens?: number }): Promise<GeneratedContent> {
    if (!params.prompt?.trim()) throw new Error('Prompt is required for text generation');
    const response = await this.client.post('/chat/completions', {
      model: params.model || this.model,
      messages: [
        ...(params.systemPrompt ? [{ role: 'system', content: params.systemPrompt }] : []),
        { role: 'user', content: params.prompt },
      ],
      ...(params.temperature !== undefined ? { temperature: params.temperature } : {}),
      ...(params.maxTokens !== undefined ? { max_tokens: params.maxTokens } : {}),
    });
    const choice = response.data?.choices?.[0];
    const content = choice?.message?.content;
    if (typeof content !== 'string') throw new Error('OpenRouter returned no text content');
    return {
      id: String(response.data.id || ''),
      url: '',
      format: 'text/plain',
      size: Buffer.byteLength(content, 'utf8'),
      metadata: {
        provider: 'openrouter',
        model: response.data.model || params.model || this.model,
        content,
        usage: response.data.usage,
        finishReason: choice.finish_reason,
      },
    };
  }

  async healthCheck(): Promise<boolean> {
    if (!this.apiKey) return false;
    try {
      const response = await this.client.get('/models');
      return response.status === 200;
    } catch {
      return false;
    }
  }

  async validateCredentials(): Promise<boolean> {
    return this.healthCheck();
  }

  async getRateLimit(): Promise<RateLimitStatus> {
    return { remaining: 0, resetTime: 0, limit: 0 };
  }

  async validateInput(type: string, input: any): Promise<ValidationResult> {
    const errors: string[] = [];
    if (type !== 'text_generation') errors.push(`Unsupported capability: ${type}`);
    if (!input || typeof input.prompt !== 'string' || !input.prompt.trim()) {
      errors.push('Prompt is required for text generation');
    }
    return { valid: errors.length === 0, errors: errors.length ? errors : undefined };
  }

  async generateImage(_params: ImageGenParams): Promise<GeneratedContent> {
    throw new Error('OpenRouter provider does not support image generation through this adapter');
  }
  async generateVideo(_params: VideoGenParams): Promise<GeneratedContent> {
    throw new Error('OpenRouter provider does not support video generation through this adapter');
  }
  async generateAudio(_params: AudioGenParams): Promise<GeneratedContent> {
    throw new Error('OpenRouter provider does not support audio generation through this adapter');
  }
  async synthesizeSpeech(_params: TTSParams): Promise<GeneratedContent> {
    throw new Error('OpenRouter provider does not support speech synthesis through this adapter');
  }
}
