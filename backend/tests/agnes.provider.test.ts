/**
 * Agnes provider tests.
 *
 * These verify request construction and error propagation without requiring
 * real Agnes credentials: the axios client is mocked.
 */

jest.mock('../src/utils/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

jest.mock('axios', () => ({
  __esModule: true,
  default: { create: jest.fn() },
}));

import axios from 'axios';
import logger from '../src/utils/logger';
import { AgnesProvider } from '../src/providers/agnes/AgnesProvider';

const mockedCreate = axios.create as unknown as jest.Mock;

describe('AgnesProvider', () => {
  let post: jest.Mock;
  let get: jest.Mock;
  let provider: AgnesProvider;

  beforeEach(async () => {
    post = jest.fn();
    get = jest.fn(async () => ({ data: { status: 'ok' } }));
    mockedCreate.mockReset();
    mockedCreate.mockReturnValue({ post, get });

    provider = new AgnesProvider();
    await provider.initialize({
      name: 'agnes',
      apiKey: 'test-key',
      apiUrl: 'https://agnes.test',
      timeout: 5000,
    });
  });

  it('configures an axios client with the provider base URL', () => {
    // axios.create() is called once at construction and again in initialize();
    // the initialize() call is the one that must carry the provider config.
    const calls = mockedCreate.mock.calls;
    const options = calls[calls.length - 1][0];
    expect(options.baseURL).toBe('https://agnes.test');
    expect(options.timeout).toBe(5000);
  });

  it('posts an image generation request and returns the generated content', async () => {
    post.mockResolvedValue({
      data: { id: 'img-1', url: 'https://cdn.test/img-1.png', format: 'png' },
    });

    const result = await provider.generateImage({ prompt: 'a cat' });

    expect(post).toHaveBeenCalledTimes(1);
    expect(post.mock.calls[0][0]).toBe('/generate/image');
    expect(post.mock.calls[0][1]).toEqual(expect.objectContaining({ prompt: 'a cat' }));
    expect(result.id).toBe('img-1');
    expect(result.url).toBe('https://cdn.test/img-1.png');
  });

  it('propagates a sanitized provider error without logging Axios authorization headers', async () => {
    const secret = 'test-agnes-secret';
    const axiosError = Object.assign(new Error('agnes unavailable'), {
      config: { headers: { Authorization: `Bearer ${secret}` } },
    });
    post.mockRejectedValue(axiosError);
    (logger.error as jest.Mock).mockClear();

    await expect(provider.generateImage({ prompt: 'x' })).rejects.toThrow('agnes unavailable');

    expect(logger.error).toHaveBeenCalledWith('Agnes image generation failed: agnes unavailable');
    expect(JSON.stringify((logger.error as jest.Mock).mock.calls)).not.toContain(secret);
  });
});
