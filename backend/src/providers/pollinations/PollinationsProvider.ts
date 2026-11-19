import { OpenAICompatibleTextProvider } from '../compatible/OpenAICompatibleTextProvider';

export class PollinationsProvider extends OpenAICompatibleTextProvider {
  constructor() {
    super('pollinations', 'https://gen.pollinations.ai/v1', process.env.POLLINATIONS_MODEL || 'openai/gpt-4o-mini');
  }
}
