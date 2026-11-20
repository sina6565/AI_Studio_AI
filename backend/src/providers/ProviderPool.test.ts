import { ProviderPool } from './ProviderPool';
import { IProvider, GeneratedContent } from './interfaces/IProvider';

const output = (text: string): GeneratedContent => ({
  id: text, url: '', format: 'text/plain', size: text.length, text,
});

function mockProvider(name: string, generateText: jest.Mock): IProvider {
  return {
    name,
    capabilities: ['text_generation'],
    initialize: jest.fn(),
    generateImage: jest.fn(),
    generateVideo: jest.fn(),
    generateAudio: jest.fn(),
    synthesizeSpeech: jest.fn(),
    generateText,
    healthCheck: jest.fn().mockResolvedValue(true),
    getRateLimit: jest.fn().mockResolvedValue({ remaining: 0, resetTime: 0, limit: 0 }),
    validateInput: jest.fn().mockResolvedValue({ valid: true }),
    validateCredentials: jest.fn().mockResolvedValue(true),
  };
}

describe('ProviderPool', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv, TEXT_PROVIDER_FALLBACK_ORDER: 'gemini,nvidia-nim', PROVIDER_POOL_MAX_ATTEMPTS: '3' };
  });

  afterAll(() => { process.env = originalEnv; });

  it('falls back from Gemini quota exhaustion to NVIDIA NIM', async () => {
    const gemini = mockProvider('gemini', jest.fn().mockRejectedValue({
      response: { status: 429 }, code: 'ERR_BAD_REQUEST',
    }));
    const nvidia = mockProvider('nvidia-nim', jest.fn().mockResolvedValue(output('NIM answer')));
    const pool = new ProviderPool([nvidia, gemini]);

    const result = await pool.generateText({ prompt: 'hello' });

    expect(gemini.generateText).toHaveBeenCalledTimes(1);
    expect(nvidia.generateText).toHaveBeenCalledTimes(1);
    expect(result.text).toBe('NIM answer');
    expect(result.metadata?.providerPool).toMatchObject({ selectedProvider: 'nvidia-nim' });
  });

  it('does not fallback on authentication failures', async () => {
    const gemini = mockProvider('gemini', jest.fn().mockRejectedValue({
      response: { status: 401 }, code: 'ERR_BAD_REQUEST',
    }));
    const nvidia = mockProvider('nvidia-nim', jest.fn().mockResolvedValue(output('must not run')));
    const pool = new ProviderPool([gemini, nvidia]);

    await expect(pool.generateText({ prompt: 'hello' })).rejects.toMatchObject({ response: { status: 401 } });
    expect(nvidia.generateText).not.toHaveBeenCalled();
  });

  it('does not fallback for invalid prompts', async () => {
    const gemini = mockProvider('gemini', jest.fn());
    const nvidia = mockProvider('nvidia-nim', jest.fn());
    const pool = new ProviderPool([gemini, nvidia]);

    await expect(pool.generateText({ prompt: '   ' })).rejects.toMatchObject({ code: 'INVALID_INPUT' });
    expect(gemini.generateText).not.toHaveBeenCalled();
    expect(nvidia.generateText).not.toHaveBeenCalled();
  });

  it('respects the configured provider order regardless of registration order', async () => {
    const gemini = mockProvider('gemini', jest.fn().mockResolvedValue(output('Gemini answer')));
    const nvidia = mockProvider('nvidia-nim', jest.fn().mockResolvedValue(output('NIM answer')));
    const pool = new ProviderPool([nvidia, gemini]);

    const result = await pool.generateText({ prompt: 'hello' });

    expect(gemini.generateText).toHaveBeenCalledTimes(1);
    expect(nvidia.generateText).not.toHaveBeenCalled();
    expect(result.text).toBe('Gemini answer');
  });
});
