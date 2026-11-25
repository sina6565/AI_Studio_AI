import { z } from 'zod';

const vector3 = z.tuple([z.number(), z.number(), z.number()]);
const positiveVector3 = z.tuple([
  z.number().positive(),
  z.number().positive(),
  z.number().positive(),
]);
const stableId = z.string().min(1).max(100);

export const browserGameAssetSchema = z.object({
  id: stableId,
  uri: z.string().min(1).max(2048),
  format: z.enum(['glb', 'gltf', 'png', 'jpg', 'webp', 'ktx2', 'audio']),
  license: z.object({
    spdx: z.string().min(1).max(100),
    sourceUrl: z.string().url().optional(),
    attribution: z.string().max(1000).optional(),
    commercialUse: z.enum(['allowed', 'prohibited', 'unverified']),
  }).strict(),
}).strict();

export const browserGameEntitySchema = z.object({
  id: stableId,
  kind: z.enum(['mesh', 'primitive', 'character', 'trigger']),
  assetId: stableId.optional(),
  primitive: z.enum(['box', 'sphere', 'capsule', 'plane', 'cylinder']).optional(),
  transform: z.object({
    position: vector3,
    rotationDegrees: vector3,
    scale: positiveVector3,
  }).strict(),
  collision: z.enum(['none', 'static', 'dynamic', 'trigger']).default('none'),
  tags: z.array(z.string().min(1).max(80)).max(30).default([]),
}).strict().superRefine((entity, context) => {
  if (entity.kind === 'primitive' && !entity.primitive) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['primitive'],
      message: 'Primitive entities must declare a supported primitive shape.',
    });
  }
  if ((entity.kind === 'mesh' || entity.kind === 'character') && !entity.assetId) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['assetId'],
      message: 'Mesh and character entities must reference a declared asset.',
    });
  }
});

export const browserGameSceneManifestSchema = z.object({
  schemaVersion: z.literal(1),
  project: z.object({
    id: stableId,
    title: z.string().min(1).max(120),
    description: z.string().max(4000).default(''),
    genre: z.string().min(1).max(80),
    target: z.enum(['web_desktop', 'web_mobile', 'web_responsive']),
  }).strict(),
  runtime: z.object({
    id: z.literal('threejs_r3f'),
    threeVersion: z.string().regex(/^\d+\.\d+\.\d+$/),
    reactThreeFiberMajorVersion: z.literal(8),
  }).strict(),
  world: z.object({
    units: z.literal('meters'),
    coordinateSystem: z.literal('right_handed_y_up'),
    bounds: positiveVector3,
    gravity: vector3.default([0, -9.81, 0]),
  }).strict(),
  camera: z.object({
    mode: z.enum(['perspective', 'orthographic']),
    position: vector3,
    target: vector3,
    fieldOfViewDegrees: z.number().min(10).max(120).default(60),
  }).strict(),
  assets: z.array(browserGameAssetSchema).max(500).default([]),
  entities: z.array(browserGameEntitySchema).max(2000).default([]),
  lights: z.array(z.object({
    id: stableId,
    kind: z.enum(['ambient', 'directional', 'point', 'spot']),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    intensity: z.number().min(0).max(10000),
    position: vector3.optional(),
    castShadow: z.boolean().default(false),
  }).strict()).max(100).default([]),
  input: z.object({
    desktop: z.array(z.object({
      action: stableId,
      keys: z.array(z.string().min(1).max(30)).max(8),
    }).strict()).max(50).default([]),
    touchControls: z.enum(['none', 'virtual_joystick', 'directional_pad', 'custom']).default('none'),
  }).strict(),
  gameplay: z.object({
    maxPlayers: z.number().int().min(1).max(16).default(1),
    objectives: z.array(z.object({
      id: stableId,
      event: z.enum(['collect', 'reach', 'activate', 'survive', 'score']),
      targetEntityId: stableId.optional(),
      count: z.number().int().positive().default(1),
    }).strict()).max(100).default([]),
    interactions: z.array(z.object({
      id: stableId,
      entityId: stableId,
      action: z.enum(['open', 'collect', 'activate', 'inspect', 'unlock']),
    }).strict()).max(200).default([]),
  }).strict(),
}).strict().superRefine((manifest, context) => {
  const assetIds = new Set(manifest.assets.map((asset) => asset.id));
  if (assetIds.size !== manifest.assets.length) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['assets'],
      message: 'Asset IDs must be unique.',
    });
  }

  const entityIds = new Set(manifest.entities.map((entity) => entity.id));
  if (entityIds.size !== manifest.entities.length) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['entities'],
      message: 'Entity IDs must be unique.',
    });
  }

  for (const [index, entity] of manifest.entities.entries()) {
    if (entity.assetId && !assetIds.has(entity.assetId)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['entities', index, 'assetId'],
        message: 'Entity assetId must reference a declared asset.',
      });
    }
  }

  for (const [index, interaction] of manifest.gameplay.interactions.entries()) {
    if (!entityIds.has(interaction.entityId)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['gameplay', 'interactions', index, 'entityId'],
        message: 'Interaction must reference a declared entity.',
      });
    }
  }

  for (const [index, objective] of manifest.gameplay.objectives.entries()) {
    if (objective.targetEntityId && !entityIds.has(objective.targetEntityId)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['gameplay', 'objectives', index, 'targetEntityId'],
        message: 'Objective target must reference a declared entity.',
      });
    }
  }
});

export type BrowserGameSceneManifest = z.infer<typeof browserGameSceneManifestSchema>;
