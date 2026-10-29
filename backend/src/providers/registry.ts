import logger from '../utils/logger';
import { AgnesProvider } from './agnes/AgnesProvider';
import { LocalFallbackProvider } from './local/LocalFallbackProvider';
import { IProvider } from './interfaces/IProvider';

class ProviderRegistry {
  private providers = new Map<string, IProvider>();

  /**
   * Initialize all configured providers.
   *
   * If no real provider is configured, register a local fallback so the app can
   * still boot and return explicit provider-unavailable errors instead of
   * failing startup or unrelated modules.
   */
  async initializeAll(): Promise<void> {
    try {
      const agnesEnabled = process.env.AGNES_ENABLED === 'true';
      const hasAgnesKey = Boolean(process.env.AGNES_API_KEY);

      if (agnesEnabled && hasAgnesKey) {
        const provider = new AgnesProvider();
        await provider.initialize({
          name: 'agnes',
          apiKey: process.env.AGNES_API_KEY,
          apiUrl: process.env.AGNES_API_URL,
          timeout: Number(process.env.AGNES_TIMEOUT || 300000),
        });

        const credentialsValid = await provider.validateCredentials();
        if (credentialsValid) {
          this.providers.set('agnes', provider);
          logger.info('[ProviderRegistry] Agnes provider initialized successfully');
        } else {
          logger.warn('[ProviderRegistry] Agnes provider credentials validation failed');
        }
      }

      if (this.providers.size === 0) {
        const fallback = new LocalFallbackProvider();
        await fallback.initialize({ name: 'local-fallback', timeout: 5000 });
        this.providers.set('local-fallback', fallback);
        logger.warn('[ProviderRegistry] No external provider configured; local fallback provider registered');
      }
    } catch (error) {
      logger.error('[ProviderRegistry] Error during provider initialization', error);
      throw error;
    }
  }

  getAvailableProviders(): IProvider[] {
    return Array.from(this.providers.values());
  }

  getProvider(name: string): IProvider | undefined {
    return this.providers.get(name.toLowerCase());
  }

  hasProvider(name: string): boolean {
    return this.providers.has(name.toLowerCase());
  }

  register(provider: IProvider): void {
    const key = provider.name.toLowerCase();
    this.providers.set(key, provider);
    logger.info(`[ProviderRegistry] Registered provider: ${provider.name}`);
  }

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
