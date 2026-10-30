import logger from '../utils/logger';
import config from '../config';
import { AgnesProvider } from './agnes/AgnesProvider';
import { IProvider } from './interfaces/IProvider';

class ProviderRegistry {
  private providers = new Map<string, IProvider>();

  /**
   * Initialize all configured providers.
   *
   * Providers are optional and must never crash startup. Missing credentials
   * or an external service outage should only log a warning and disable that
   * adapter instead of failing the entire platform.
   */
  async initializeAll(): Promise<void> {
    try {
      const agnesEnabled =
        process.env.AGNES_ENABLED === 'true' ||
        (Boolean(process.env.AGNES_API_KEY || process.env.AGNES_API_URL) &&
          config.providers.agnes?.enabled !== false);

      if (agnesEnabled) {
        const provider = new AgnesProvider();
        await provider.initialize({
          name: 'agnes',
          apiKey: process.env.AGNES_API_KEY || config.providers.agnes?.apiKey || '',
          apiUrl: process.env.AGNES_API_URL || config.providers.agnes?.apiUrl || '',
          timeout: Number(process.env.AGNES_TIMEOUT || config.providers.agnes?.timeout || 300000),
        });

        const credentialsValid = await provider.validateCredentials();
        if (credentialsValid) {
          this.providers.set('agnes', provider);
          logger.info('[ProviderRegistry] Agnes provider initialized successfully');
        } else {
          logger.warn('[ProviderRegistry] Agnes provider credentials validation failed; adapter remains disabled');
        }
      } else {
        logger.info('[ProviderRegistry] Agnes adapter disabled by configuration');
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
        provider.healthCheck().then((healthy) => {
          status[name] = { initialized: true, healthy };
        }).catch(() => {
          status[name] = { initialized: true, healthy: false };
        });

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
