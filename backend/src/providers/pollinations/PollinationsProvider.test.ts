import { PollinationsProvider } from './PollinationsProvider';

describe('PollinationsProvider', () => {
  it('registers keyless text and image generation capabilities', async () => {
    const provider = new PollinationsProvider();
    await provider.initialize({ name: 'pollinations', timeout: 1000 });
    expect(provider.capabilities).toEqual(['text_generation', 'image_generation']);
    expect(await provider.validateCredentials()).toBe(true);
    expect((await provider.validateInput('image_generation', { prompt: 'a golden portal' })).valid).toBe(true);
    expect((await provider.validateInput('text_generation', { prompt: 'describe a world' })).valid).toBe(true);
  });

  it('builds a keyless image URL and rejects empty prompts', async () => {
    const provider = new PollinationsProvider();
    await provider.initialize({ name: 'pollinations' });
    await expect(provider.generateImage({ prompt: '' })).rejects.toThrow('prompt');
    // No network request is made while constructing the image URL.
    const image = await provider.generateImage({ prompt: 'golden portal', seed: 7 });
    expect(image.url).toContain('image.pollinations.ai/prompt/');
    expect(image.url).toContain('seed=7');
    expect(image.metadata?.apiKeyRequired).toBe(false);
  });
});
