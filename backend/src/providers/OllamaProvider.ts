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
  TextGenParams,
} from './interfaces/IProvider';

/**
 * Optional self-hosted Ollama adapter. It never downloads a model, calls a
 * cloud endpoint, or blocks startup when the local server is unavailable.
 */
export class OllamaProvider implements IProvider {
  name = 'ollama';
  capabilities = ['text_generation'];
  private baseUrl = 'http://127.0.0.1:11434';
  private model = 'qwen2.5:7b';
  private timeout = 120000;

  async initialize(providerConfig: ProviderConfig): Promise<void> {
    const configuredUrl = providerConfig.apiUrl || process.env.OLLAMA_BASE_URL || this.baseUrl;
    const parsed = new URL(configuredUrl);
    const localHttp = parsed.protocol === 'http:' &&
      ['localhost', '127.0.0.1', '::1'].includes(parsed.hostname);
    if (parsed.protocol !== 'https:' && !localHttp) {
      throw new Error('Ollama must use HTTPS or a loopback HTTP address.');
    }
    this.baseUrl = configuredUrl.replace(/\/$/, '');
    this.model = providerConfig.models?.text_generation || process.env.OLLAMA_MODEL || this.model;
    this.timeout = providerConfig.timeout || Number(process.env.OLLAMA_TIMEOUT || 120000);
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(this.baseUrl + '/api/tags', {
        signal: AbortSignal.timeout(Math.min(this.timeout, 10000)),
      });
      if (!response.ok) return false;
      const payload = await response.json() as { models?: Array<{ name?: string }> };
      return Boolean(payload.models?.some((item) =>
        item.name === this.model || item.name?.startsWith(this.model + ':'),
      ));
    } catch {
      return false;
    }
  }

  async generateText(params: TextGenParams): Promise<string> {
    if (!params.prompt.trim()) throw new Error('Text generation prompt is required.');
    const response = await fetch(this.baseUrl + '/api/chat', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        model: this.model,
        stream: false,
        format: params.format === 'json' ? 'json' : undefined,
        messages: [
          ...(params.system ? [{ role: 'system', content: params.system }] : []),
          { role: 'user', content: params.prompt },
        ],
        options: {
          temperature: params.temperature ?? 0.35,
          num_predict: params.maxTokens ?? 1800,
        },
      }),
      signal: AbortSignal.timeout(this.timeout),
    });
    if (!response.ok) {
      const detail = (await response.text()).slice(0, 500);
      throw new Error('Ollama returned HTTP ' + response.status + ': ' + detail);
    }
    const payload = await response.json() as { message?: { content?: string } };
    const text = payload.message?.content;
    if (typeof text !== 'string' || !text.trim()) {
      throw new Error('Ollama returned an empty text response.');
    }
    return text.trim();
  }

  async generateImage(_params: ImageGenParams): Promise<GeneratedContent> {
    throw new Error('Ollama text adapter does not support image generation.');
  }

  async generateVideo(_params: VideoGenParams): Promise<GeneratedContent> {
    throw new Error('Ollama text adapter does not support video generation.');
  }

  async generateAudio(_params: AudioGenParams): Promise<GeneratedContent> {
    throw new Error('Ollama text adapter does not support audio generation.');
  }

  async synthesizeSpeech(_params: TTSParams): Promise<GeneratedContent> {
    throw new Error('Ollama text adapter does not support speech synthesis.');
  }

  async getRateLimit(): Promise<RateLimitStatus> {
    return { remaining: 1000000, resetTime: Date.now() + 60000, limit: 1000000 };
  }

  async validateInput(type: string, input: any): Promise<ValidationResult> {
    if (type === 'text_generation') {
      return { valid: typeof input?.prompt === 'string' && input.prompt.trim().length > 0 };
    }
    if (type === 'website_build') {
      return { valid: typeof input?.prompt === 'string' && input.prompt.trim().length >= 12 };
    }
    return { valid: false, errors: ['Ollama text adapter only supports text generation and prompt-based website builds.'] };
  }

  async validateCredentials(): Promise<boolean> {
    return this.healthCheck();
  }
}
