import { Router } from '../src/routing/Router';
import { AppError } from '../src/types/errors';
import type { IProvider } from '../src/providers/interfaces/IProvider';

const provider = (name: string, capabilities: string[], healthy = true) => ({
  name,
  capabilities,
  healthCheck: jest.fn(async () => healthy),
}) as unknown as IProvider;

describe('Router', () => {
  it('selects the only provider advertising the requested capability', async () => {
    const image = provider('image-provider', ['image_generation']);
    const video = provider('video-provider', ['video_generation']);
    const decision = await new Router().route('image_generation', [image, video]);

    expect(decision.providerName).toBe('image-provider');
    expect(image.healthCheck).not.toHaveBeenCalled();
    expect(video.healthCheck).not.toHaveBeenCalled();
  });

  it('prefers a healthy provider when multiple providers support a capability', async () => {
    const unhealthy = provider('first', ['image_generation'], false);
    const healthy = provider('second', ['image_generation'], true);
    const decision = await new Router().route('image_generation', [unhealthy, healthy]);

    expect(decision.providerName).toBe('second');
  });

  it('throws a typed 503 error when no provider supports the capability', async () => {
    try {
      await new Router().route('asset_3d_generation', [provider('images', ['image_generation'])]);
      throw new Error('Expected routing to reject unsupported capability');
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect(error).toMatchObject({
        code: 'NO_PROVIDER_AVAILABLE',
        statusCode: 503,
        message: 'No provider available for asset_3d_generation',
      });
    }
  });
});
