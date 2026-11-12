import axios, { AxiosInstance } from 'axios';
import { IProvider, ProviderConfig, VideoGenParams, GeneratedContent, RateLimitStatus, ValidationResult } from '../interfaces/IProvider';

type SeedanceModel = 'dreamina-seedance-2-0-260128' | 'dreamina-seedance-2-0-fast-260128' | 'dreamina-seedance-2-0-mini-260615';
type SeedanceParams = VideoGenParams & {
  ratio?: string; inputReferences?: Array<Record<string, any>>;
  generateAudio?: boolean; watermark?: boolean; seed?: number;
  rightsConfirmed?: boolean; inputRightsConfirmed?: boolean; authorizedPortraitsConfirmed?: boolean;
};
const MODELS: SeedanceModel[] = ['dreamina-seedance-2-0-260128', 'dreamina-seedance-2-0-fast-260128', 'dreamina-seedance-2-0-mini-260615'];

export class BytePlusSeedanceProvider implements IProvider {
  name = 'byteplus-seedance';
  capabilities = ['video_generation', 'text_to_video', 'image_to_video', 'multimodal_video_generation'];
  private client!: AxiosInstance;
  private apiKey = '';
  private defaultModel: SeedanceModel = 'dreamina-seedance-2-0-260128';
  private allowBillableRequests = false;

  async initialize(config: ProviderConfig): Promise<void> {
    this.apiKey = config.apiKey || process.env.BYTEPLUS_SEEDANCE_API_KEY || '';
    this.defaultModel = (config.models?.video || process.env.BYTEPLUS_SEEDANCE_MODEL || MODELS[0]) as SeedanceModel;
    this.allowBillableRequests = process.env.BYTEPLUS_ALLOW_BILLABLE_REQUESTS === 'true';
    this.client = axios.create({
      baseURL: (config.apiUrl || process.env.BYTEPLUS_MODELARK_API_URL || 'https://ark.ap-southeast.bytepluses.com/api/v3').replace(/\/$/, ''),
      timeout: config.timeout || Number(process.env.BYTEPLUS_SEEDANCE_TIMEOUT || 180000),
      headers: { Authorization: `Bearer ${this.apiKey}`, 'Content-Type': 'application/json' },
    });
  }

  private assertBillableAccess(): void {
    if (!this.apiKey) throw new Error('BYTEPLUS_SEEDANCE_API_KEY is not configured');
    if (!this.allowBillableRequests) throw new Error('Seedance generation is billable. Explicitly set BYTEPLUS_ALLOW_BILLABLE_REQUESTS=true after approving the costs.');
  }

  async generateVideo(params: VideoGenParams): Promise<GeneratedContent> {
    this.assertBillableAccess();
    const input = params as SeedanceParams;
    const validation = await this.validateInput('video_generation', input);
    if (!validation.valid) throw new Error(validation.errors?.join('; ') || 'Invalid Seedance request');
    const model = (input.model || this.defaultModel) as SeedanceModel;
    const body: Record<string, unknown> = {
      model,
      content: [{ type: 'text', text: input.prompt }, ...(input.inputReferences || [])],
      resolution: input.resolution || '720p',
      ratio: input.ratio || '16:9',
      duration: input.duration ?? 5,
      generate_audio: input.generateAudio ?? true,
      watermark: input.watermark ?? true,
      ...(input.seed !== undefined ? { seed: input.seed } : {}),
    };
    const created = await this.client.post('/contents/generations/tasks', body);
    const taskId = created.data?.id;
    if (typeof taskId !== 'string' || !taskId) throw new Error('BytePlus ModelArk returned no task id');

    let task = created.data;
    const maxPolls = Math.max(1, Number(process.env.BYTEPLUS_SEEDANCE_MAX_POLLS || 60));
    const pollMs = Math.max(1000, Number(process.env.BYTEPLUS_SEEDANCE_POLL_MS || 5000));
    for (let i = 0; i < maxPolls; i += 1) {
      const status = String(task?.status || '').toLowerCase();
      if (status === 'succeeded') {
        const url = task?.content?.video_url || task?.video_url || task?.output?.video_url || '';
        if (!url) throw new Error(`Seedance task ${taskId} succeeded without a video URL`);
        return { id: taskId, url, format: 'video/mp4', duration: Number(task?.duration || input.duration || 0) || undefined, size: 0,
          metadata: { provider: this.name, model, status, taskId, usage: task?.usage } };
      }
      if (['failed', 'expired'].includes(status) || task?.error) {
        throw new Error(task?.error?.message || task?.message || `Seedance task ${taskId} ended with status ${status || 'failed'}`);
      }
      if (i < maxPolls - 1) {
        await new Promise(resolve => setTimeout(resolve, pollMs));
        task = (await this.client.get(`/contents/generations/tasks/${encodeURIComponent(taskId)}`)).data;
      }
    }
    return { id: taskId, url: '', format: 'video/mp4', duration: input.duration, size: 0,
      metadata: { provider: this.name, model, status: task?.status || 'processing', taskId, pollingRequired: true } };
  }

  async generateImage(): Promise<GeneratedContent> { throw new Error('Seedance provider supports video generation only'); }
  async generateAudio(): Promise<GeneratedContent> { throw new Error('Seedance audio is generated only as synchronized video audio'); }
  async synthesizeSpeech(): Promise<GeneratedContent> { throw new Error('Seedance provider does not expose standalone TTS'); }
  async healthCheck(): Promise<boolean> { return Boolean(this.apiKey); }
  async validateCredentials(): Promise<boolean> { return Boolean(this.apiKey); }
  async getRateLimit(): Promise<RateLimitStatus> { return { remaining: 0, resetTime: 0, limit: 0 }; }

  async validateInput(type: string, value: any): Promise<ValidationResult> {
    const errors: string[] = [];
    if (type !== 'video_generation') errors.push('Only video_generation is supported');
    if (!value || typeof value.prompt !== 'string' || !value.prompt.trim()) errors.push('A non-empty prompt is required');
    if (value?.rightsConfirmed !== true) errors.push('Accept the applicable BytePlus service terms before generation');
    if (value?.inputReferences?.length && value.inputRightsConfirmed !== true) errors.push('Confirm rights to every uploaded reference asset');
    if (value?.inputReferences?.length && value.authorizedPortraitsConfirmed !== true) errors.push('Confirm authorization and eligibility for identifiable-person reference assets');
    const model = value?.model || this.defaultModel;
    if (!MODELS.includes(model)) errors.push('Unsupported Seedance 2.0 model id');
    if (value?.duration !== undefined && value.duration !== -1 && (!Number.isInteger(value.duration) || value.duration < 4 || value.duration > 15)) errors.push('Seedance 2.0 duration must be 4–15 seconds or -1');
    const resolution = value?.resolution || '720p';
    if (model === MODELS[0] && !['480p', '720p', '1080p', '4k'].includes(resolution)) errors.push('Seedance 2.0 supports 480p, 720p, 1080p and 4k');
    if (model !== MODELS[0] && !['480p', '720p'].includes(resolution)) errors.push('Seedance Fast and Mini support 480p and 720p only');
    if (Array.isArray(value?.inputReferences)) {
      const count = (type: string) => value.inputReferences.filter((item: any) => item?.type === type).length;
      if (count('image_url') > 9 || count('video_url') > 3 || count('audio_url') > 3) errors.push('Seedance 2.0 supports up to 9 images, 3 videos and 3 audio references');
      if (value.inputReferences.some((item: any) => !['image_url', 'video_url', 'audio_url'].includes(item?.type))) errors.push('Reference content type must be image_url, video_url or audio_url');
      if (count('audio_url') > 0 && count('image_url') === 0 && count('video_url') === 0) errors.push('Seedance 2.0 does not support audio-only input');
    }
    return { valid: errors.length === 0, errors: errors.length ? errors : undefined };
  }
}
