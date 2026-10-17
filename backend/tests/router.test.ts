/**
 * Provider routing tests.
 *
 * The router decides which provider runs a job. These tests pin the selection
 * rules and — importantly — that an unroutable request produces a *typed* error
 * the API layer can map, rather than a bare Error that becomes a masked 500.
 */

import { Router } from '../src/routing/Router';
import { AppError } from '../src/types/errors';
import { JobType, ProviderCapability } from '../src/types';
import type { RoutingContext } from '../src/types';
import type { IProvider } from '../src/providers/interfaces/IProvider';

function makeProvider(
  name: string,
  capabilities: string[],
  healthy: boolean | (() => Promise<boolean>) = true,
): IProvider {
  const healthCheck =
    typeof healthy === 'function'
      ? jest.fn(healthy)
      : healthy
        ? jest.fn(async () => true)
        : jest.fn(async () => {
            throw new Error('health check unreachable');
          });

  return {
    name,
    capabilities,
    healthCheck,
  } as unknown as IProvider;
}

const IMAGE = ProviderCapability.IMAGE_GENERATION;
const VIDEO = ProviderCapability.VIDEO_GENERATION;

const context = (
  capabilities: ProviderCapability[],
  defaultProvider?: string,
): RoutingContext => ({
  jobType: JobType.IMAGE_GENERATION,
  capabilities,
  userPreferences: defaultProvider
    ? {
        language: 'en',
        theme: 'light',
        defaultProvider,
        notificationsEnabled: true,
      }
    : undefined,
});

describe('Router', () => {
  let router: Router;

  beforeEach(() => {
    router = new Router();
  });

  describe('capability filtering', () => {
    it('selects the only provider that advertises the capability', async () => {
      const image = makeProvider('image-only', [IMAGE]);
      const video = makeProvider('video-only', [VIDEO]);

      const decision = await router.route(IMAGE, [image, video]);

      expect(decision.providerName).toBe('image-only');
      expect(decision.reasoning).toMatch(/only available/i);
    });

    it('never selects a provider that lacks the capability', async () => {
      const video = makeProvider('video-only', [VIDEO]);

      await expect(router.route(IMAGE, [video])).rejects.toThrow(
        /no provider available/i,
      );
      expect(video.healthCheck).not.toHaveBeenCalled();
    });

    it('rejects with a typed error when no provider is capable', async () => {
      const video = makeProvider('video-only', [VIDEO]);

      await expect(router.route(IMAGE, [video])).rejects.toBeInstanceOf(AppError);

      await router.route(IMAGE, [video]).catch((error: AppError) => {
        expect(error.code).toBe('NO_PROVIDER_AVAILABLE');
        expect(error.statusCode).toBe(503);
        expect(error.message).toContain(IMAGE);
      });
    });

    it('rejects with a typed error when there are no providers at all', async () => {
      await expect(router.route(IMAGE, [])).rejects.toMatchObject({
        code: 'NO_PROVIDER_AVAILABLE',
        statusCode: 503,
      });
    });
  });

  describe('selection among several capable providers', () => {
    it('honours the user preference and lists the others as fallbacks', async () => {
      const first = makeProvider('provider-a', [IMAGE]);
      const second = makeProvider('provider-b', [IMAGE]);

      const decision = await router.route(
        IMAGE,
        [first, second],
        context([IMAGE], 'provider-b'),
      );

      expect(decision.providerName).toBe('provider-b');
      expect(decision.reasoning).toMatch(/preference/i);
      expect(decision.fallbackProviders).toEqual(['provider-a']);
    });

    it('ignores a preference that is not capable of the job', async () => {
      const image = makeProvider('image-only', [IMAGE]);
      const video = makeProvider('video-only', [VIDEO]);

      const decision = await router.route(
        IMAGE,
        [image, video],
        context([IMAGE], 'video-only'),
      );

      expect(decision.providerName).toBe('image-only');
    });

    it('prefers a healthy provider over an unhealthy one', async () => {
      const healthy = makeProvider('healthy', [IMAGE]);
      const unhealthy = makeProvider('unhealthy', [IMAGE], false);

      const decision = await router.route(IMAGE, [unhealthy, healthy]);

      expect(decision.providerName).toBe('healthy');
    });

    it('falls back to capable providers when every health check fails', async () => {
      const first = makeProvider('down-a', [IMAGE], false);
      const second = makeProvider('down-b', [IMAGE], false);

      const decision = await router.route(IMAGE, [first, second]);

      // Both are unhealthy, but a capable provider is still better than none.
      expect(['down-a', 'down-b']).toContain(decision.providerName);
      expect(decision.fallbackProviders).toHaveLength(1);
    });

    it('treats a throwing health check as unhealthy rather than failing the route', async () => {
      const broken = makeProvider('broken', [IMAGE], async () => {
        throw new Error('boom');
      });
      const working = makeProvider('working', [IMAGE]);

      const decision = await router.route(IMAGE, [broken, working]);

      expect(decision.providerName).toBe('working');
    });
  });
});
