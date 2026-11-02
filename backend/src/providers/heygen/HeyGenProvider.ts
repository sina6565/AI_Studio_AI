import axios, { AxiosError } from 'axios';
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
 * HeyGen Voice Turbo through OpenRouter's OpenAI-compatible speech endpoint.
 * Audio is returned as a data URL because the current provider contract
 * exposes a URL but this repository has no shared binary-asset storage API.
 */
export class HeyGenProvider implements IProvider {
  name = 'heygen';
  capabilities = ['text_to_speech'];

  private apiKey = '';
  private apiUrl = 'https://openrouter.ai/api/v1';
  private model = 'heygen/heygen-voice-1-turbo:free';
  private timeout = 120000;

  async initialize(providerConfig: ProviderConfig): Promise<void> {
    this.apiKey = providerConfig.apiKey || process.env.OPENROUTER_API_KEY || '';
    this.apiUrl = (providerConfig.apiUrl || 'https://openrouter.ai/api/v1').replace(/\/$/, '');
    this.model = providerConfig.models?.tts || process.env.HEYGEN_TTS_MODEL || this.model;
    this.timeout = providerConfig.timeout || Number(process.env.HEYGEN_TTS_TIMEOUT || 120000);

    if (!this.apiKey) {
      throw new Error('OPENROUTER_API_KEY is required to initialize HeyGen');
    }
  }

  async healthCheck(): Promise<boolean> {
    // Avoid a billable/model request as a health probe. This only verifies
    // local configuration; actual provider availability is checked per job.
    return Boolean(this.apiKey && this.model);
  }

  async getRateLimit(): Promise<RateLimitStatus> {
    // OpenRouter free-model limits are dynamic and are not exposed by this endpoint.
    return { remaining: 0, resetTime: Date.now(), limit: 0 };
  }

  async generateImage(_params: ImageGenParams): Promise<GeneratedContent> {
    throw new Error('HeyGen provider supports text-to-speech only');
  }

  async generateVideo(_params: VideoGenParams): Promise<GeneratedContent> {
    throw new Error('HeyGen provider supports text-to-speech only');
  }

  async generateAudio(_params: AudioGenParams): Promise<GeneratedContent> {
    throw new Error('HeyGen provider supports text-to-speech only');
  }

  async synthesizeSpeech(params: TTSParams): Promise<GeneratedContent> {
    const validation = await this.validateInput('text_to_speech', params);
    if (!validation.valid) {
      throw new Error(validation.errors?.join('; ') || 'Invalid speech input');
    }

    const responseFormat = (params as TTSParams & { response_format?: string }).response_format || 'mp3';
    if (!['mp3', 'pcm'].includes(responseFormat)) {
      throw new Error('HeyGen response_format must be mp3 or pcm');
    }

    try {
      const response = await axios.post(
        `${this.apiUrl}/audio/speech`,
        {
          model: params.model || this.model,
          input: params.text,
          voice: params.voice,
          response_format: responseFormat,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': process.env.OPENROUTER_HTTP_REFERER || 'https://github.com/sina6565/AI_Studio_AI',
            'X-Title': 'SINA AI STUDIO',
          },
          responseType: 'arraybuffer',
          timeout: this.timeout,
          validateStatus: () => true,
        },
      );

      const contentType = String(response.headers['content-type'] || '');
      const audio = Buffer.from(response.data as ArrayBuffer);

      if (response.status < 200 || response.status >= 300 || !contentType.toLowerCase().startsWith('audio/')) {
        const body = audio.toString('utf8');
        let message = body.slice(0, 1000) || `OpenRouter TTS failed with HTTP ${response.status}`;
        try {
          const parsed = JSON.parse(body);
          message = parsed.error?.message || parsed.message || message;
        } catch {
          // The provider may return a plain-text error body.
        }
        throw new Error(`OpenRouter HeyGen TTS error (${response.status}): ${message}`);
      }

      if (!audio.length) {
        throw new Error('OpenRouter returned an empty audio response');
      }

      const mimeType = contentType.split(';')[0] || (responseFormat === 'pcm' ? 'audio/pcm' : 'audio/mpeg');
      const generationId = String(response.headers['x-generation-id'] || '');

      return {
        id: generationId || `heygen-${Date.now()}`,
        url: `data:${mimeType};base64,${audio.toString('base64')}`,
        format: responseFormat === 'pcm' ? 'pcm' : 'mp3',
        size: audio.length,
        metadata: {
          provider: 'heygen',
          model: params.model || this.model,
          voice: params.voice,
          contentType,
          generationId: generationId || undefined,
          storage: 'data-url',
        },
      };
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new Error(`HeyGen request failed: ${error.message}`);
      }
      throw error;
    }
  }

  async validateInput(type: string, input: any): Promise<ValidationResult> {
    const errors: string[] = [];
    if (type !== 'text_to_speech') errors.push('HeyGen supports text_to_speech only');
    if (!input || typeof input.text !== 'string' || !input.text.trim()) {
      errors.push('Text is required for speech synthesis');
    } else if (input.text.length > 5000) {
      errors.push('HeyGen Voice Turbo accepts at most 5000 characters per request');
    }
    if (!input?.voice || typeof input.voice !== 'string') {
      errors.push('A HeyGen voice ID is required');
    }
    return { valid: errors.length === 0, errors: errors.length ? errors : undefined };
  }

  async validateCredentials(): Promise<boolean> {
    return this.healthCheck();
  }
}
