import * as zod from "zod";

import { SettingsSchema } from "@/context/SettingsContext";

export const FORMAT_VERSION = 1;

export const BundleImageRefSchema = zod.union([
  zod.object({
    kind: zod.literal("google"),
    id: zod.string(),
    name: zod.string(),
    mimeType: zod.string(),
    path: zod.string().optional(),
  }),
  zod.object({
    kind: zod.literal("scryfall"),
    uri: zod.string(),
    name: zod.string(),
    mimeType: zod.string(),
    path: zod.string().optional(),
  }),
  zod.object({
    kind: zod.literal("local"),
    hash: zod.string(),
    fileName: zod.string(),
    mimeType: zod.string(),
    path: zod.string().optional(),
  }),
]);

export type BundleImageRef = zod.infer<typeof BundleImageRefSchema>;

/** Omit that distributes over a union instead of collapsing to shared keys. */
export type DistributiveOmit<T, K extends keyof never> = T extends unknown
  ? Omit<T, K>
  : never;

export const BundleCardBackSchema = zod.union([
  zod.object({
    kind: zod.literal("google"),
    id: zod.string(),
    name: zod.string(),
  }),
  zod.object({
    kind: zod.literal("scryfall"),
    uri: zod.string(),
    name: zod.string(),
  }),
  zod.object({
    kind: zod.literal("local"),
    hash: zod.string(),
    fileName: zod.string(),
    mimeType: zod.string(),
    path: zod.string().optional(),
  }),
]);

export type BundleCardBack = zod.infer<typeof BundleCardBackSchema>;

export const BundlePresetSchema = zod.object({
  name: zod.string().min(1),
  settings: SettingsSchema,
  basePdf: zod
    .object({
      name: zod.string(),
      pageCount: zod.number(),
      path: zod.string(),
    })
    .nullable(),
  defaultCardBack: BundleCardBackSchema.nullable(),
});

export type BundlePreset = zod.infer<typeof BundlePresetSchema>;

export const BundleSlotSchema = zod.object({
  front: zod.string().nullable(),
  back: zod.string().nullable(),
});

export type BundleSlot = zod.infer<typeof BundleSlotSchema>;

export const BundleProjectSchema = zod.object({
  name: zod.string().min(1),
  slots: zod.array(BundleSlotSchema),
});

export type BundleProject = zod.infer<typeof BundleProjectSchema>;

export const BundleManifestSchema = zod.object({
  format: zod.literal("proxy-print/bundle"),
  formatVersion: zod.literal(FORMAT_VERSION),
  presets: zod.array(BundlePresetSchema).optional(),
  projects: zod.array(BundleProjectSchema).optional(),
  settings: SettingsSchema.nullable().optional(),
  images: zod.record(zod.string(), BundleImageRefSchema),
});

export type BundleManifest = zod.infer<typeof BundleManifestSchema>;
