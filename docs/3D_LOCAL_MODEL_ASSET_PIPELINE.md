# SINA AI STUDIO — Local 3D Model Asset Pipeline

## Purpose

Extend the existing Blender → GLB → Unreal Engine 5 workflow with a provider-independent, free-only local model path. This does not replace the existing Orchestrator, room manifest, Blender authoring stage, or UE5 worker.

## Integration contract

- Three.js / React Three Fiber remains the browser-side scene preview and camera interaction layer. Unreal Engine 5 remains the native runtime target.
- Voxel scene construction and procedural scene generation are distinct task modes; neither is mislabeled as image-to-3D.
- Image-guided generation requires a stored reference-image asset ID and a compatible vision component: a GGUF vision projector for llama.cpp, or a processor configuration for Transformers.
- GGUF models use llama.cpp. Q4_K_M and Q8_0 are tracked as quantization profiles.
- Safetensors models use Transformers. FP16 is tracked as the full-precision path.
- GLB is the normalized handoff format. Camera position, target, and field of view are explicit render inputs.
- Blender remains responsible for normalization and geometry/render validation before UE5 import.

## License policy

Model base, model weights/fine-tune, training dataset, and each runtime/dependency license are independent records. Apache-2.0 is preferred; MIT is an accepted permissive option. Other, unknown, restricted, or unverified licenses block eligibility pending owner review.

## Runtime and cost policy

- Local execution only. This contract does not invoke paid APIs, hosted GPUs, Meshy, Replicate, or Stability.
- A model remains catalog-only until explicitly enabled by the owner.
- Eligibility requires an available local worker, installed compatible runtime, present model files, separately verified licenses, and explicit commercial-use review.
- Eligibility is not proof of inference or output quality. A benchmark must retain model/version, prompt/reference hash, runtime settings, output GLB, Blender audit, and UE5 import/runtime evidence.

## Implementation boundary

The backend asset-pipeline module validates model/runtime/license/hardware/render contracts. It does not download weights, launch llama.cpp or Transformers, call remote services, generate meshes, render scenes, or import GLB into UE5. Those operations require a configured local worker and actual model/engine binaries. Existing procedural Blender room generation remains the guaranteed fallback.