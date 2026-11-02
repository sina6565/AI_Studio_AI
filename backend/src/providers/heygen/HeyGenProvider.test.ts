import { HeyGenProvider } from './HeyGenProvider';

describe('HeyGenProvider', () => {
  it('advertises text-to-speech only', () => {
    const provider = new HeyGenProvider();
    expect(provider.capabilities).toEqual(['text_to_speech']);
  });

  it('rejects empty text', async () => {
    const provider = new HeyGenProvider();
    const result = await provider.validateInput('text_to_speech', {
      text: '   ',
      voice: 'nadine',
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Text is required for speech synthesis');
  });

  it('rejects text longer than 5000 characters', async () => {
    const provider = new HeyGenProvider();
    const result = await provider.validateInput('text_to_speech', {
      text: 'a'.repeat(5001),
      voice: 'nadine',
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      'HeyGen Voice Turbo accepts at most 5000 characters per request',
    );
  });

  it('requires a voice ID', async () => {
    const provider = new HeyGenProvider();
    const result = await provider.validateInput('text_to_speech', {
      text: 'Hello',
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('A HeyGen voice ID is required');
  });

  it('accepts valid text and a voice ID', async () => {
    const provider = new HeyGenProvider();
    const result = await provider.validateInput('text_to_speech', {
      text: 'Hello',
      voice: 'nadine',
    });
    expect(result.valid).toBe(true);
  });
});
