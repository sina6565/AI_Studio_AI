import logger from '../utils/logger';
import { AgnesProvider } from './agnes/AgnesProvider';
import { OllamaProvider } from './OllamaProvider';
import { IProvider } from './interfaces/IProvider';

class ProviderRegistry {
  private providers = new Map<string, IProvider>();

  /** Initialize optional providers independently so one unavailable provider never blocks another. */
  async initializeAll(): Promise<void> {
    if (process.env.AGNES_ENABLED === 'true') {
      try {
        const provider = new AgnesProvider();
        await provider.initialize({
          name: 'agnes',
          apiKey: process.env.AGNES_API_KEY,
          apiUrl: process.env.AGNES_API_URL,
          timeout: Number(process.env.AGNES_TIMEOUT || 300000),
        });
        if (await provider.validateCredentials()) {
          this.providers.set('agnes', provider);
          logger.info('[ProviderRegistry] Agnes provider initialized successfully');
        } else {
          logger.warn('[ProviderRegistry] Agnes provider credentials or health check failed');
        }
      } catch (error) {
        logger.warn('[ProviderRegistry] Agnes initialization skipped; other providers will continue', error);
      }
    }

    if (process.env.OLLAMA_ENABLED === 'true') {
      try {
        const provider = new OllamaProvider();
        await provider.initialize({
          name: 'ollama',
          apiUrl: process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434',
          timeout: Number(process.env.OLLAMA_TIMEOUT || 120000),
          models: { text_generation: process.env.OLLAMA_MODEL || 'qwen2.5:7b' },
        });
        if (await provider.validateCredentials()) {
          this.providers.set('ollama', provider);
          logger.info('[ProviderRegistry] Local Ollama text provider initialized successfully');
        } else {
          logger.warn('[ProviderRegistry] Ollama is enabled but the local server/model is unavailable; deterministic fallbacks remain active');
        }
      } catch (error) {
        logger.warn('[ProviderRegistry] Ollama initialization skipped; deterministic fallbacks remain active', error);
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
