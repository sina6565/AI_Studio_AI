# 3D Asset Model Benchmark — SINA AI STUDIO

## Purpose

Use one identical approved reference image and the same output constraints to compare candidate image-to-3D models. Do not choose a model from marketing screenshots alone. Select the winner from imported GLB assets and UE5 runtime evidence.

## Candidates verified from current public model documentation (2026-11-06)

| Candidate | Task role | Cost / access | Practical constraints | Decision |
|---|---|---|---|---|
| Meshy 7.1 + Meshy 7 | High-detail hero props | Paid API credits; image-to-3D textured request is 30 credits at 2K | Strong hero detail; external service and per-task cost | Benchmark only if user explicitly authorizes spend |
| Meshy T2.5 + Meshy N1 | Game-ready character/props with target face count | Paid API credits; textured image-to-3D request is 15 credits at 2K | Smart topology; better fit for controlled game asset budgets | Benchmark only if user explicitly authorizes spend |
| Meshy T2 + Meshy N1 | Many low-poly props / separated parts | Paid API credits; textured image-to-3D request is 15 credits at 2K | 4,000-face default, separated parts | Benchmark only if user explicitly authorizes spend |
| Tencent Hunyuan3D-2mini (for example, `Hunyuan3D-DiT-v2-mini-Turbo`) | Self-hosted image-to-shape | Open-source code and weights; no per-call API charge when self-hosted | Official README lists 6 GB VRAM for shape generation. The README and Model Zoo page disagree on combined shape+texture memory (16 GB vs 24.5 GB); verify the exact checkpoint and pipeline before deployment | First local candidate for geometry-only experiments; procedural Blender remains the guaranteed fallback |
| Microsoft TRELLIS-image-large | Image-to-3D mesh / other 3D representations | Open-source repository and model weights | Official repo requires NVIDIA GPU with at least 16 GB memory; Linux-tested path | Secondary self-hosted benchmark; not suitable for weak laptop hardware |

Official references:
- Meshy model comparison: https://docs.meshy.ai/en/api/models
- Meshy API pricing: https://docs.meshy.ai/en/api/pricing
- Meshy Image-to-3D endpoint: https://docs.meshy.ai/en/api/image-to-3d
- Hunyuan3D-2 official README and hardware notes: https://github.com/Tencent-Hunyuan/Hunyuan3D-2
- Hunyuan3D-2 Model Zoo (separate memory estimate): https://github.com/Tencent-Hunyuan/Hunyuan3D-2/blob/main/docs/source/modelzoo.md
- TRELLIS official repository and hardware notes: https://github.com/microsoft/TRELLIS

## Important correction to the installed skill

The installed Build 3D Game Rooms skill pins `ai_model: meshy-5`. Current Meshy documentation lists Meshy 7.1, Meshy 6, Meshy 6 Lite, Meshy T2, and Meshy T2.5 for Image-to-3D; Meshy 5 is not in the current supported model list. Do not copy the old pin into production code. Keep Meshy disabled unless the owner explicitly authorizes paid usage.

## Benchmark protocol

1. Create one neutral, isolated reference image for each test asset.
2. Run the same reference image through each accessible candidate. Preserve exact prompt, model/version, settings, source hash, task ID, and timestamp.
3. Normalize each result to the same dimensions and target polygon budget in Blender.
4. Import each GLB into the same UE5 test map and material/light setup.
5. Score each candidate from 0–5:
   - silhouette and reference fidelity (20%)
   - geometry completeness / back surface / no fused parts (15%)
   - topology and polygon budget (15%)
   - UVs, materials, and PBR quality (10%)
   - scale, pivot, and attachment-face correctness (10%)
   - collision and navigation suitability (10%)
   - GLB import reliability and UE5 runtime stability (10%)
   - latency and reproducibility (5%)
   - cost and deployment fit (5%)
6. Reject any candidate with broken support, non-manifold critical geometry, severe silhouette drift, unusable UVs, or failed UE5 import regardless of its weighted score.
7. Select a winner per asset class (hero props, modular props, characters); do not force one model to win every class.
8. Only then promote the winner to the production provider adapter. Keep the other adapters available for future re-evaluation.

## Current project decision

- Runtime engine remains Unreal Engine 5.
- Blender remains the deterministic room authoring, normalization, and geometry QA stage.
- No paid model calls are enabled.
- Hunyuan3D-2mini is the first self-hosted candidate for a geometry-only experiment after a compatible GPU worker is available. Tencent's official README reports 6 GB VRAM for shape generation, while its Model Zoo page reports 24.5 GB for shape plus texture and the README reports 16 GB for that combined path. Treat textured generation as hardware-gated and measure the selected checkpoint rather than relying on one universal figure. This is a candidate, not a verified winner.
- If no compatible GPU is available, build the room shell and structural geometry procedurally in Blender; do not block room development on AI mesh generation.
- No model has been executed or scored by this repository yet. A benchmark result must not be claimed until actual GLB files and UE5 test evidence are attached.
