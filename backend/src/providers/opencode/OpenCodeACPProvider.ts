import { spawn } from 'child_process';
import { randomUUID } from 'crypto';
import { createInterface } from 'readline';
import {
  IProvider, ProviderConfig, ImageGenParams, VideoGenParams, AudioGenParams,
  TTSParams, TextGenParams, GeneratedContent, RateLimitStatus, ValidationResult,
} from '../interfaces/IProvider';

/**
 * OpenCode ACP bridge. ACP is an agent protocol, not a model inference API.
 * This adapter launches `opencode acp` and speaks JSON-RPC over stdio.
 */
export class OpenCodeACPProvider implements IProvider {
  name = 'opencode-acp';
  capabilities = ['text_generation'];
  private command = 'opencode';
  private args = ['acp'];
  private cwd = process.cwd();
  private timeout = 120000;

  async initialize(config: ProviderConfig): Promise<void> {
    this.command = process.env.OPENCODE_ACP_COMMAND || 'opencode';
    this.args = (process.env.OPENCODE_ACP_ARGS || 'acp').split(/\s+/).filter(Boolean);
    this.cwd = process.env.OPENCODE_ACP_CWD || process.cwd();
    this.timeout = config.timeout || Number(process.env.OPENCODE_ACP_TIMEOUT || 120000);
  }

  private async request(params: Record<string, unknown>, timeoutMs: number): Promise<any> {
    const child = spawn(this.command, this.args, { cwd: this.cwd, stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true });
    let stderr = '';
    child.stderr.setEncoding('utf8').on('data', (chunk) => { stderr += chunk; });
    const rl = createInterface({ input: child.stdout });
    const pending = new Map<string, { resolve: (v: any) => void; reject: (e: Error) => void }>();
    let streamedText = '';
    const failAll = (error: Error) => { for (const p of pending.values()) p.reject(error); pending.clear(); };
    rl.on('line', (line) => {
      try {
        const message = JSON.parse(line);
        if (message.method === 'session/update') {
          const update = message.params?.update;
          if (update?.sessionUpdate === 'agent_message_chunk' && update?.content?.type === 'text') {
            streamedText += update.content.text || '';
          }
        }
        if (message.id && pending.has(String(message.id))) {
          const p = pending.get(String(message.id))!;
          pending.delete(String(message.id));
          if (message.error) p.reject(new Error(message.error.message || 'ACP request failed'));
          else p.resolve(message.result);
        }
      } catch { /* Ignore non-JSON diagnostic lines; ACP protocol messages remain JSON-RPC. */ }
    });
    child.on('error', (error) => failAll(error));
    child.on('exit', (code) => failAll(new Error(`OpenCode ACP exited (${code}): ${stderr.slice(-2000)}`)));
    const send = (rpcMethod: string, rpcParams: Record<string, unknown>) => new Promise<any>((resolve, reject) => {
      const requestId = randomUUID();
      const timer = setTimeout(() => { pending.delete(requestId); reject(new Error(`ACP request timed out: ${rpcMethod}`)); }, timeoutMs);
      pending.set(requestId, {
        resolve: (value) => { clearTimeout(timer); resolve(value); },
        reject: (error) => { clearTimeout(timer); reject(error); },
      });
      child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id: requestId, method: rpcMethod, params: rpcParams }) + '\n');
    });
    try {
      await send('initialize', {
        protocolVersion: 1,
        clientInfo: { name: 'sina-ai-studio', version: '1.0.0' },
        clientCapabilities: {},
      });
      const session = await send('session/new', { cwd: this.cwd, mcpServers: [] });
      const result = await send('session/prompt', {
        sessionId: session.sessionId,
        prompt: [{ type: 'text', text: String(params.prompt || '') }],
      });
      return { ...result, text: streamedText };
    } finally {
      rl.close();
      child.kill();
    }
  }

  async generateText(params: TextGenParams): Promise<GeneratedContent> {
    const prompt = params.prompt?.trim();
    if (!prompt) throw Object.assign(new Error('A non-empty prompt is required'), { statusCode: 400 });
    const effectivePrompt = params.systemInstruction
      ? `System instructions:\n${params.systemInstruction}\n\nUser request:\n${prompt}`
      : prompt;
    const result = await this.request({ prompt: effectivePrompt }, this.timeout);
    const text = Array.isArray(result?.content)
      ? result.content.filter((part: any) => part.type === 'text').map((part: any) => part.text || '').join('\n').trim()
      : String(result?.text || '').trim();
    if (!text) throw new Error('OpenCode ACP returned no text content');
    return { id: randomUUID(), url: '', format: 'text/plain', size: Buffer.byteLength(text, 'utf8'), text,
      metadata: { provider: this.name, protocol: 'agent-client-protocol', stopReason: result?.stopReason } };
  }

  async healthCheck(): Promise<boolean> {
    try {
      const child = spawn(this.command, this.args, { cwd: this.cwd, stdio: ['pipe', 'pipe', 'ignore'], windowsHide: true });
      return await new Promise<boolean>((resolve) => {
        const timer = setTimeout(() => { child.kill(); resolve(false); }, 5000);
        child.once('spawn', () => { clearTimeout(timer); child.kill(); resolve(true); });
        child.once('error', () => { clearTimeout(timer); resolve(false); });
      });
    } catch { return false; }
  }
  async validateCredentials(): Promise<boolean> { return this.healthCheck(); }
  async getRateLimit(): Promise<RateLimitStatus> { return { remaining: 0, resetTime: 0, limit: 0 }; }
  async validateInput(type: string, input: any): Promise<ValidationResult> {
    const errors: string[] = [];
    if (type !== 'text_generation') errors.push(`OpenCode ACP adapter does not support ${type}`);
    if (!input || typeof input.prompt !== 'string' || !input.prompt.trim()) errors.push('Prompt is required');
    return { valid: errors.length === 0, errors: errors.length ? errors : undefined };
  }
  private unsupported(name: string): never { throw new Error(`OpenCode ACP adapter does not implement ${name}`); }
  async generateImage(_p: ImageGenParams): Promise<GeneratedContent> { return this.unsupported('image generation'); }
  async generateVideo(_p: VideoGenParams): Promise<GeneratedContent> { return this.unsupported('video generation'); }
  async generateAudio(_p: AudioGenParams): Promise<GeneratedContent> { return this.unsupported('audio generation'); }
  async synthesizeSpeech(_p: TTSParams): Promise<GeneratedContent> { return this.unsupported('text-to-speech'); }
}
