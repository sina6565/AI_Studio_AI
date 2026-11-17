import { z } from 'zod';
export const MODEL_LICENSE_PRIORITY = ['Apache-2.0', 'MIT'] as const;
export const THREE_D_OUTPUT_FORMAT = 'glb' as const;
export const modelLicenseSchema = z.object({ spdxId: z.string().min(1), status: z.enum(['verified', 'review_required', 'restricted', 'unknown']), sourceUrl: z.string().url().optional() }).strict();
export const modelDependencyLicenseSchema = z.object({ name: z.string().min(1), license: modelLicenseSchema }).strict();
export const local3DModelCandidateSchema = z.object({
  id: z.string().min(1), modelName: z.string().min(1), modelVersion: z.string().min(1),
  capabilities: z.array(z.enum(['text_to_3d', 'image_to_3d', 'voxel_scene', 'procedural_scene'])).min(1),
  weightsFormat: z.enum(['gguf', 'safetensors']), runtime: z.enum(['llama_cpp', 'transformers']),
  quantization: z.enum(['Q4_K_M', 'Q8_0', 'FP16']).optional(),
  visionProjector: z.boolean().default(false), processorConfig: z.boolean().default(false),
  baseModelLicense: modelLicenseSchema, weightsLicense: modelLicenseSchema, datasetLicense: modelLicenseSchema,
  dependencies: z.array(modelDependencyLicenseSchema).default([]),
  commercialUseReviewed: z.boolean().default(false), enabled: z.boolean().default(false),
}).strict().superRefine((candidate, context) => {
  if (candidate.weightsFormat === 'gguf' && candidate.runtime !== 'llama_cpp') context.addIssue({ code: z.ZodIssueCode.custom, path: ['runtime'], message: 'GGUF candidates must use the llama.cpp runtime.' });
  if (candidate.weightsFormat === 'safetensors' && candidate.runtime !== 'transformers') context.addIssue({ code: z.ZodIssueCode.custom, path: ['runtime'], message: 'Safetensors candidates must use the Transformers runtime.' });
  if (candidate.weightsFormat === 'gguf' && candidate.quantization === 'FP16') context.addIssue({ code: z.ZodIssueCode.custom, path: ['quantization'], message: 'FP16 is tracked as a Safetensors/Transformers path in this pipeline.' });
  if (candidate.weightsFormat === 'safetensors' && candidate.quantization && candidate.quantization !== 'FP16') context.addIssue({ code: z.ZodIssueCode.custom, path: ['quantization'], message: 'Q4_K_M and Q8_0 are GGUF quantization profiles.' });
  if (candidate.capabilities.includes('image_to_3d')) { const hasVision = candidate.runtime === 'llama_cpp' ? candidate.visionProjector : candidate.processorConfig; if (!hasVision) context.addIssue({ code: z.ZodIssueCode.custom, path: ['visionProjector'], message: 'Image-guided generation requires a compatible vision projector or Transformers processor configuration.' }); }
});
export const local3DHardwareSchema = z.object({ available: z.boolean(), runtimeInstalled: z.boolean(), modelFilePresent: z.boolean(), vramGb: z.number().nonnegative().default(0), ramGb: z.number().nonnegative().default(0) }).strict();
export const threeDRenderRequestSchema = z.object({ prompt: z.string().min(1).max(8000), mode: z.enum(['text_to_3d', 'image_to_3d', 'voxel_scene', 'procedural_scene']), referenceImageAssetId: z.string().min(1).optional(), outputFormat: z.literal(THREE_D_OUTPUT_FORMAT).default(THREE_D_OUTPUT_FORMAT), camera: z.object({ position: z.tuple([z.number(), z.number(), z.number()]), target: z.tuple([z.number(), z.number(), z.number()]), fovDegrees: z.number().min(20).max(120).default(50) }).strict() }).strict().superRefine((request, context) => { if (request.mode === 'image_to_3d' && !request.referenceImageAssetId) context.addIssue({ code: z.ZodIssueCode.custom, path: ['referenceImageAssetId'], message: 'Image-guided generation requires a stored reference image asset ID.' }); });
export type Local3DModelCandidate = z.infer<typeof local3DModelCandidateSchema>;
export type Local3DHardware = z.infer<typeof local3DHardwareSchema>;
export interface ThreeDModelEligibility { eligible: boolean; reasons: string[]; runtime: 'llama_cpp' | 'transformers'; outputFormat: typeof THREE_D_OUTPUT_FORMAT; }
/** Evaluates a local candidate only; this function never invokes a model or paid service. */
export function evaluateLocal3DModel(rawCandidate: unknown, rawHardware: unknown): ThreeDModelEligibility {
  const candidate = local3DModelCandidateSchema.parse(rawCandidate); const hardware = local3DHardwareSchema.parse(rawHardware); const reasons: string[] = [];
  const licenses = [candidate.baseModelLicense, candidate.weightsLicense, candidate.datasetLicense, ...candidate.dependencies.map(item => item.license)];
  if (licenses.some(license => license.status !== 'verified')) reasons.push('Every model, weights, dataset, and dependency license must be verified separately.');
  if (licenses.some(license => !MODEL_LICENSE_PRIORITY.includes(license.spdxId as typeof MODEL_LICENSE_PRIORITY[number]))) reasons.push('At least one license is outside the preferred Apache-2.0/MIT allowlist and requires owner review.');
  if (!candidate.commercialUseReviewed) reasons.push('Commercial-use review has not been approved.');
  if (!hardware.available || !hardware.runtimeInstalled || !hardware.modelFilePresent) reasons.push('A compatible local worker, runtime, and model file must all be available.');
  if (!candidate.enabled) reasons.push('The candidate is catalog-only and has not been explicitly enabled.');
  return { eligible: reasons.length === 0, reasons, runtime: candidate.runtime, outputFormat: THREE_D_OUTPUT_FORMAT };
}