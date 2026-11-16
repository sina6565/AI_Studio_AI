import logger from '../utils/logger';
import { AgnesProvider } from './agnes/AgnesProvider';
import { GeminiProvider } from './gemini/GeminiProvider';
import { IProvider } from './interfaces/IProvider';

class ProviderRegistry {
  private providers = new Map<string, IProvider>();

  async initializeAll(): Promise<void> {
    const configuredProviders: Array<{ name: string; enabled: boolean; provider: IProvider; config: Parameters<IProvider['initialize']>[0] }> = [
      {
        name: 'agnes',
        enabled: process.env.AGNES_ENABLED === 'true',
        provider: new AgnesProvider(),
        config: {
          name: 'agnes',
          apiKey: process.env.AGNES_API_KEY,
          apiUrl: process.env.AGNES_API_URL,
          timeout: Number(process.env.AGNES_TIMEOUT || 300000),
        },
      },
      {
        name: 'gemini',
        enabled: process.env.GEMINI_ENABLED === 'true',
        provider: new GeminiProvider(),
        config: {
          name: 'gemini',
          apiKey: process.env.GOOGLE_API_KEY,
          apiUrl: process.env.GEMINI_API_URL,
          timeout: Number(process.env.GEMINI_TIMEOUT || 30000),
          models: { text: process.env.GEMINI_MODEL || 'gemini-2.5-flash' },
        },
      },
    ];

    for (const entry of configuredProviders) {
      if (!entry.enabled) continue;
      try {
        await entry.provider.initialize(entry.config);
        const valid = await entry.provider.validateCredentials();
        if (valid) {
          this.providers.set(entry.name, entry.provider);
          logger.info(`[ProviderRegistry] ${entry.name} provider initialized successfully`);
        } else {
          logger.warn(`[ProviderRegistry] ${entry.name} provider credentials validation failed`);
        }
      } catch (error) {
        // An optional provider must never prevent the backend from starting.
        logger.error(`[ProviderRegistry] ${entry.name} provider initialization failed; continuing without it`, error);
      }
    }

    if (this.providers.size === 0) {
      logger.warn('[ProviderRegistry] No providers were successfully initialized');
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
      status[name] = { initialized: true };
      provider.healthCheck().then((healthy) => {
        status[name] = { initialized: true, healthy };
      }).catch(() => {
        status[name] = { initialized: true, healthy: false };
      });
    }
    return status;
  }
}

export default new ProviderRegistry();
