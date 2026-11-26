import { GroqProvider } from './GroqProvider';

describe('GroqProvider', () => {
  it('exposes text generation only and validates prompts', async () => {
    const provider = new GroqProvider();
    expect(provider.capabilities).toEqual(['text_generation']);
    expect((await provider.validateInput('text_generation', { prompt: 'Design a 3D level' })).valid).toBe(true);
    expect((await provider.validateInput('image_generation', { prompt: 'image' })).valid).toBe(false);
  });

  it('requires an explicit API key when enabled', async () => {
    const provider = new GroqProvider();
    await expect(provider.initialize({ name: 'groq', timeout: 1000 })).rejects.toThrow('GROQ_API_KEY');
  });
});
