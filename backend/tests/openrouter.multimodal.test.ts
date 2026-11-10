jest.mock('axios', () => ({ __esModule: true, default: { create: jest.fn() } }));
import axios from 'axios';
import { OpenRouterProvider } from '../src/providers/openrouter/OpenRouterProvider';

describe('OpenRouterProvider multimodal adapter', () => {
  const create = axios.create as unknown as jest.Mock;
  let get: jest.Mock, post: jest.Mock, provider: OpenRouterProvider;
  beforeEach(async () => {
    get = jest.fn().mockResolvedValue({ status: 200, data: { data: [] } });
    post = jest.fn();
    create.mockReset();
    create.mockReturnValue({ get, post });
    provider = new OpenRouterProvider();
    await provider.initialize({ name: 'openrouter', apiKey: 'test', timeout: 1000 });
  });
  it('discovers all model modalities', async () => {
    get.mockResolvedValueOnce({ status: 200, data: { data: [{ id: 'model-x' }] } });
    await expect(provider.listModels()).resolves.toEqual([{ id: 'model-x' }]);
    expect(get).toHaveBeenCalledWith('/models', { params: { output_modalities: 'all' } });
  });
  it('generates images using the unified images endpoint', async () => {
    post.mockResolvedValue({ data: { data: [{ b64_json: Buffer.from('png').toString('base64'), media_type: 'image/png' }] } });
    const result = await provider.generateImage({ prompt: 'a star', model: 'image-model' });
    expect(post).toHaveBeenCalledWith('/images', expect.objectContaining({ model: 'image-model', prompt: 'a star' }));
    expect(result.format).toBe('image/png');
  });
  it('sends chat completions for text', async () => {
    post.mockResolvedValue({ data: { id: 'x', model: 'text-model', choices: [{ message: { content: 'ok' } }] } });
    const result = await provider.generateText({ prompt: 'hello', model: 'text-model' });
    expect(result.metadata?.content).toBe('ok');
  });
});
