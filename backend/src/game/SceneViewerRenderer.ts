/**
 * Self-contained HTML5 scene-viewer renderer.
 *
 * Turns a game manifest into a single HTML document with no external
 * JavaScript or CSS, so the viewer can be saved and opened offline. Scene
 * images stay provider-hosted URLs, so the document is self-contained in its
 * *code*, not in its media — the viewer says so in its own footer rather than
 * implying a fully offline bundle.
 *
 * Security: every piece of user-supplied text is escaped, image sources are
 * restricted to http(s)/data-image, and the scene data embedded in the
 * <script> tag is JSON with angle brackets and line separators neutralised, so
 * a crafted title or description cannot inject markup or break out of the
 * script element.
 */

import type { GameManifest } from './types';

const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

/** Escape text for use in HTML markup and quoted attributes. */
export function escapeHtml(value: unknown): string {
  return String(value ?? '').replace(/[&<>"']/g, (char) => HTML_ESCAPES[char]);
}

/** Allow only http(s) and inline image data URLs as image sources. */
export function safeImageUrl(value: unknown): string {
  const raw = String(value ?? '').trim();
  if (!raw) return '';
  if (/^https?:\/\//i.test(raw) || /^data:image\//i.test(raw)) return raw;
  return '';
}

/** Serialise data for embedding inside a <script> element safely. */
export function jsonForScript(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

/** Stable, filesystem-safe filename for a rendered viewer. */
export function sceneViewerFilename(title: unknown): string {
  const slug = String(title ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return `${slug || 'game'}-scene-viewer.html`;
}

export interface RenderedScene {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
}

/**
 * Render a game manifest into a self-contained HTML5 scene viewer with
 * click-through navigation (buttons, keyboard, swipe, scene dots).
 */
export function renderSceneViewer(manifest: GameManifest): string {
  const scenes: RenderedScene[] = (manifest.scenes || []).map((scene, index) => ({
    id: scene.id || `scene-${index + 1}`,
    name: scene.name || `Scene ${index + 1}`,
    description: scene.description || '',
    imageUrl: safeImageUrl(scene.imageUrl),
  }));

  const title = escapeHtml(manifest.title || 'Untitled game');
  const description = escapeHtml(manifest.description || '');
  const genre = escapeHtml(manifest.genre || 'adventure');
  const artStyle = escapeHtml(manifest.artStyle || 'stylised');
  const sceneCount = scenes.length;

  const dots = scenes
    .map(
      (scene, index) =>
        `        <li><button type="button" class="dot" data-index="${index}" ` +
        `title="${escapeHtml(scene.name)}" aria-label="Scene ${index + 1}: ${escapeHtml(
          scene.name,
        )}">${index + 1}</button></li>`,
    )
    .join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="generator" content="AI Studio scene viewer">
<title>${title} — scene viewer</title>
<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body {
    background: #0b0f17; color: #e7ecf3;
    font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
    min-height: 100vh; display: flex; flex-direction: column;
  }
  header { padding: 20px 24px 8px; text-align: center; }
  h1 { margin: 0 0 6px; font-size: 1.5rem; line-height: 1.25; }
  .meta { color: #93a2b8; font-size: .8rem; letter-spacing: .04em; text-transform: uppercase; }
  .desc { color: #b9c6d8; font-size: .9rem; margin: 8px auto 0; max-width: 640px; }
  main { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 16px 24px; }
  .stage {
    position: relative; width: 100%; max-width: 900px;
    background: #131a26; border: 1px solid #1f2a3a; border-radius: 12px; overflow: hidden;
  }
  .frame { width: 100%; aspect-ratio: 16 / 9; display: block; background: #0e1420; object-fit: cover; cursor: pointer; }
  .frame.empty { display: flex; align-items: center; justify-content: center; color: #64748b; font-size: .85rem; }
  .caption { padding: 14px 18px; border-top: 1px solid #1f2a3a; }
  .caption h2 { margin: 0 0 4px; font-size: 1.05rem; }
  .caption p { margin: 0; color: #a9b8cc; font-size: .88rem; line-height: 1.5; }
  nav { display: flex; align-items: center; justify-content: center; gap: 14px; padding: 16px 24px 4px; }
  button {
    font: inherit; color: #e7ecf3; background: #1b2432;
    border: 1px solid #2b3a4f; border-radius: 8px; padding: 9px 18px; cursor: pointer;
  }
  button:hover:not(:disabled) { background: #243146; }
  button:disabled { opacity: .4; cursor: not-allowed; }
  .counter { color: #93a2b8; font-size: .85rem; min-width: 74px; text-align: center; }
  .dots { list-style: none; display: flex; flex-wrap: wrap; gap: 6px; justify-content: center; margin: 10px 0 0; padding: 0; }
  .dot { width: 30px; height: 30px; padding: 0; border-radius: 50%; font-size: .78rem; }
  .dot[aria-current="true"] { background: #3b82f6; border-color: #60a5fa; }
  footer { padding: 14px 24px 22px; text-align: center; color: #6b7a90; font-size: .75rem; line-height: 1.6; }
  .hint { color: #7c8ba1; font-size: .78rem; margin-top: 8px; }
</style>
</head>
<body>
<header>
  <h1>${title}</h1>
  <div class="meta">${genre} &middot; ${artStyle} &middot; ${sceneCount} scene${sceneCount === 1 ? '' : 's'}</div>
  ${description ? `<p class="desc">${description}</p>` : ''}
</header>

<main>
  <div class="stage">
    <img id="frame" class="frame" alt="" />
    <div class="caption">
      <h2 id="scene-name"></h2>
      <p id="scene-desc"></p>
    </div>
  </div>

  <nav>
    <button type="button" id="prev" aria-label="Previous scene">&lsaquo; Prev</button>
    <span class="counter" id="counter"></span>
    <button type="button" id="next" aria-label="Next scene">Next &rsaquo;</button>
  </nav>

  <ol class="dots" id="dots">
${dots}
  </ol>

  <p class="hint">Click the image, use the buttons, the &larr;/&rarr; keys, or swipe to move through the scenes.</p>
</main>

<footer>
  Generated by AI Studio &middot; ${escapeHtml(manifest.version || '1.0')} &middot; ${escapeHtml(
    manifest.generatedAt || '',
  )}<br>
  This is a scene viewer over a generated game definition. Scene images are loaded from their provider URLs, so an internet connection is required to display them.
</footer>

<script>
(function () {
  var SCENES = ${jsonForScript(scenes)};
  var frame = document.getElementById('frame');
  var nameEl = document.getElementById('scene-name');
  var descEl = document.getElementById('scene-desc');
  var counter = document.getElementById('counter');
  var prevBtn = document.getElementById('prev');
  var nextBtn = document.getElementById('next');
  var dots = Array.prototype.slice.call(document.querySelectorAll('.dot'));
  var index = 0;

  function clamp(value) {
    if (value < 0) return 0;
    if (value > SCENES.length - 1) return SCENES.length - 1;
    return value;
  }

  function render() {
    var scene = SCENES[index];
    if (!scene) return;
    if (scene.imageUrl) {
      frame.src = scene.imageUrl;
      frame.alt = scene.name;
      frame.className = 'frame';
    } else {
      frame.removeAttribute('src');
      frame.className = 'frame empty';
      frame.alt = '';
      frame.textContent = 'No image was generated for this scene.';
    }
    nameEl.textContent = scene.name;
    descEl.textContent = scene.description;
    counter.textContent = (index + 1) + ' / ' + SCENES.length;
    prevBtn.disabled = index === 0;
    nextBtn.disabled = index === SCENES.length - 1;
    dots.forEach(function (dot, i) {
      if (i === index) { dot.setAttribute('aria-current', 'true'); }
      else { dot.removeAttribute('aria-current'); }
    });
  }

  function goTo(target) {
    var next = clamp(target);
    if (next === index) return;
    index = next;
    render();
  }

  prevBtn.addEventListener('click', function () { goTo(index - 1); });
  nextBtn.addEventListener('click', function () { goTo(index + 1); });
  frame.addEventListener('click', function () {
    if (index < SCENES.length - 1) { goTo(index + 1); }
  });
  dots.forEach(function (dot) {
    dot.addEventListener('click', function () {
      goTo(parseInt(dot.getAttribute('data-index'), 10) || 0);
    });
  });
  document.addEventListener('keydown', function (event) {
    if (event.key === 'ArrowLeft') { goTo(index - 1); }
    else if (event.key === 'ArrowRight' || event.key === ' ') { goTo(index + 1); }
  });

  var touchStartX = null;
  document.addEventListener('touchstart', function (event) {
    touchStartX = event.changedTouches[0].clientX;
  }, { passive: true });
  document.addEventListener('touchend', function (event) {
    if (touchStartX === null) return;
    var delta = event.changedTouches[0].clientX - touchStartX;
    touchStartX = null;
    if (Math.abs(delta) < 50) return;
    goTo(delta < 0 ? index + 1 : index - 1);
  }, { passive: true });

  render();
})();
</script>
</body>
</html>
`;
}
