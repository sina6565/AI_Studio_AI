import axios from 'axios';
import logger from '../../utils/logger';
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

export class LocalFallbackProvider implements IProvider {
  name = 'local-fallback';
  capabilities = [
    'image_generation',
    'video_generation',
    'audio_generation',
    'text_to_speech',
  ];

  private readonly client = axios.create({ timeout: 5000 });

  async initialize(_config: ProviderConfig): Promise<void> {
    logger.info('[Provider] Local fallback provider initialized for safe startup without external AI credentials');
  }

  async generateImage(_params: ImageGenParams): Promise<GeneratedContent> {
    throw this.createUnavailableError('image generation');
  }

  async generateVideo(_params: VideoGenParams): Promise<GeneratedContent> {
    throw this.createUnavailableError('video generation');
  }

  async generateAudio(_params: AudioGenParams): Promise<GeneratedContent> {
    throw this.createUnavailableError('audio generation');
  }

  async synthesizeSpeech(_params: TTSParams): Promise<GeneratedContent> {
    throw this.createUnavailableError('speech synthesis');
  }

  async healthCheck(): Promise<boolean> {
    return true;
  }

  async getRateLimit(): Promise<RateLimitStatus> {
    return {
      remaining: 0,
      resetTime: Date.now(),
      limit: 0,
    };
  }

  async validateInput(type: string, input: any): Promise<ValidationResult> {
    const errors: string[] = [];
    if (!input) {
      errors.push('Input is required');
      return { valid: false, errors };
    }

    switch (type) {
      case 'image_generation':
      case 'video_generation':
      case 'audio_generation':
        if (!input.prompt) errors.push('Prompt is required');
        break;
      case 'text_to_speech':
        if (!input.text) errors.push('Text is required');
        break;
      default:
        break;
    }

    return { valid: errors.length === 0, errors: errors.length > 0 ? errors : undefined };
  }

  async validateCredentials(): Promise<boolean> {
    return false;
  }

  private createUnavailableError(operation: string): Error {
    const message = `No external AI provider is configured for ${operation}. Set AGNES_API_KEY / AGNES_ENABLED=true or configure a provider before running generation jobs.`;
    const error = new Error(message) as Error & { code?: string };
    error.code = 'PROVIDER_UNAVAILABLE';
    return error;
  }
}

export default new LocalFallbackProvider();
