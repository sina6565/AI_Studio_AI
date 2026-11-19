import { OpenAICompatibleTextProvider } from '../compatible/OpenAICompatibleTextProvider';

export class TogetherProvider extends OpenAICompatibleTextProvider {
  constructor() {
    super('together', 'https://api.together.xyz/v1', process.env.TOGETHER_MODEL || '');
  }
}
