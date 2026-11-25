import logger from '../utils/logger';
import { AgnesProvider } from './agnes/AgnesProvider';
import { GeminiProvider } from './gemini/GeminiProvider';
import { NvidiaNimProvider } from './nvidia/NvidiaNimProvider';
import { ProviderPool } from './ProviderPool';
import { OpenCodeFreeProvider } from './opencode/OpenCodeFreeProvider';
import { OpenCodeZenProvider } from './opencode/OpenCodeZenProvider';
import { OpenCodeACPProvider } from './opencode/OpenCodeACPProvider';
import { IProvider } from './interfaces/IProvider';

class ProviderRegistry {
  private providers = new Map<string, IProvider>();

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
        const credentialsValid = await provider.validateCredentials();
        if (credentialsValid) {
          this.providers.set('agnes', provider);
          logger.info('[ProviderRegistry] Agnes provider initialized successfully');
        } else {
          logger.warn('[ProviderRegistry] Agnes provider credentials validation failed');
        }
      }

      // Gemini is the first hosted text route in SINA's default Pool policy.
      if (process.env.GEMINI_ENABLED === 'true') {
        try {
          const gemini = new GeminiProvider();
          await gemini.initialize({
            name: 'gemini',
            apiKey: process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY,
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

      if (process.env.NVIDIA_NIM_ENABLED === 'true') {
        const billingMode = String(process.env.NVIDIA_NIM_BILLING_MODE || 'unknown').toLowerCase();
        // NVIDIA_NIM_ALLOW_PAID is the canonical explicit opt-in. Keep the
        // older *_ALLOW_PAID_USAGE name as a backward-compatible alias.
        const allowPaidUsage =
          process.env.NVIDIA_NIM_ALLOW_PAID === 'true' ||
          process.env.NVIDIA_NIM_ALLOW_PAID_USAGE === 'true';
        const billingAllowed = billingMode === 'free' || (billingMode === 'paid' && allowPaidUsage);

        if (!billingAllowed) {
          logger.warn('[ProviderRegistry] NVIDIA NIM skipped: verify free entitlement before setting billing mode to free; paid usage requires explicit opt-in');
        } else {
          try {
            const nvidia = new NvidiaNimProvider();
            await nvidia.initialize({
              name: 'nvidia-nim',
              apiKey: process.env.NVIDIA_NIM_API_KEY || process.env.NVIDIA_API_KEY,
              apiUrl: process.env.NVIDIA_NIM_BASE_URL || 'https://integrate.api.nvidia.com/v1',
              timeout: Number(process.env.NVIDIA_NIM_TIMEOUT || 120000),
              models: { text: process.env.NVIDIA_NIM_DEFAULT_MODEL || 'openai/gpt-oss-20b' },
            });
            if (await nvidia.validateCredentials()) {
              this.providers.set('nvidia-nim', nvidia);
              logger.info('[ProviderRegistry] NVIDIA NIM provider initialized successfully');
            } else {
              logger.warn('[ProviderRegistry] NVIDIA NIM health check failed; continuing without NVIDIA NIM');
            }
          } catch (error) {
            logger.error('[ProviderRegistry] NVIDIA NIM initialization failed; continuing without NVIDIA NIM', {
              message: error instanceof Error ? error.message : 'Unknown error',
            });
          }
        }
      }


      // OpenCode integrations are separate optional routes; no existing provider is replaced.
      if (process.env.OPENCODE_FREE_ENABLED === 'true') {
        try {
          const provider = new OpenCodeFreeProvider();
          await provider.initialize({
            name: 'opencode-free', timeout: Number(process.env.OPENCODE_FREE_TIMEOUT || 120000),
            models: { text: process.env.OPENCODE_FREE_MODEL || '' },
          });
          if (await provider.validateCredentials()) {
            this.providers.set('opencode-free', provider);
            logger.info('[ProviderRegistry] OpenCode Free local CLI initialized');
          } else {
            logger.warn('[ProviderRegistry] OpenCode Free CLI unavailable; continuing without it');
          }
        } catch (error) {
          logger.warn('[ProviderRegistry] OpenCode Free initialization skipped', {
            message: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      if (process.env.OPENCODE_ZEN_ENABLED === 'true') {
        try {
          const provider = new OpenCodeZenProvider();
          await provider.initialize({
            name: 'opencode-zen', apiKey: process.env.OPENCODE_ZEN_API_KEY,
            apiUrl: process.env.OPENCODE_ZEN_BASE_URL, timeout: Number(process.env.OPENCODE_ZEN_TIMEOUT || 90000),
            models: { text: process.env.OPENCODE_ZEN_MODEL || 'minimax-m2.5-free' },
          });
          if (await provider.validateCredentials()) {
            this.providers.set('opencode-zen', provider);
            logger.info('[ProviderRegistry] OpenCode Zen initialized');
          } else {
            logger.warn('[ProviderRegistry] OpenCode Zen health check failed; continuing without it');
          }
        } catch (error) {
          logger.warn('[ProviderRegistry] OpenCode Zen initialization skipped', {
            message: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      if (process.env.OPENCODE_ACP_ENABLED === 'true') {
        try {
          const provider = new OpenCodeACPProvider();
          await provider.initialize({
            name: 'opencode-acp', timeout: Number(process.env.OPENCODE_ACP_TIMEOUT || 120000),
          });
          if (await provider.validateCredentials()) {
            this.providers.set('opencode-acp', provider);
            logger.info('[ProviderRegistry] OpenCode ACP bridge initialized');
          } else {
            logger.warn('[ProviderRegistry] OpenCode ACP command unavailable; continuing without it');
          }
        } catch (error) {
          logger.warn('[ProviderRegistry] OpenCode ACP initialization skipped', {
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

  /** Concrete text adapters stay inside the Pool Provider. */
  getAvailableProviders(): IProvider[] {
    const all = Array.from(this.providers.values());
    const textProviders = all.filter((provider) =>
      provider.capabilities.includes('text_generation') && typeof provider.generateText === 'function',
    );
    const nonTextProviders = all.filter((provider) =>
      provider.capabilities.some((capability) => capability !== 'text_generation'),
    );
    return textProviders.length
      ? [...nonTextProviders, new ProviderPool(textProviders)]
      : nonTextProviders;
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

    const status = Object.fromEntries(entries) as Record<string, { initialized: boolean; healthy: boolean }>;
    const textProviderNames = new Set(
      Array.from(this.providers.values())
        .filter((provider) => provider.capabilities.includes('text_generation') && typeof provider.generateText === 'function')
        .map((provider) => provider.name),
    );
    if (textProviderNames.size) {
      status['provider-pool'] = {
        initialized: true,
        healthy: entries.some(([name, state]) => textProviderNames.has(name) && state.healthy),
      };
    }
    return status;
  }
}

export default new ProviderRegistry();
