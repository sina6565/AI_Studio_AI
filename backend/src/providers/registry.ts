import logger from '../utils/logger';
import { AgnesProvider } from './agnes/AgnesProvider';
import { OpenRouterProvider } from './openrouter/OpenRouterProvider';
import { BytePlusSeedanceProvider } from './byteplus/BytePlusSeedanceProvider';
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

      if (process.env.OPENROUTER_API_KEY && process.env.OPENROUTER_ENABLED !== 'false') {
        const openrouter = new OpenRouterProvider();
        await openrouter.initialize({
          name: 'openrouter',
          apiKey: process.env.OPENROUTER_API_KEY,
          apiUrl: process.env.OPENROUTER_API_URL || 'https://openrouter.ai/api/v1',
          timeout: Number(process.env.OPENROUTER_TIMEOUT || 180000),
          models: { text: process.env.OPENROUTER_MODEL || 'openrouter/auto' },
        });
        if (await openrouter.validateCredentials()) {
          this.providers.set('openrouter', openrouter);
          logger.info('[ProviderRegistry] OpenRouter multimodal provider initialized');
        } else {
          logger.warn('[ProviderRegistry] OpenRouter key validation failed; provider not registered');
        }
      }

      if (process.env.BYTEPLUS_SEEDANCE_ENABLED === 'true' && process.env.BYTEPLUS_SEEDANCE_API_KEY) {
        const seedance = new BytePlusSeedanceProvider();
        await seedance.initialize({
          name: 'byteplus-seedance',
          apiKey: process.env.BYTEPLUS_SEEDANCE_API_KEY,
          apiUrl: process.env.BYTEPLUS_MODELARK_API_URL || 'https://ark.ap-southeast.bytepluses.com/api/v3',
          timeout: Number(process.env.BYTEPLUS_SEEDANCE_TIMEOUT || 180000),
          models: { video: process.env.BYTEPLUS_SEEDANCE_MODEL || 'dreamina-seedance-2-0-260128' },
        });
        // No billable request is sent during startup; healthCheck only confirms key configuration.
        if (await seedance.validateCredentials()) {
          this.providers.set('byteplus-seedance', seedance);
          logger.info('[ProviderRegistry] BytePlus Seedance provider configured (generation remains cost-gated)');
        }
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
