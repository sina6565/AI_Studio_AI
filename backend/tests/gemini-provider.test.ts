import { GeminiProvider } from '../src/providers/gemini/GeminiProvider';

describe('GeminiProvider', () => {
  it('advertises only text generation capability', () => {
    const provider = new GeminiProvider();
    expect(provider.name).toBe('gemini');
    expect(provider.capabilities).toEqual(['text_generation']);
  });

  it('requires a non-empty prompt for text generation', async () => {
    const provider = new GeminiProvider();
    const result = await provider.validateInput('text_generation', { prompt: '  ' });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Prompt is required for text generation');
  });

  it('rejects capabilities it does not implement', async () => {
    const provider = new GeminiProvider();
    const result = await provider.validateInput('image_generation', { prompt: 'a landscape' });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Gemini does not support image_generation');
  });
});
