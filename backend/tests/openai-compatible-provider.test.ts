import { OpenAICompatibleTextProvider } from '../src/providers/compatible/OpenAICompatibleTextProvider';

describe('OpenAICompatibleTextProvider', () => {
  const createProvider = () =>
    new OpenAICompatibleTextProvider('test-provider', 'https://example.invalid/v1', 'test-model');

  it('requires an API key when explicitly enabled', async () => {
    await expect(createProvider().initialize({
      name: 'test-provider',
      timeout: 1000,
      models: { text: 'test-model' },
    })).rejects.toThrow('API key is required');
  });

  it('requires an explicit model when no default is available', async () => {
    const provider = new OpenAICompatibleTextProvider(
      'test-provider',
      'https://example.invalid/v1',
      '',
    );
    await expect(provider.initialize({
      name: 'test-provider',
      apiKey: 'test-only-key',
      timeout: 1000,
    })).rejects.toThrow('text model must be configured');
  });

  it('validates text-generation inputs without network access', async () => {
    const result = await createProvider().validateInput('text_generation', { prompt: 'hello' });
    expect(result.valid).toBe(true);
    expect(result.errors).toBeUndefined();
  });

  it('rejects capabilities not implemented by the text adapter', async () => {
    const result = await createProvider().validateInput('image_generation', { prompt: 'hello' });
    expect(result.valid).toBe(false);
    expect(result.errors?.[0]).toContain('text_generation only');
  });

  it('does not pretend to implement image generation', async () => {
    await expect(createProvider().generateImage({ prompt: 'a test image' }))
      .rejects.toThrow('does not implement image generation');
  });
});
