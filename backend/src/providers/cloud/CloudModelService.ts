import axios from 'axios';

export type ChatRole = 'system' | 'user' | 'assistant';
export interface ChatMessage { role: ChatRole; content: string; }
export interface CloudModelRequest {
  provider: 'google-gemma' | 'nvidia';
  model?: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
}
export interface CloudModelResponse {
  provider: string;
  model: string;
  content: string;
}

const GEMMA_MODELS = ['gemma-4-26b-a4b-it', 'gemma-4-31b-it'] as const;
const NVIDIA_DEFAULT_MODEL = 'nvidia/nemotron-3.5-lightning-30b-a3b';

export class CloudModelService {
  listModels() {
    return [
      ...GEMMA_MODELS.map((id) => ({
        id, provider: 'google-gemma', configured: Boolean(process.env.GOOGLE_GEMMA_API_KEY),
        input: ['text', 'image'], output: ['text'],
      })),
      {
        id: NVIDIA_DEFAULT_MODEL, provider: 'nvidia',
        configured: Boolean(process.env.NVIDIA_API_KEY),
        input: ['text'], output: ['text'],
      },
    ];
  }

  async chat(request: CloudModelRequest): Promise<CloudModelResponse> {
    if (!Array.isArray(request.messages) || request.messages.length === 0 ||
        request.messages.length > 100 ||
        request.messages.some((m) => !m || !['system', 'user', 'assistant'].includes(m.role) ||
          typeof m.content !== 'string' || !m.content.trim() || m.content.length > 100000)) {
      throw Object.assign(new Error('messages must contain 1-100 valid chat messages'), { statusCode: 400, code: 'INVALID_MESSAGES' });
    }

    if (request.provider === 'google-gemma') return this.googleGemma(request);
    if (request.provider === 'nvidia') return this.nvidia(request);
    throw Object.assign(new Error('Unsupported cloud model provider'), { statusCode: 400, code: 'UNSUPPORTED_PROVIDER' });
  }

  private async googleGemma(request: CloudModelRequest): Promise<CloudModelResponse> {
    const apiKey = process.env.GOOGLE_GEMMA_API_KEY;
    if (!apiKey) throw Object.assign(new Error('Google Gemma provider is not configured'), { statusCode: 503, code: 'PROVIDER_NOT_CONFIGURED' });
    const model = request.model || GEMMA_MODELS[0];
    if (!(GEMMA_MODELS as readonly string[]).includes(model)) {
      throw Object.assign(new Error('Model is not in the supported Gemma allowlist'), { statusCode: 400, code: 'MODEL_NOT_ALLOWED' });
    }
    const system = request.messages.find((m) => m.role === 'system')?.content;
    const contents = request.messages.filter((m) => m.role !== 'system').map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));
    if (!contents.length) throw Object.assign(new Error('At least one user or assistant message is required'), { statusCode: 400, code: 'EMPTY_CONTENT' });
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {}),
        contents,
        generationConfig: {
          ...(request.temperature !== undefined ? { temperature: request.temperature } : {}),
          ...(request.maxTokens !== undefined ? { maxOutputTokens: request.maxTokens } : {}),
        },
      },
      { params: { key: apiKey }, timeout: 120000 },
    );
    const content = (response.data?.candidates?.[0]?.content?.parts || [])
      .map((part: { text?: string }) => part.text || '').join('');
    if (!content) throw new Error('Google Gemma returned an empty response');
    return { provider: 'google-gemma', model, content };
  }

  private async nvidia(request: CloudModelRequest): Promise<CloudModelResponse> {
    const apiKey = process.env.NVIDIA_API_KEY;
    if (!apiKey) throw Object.assign(new Error('NVIDIA provider is not configured'), { statusCode: 503, code: 'PROVIDER_NOT_CONFIGURED' });
    const model = request.model || NVIDIA_DEFAULT_MODEL;
    if (model !== NVIDIA_DEFAULT_MODEL) {
      throw Object.assign(new Error('Model is not in the supported NVIDIA allowlist'), { statusCode: 400, code: 'MODEL_NOT_ALLOWED' });
    }
    const response = await axios.post(
      'https://integrate.api.nvidia.com/v1/chat/completions',
      {
        model,
        messages: request.messages,
        ...(request.temperature !== undefined ? { temperature: request.temperature } : {}),
        max_tokens: request.maxTokens ?? 2048,
      },
      { headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' }, timeout: 120000 },
    );
    const content = response.data?.choices?.[0]?.message?.content;
    if (typeof content !== 'string' || !content.trim()) throw new Error('NVIDIA returned an empty response');
    return { provider: 'nvidia', model, content };
  }
}

export default new CloudModelService();
