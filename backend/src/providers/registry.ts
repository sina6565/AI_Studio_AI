import logger from '../utils/logger';
import { AgnesProvider } from './agnes/AgnesProvider';
import { GeminiProvider } from './gemini/GeminiProvider';
import { HuggingFaceProvider } from './huggingface/HuggingFaceProvider';
import { OpenRouterProvider } from './openrouter/OpenRouterProvider';
import { PollinationsProvider } from './pollinations/PollinationsProvider';
import { TogetherProvider } from './together/TogetherProvider';
import { IProvider, ProviderConfig } from './interfaces/IProvider';

class ProviderRegistry {
  private providers = new Map<string, IProvider>();

  private async initializeOptional(
    key: string,
    provider: IProvider,
    config: ProviderConfig,
  ): Promise<void> {
    try {
      await provider.initialize(config);
      if (await provider.validateCredentials()) {
        this.providers.set(key, provider);
        logger.info(`[ProviderRegistry] ${key} provider initialized successfully`);
      } else {
        logger.warn(`[ProviderRegistry] ${key} credentials validation failed; provider not registered`);
      }
    } catch (error) {
      // An unavailable optional upstream must never prevent the platform from starting.
      logger.warn(`[ProviderRegistry] ${key} initialization failed; continuing without it`, {
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async initializeAll(): Promise<void> {
    this.providers.clear();

    if (process.env.AGNES_ENABLED === 'true') {
      await this.initializeOptional('agnes', new AgnesProvider(), {
        name: 'agnes',
        apiKey: process.env.AGNES_API_KEY,
        apiUrl: process.env.AGNES_API_URL,
        timeout: Number(process.env.AGNES_TIMEOUT || 300000),
      });
    }

    if (process.env.GEMINI_ENABLED === 'true') {
      await this.initializeOptional('gemini', new GeminiProvider(), {
        name: 'gemini',
        apiKey: process.env.GOOGLE_API_KEY,
        apiUrl: process.env.GEMINI_API_URL,
        timeout: Number(process.env.GEMINI_TIMEOUT || 30000),
        models: { text: process.env.GEMINI_MODEL || 'gemini-2.5-flash' },
      });
    }

    const compatibleProviders: Array<{
      key: string;
      enabled: string | undefined;
      provider: IProvider;
      apiKey: string | undefined;
      apiUrl: string | undefined;
      model: string | undefined;
    }> = [
      { key: 'openrouter', enabled: process.env.OPENROUTER_ENABLED, provider: new OpenRouterProvider(), apiKey: process.env.OPENROUTER_API_KEY, apiUrl: process.env.OPENROUTER_API_URL, model: process.env.OPENROUTER_MODEL || 'openrouter/auto' },
      { key: 'together', enabled: process.env.TOGETHER_ENABLED, provider: new TogetherProvider(), apiKey: process.env.TOGETHER_API_KEY, apiUrl: process.env.TOGETHER_API_URL, model: process.env.TOGETHER_MODEL },
      { key: 'pollinations', enabled: process.env.POLLINATIONS_ENABLED, provider: new PollinationsProvider(), apiKey: process.env.POLLINATIONS_API_KEY, apiUrl: process.env.POLLINATIONS_API_URL, model: process.env.POLLINATIONS_MODEL },
      { key: 'huggingface', enabled: process.env.HUGGINGFACE_ENABLED, provider: new HuggingFaceProvider(), apiKey: process.env.HUGGINGFACE_API_KEY, apiUrl: process.env.HUGGINGFACE_API_URL, model: process.env.HUGGINGFACE_MODEL },
    ];

    for (const item of compatibleProviders) {
      if (item.enabled !== 'true') continue;
      await this.initializeOptional(item.key, item.provider, {
        name: item.key,
        apiKey: item.apiKey,
        apiUrl: item.apiUrl,
        timeout: 30000,
        models: { text: item.model || '' },
      });
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
      void provider.healthCheck().then((healthy) => {
        status[name] = { initialized: true, healthy };
      }).catch(() => {
        status[name] = { initialized: true, healthy: false };
      });
    }
    return status;
  }
}

export default new ProviderRegistry();
