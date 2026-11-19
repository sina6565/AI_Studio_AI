import { OpenAICompatibleTextProvider } from '../compatible/OpenAICompatibleTextProvider';

export class HuggingFaceProvider extends OpenAICompatibleTextProvider {
  constructor() {
    super('huggingface', 'https://router.huggingface.co/v1', process.env.HUGGINGFACE_MODEL || '');
  }
}
