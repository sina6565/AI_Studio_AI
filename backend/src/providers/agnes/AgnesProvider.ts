import axios from 'axios';
import config from '../../config';
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

export class AgnesProvider implements IProvider {
  name = 'agnes';
  capabilities = ['image_generation', 'video_generation', 'audio_generation', 'text_to_speech'];
  private apiKey: string = '';
  private apiUrl: string = '';
  private timeout: number = 300000;
  private client = axios.create();

  async initialize(providerConfig: ProviderConfig): Promise<void> {
    const agnesConfig = config.providers?.agnes ?? {
      enabled: false,
      apiKey: '',
      apiUrl: 'https://api.agnes.ai',
      timeout: 300000,
    };

    this.apiKey = providerConfig.apiKey || agnesConfig.apiKey || '';
    this.apiUrl = providerConfig.apiUrl || agnesConfig.apiUrl || '';
    this.timeout = providerConfig.timeout || agnesConfig.timeout;

    this.client = axios.create({
      baseURL: this.apiUrl,
      timeout: this.timeout,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
      },
    });

    logger.info('Agnes provider initialized');
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/health');
      return response.status === 200;
    } catch (error) {
      logger.warn('Agnes provider health check failed', error);
      return false;
    }
  }

  async getRateLimit(): Promise<RateLimitStatus> {
    try {
      const response = await this.client.get('/rate-limit');
      return response.data;
    } catch (error) {
      logger.error('Failed to get rate limit status', error);
      return {
        remaining: 0,
        resetTime: Date.now(),
        limit: 100,
      };
    }
  }

  async generateImage(params: ImageGenParams): Promise<GeneratedContent> {
    try {
      const response = await this.client.post('/generate/image', params);
      return {
        id: response.data.id,
        url: response.data.url,
        format: 'jpg',
        size: response.data.size || 0,
        metadata: response.data.metadata,
      };
    } catch (error) {
      logger.error('Agnes image generation failed', error);
      throw error;
    }
  }

  async generateVideo(params: VideoGenParams): Promise<GeneratedContent> {
    try {
      const response = await this.client.post('/generate/video', params);
      return {
        id: response.data.id,
        url: response.data.url,
        format: 'mp4',
        duration: response.data.duration,
        size: response.data.size || 0,
        metadata: response.data.metadata,
      };
    } catch (error) {
      logger.error('Agnes video generation failed', error);
      throw error;
    }
  }

  async generateAudio(params: AudioGenParams): Promise<GeneratedContent> {
    try {
      const response = await this.client.post('/generate/audio', params);
      return {
        id: response.data.id,
        url: response.data.url,
        format: response.data.format || 'mp3',
        duration: response.data.duration,
        size: response.data.size || 0,
        metadata: response.data.metadata,
      };
    } catch (error) {
      logger.error('Agnes audio generation failed', error);
      throw error;
    }
  }

  async synthesizeSpeech(params: TTSParams): Promise<GeneratedContent> {
    try {
      const response = await this.client.post('/synthesize/speech', params);
      return {
        id: response.data.id,
        url: response.data.url,
        format: 'mp3',
        duration: response.data.duration,
        size: response.data.size || 0,
        metadata: response.data.metadata,
      };
    } catch (error) {
      logger.error('Agnes speech synthesis failed', error);
      throw error;
    }
  }

  async validateInput(type: string, input: any): Promise<ValidationResult> {
    return { valid: true };
  }

  async validateCredentials(): Promise<boolean> {
    return Boolean(this.apiKey);
  }
}
