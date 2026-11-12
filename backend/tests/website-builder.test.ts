import { buildWebsite, buildWebsiteWithPrompt, renderWebsiteHtml } from '../src/website/WebsiteBuilderService';

const validSpec = {
  name: 'SINA Studio',
  tagline: 'From an idea to a universe',
  description: 'A creative platform for ambitious digital work.',
  kind: 'business' as const,
  palette: 'midnight' as const,
  language: 'en' as const,
  contactEmail: 'hello@sina.example',
};

describe('local website builder', () => {
  it('builds a responsive standalone HTML artifact and metadata', () => {
    const result = buildWebsite(validSpec);
    const html = Buffer.from(result.url.split(',')[1], 'base64').toString('utf8');

    expect(result.format).toBe('text/html');
    expect(result.metadata.filename).toBe('sina-studio.html');
    expect(result.metadata.generator).toBe('sina-local-website-builder');
    expect(result.metadata.hostedPublishing).toBe(false);
    expect(result.size).toBe(Buffer.byteLength(html, 'utf8'));
    expect(html).toContain('name="viewport"');
    expect(html).toContain('grid-template-columns:repeat(3');
    expect(html).toContain('mailto:hello@sina.example');
  });

  it('builds a complete responsive site from one natural-language prompt', () => {
    const result = buildWebsite({
      prompt: 'Create a website for a handmade ceramics shop. Include product highlights and contact information.',
      language: 'en',
    });
    const html = result.metadata.html;

    expect(result.metadata.buildMode).toBe('single-prompt-local-interpreter');
    expect(result.metadata.aiCopyGeneration).toBe(false);
    expect(result.metadata.hostedPublishing).toBe(false);
    expect(html).toContain('<title>handmade ceramics shop — Discover handmade ceramics shop</title>');
    expect(html).toContain('Products and benefits');
    expect(html).toContain('name="description"');
  });

  it('detects Persian prompt language and generates RTL output', () => {
    const result = buildWebsite({
      prompt: 'یک وب‌سایت برای فروشگاه محصولات دست‌ساز بساز که معرفی، محصولات و راه‌های تماس داشته باشد.',
    });

    expect(result.metadata.html).toContain('<html lang="fa" dir="rtl">');
    expect(result.metadata.html).toContain('ارتباط با ما');
  });

  it('uses a validated local LLM website brief when a text provider is available', async () => {
    const generateText = jest.fn().mockResolvedValue(JSON.stringify({
      name: 'Ceramics Atelier',
      tagline: 'Objects shaped with care',
      description: 'A thoughtful studio for handmade ceramic objects.',
      kind: 'business',
      palette: 'ocean',
      language: 'en',
      features: [
        { title: 'The studio', description: 'Meet the makers and their process.' },
        { title: 'Collections', description: 'Explore small-batch ceramic pieces.' },
        { title: 'Visit and contact', description: 'Ask about workshops and availability.' },
      ],
    }));

    const result = await buildWebsiteWithPrompt({
      prompt: 'Create a website for a handmade ceramics studio.',
      language: 'en',
    }, generateText);

    expect(generateText).toHaveBeenCalledTimes(1);
    expect(result.metadata.buildMode).toBe('ollama-local-text');
    expect(result.metadata.aiCopyGeneration).toBe(true);
    expect(result.metadata.textProvider).toBe('ollama');
    expect(result.metadata.html).toContain('<title>Ceramics Atelier — Objects shaped with care</title>');
    expect(result.metadata.html).toContain('Collections');
  });

  it('falls back to the deterministic prompt interpreter when local text generation fails', async () => {
    const result = await buildWebsiteWithPrompt({
      prompt: 'Create a website for a handmade ceramics shop.',
      language: 'en',
    }, async () => 'not valid JSON');

    expect(result.metadata.buildMode).toBe('local-prompt-interpreter');
    expect(result.metadata.aiCopyGeneration).toBe(false);
    expect(result.metadata.textProvider).toBe('none');
    expect(result.metadata.fallbackReason).toBeDefined();
    expect(result.metadata.html).toContain('handmade ceramics shop');
  });

  it('escapes user text before writing it into HTML', () => {
    const html = renderWebsiteHtml({
      ...validSpec,
      name: '<script>alert(1)</script>',
      tagline: '<img src=x onerror=alert(1)>',
      description: 'Safe & sound',
    });

    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;');
    expect(html).toContain('Safe &amp; sound');
    expect(html).not.toContain('<script>alert(1)</script>');
  });

  it('renders user-defined sections and SEO metadata safely', () => {
    const html = renderWebsiteHtml({
      ...validSpec,
      name: 'SINA <Studio>',
      features: [
        { title: 'Build websites', description: 'Create responsive pages.' },
        { title: 'Game design', description: 'Prototype playable worlds.' },
      ],
    });

    expect(html).toContain('<title>SINA &lt;Studio&gt; — From an idea to a universe</title>');
    expect(html).toContain('property="og:title"');
    expect(html).toContain('name="robots" content="index,follow"');
    expect(html).toContain('"@type":"WebSite"');
    expect(html).toContain('<h3>Build websites</h3><p>Create responsive pages.</p>');
    expect(html).toContain('<h3>Game design</h3><p>Prototype playable worlds.</p>');
  });

  it('supports Persian right-to-left output', () => {
    const html = renderWebsiteHtml({ ...validSpec, language: 'fa' });
    expect(html).toContain('<html lang="fa" dir="rtl">');
    expect(html).toContain('ارتباط');
  });

  it('rejects more than six custom sections', () => {
    expect(() => buildWebsite({
      ...validSpec,
      features: Array.from({ length: 7 }, (_, index) => ({ title: `Section ${index}`, description: 'Details' })),
    })).toThrow();
  });

  it('rejects invalid emails and unknown fields', () => {
    expect(() => buildWebsite({ ...validSpec, contactEmail: 'not-an-email' })).toThrow();
    expect(() => buildWebsite({ ...validSpec, executable: 'alert(1)' })).toThrow();
  });
});
