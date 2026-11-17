import { Provider, ProviderRegistry } from '../contracts';

/** Deterministic provider for tests and CI. It never performs network requests. */
export class FakeProvider implements Provider {
  readonly id = 'fake';
  readonly isLocal = true;

  async complete(_prompt: string): Promise<{ text: string; tokens: number }> {
    return {
      text: [
        'export function add(a: number, b: number): number {',
        '  return a + b;',
        '}',
        '',
      ].join('\n'),
      tokens: 24,
    };
  }
}

/** Local Ollama HTTP adapter. The base URL is the server origin, not an API path. */
export class OllamaProvider implements Provider {
  readonly id = 'ollama';
  readonly isLocal = true;
  private readonly baseUrl: string;

  constructor(
    private readonly model = 'qwen2.5-coder:7b',
    baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
  ) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
  }

  async complete(
    prompt: string,
    opts: { system?: string; maxTokens?: number } = {},
  ): Promise<{ text: string; tokens: number }> {
    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        model: this.model,
        prompt,
        ...(opts.system ? { system: opts.system } : {}),
        stream: false,
        options: { num_predict: opts.maxTokens ?? 800 },
      }),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      throw new Error(
        `Ollama request failed (${response.status}): ${detail.slice(0, 300)}`,
      );
    }

    const result = (await response.json()) as {
      response?: string;
      eval_count?: number;
    };

    if (typeof result.response !== 'string') {
      throw new Error('Ollama returned an invalid response payload');
    }

    return {
      text: result.response,
      tokens: typeof result.eval_count === 'number' ? result.eval_count : 0,
    };
  }
}

/** Ordered provider selection with an explicit local-only guard. */
export class SimpleProviderRegistry implements ProviderRegistry {
  constructor(private readonly chain: Provider[]) {}

  pick(req: { needs?: string[]; localOnly?: boolean } = {}): Provider {
    const candidates = req.localOnly
      ? this.chain.filter((provider) => provider.isLocal === true)
      : this.chain;

    const provider = candidates[0];
    if (!provider) {
      throw new Error(
        req.localOnly
          ? 'no local provider available'
          : 'no provider available',
      );
    }
    return provider;
  }
}
