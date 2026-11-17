import { evaluateLocal3DModel, local3DModelCandidateSchema, threeDRenderRequestSchema } from './assetPipeline';
const apache = { spdxId: 'Apache-2.0', status: 'verified' as const };
const candidate = { id: 'test-3d-model', modelName: 'SINA 3D Candidate', modelVersion: '1.0', capabilities: ['image_to_3d', 'voxel_scene'], weightsFormat: 'gguf', runtime: 'llama_cpp', quantization: 'Q4_K_M', visionProjector: true, baseModelLicense: apache, weightsLicense: apache, datasetLicense: { spdxId: 'MIT', status: 'verified' }, dependencies: [], commercialUseReviewed: true, enabled: true };
const hardware = { available: true, runtimeInstalled: true, modelFilePresent: true, vramGb: 12, ramGb: 32 };
describe('local 3D model asset pipeline contract', () => {
  it('accepts GGUF with llama.cpp and a vision projector', () => { expect(local3DModelCandidateSchema.safeParse(candidate).success).toBe(true); });
  it('rejects image-to-3D without a vision component', () => { expect(local3DModelCandidateSchema.safeParse({ ...candidate, visionProjector: false }).success).toBe(false); });
  it('rejects mismatched weights and runtime combinations', () => { expect(local3DModelCandidateSchema.safeParse({ ...candidate, runtime: 'transformers' }).success).toBe(false); });
  it('requires a stored reference image for image-guided generation', () => { expect(threeDRenderRequestSchema.safeParse({ prompt: 'Create a modular sci-fi room', mode: 'image_to_3d', camera: { position: [4, -5, 3], target: [0, 0, 1], fovDegrees: 50 } }).success).toBe(false); });
  it('allows a reviewed, enabled local candidate when hardware is ready', () => { expect(evaluateLocal3DModel(candidate, hardware).eligible).toBe(true); });
  it('keeps catalog-only candidates out of production routing', () => { expect(evaluateLocal3DModel({ ...candidate, enabled: false }, hardware).eligible).toBe(false); });
  it('blocks unknown dataset licenses even when weights are Apache-2.0', () => { expect(evaluateLocal3DModel({ ...candidate, datasetLicense: { spdxId: 'unknown', status: 'unknown' } }, hardware).eligible).toBe(false); });
});