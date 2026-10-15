/**
 * Scene-viewer renderer tests.
 *
 * The viewer embeds user-supplied game text into an HTML document, so these
 * tests focus as much on injection safety as on the viewer's structure.
 */

import {
  escapeHtml,
  jsonForScript,
  renderSceneViewer,
  safeImageUrl,
  sceneViewerFilename,
} from '../src/game/SceneViewerRenderer';
import type { GameManifest } from '../src/game/types';

function makeManifest(overrides: Partial<GameManifest> = {}): GameManifest {
  return {
    version: '1.0',
    title: 'Dungeon of Echoes',
    description: 'A short dungeon crawl.',
    genre: 'dungeon crawler',
    artStyle: 'pixel art',
    scenes: [
      {
        id: 'scene-1',
        name: 'Entrance',
        description: 'A mossy stone doorway.',
        imageUrl: 'https://cdn.example.com/entrance.png',
      },
      {
        id: 'scene-2',
        name: 'Hall',
        description: 'A long torch-lit hall.',
        imageUrl: 'https://cdn.example.com/hall.png',
      },
    ],
    assets: [
      { sceneId: 'scene-1', url: 'https://cdn.example.com/entrance.png', format: 'png', provider: 'agnes' },
      { sceneId: 'scene-2', url: 'https://cdn.example.com/hall.png', format: 'png', provider: 'agnes' },
    ],
    assetCount: 2,
    playable: false,
    engine: { type: 'scene-viewer', runtime: 'html5' },
    generatedAt: '2026-10-14T00:00:00.000Z',
    notes: 'game definition',
    ...overrides,
  };
}

describe('escapeHtml', () => {
  it('escapes the five markup-significant characters', () => {
    expect(escapeHtml(`<a href="x" & 'y'>`)).toBe(
      '&lt;a href=&quot;x&quot; &amp; &#39;y&#39;&gt;',
    );
  });

  it('handles null and undefined without throwing', () => {
    expect(escapeHtml(null)).toBe('');
    expect(escapeHtml(undefined)).toBe('');
  });
});

describe('safeImageUrl', () => {
  it('allows http and https URLs', () => {
    expect(safeImageUrl('https://cdn.example.com/a.png')).toBe('https://cdn.example.com/a.png');
    expect(safeImageUrl('http://cdn.example.com/a.png')).toBe('http://cdn.example.com/a.png');
  });

  it('allows inline image data URLs', () => {
    expect(safeImageUrl('data:image/png;base64,AAAA')).toBe('data:image/png;base64,AAAA');
  });

  it('rejects javascript and other schemes', () => {
    expect(safeImageUrl('javascript:alert(1)')).toBe('');
    expect(safeImageUrl('data:text/html;base64,AAAA')).toBe('');
    expect(safeImageUrl('  vbscript:msgbox(1)')).toBe('');
  });

  it('returns an empty string for missing values', () => {
    expect(safeImageUrl(undefined)).toBe('');
    expect(safeImageUrl('')).toBe('');
  });
});

describe('sceneViewerFilename', () => {
  it('slugs the title', () => {
    expect(sceneViewerFilename('Dungeon of Echoes')).toBe('dungeon-of-echoes-scene-viewer.html');
  });

  it('falls back for empty or symbol-only titles', () => {
    expect(sceneViewerFilename('')).toBe('game-scene-viewer.html');
    expect(sceneViewerFilename('!!!')).toBe('game-scene-viewer.html');
  });

  it('truncates long titles', () => {
    expect(sceneViewerFilename('a'.repeat(200)).length).toBeLessThanOrEqual(80);
  });
});

describe('jsonForScript', () => {
  it('neutralises angle brackets and line separators', () => {
    const encoded = jsonForScript({ s: '</script><b>\u2028\u2029' });
    expect(encoded).not.toContain('</script>');
    expect(encoded).not.toContain('<b>');
    expect(encoded).toContain('\\u003c');
    expect(encoded).toContain('\\u2028');
    expect(encoded).toContain('\\u2029');
  });
});

describe('renderSceneViewer', () => {
  it('produces a complete standalone HTML document', () => {
    const html = renderSceneViewer(makeManifest());
    expect(html.startsWith('<!DOCTYPE html>')).toBe(true);
    expect(html).toContain('</html>');
    expect(html).toContain('<title>Dungeon of Echoes — scene viewer</title>');
  });

  it('does not reference any external script or stylesheet', () => {
    const html = renderSceneViewer(makeManifest());
    expect(html).not.toContain('<script src=');
    expect(html).not.toMatch(/<link[^>]+rel=["']stylesheet/i);
  });

  it('includes every scene name, description and image', () => {
    const html = renderSceneViewer(makeManifest());
    expect(html).toContain('Entrance');
    expect(html).toContain('A mossy stone doorway.');
    expect(html).toContain('https://cdn.example.com/entrance.png');
    expect(html).toContain('Hall');
    expect(html).toContain('https://cdn.example.com/hall.png');
  });

  it('renders click-through navigation controls', () => {
    const html = renderSceneViewer(makeManifest());
    expect(html).toContain('id="prev"');
    expect(html).toContain('id="next"');
    expect(html).toContain('class="dot"');
    expect(html).toContain('ArrowRight');
    expect(html).toContain('touchstart');
  });

  it('states that the artifact is a scene viewer, not an engine build', () => {
    const html = renderSceneViewer(makeManifest());
    expect(html).toContain('scene viewer over a generated game definition');
  });

  it('escapes injected markup in the title, description and scene text', () => {
    const evil = 'A</script><img src=x onerror=alert(1)>';
    const html = renderSceneViewer(
      makeManifest({
        title: evil,
        description: evil,
        genre: evil,
        artStyle: evil,
        scenes: [
          { id: 'scene-1', name: evil, description: evil, imageUrl: 'https://cdn.example.com/a.png' },
        ],
      }),
    );

    // Only the viewer's own closing script tag may appear.
    expect((html.match(/<\/script>/g) || []).length).toBe(1);
    expect(html).not.toContain('<img src=x');
    expect(html).toContain('&lt;img src=x');
    expect(html).toContain('\\u003c/script\\u003e');
  });

  it('drops an unsafe image URL instead of emitting it', () => {
    const html = renderSceneViewer(
      makeManifest({
        scenes: [
          { id: 's1', name: 'Bad', description: 'Bad scene', imageUrl: 'javascript:alert(1)' },
        ],
      }),
    );
    expect(html).not.toContain('javascript:alert(1)');
  });

  it('handles a manifest with no scenes', () => {
    const html = renderSceneViewer(makeManifest({ scenes: [], assets: [], assetCount: 0 }));
    expect(html).toContain('0 scenes');
    expect(html.startsWith('<!DOCTYPE html>')).toBe(true);
  });

  it('uses singular wording for a single scene', () => {
    const html = renderSceneViewer(
      makeManifest({
        scenes: [{ id: 's1', name: 'Only', description: 'Only scene' }],
      }),
    );
    expect(html).toContain('1 scene<');
  });
});
