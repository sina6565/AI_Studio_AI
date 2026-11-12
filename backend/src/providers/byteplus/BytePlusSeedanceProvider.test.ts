import { BytePlusSeedanceProvider } from './BytePlusSeedanceProvider';

describe('BytePlusSeedanceProvider', () => {
  const originalAllow = process.env.BYTEPLUS_ALLOW_BILLABLE_REQUESTS;
  let provider: BytePlusSeedanceProvider;

  beforeEach(async () => {
    process.env.BYTEPLUS_ALLOW_BILLABLE_REQUESTS = 'false';
    provider = new BytePlusSeedanceProvider();
    await provider.initialize({ name: 'byteplus-seedance', apiKey: 'test-key', timeout: 1000 });
  });

  afterAll(() => {
    if (originalAllow === undefined) delete process.env.BYTEPLUS_ALLOW_BILLABLE_REQUESTS;
    else process.env.BYTEPLUS_ALLOW_BILLABLE_REQUESTS = originalAllow;
  });

  it('blocks billable generation unless the explicit cost gate is enabled', async () => {
    await expect(provider.generateVideo({
      prompt: 'A cinematic sunrise',
      rightsConfirmed: true,
    } as any)).rejects.toThrow('BYTEPLUS_ALLOW_BILLABLE_REQUESTS=true');
  });

  it('requires explicit acceptance of provider terms', async () => {
    const result = await provider.validateInput('video_generation', { prompt: 'A scene' });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Accept the applicable BytePlus service terms before generation');
  });

  it('requires rights confirmation for supplied reference assets', async () => {
    const result = await provider.validateInput('video_generation', {
      prompt: 'Animate this image',
      rightsConfirmed: true,
      inputReferences: [{ type: 'image_url', image_url: { url: 'https://example.com/image.png' }, role: 'reference_image' }],
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Confirm rights to every uploaded reference asset');
  });

  it('rejects unsupported resolution for Fast and Mini tiers', async () => {
    const result = await provider.validateInput('video_generation', {
      prompt: 'A scene',
      rightsConfirmed: true,
      model: 'dreamina-seedance-2-0-fast-260128',
      resolution: '1080p',
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Seedance Fast and Mini support 480p and 720p only');
  });

  it('enforces the 9 image, 3 video and 3 audio reference limits', async () => {
    const inputReferences = Array.from({ length: 10 }, () => ({
      type: 'image_url',
      image_url: { url: 'https://example.com/image.png' },
      role: 'reference_image',
    }));
    const result = await provider.validateInput('video_generation', {
      prompt: 'A scene',
      rightsConfirmed: true,
      inputRightsConfirmed: true,
      authorizedPortraitsConfirmed: true,
      inputReferences,
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Seedance 2.0 supports up to 9 images, 3 videos and 3 audio references');
  });
});
