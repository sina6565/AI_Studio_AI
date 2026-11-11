import axios, { AxiosInstance } from 'axios';
import {
  IProvider, ProviderConfig, ImageGenParams, VideoGenParams, AudioGenParams,
  TTSParams, GeneratedContent, RateLimitStatus, ValidationResult,
} from '../interfaces/IProvider';

/**
 * Unified OpenRouter adapter. Model availability is discovered from OpenRouter;
 * capability support is per-model and must be selected by model id.
 */
export class OpenRouterProvider implements IProvider {
  name = 'openrouter';
  capabilities = [
    'text_generation', 'image_generation', 'video_generation',
    'audio_generation', 'text_to_speech', 'speech_to_text',
    'multimodal_understanding',
  ];
  private client!: AxiosInstance;
  private apiKey = '';
  private defaultModel = 'openrouter/auto';
  private delay(ms: number): Promise<void> { return new Promise(resolve => setTimeout(resolve, ms)); }

  async initialize(config: ProviderConfig): Promise<void> {
    this.apiKey = config.apiKey || process.env.OPENROUTER_API_KEY || '';
    this.defaultModel = config.models?.text || process.env.OPENROUTER_MODEL || 'openrouter/auto';
    this.client = axios.create({
      baseURL: (config.apiUrl || process.env.OPENROUTER_API_URL || 'https://openrouter.ai/api/v1').replace(/\/$/, ''),
      timeout: config.timeout || Number(process.env.OPENROUTER_TIMEOUT || 180000),
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...(process.env.OPENROUTER_SITE_URL ? { 'HTTP-Referer': process.env.OPENROUTER_SITE_URL } : {}),
        'X-Title': process.env.OPENROUTER_APP_NAME || 'SINA AI STUDIO',
      },
    });
  }

  /** Live catalog. Use output_modalities=all and retain each model's modality metadata. */
  async listModels(): Promise<any[]> {
    const response = await this.client.get('/models', { params: { output_modalities: 'all' } });
    return response.data?.data || [];
  }

  async listImageModels(): Promise<any[]> {
    const response = await this.client.get('/images/models');
    return response.data?.data || [];
  }

  async listVideoModels(): Promise<any[]> {
    const response = await this.client.get('/videos/models');
    return response.data?.data || [];
  }

  async generateText(params: {
    prompt: string; model?: string; systemPrompt?: string;
    temperature?: number; maxTokens?: number; messages?: any[];
  }): Promise<GeneratedContent> {
    if (!params.prompt?.trim() && !params.messages?.length) throw new Error('Prompt or messages are required');
    const messages = params.messages || [
      ...(params.systemPrompt ? [{ role: 'system', content: params.systemPrompt }] : []),
      { role: 'user', content: params.prompt },
    ];
    const response = await this.client.post('/chat/completions', {
      model: params.model || this.defaultModel,
      messages,
      ...(params.temperature !== undefined ? { temperature: params.temperature } : {}),
      ...(params.maxTokens !== undefined ? { max_tokens: params.maxTokens } : {}),
    });
    const choice = response.data?.choices?.[0];
    const content = choice?.message?.content;
    return {
      id: String(response.data?.id || ''),
      url: '',
      format: 'text/plain',
      size: Buffer.byteLength(typeof content === 'string' ? content : JSON.stringify(content || ''), 'utf8'),
      metadata: { provider: this.name, model: response.data?.model, content, message: choice?.message, usage: response.data?.usage },
    };
  }

  async generateImage(params: ImageGenParams): Promise<GeneratedContent> {
    const response = await this.client.post('/images', {
      model: params.model,
      prompt: params.prompt,
      ...(params.size ? { size: params.size } : {}),
      ...(params.quality ? { quality: params.quality } : {}),
      ...(params.style ? { style: params.style } : {}),
      ...(params.seed !== undefined ? { seed: params.seed } : {}),
      ...(params.negative_prompt ? { negative_prompt: params.negative_prompt } : {}),
      ...(Array.isArray((params as any).input_references) ? { input_references: (params as any).input_references } : {}),
    });
    const image = response.data?.data?.[0];
    if (!image?.b64_json && !image?.url) throw new Error('OpenRouter image response contained no image data');
    return {
      id: String(response.data?.id || ''),
      url: image.url || '',
      format: image.media_type || 'image/png',
      size: image.b64_json ? Buffer.from(image.b64_json, 'base64').length : 0,
      metadata: { provider: this.name, model: params.model, imageBase64: image.b64_json, usage: response.data?.usage },
    };
  }

  async generateVideo(params: VideoGenParams): Promise<GeneratedContent> {
    const submitted = await this.client.post('/videos', {
      model: params.model,
      prompt: params.prompt,
      ...(params.duration !== undefined ? { duration: params.duration } : {}),
      ...(params.resolution ? { resolution: params.resolution } : {}),
      ...(params.fps ? { fps: params.fps } : {}),
      ...(Array.isArray((params as any).input_references) ? { input_references: (params as any).input_references } : {}),
      ...(typeof (params as any).generate_audio === 'boolean' ? { generate_audio: (params as any).generate_audio } : {}),
    });
    const jobId = submitted.data?.id;
    const pollingUrl = submitted.data?.polling_url;
    if (!jobId && !pollingUrl) throw new Error('OpenRouter did not return a video job id');
    let status = submitted.data;
    const maxPolls = Number(process.env.OPENROUTER_VIDEO_MAX_POLLS || 60);
    for (let i = 0; i < maxPolls && !status?.url && !status?.video_url && !status?.error; i++) {
      await this.delay(Number(process.env.OPENROUTER_VIDEO_POLL_MS || 5000));
      const pollPath = pollingUrl || `/videos/${encodeURIComponent(jobId)}`;
      const polled = await this.client.get(pollPath);
      status = polled.data;
      if (status?.status === 'failed') throw new Error(status.error || 'OpenRouter video generation failed');
    }
    const videoUrl = status?.url || status?.video_url || status?.unsigned_urls?.[0] || '';
    return {
      id: String(jobId || status?.id || ''),
      url: videoUrl,
      format: 'video/mp4',
      duration: params.duration,
      size: 0,
      metadata: { provider: this.name, model: params.model, status: status?.status || 'processing', pollingUrl, usage: status?.usage },
    };
  }

  async generateAudio(params: AudioGenParams): Promise<GeneratedContent> {
    const response = await this.client.post('/chat/completions', {
      model: params.model,
      modalities: ['audio'],
      audio: { format: params.format || 'mp3', voice: (params as any).voice || 'alloy' },
      messages: [{ role: 'user', content: params.prompt }],
    });
    const audio = response.data?.choices?.[0]?.message?.audio;
    const data = audio?.data || audio?.audio;
    if (!data) throw new Error('Selected OpenRouter model did not return audio output');
    return {
      id: String(response.data?.id || ''),
      url: '',
      format: params.format || 'mp3',
      size: Buffer.from(data, 'base64').length,
      metadata: { provider: this.name, model: response.data?.model, audioBase64: data, transcript: audio?.transcript, usage: response.data?.usage },
    };
  }

  async synthesizeSpeech(params: TTSParams): Promise<GeneratedContent> {
    const response = await this.client.post('/audio/speech', {
      model: params.model,
      input: params.text,
      voice: params.voice || 'alloy',
      response_format: 'mp3',
      ...(params.speed ? { speed: params.speed } : {}),
    }, { responseType: 'arraybuffer' });
    const bytes = Buffer.from(response.data);
    return {
      id: `openrouter-tts-${Date.now()}`,
      url: '',
      format: 'audio/mpeg',
      size: bytes.length,
      metadata: { provider: this.name, model: params.model, audioBase64: bytes.toString('base64') },
    };
  }

  async transcribeAudio(params: { model: string; audioBase64: string; filename?: string; language?: string }): Promise<GeneratedContent> {
    const response = await this.client.post('/audio/transcriptions', {
      model: params.model,
      file: params.audioBase64,
      ...(params.language ? { language: params.language } : {}),
    });
    const text = response.data?.text || '';
    return {
      id: String(response.data?.id || `openrouter-stt-${Date.now()}`),
      url: '',
      format: 'text/plain',
      size: Buffer.byteLength(text, 'utf8'),
      metadata: { provider: this.name, model: params.model, transcript: text, usage: response.data?.usage },
    };
  }

  async healthCheck(): Promise<boolean> {
    if (!this.apiKey) return false;
    try { return (await this.client.get('/models', { params: { output_modalities: 'all' } })).status === 200; }
    catch { return false; }
  }
  async validateCredentials(): Promise<boolean> { return this.healthCheck(); }
  async getRateLimit(): Promise<RateLimitStatus> { return { remaining: 0, resetTime: 0, limit: 0 }; }

  async validateInput(type: string, input: any): Promise<ValidationResult> {
    const errors: string[] = [];
    if (!input) errors.push('Input is required');
    else if (['image_generation','video_generation','audio_generation'].includes(type) && !input.prompt) errors.push('Prompt is required');
    else if (type === 'text_to_speech' && !input.text) errors.push('Text is required');
    else if (type === 'speech_to_text' && !input.audioBase64) errors.push('Base64 audio is required');
    return { valid: errors.length === 0, errors: errors.length ? errors : undefined };
  }
}
