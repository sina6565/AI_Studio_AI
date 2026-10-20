import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync(new URL('./UniverseLanding.css', import.meta.url), 'utf8');
const page = readFileSync(new URL('./UniverseLanding.tsx', import.meta.url), 'utf8');

describe('cinematic landing release regressions', () => {
  it('has a compact navigation layout for narrow phones including 390px screens', () => {
    expect(css).toContain('@media (max-width: 420px)');
    expect(css).toContain('.brand-lockup {\n    min-width: 0;');
    expect(css).toContain('.nav-actions {\n    flex-shrink: 0;');
    expect(css).toContain('white-space: nowrap;');
  });

  it('sets a real RTL layout direction for Persian, not only text alignment', () => {
    expect(css).toContain('.universe-landing.is-persian {\n  direction: rtl;');
    expect(css).toContain('.universe-landing.is-persian .universe-footer { direction: rtl; }');
    expect(page).toContain("faTitle: 'استودیوی هوش مصنوعی'");
  });

  it('respects reduced-motion preferences and avoids false live-system claims', () => {
    expect(css).toContain('@media (prefers-reduced-motion: reduce)');
    expect(page).toContain('concept');
    expect(page).not.toContain('SYSTEM ONLINE');
  });
});
