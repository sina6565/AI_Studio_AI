import { OllamaProvider } from '../src/providers/OllamaProvider';

describe('OllamaProvider', () => {
  const originalFetch = global.fetch;
  let provider: OllamaProvider;

  beforeEach(async () => {
    provider = new OllamaProvider();
    await provider.initialize({
      name: 'ollama',
      apiUrl: 'http://127.0.0.1:11434',
      timeout: 5000,
      models: { text_generation: 'qwen2.5:7b' },
    });
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('checks that the configured local model is installed', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ models: [{ name: 'qwen2.5:7b' }] }),
    }) as any;

    await expect(provider.validateCredentials()).resolves.toBe(true);
  });

  it('sends JSON-mode text generation to the local Ollama chat endpoint', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ message: { content: '{"name":"SINA"}' } }),
    }) as any;

    await expect(provider.generateText({
      prompt: 'Create a website brief.',
      system: 'Return JSON only.',
      format: 'json',
    })).resolves.toBe('{"name":"SINA"}');

    expect(global.fetch).toHaveBeenCalledWith(
      'http://127.0.0.1:11434/api/chat',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('"format":"json"'),
      }),
    );
  });

  it('rejects insecure non-loopback HTTP endpoints', async () => {
    await expect(provider.initialize({
      name: 'ollama',
      apiUrl: 'http://ollama.internal:11434',
      timeout: 5000,
    })).rejects.toThrow(/HTTPS or a loopback HTTP address/);
  });

  it('accepts prompt-based game builds through its text-generation capability', async () => {
    await expect(provider.validateInput('game_build', {
      prompt: 'Build a 2D adventure game with a custom map and exit.',
    })).resolves.toEqual({ valid: true });
  });

  it('does not pretend to support image generation', async () => {
    await expect(provider.generateImage({ prompt: 'a test image' })).rejects.toThrow(/does not support image generation/);
  });
});
