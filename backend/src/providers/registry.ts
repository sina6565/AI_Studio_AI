import logger from '../utils/logger';
import { AgnesProvider } from './agnes/AgnesProvider';
import { HeyGenProvider } from './heygen/HeyGenProvider';
import { IProvider } from './interfaces/IProvider';

class ProviderRegistry {
  private providers = new Map<string, IProvider>();

  /**
   * Initialize all configured providers
   */
  async initializeAll(): Promise<void> {
    try {
      const provider = new AgnesProvider();
      if (process.env.AGNES_ENABLED === 'true') {
        await provider.initialize({
          name: 'agnes',
          apiKey: process.env.AGNES_API_KEY,
          apiUrl: process.env.AGNES_API_URL,
          timeout: Number(process.env.AGNES_TIMEOUT || 300000),
        });

        // Validate credentials before registering
        const credentialsValid = await provider.validateCredentials();
        if (credentialsValid) {
          this.providers.set('agnes', provider);
          logger.info('[ProviderRegistry] Agnes provider initialized successfully');
        } else {
          logger.warn('[ProviderRegistry] Agnes provider credentials validation failed');
        }
      }

      // HeyGen is an optional TTS-only provider. It is never allowed to
      // replace Agnes and is enabled only with an explicit flag and API key.
      if (
        process.env.HEYGEN_TTS_ENABLED === 'true' &&
        process.env.OPENROUTER_API_KEY
      ) {
        const heygen = new HeyGenProvider();
        await heygen.initialize({
          name: 'heygen',
          apiKey: process.env.OPENROUTER_API_KEY,
          apiUrl: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
          timeout: Number(process.env.HEYGEN_TTS_TIMEOUT || 120000),
          models: {
            tts: process.env.HEYGEN_TTS_MODEL || 'heygen/heygen-voice-1-turbo:free',
          },
        });
        this.providers.set('heygen', heygen);
        logger.info('[ProviderRegistry] HeyGen Voice Turbo provider initialized');
      } else if (process.env.HEYGEN_TTS_ENABLED === 'true') {
        logger.warn('[ProviderRegistry] HeyGen enabled but OPENROUTER_API_KEY is missing');
      }

      if (this.providers.size === 0) {
        logger.warn('[ProviderRegistry] No providers were successfully initialized');
      }
    } catch (error) {
      logger.error('[ProviderRegistry] Error during provider initialization', error);
      throw error;
    }
  }

  /**
   * Get all available providers
   */
  getAvailableProviders(): IProvider[] {
    return Array.from(this.providers.values());
  }

  /**
   * Get a specific provider by name
   */
  getProvider(name: string): IProvider | undefined {
    return this.providers.get(name.toLowerCase());
  }

  /**
   * Check if a provider exists
   */
  hasProvider(name: string): boolean {
    return this.providers.has(name.toLowerCase());
  }

  /**
   * Register a provider manually
   */
  register(provider: IProvider): void {
    const key = provider.name.toLowerCase();
    this.providers.set(key, provider);
    logger.info(`[ProviderRegistry] Registered provider: ${provider.name}`);
  }

  /**
   * Get provider status for health checks
   */
  getStatus(): Record<string, { initialized: boolean; healthy?: boolean }> {
    const status: Record<string, { initialized: boolean; healthy?: boolean }> = {};

    for (const [name, provider] of this.providers) {
      try {
        // Note: We don't await here for synchronous status check
        // Actual health check is done asynchronously in Router
        provider.healthCheck().then((healthy) => {
          status[name] = { initialized: true, healthy };
        }).catch(() => {
          status[name] = { initialized: true, healthy: false };
        });

        // Set initialized flag immediately
        if (!status[name]) {
          status[name] = { initialized: true };
        }
      } catch (error) {
        status[name] = { initialized: true, healthy: false };
      }
    }

    return status;
  }
}

export default new ProviderRegistry();
