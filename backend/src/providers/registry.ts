import logger from '../utils/logger';
import { AgnesProvider } from './agnes/AgnesProvider';
import { GeminiProvider } from './gemini/GeminiProvider';
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

      // Gemini is an optional text provider; its failure must not disable Agnes.
      if (process.env.GEMINI_ENABLED === 'true') {
        try {
          const gemini = new GeminiProvider();
          await gemini.initialize({
            name: 'gemini',
            apiKey: process.env.GOOGLE_API_KEY,
            apiUrl: process.env.GEMINI_API_URL,
            timeout: Number(process.env.GEMINI_TIMEOUT || 30000),
            models: { text: process.env.GEMINI_MODEL || 'gemini-2.5-flash' },
          });
          if (await gemini.validateCredentials()) {
            this.providers.set('gemini', gemini);
            logger.info('[ProviderRegistry] Gemini provider initialized successfully');
          } else {
            logger.warn('[ProviderRegistry] Gemini credentials validation failed');
          }
        } catch (error) {
          logger.error('[ProviderRegistry] Gemini initialization failed; continuing without Gemini', {
            message: error instanceof Error ? error.message : 'Unknown error',
          });
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
  async getStatus(): Promise<Record<string, { initialized: boolean; healthy: boolean }>> {
    const entries = await Promise.all(
      Array.from(this.providers.entries()).map(async ([name, provider]) => {
        try {
          const healthy = await provider.healthCheck();
          return [name, { initialized: true, healthy }] as const;
        } catch (error) {
          logger.warn(`[ProviderRegistry] Health check failed for ${name}`, {
            message: error instanceof Error ? error.message : 'Unknown error',
          });
          return [name, { initialized: true, healthy: false }] as const;
        }
      }),
    );

    return Object.fromEntries(entries);
  }
}

export default new ProviderRegistry();
