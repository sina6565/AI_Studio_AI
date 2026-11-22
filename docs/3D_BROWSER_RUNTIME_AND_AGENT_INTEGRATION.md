# SINA AI STUDIO — Browser 3D Runtime and Agent Integration Decision

**Status:** Accepted architecture direction; implementation verification remains capability-specific.  
**Scope:** Canonical `sina6565/AI_Studio_AI` repository.  
**Decision date:** 2026-11-22.

## Decision

SINA will use **Three.js + React Three Fiber (R3F)** as its first-class browser 3D scene and gameplay runtime. This is not a replacement for the existing native Unreal Engine 5 path.

The platform keeps distinct runtimes behind SINA-owned contracts:

| Target | Runtime / toolchain | Responsibility |
|---|---|---|
| Browser 3D experiences | Three.js + React Three Fiber + Drei | Interactive scenes, browser-playable games, web previews and delivery |
| Native 3D game projects | Unreal Engine 5 | Native project authoring and future platform packaging |
| 3D authoring / geometry pipeline | Blender | Procedural geometry, inspection, rendering and interchange export |
| 2D games | Phaser | Independent 2D runtime |
| Interchange | glTF 2.0 / GLB | Runtime-neutral transfer of meshes, materials, transforms and animation where supported |

Do not route every 3D task to Unreal. The SINA Orchestrator selects the target runtime from the user's requested delivery target, required capabilities, available workers and explicit policy. A browser game should not require an installed Unreal Editor or a UE5 worker.

## Why this decision

- Three.js is MIT-licensed and permits commercial use, modification and distribution subject to retaining the copyright and license notice: https://threejs.org/license/
- React Three Fiber is the React renderer for Three.js. Keep the currently installed R3F v8 line paired with this repository's React 18; do not move to R3F v10 while its official documentation labels it alpha: https://r3f.docs.pmnd.rs/
- Blender can be used commercially and artists retain rights to their output. Distribution of Blender itself or modifications to Blender remains subject to GPL obligations; review bundled add-ons and assets separately: https://www.blender.org/support/faq/
- Existing frontend dependencies and code already include Three.js, R3F, Drei, a 3D builder and a playable browser prototype. The next step is integration and validation, not a duplicate engine installation.

## Agent and MCP execution model

Do not create a second orchestrator, parallel agent registry, or provider-specific game pipeline. Extend the existing SINA Orchestrator, Agent Registry, Execution Manager, Provider Pool and SINA MCP Gateway.

The Orchestrator should decompose a browser-game request into typed tasks and assign available specialists by capability. Suggested specialist roles are logical capabilities, not a requirement to create duplicate agent frameworks:

1. **Game Design / Planner:** produces the game brief, mechanics, target runtime and acceptance criteria.
2. **Scene Agent:** produces a validated, versioned scene manifest (world dimensions, entities, transforms, lights, cameras, collision intent and asset references).
3. **Asset Agent:** supplies licensed/generated assets and GLB files with provenance and per-asset license metadata.
4. **Gameplay Agent:** creates or selects reviewed gameplay modules for input, movement, camera, physics/collision, objectives, UI and state.
5. **Integration Agent:** assembles the scene and gameplay modules using approved project templates and registered tools.
6. **QA / Optimization Agent:** runs deterministic checks, browser smoke tests, accessibility/input checks, performance budgets and artifact/license audits.

Expose capabilities through the existing MCP Gateway / Tool Registry only after confirming the gateway's actual implementation and authorization model. Candidate tool contracts:

- `scene.validate_manifest`: schema and semantic validation; no code execution.
- `scene.preview_r3f`: render a preview from a validated manifest.
- `asset.inspect_glb`: inspect file type, dimensions, material/texture references, animation tracks and provenance.
- `game.build_browser`: assemble only approved templates and allowlisted modules.
- `game.run_browser_tests`: execute a bounded test suite in an isolated browser/runtime.
- `game.export_glb`: export supported scene assets for Blender/UE5 handoff.
- `game.package_ue5_source`: call the existing authenticated UE5 worker only when the requested target is UE5 and the worker is healthy.

These are proposed tool names/contracts, not claims that these MCP tools already exist. Register each only after implementation, authentication, scoped permissions, audit logging, timeouts, quotas and tests are in place.

## Required scene contract

Create a versioned, provider-neutral scene manifest before allowing an agent to generate executable code. At minimum it should define:

- `schemaVersion`, `projectId`, `targetRuntime` (`web-r3f` or `unreal-5`) and target profile.
- World units, coordinate convention, gravity and scene bounds.
- Stable entity IDs, asset references, transforms, hierarchy and material references.
- Camera, lighting, input bindings, collision/navigation intent and gameplay objective metadata.
- Asset provenance, SPDX/license identifier where known, attribution/notice requirements and source URL.
- Validation results, creator task IDs and artifact hashes.

The manifest must be validated against a versioned schema. Agents must not insert arbitrary executable code into the manifest.

## Security and execution boundaries

- Never execute model-generated JavaScript, Python, shell commands, Blueprint source or downloaded scripts directly.
- Browser builds must use reviewed templates and allowlisted modules; isolate preview/build jobs and enforce CPU, memory, time, file-size and network limits.
- MCP tools use per-task allowlists, scoped credentials, explicit approvals for external writes and audit records.
- Treat imported GLB, textures, archives and plugins as untrusted input; validate type, size, decompression limits and references.
- No paid provider, hosted GPU or subscription may be enabled without explicit owner authorization. Prefer local/free paths and report unavailable capability honestly.
- Do not claim a browser build proves UE5 behavior, or a Blender render proves a playable game.

## License and commercial-use policy

- Three.js: MIT; preserve its license/copyright notice in distributed copies.
- React Three Fiber: MIT; preserve the relevant notice.
- Blender: GPL application; commercial use of artwork is allowed. If distributing Blender itself or modified Blender, satisfy GPL source and notice obligations. Review add-ons independently.
- GLB assets, textures, fonts, audio, HDRIs, sample projects and marketplace packs have their own licenses. An MIT engine does not make imported assets commercially reusable.
- Reject or quarantine assets with unknown provenance for commercial release until reviewed. Record the exact license and source per asset.

## Delivery stages and acceptance gates

1. **Brief accepted:** target runtime, genre, mechanics and measurable acceptance criteria are recorded.
2. **Scene validated:** manifest schema, dimensions, references and asset licenses pass.
3. **Browser preview:** R3F scene loads without console errors and supports desktop and touch controls where required.
4. **Playable build:** input, camera, collision, game state, objectives, restart and failure/success paths pass automated smoke tests.
5. **Quality gate:** performance, memory, asset budget, accessibility and license checks pass on agreed target devices.
6. **Delivery:** project files, source manifest, assets, provenance/license report, test evidence and preview URL are attached to the SINA Job.
7. **Native handoff:** only if requested, export supported assets through GLB and use the existing Blender/UE5 path. Native runtime/package approval remains a separate gate.

## Immediate implementation sequence

- Keep existing `three`, `@react-three/fiber` v8 and `@react-three/drei` dependencies; no duplicate packages or alpha upgrade.
- Update the 3D pipeline documentation so R3F is a browser runtime, not merely a concept-preview renderer.
- Audit the existing `Game3DBuilder` and `Playable3DGame` implementations against the acceptance gates above.
- Implement the versioned scene manifest and validators before enabling agent-authored game logic.
- Inspect the real MCP Gateway and Tool Registry before registering the candidate tool contracts.
- Add browser smoke tests and artifact/license evidence; report each gate as unverified until it has actually run.

## Verified repository evidence at decision time

- `frontend/package.json` includes Three.js, `@react-three/fiber` v8 and `@react-three/drei` with React 18.
- Existing code imports R3F in `frontend/src/pages/Game3DBuilder.tsx`, `frontend/src/components/games/Playable3DGame.tsx` and the universe scene components.
- `docs/3D_GAME_ROOM_PIPELINE.md` documents the Blender/UE5 worker and explicitly states that a real UE5 build/runtime has not yet been verified.
- This ADR does not claim the proposed MCP tool contracts, complete agent-to-game pipeline, browser QA gates or native UE5 runtime are already implemented.
