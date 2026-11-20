import { NvidiaNimModelPool } from './NvidiaNimModelPool';
import { NvidiaNimProvider } from './NvidiaNimProvider';

describe('NvidiaNimModelPool', () => {
  it('tries the configured default model before the rest of the allowlist', async () => {
    const provider = {
      getDefaultModel: jest.fn().mockReturnValue('openai/gpt-oss-120b'),
      generateText: jest.fn().mockResolvedValue({
        id: 'result', url: '', format: 'text/plain', size: 2, text: 'ok',
      }),
    } as unknown as NvidiaNimProvider;
    const pool = new NvidiaNimModelPool(provider);

    await pool.generateText({ prompt: 'hello' });

    expect(provider.generateText).toHaveBeenCalledTimes(1);
    expect(provider.generateText).toHaveBeenCalledWith(expect.objectContaining({
      prompt: 'hello',
      model: 'openai/gpt-oss-120b',
    }));
  });

  it('tries the next model after a model-scoped 429', async () => {
    const provider = {
      getDefaultModel: jest.fn().mockReturnValue('openai/gpt-oss-20b'),
      generateText: jest.fn()
        .mockRejectedValueOnce({ statusCode: 429, code: 'MODEL_RATE_LIMITED' })
        .mockResolvedValueOnce({ id: 'result', url: '', format: 'text/plain', size: 2, text: 'ok' }),
    } as unknown as NvidiaNimProvider;
    const pool = new NvidiaNimModelPool(provider);

    await pool.generateText({ prompt: 'hello' });

    expect(provider.generateText).toHaveBeenNthCalledWith(1, expect.objectContaining({ model: 'openai/gpt-oss-20b' }));
    expect(provider.generateText).toHaveBeenNthCalledWith(2, expect.objectContaining({ model: 'meta/llama-4-maverick-17b-128e-instruct' }));
  });
});
