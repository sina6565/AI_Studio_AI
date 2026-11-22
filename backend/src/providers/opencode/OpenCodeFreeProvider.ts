import { execFile } from 'child_process';
import { promisify } from 'util';
import { randomUUID } from 'crypto';
import {
  IProvider, ProviderConfig, ImageGenParams, VideoGenParams, AudioGenParams,
  TTSParams, TextGenParams, GeneratedContent, RateLimitStatus, ValidationResult,
} from '../interfaces/IProvider';

const execFileAsync = promisify(execFile);

/**
 * OpenCode Free is a local CLI bridge, not a hosted free-inference entitlement.
 * The user must configure a free/local model/provider in OpenCode itself.
 */
export class OpenCodeFreeProvider implements IProvider {
  name = 'opencode-free';
  capabilities = ['text_generation'];
  private command = 'opencode';
  private model = '';
  private timeout = 120000;

  async initialize(config: ProviderConfig): Promise<void> {
    this.command = process.env.OPENCODE_FREE_COMMAND || 'opencode';
    this.model = config.models?.text || process.env.OPENCODE_FREE_MODEL || '';
    this.timeout = config.timeout || Number(process.env.OPENCODE_FREE_TIMEOUT || 120000);
    if (!this.model) throw new Error('OPENCODE_FREE_MODEL must identify a model configured in the local OpenCode installation');
  }

  async generateText(params: TextGenParams): Promise<GeneratedContent> {
    const prompt = params.prompt?.trim();
    if (!prompt) throw Object.assign(new Error('A non-empty prompt is required'), { statusCode: 400 });
    const model = params.model || this.model;
    const args = ['run', '--format', 'text', '--model', model];
    if (params.systemInstruction) args.push('--system', params.systemInstruction);
    args.push(prompt);
    const { stdout } = await execFileAsync(this.command, args, {
      timeout: this.timeout, maxBuffer: 8 * 1024 * 1024, windowsHide: true,
    });
    const text = String(stdout || '').trim();
    if (!text) throw new Error('OpenCode CLI returned an empty response');
    return {
      id: randomUUID(), url: '', format: 'text/plain', size: Buffer.byteLength(text, 'utf8'), text,
      metadata: { provider: this.name, model, execution: 'local-cli' },
    };
  }

  async healthCheck(): Promise<boolean> {
    try { await execFileAsync(this.command, ['--version'], { timeout: 10000, windowsHide: true }); return true; }
    catch { return false; }
  }
  async validateCredentials(): Promise<boolean> { return this.healthCheck(); }
  async getRateLimit(): Promise<RateLimitStatus> { return { remaining: 0, resetTime: 0, limit: 0 }; }
  async validateInput(type: string, input: any): Promise<ValidationResult> {
    const errors: string[] = [];
    if (type !== 'text_generation') errors.push(`OpenCode Free CLI does not support ${type}`);
    if (!input || typeof input.prompt !== 'string' || !input.prompt.trim()) errors.push('Prompt is required');
    return { valid: errors.length === 0, errors: errors.length ? errors : undefined };
  }
  private unsupported(name: string): never { throw new Error(`OpenCode Free CLI adapter does not implement ${name}`); }
  async generateImage(_p: ImageGenParams): Promise<GeneratedContent> { return this.unsupported('image generation'); }
  async generateVideo(_p: VideoGenParams): Promise<GeneratedContent> { return this.unsupported('video generation'); }
  async generateAudio(_p: AudioGenParams): Promise<GeneratedContent> { return this.unsupported('audio generation'); }
  async synthesizeSpeech(_p: TTSParams): Promise<GeneratedContent> { return this.unsupported('text-to-speech'); }
}
