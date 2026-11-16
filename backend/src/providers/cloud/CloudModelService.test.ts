import axios from 'axios';
import cloudModelService from './CloudModelService';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('CloudModelService', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetAllMocks();
    process.env = { ...originalEnv, GOOGLE_GEMMA_API_KEY: 'test-google-key', NVIDIA_API_KEY: 'test-nvidia-key' };
  });

  afterAll(() => { process.env = originalEnv; });

  it('lists both hosted Gemma models and NVIDIA Lightning without downloading weights', () => {
    const models = cloudModelService.listModels();
    expect(models.map((m) => m.id)).toContain('gemma-4-26b-a4b-it');
    expect(models.map((m) => m.id)).toContain('gemma-4-31b-it');
    expect(models.some((m) => m.provider === 'nvidia' && m.configured)).toBe(true);
  });

  it('calls hosted Gemma API and extracts generated text', async () => {
    mockedAxios.post.mockResolvedValueOnce({ data: { candidates: [{ content: { parts: [{ text: 'سلام' }] } }] } } as any);
    const result = await cloudModelService.chat({
      provider: 'google-gemma', model: 'gemma-4-26b-a4b-it',
      messages: [{ role: 'user', content: 'سلام' }],
    });
    expect(result.content).toBe('سلام');
    expect(mockedAxios.post).toHaveBeenCalledWith(
      expect.stringContaining('/models/gemma-4-26b-a4b-it:generateContent'),
      expect.objectContaining({ contents: expect.any(Array) }),
      expect.objectContaining({ params: { key: 'test-google-key' } }),
    );
  });

  it('calls NVIDIA OpenAI-compatible hosted endpoint', async () => {
    mockedAxios.post.mockResolvedValueOnce({ data: { choices: [{ message: { content: 'Hello' } }] } } as any);
    const result = await cloudModelService.chat({
      provider: 'nvidia', messages: [{ role: 'user', content: 'Hello' }],
    });
    expect(result.content).toBe('Hello');
    expect(mockedAxios.post).toHaveBeenCalledWith(
      'https://integrate.api.nvidia.com/v1/chat/completions',
      expect.objectContaining({ model: 'nvidia/nemotron-3.5-lightning-30b-a3b' }),
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer test-nvidia-key' }) }),
    );
  });

  it('rejects model IDs outside the allowlist', async () => {
    await expect(cloudModelService.chat({
      provider: 'google-gemma', model: 'untrusted-model',
      messages: [{ role: 'user', content: 'hello' }],
    })).rejects.toMatchObject({ code: 'MODEL_NOT_ALLOWED' });
  });
});
