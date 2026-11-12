# Website and Game Builder Release Readiness

This checklist defines the release boundary for the prompt-first website and browser-game workflows. A green CI run is necessary but not sufficient for public release.

## Prompt-first website builder

- [x] One natural-language prompt is the primary input.
- [x] Prompt payload is validated server-side (12–4000 characters, strict fields).
- [x] Local deterministic interpreter creates a responsive standalone HTML page without a paid API or external provider.
- [x] English and Persian language detection/selection and RTL output.
- [x] SEO title, meta description, robots directive, Open Graph/Twitter tags and Schema.org WebSite JSON-LD.
- [x] Sandboxed preview, editable HTML source and standalone HTML download.
- [x] Optional LLM-quality content specification through the owner-enabled local Ollama provider, with strict JSON validation and deterministic fallback when unavailable.
- [ ] Multi-page routing, navigation editor and page-level content editing.
- [ ] Persistent project revisions and restore/rollback.
- [ ] Public publishing, domain binding, HTTPS, sitemap and canonical URL generation after a real domain is configured.
- [ ] Manual browser QA on Android and desktop after a deployable build is available.

## Prompt-first browser game builder

- [x] One natural-language prompt is the primary input for the 2D playable prototype.
- [x] Strict prompt validation and deterministic local game-definition generation.
- [x] Versioned Phaser definition with validated map bounds, reachable objectives and allow-listed rules.
- [x] Authenticated job lifecycle and optional project association.
- [x] Play route at `/play/:jobId` after job completion.
- [x] Keyboard and on-screen directional controls.
- [ ] Editable level/map editor and configurable objectives, hazards, score, lives and timer.
- [ ] More gameplay templates (platformer, puzzle, racing, shooter) with their own schemas and runtime tests.
- [ ] Automated agent playtesting and repair loop.
- [ ] Mobile-device acceptance and performance QA.

## Separate 3D / Unreal Engine 5 release gate

- [x] UE5 worker adapter, manifest schema, explicit Function/Form gates and worker contract tests exist.
- [ ] A real owner-operated Blender/UE5 worker must complete preview and project build.
- [ ] Verify character controller, collision, navigation, interactions and playtest in an actual UE5 runtime.
- [ ] Verify source project and artifact download from the configured worker.
- [ ] Do not label a room preview or UE5 source ZIP as a fully playable packaged game.

## Release decision

Do not merge or announce the whole website/game builder as fully production-ready until the required CI checks pass and the relevant manual acceptance gates above are completed. The current prompt-first website and 2D game features are an MVP release candidate; public website hosting and native/3D game production remain explicitly out of scope until their gates pass.
