jest.mock('axios', () => ({
  __esModule: true,
  default: { create: jest.fn() },
}));

import axios from 'axios';
import { OpenRouterProvider } from '../src/providers/openrouter/OpenRouterProvider';

const mockedCreate = axios.create as unknown as jest.Mock;

describe('OpenRouterProvider', () => {
  let post: jest.Mock;
  let get: jest.Mock;
  let provider: OpenRouterProvider;

  beforeEach(async () => {
    post = jest.fn();
    get = jest.fn(async () => ({ status: 200, data: { data: [] } }));
    mockedCreate.mockReset();
    mockedCreate.mockReturnValue({ post, get });
    provider = new OpenRouterProvider();
    await provider.initialize({
      name: 'openrouter',
      apiKey: 'test-key',
      apiUrl: 'https://openrouter.test/api/v1',
      timeout: 5000,
      models: { text: 'openrouter/free' },
    });
  });

  it('uses the OpenAI-compatible chat completions endpoint', async () => {
    post.mockResolvedValue({
      data: {
        id: 'chat-1',
        model: 'openrouter/free',
        choices: [{ message: { content: 'Hello from SINA' }, finish_reason: 'stop' }],
        usage: { total_tokens: 10 },
      },
    });

    const result = await provider.generateText({ prompt: 'Say hello' });
    expect(post).toHaveBeenCalledWith('/chat/completions', expect.objectContaining({
      model: 'openrouter/free',
      messages: [{ role: 'user', content: 'Say hello' }],
    }));
    expect(result.metadata?.content).toBe('Hello from SINA');
  });

  it('exposes only text generation capability', () => {
    expect(provider.capabilities).toEqual(['text_generation']);
  });

  it('rejects empty prompts', async () => {
    await expect(provider.generateText({ prompt: ' ' })).rejects.toThrow('Prompt is required');
  });

  it('checks credentials against the models endpoint', async () => {
    expect(await provider.validateCredentials()).toBe(true);
    expect(get).toHaveBeenCalledWith('/models');
  });
});
