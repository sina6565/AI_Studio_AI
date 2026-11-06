import { z } from 'zod';

export const UE5_ENGINE_ID = 'unreal_engine_5' as const;
export const UE5_ENGINE_MAJOR_VERSION = 5 as const;

const vector3 = z.tuple([z.number(), z.number(), z.number()]);
const positiveVector3 = z.tuple([z.number().positive(), z.number().positive(), z.number().positive()]);

export const roomPropSchema = z.object({
  id: z.string().min(1).max(100),
  role: z.string().min(1).max(300),
  dimensionsMeters: positiveVector3,
  attachment: z.enum(['floor', 'wall', 'ceiling', 'freestanding']),
  semanticFront: z.enum(['positive_x', 'negative_x', 'positive_y', 'negative_y', 'positive_z', 'negative_z']),
  reusable: z.boolean().default(true),
  source: z.enum(['procedural_blender', 'approved_local_asset', 'free_provider_asset']),
  sourceAsset: z.string().optional(),
  transform: z.object({ location: vector3, rotationDegrees: vector3, scale: positiveVector3 }).strict(),
}).strict();

export const roomOpeningSchema = z.object({
  id: z.string().min(1).max(100),
  kind: z.enum(['door', 'window', 'deep_alcove']),
  wallId: z.string().min(1),
  widthMeters: z.number().positive(),
  heightMeters: z.number().positive(),
  depthMeters: z.number().nonnegative().optional(),
  sillMeters: z.number().nonnegative().optional(),
  destination: z.string().min(1),
  traversable: z.boolean(),
  collisionEnabled: z.boolean(),
  navigationEnabled: z.boolean(),
}).strict().superRefine((opening, context) => {
  if (opening.kind === 'deep_alcove' && (opening.depthMeters ?? 0) < Math.max(0.35, opening.heightMeters * 0.15)) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['depthMeters'], message: 'Deep alcoves require real recess depth.' });
  }
  if (opening.traversable && (!opening.collisionEnabled || !opening.navigationEnabled)) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['traversable'], message: 'Traversable openings must agree with collision and navigation.' });
  }
  if (opening.kind === 'window' && opening.traversable) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['traversable'], message: 'Windows cannot be declared as traversable doors.' });
  }
});

export const ue5RoomManifestSchema = z.object({
  schemaVersion: z.literal(1),
  project: z.object({
    title: z.string().min(1).max(120),
    description: z.string().min(1).max(4000),
    genre: z.string().min(1).max(80),
    targetPlatforms: z.array(z.enum(['windows', 'linux', 'mac', 'android', 'ios'])).min(1),
  }).strict(),
  engine: z.object({
    id: z.literal(UE5_ENGINE_ID),
    majorVersion: z.literal(UE5_ENGINE_MAJOR_VERSION),
    minimumMinorVersion: z.number().int().nonnegative().default(0),
  }).strict(),
  room: z.object({
    id: z.string().min(1).max(100),
    purpose: z.string().min(1).max(1000),
    boundsMeters: positiveVector3,
    heroObjectId: z.string().min(1),
    playerSpawn: vector3,
    productionCamera: z.object({ location: vector3, target: vector3, verticalFovDegrees: z.number().min(20).max(120) }).strict(),
    symmetry: z.object({
      mode: z.enum(['none', 'bilateral', 'radial']),
      order: z.number().int().positive(),
      exceptions: z.array(z.string()),
    }).strict(),
  }).strict(),
  assets: z.array(roomPropSchema),
  openings: z.array(roomOpeningSchema),
  gameplay: z.object({
    movement: z.enum(['third_person', 'first_person', 'top_down', 'custom']),
    collisionRequired: z.literal(true),
    navigationRequired: z.literal(true),
    respawnPoints: z.array(vector3).default([]),
    interactions: z.array(z.object({
      id: z.string().min(1),
      action: z.enum(['open', 'collect', 'activate', 'inspect', 'unlock']),
      targetId: z.string().min(1),
    }).strict()).default([]),
  }).strict(),
  pipeline: z.object({
    roomAuthoring: z.literal('blender'),
    runtime: z.literal('unreal_engine_5'),
    meshGeneration: z.enum(['procedural_first', 'approved_free_assets_only']),
    paidServicesAllowed: z.literal(false),
    gates: z.object({
      functionApproved: z.boolean().default(false),
      formApproved: z.boolean().default(false),
      runtimeApproved: z.boolean().default(false),
    }).strict(),
  }).strict(),
}).strict().superRefine((manifest, context) => {
  const ids = new Set(manifest.assets.map(asset => asset.id));
  if (!ids.has(manifest.room.heroObjectId)) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['room', 'heroObjectId'], message: 'Hero object must reference a declared asset.' });
  }
  const openingIds = new Set();
  for (const opening of manifest.openings) {
    if (openingIds.has(opening.id)) context.addIssue({ code: z.ZodIssueCode.custom, path: ['openings'], message: 'Opening IDs must be unique.' });
    openingIds.add(opening.id);
  }
  if (manifest.pipeline.gates.formApproved && !manifest.pipeline.gates.functionApproved) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['pipeline', 'gates'], message: 'Form approval requires Function approval.' });
  }
  if (manifest.pipeline.gates.runtimeApproved && !manifest.pipeline.gates.formApproved) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['pipeline', 'gates'], message: 'Runtime approval requires Form approval.' });
  }
});

export type UE5RoomManifest = z.infer<typeof ue5RoomManifestSchema>;

export const game3DBuildInputSchema = z.object({
  manifest: ue5RoomManifestSchema,
  projectId: z.string().optional(),
}).strict();

export type Game3DBuildInput = z.infer<typeof game3DBuildInputSchema>;
