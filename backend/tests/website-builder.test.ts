import { buildWebsite, renderWebsiteHtml } from '../src/website/WebsiteBuilderService';

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

  it('supports Persian right-to-left output', () => {
    const html = renderWebsiteHtml({ ...validSpec, language: 'fa' });
    expect(html).toContain('<html lang="fa" dir="rtl">');
    expect(html).toContain('ارتباط');
  });

  it('rejects invalid emails and unknown fields', () => {
    expect(() => buildWebsite({ ...validSpec, contactEmail: 'not-an-email' })).toThrow();
    expect(() => buildWebsite({ ...validSpec, executable: 'alert(1)' })).toThrow();
  });
});
