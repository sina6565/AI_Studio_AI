import { OpenAICompatibleTextProvider } from '../compatible/OpenAICompatibleTextProvider';

export class OpenRouterProvider extends OpenAICompatibleTextProvider {
  constructor() {
    super(
      'openrouter',
      'https://openrouter.ai/api/v1',
      process.env.OPENROUTER_MODEL || 'openrouter/auto',
      {
        ...(process.env.OPENROUTER_HTTP_REFERER ? { 'HTTP-Referer': process.env.OPENROUTER_HTTP_REFERER } : {}),
        ...(process.env.OPENROUTER_APP_TITLE ? { 'X-Title': process.env.OPENROUTER_APP_TITLE } : {}),
      },
    );
  }
}
