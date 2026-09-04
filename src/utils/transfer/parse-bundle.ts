import JSZip from "jszip";

import {
  BundleManifest,
  BundleManifestSchema,
  BundlePreset,
  BundleProject,
} from "./schema";

export class BundleParseError extends Error {}

export type ParsedBundlePreset = BundlePreset & {
  basePdfBytes: Uint8Array | null;
  defaultCardBackBlob: Blob | null;
};

export type ParsedBundleImage = BundleManifest["images"][string] & {
  blob: Blob | null;
};

export type ParsedBundle = {
  presets: ParsedBundlePreset[];
  projects: BundleProject[];
  settings: BundleManifest["settings"];
  images: Record<string, ParsedBundleImage>;
};

// Read via ArrayBuffer rather than JSZip's "blob" type — the latter depends
// on browser-only feature detection (FileReader etc.) that Node/vitest lacks.
const readFile = async (
  zip: JSZip,
  path: string,
): Promise<ArrayBuffer | null> => {
  const entry = zip.file(path);
  if (!entry) return null;
  return entry.async("arraybuffer");
};

export const parseBundle = async (file: Blob | File): Promise<ParsedBundle> => {
  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(await file.arrayBuffer());
  } catch {
    throw new BundleParseError("Not a valid Print My Proxy bundle file");
  }

  const manifestEntry = zip.file("manifest.json");
  if (!manifestEntry) {
    throw new BundleParseError("Bundle is missing manifest.json");
  }

  let manifestJson: unknown;
  try {
    manifestJson = JSON.parse(await manifestEntry.async("text"));
  } catch {
    throw new BundleParseError("Bundle manifest is not valid JSON");
  }

  const {
    data: manifest,
    success,
    error,
  } = BundleManifestSchema.safeParse(manifestJson);
  if (!success) {
    const versionIssue = error.issues.find((issue) =>
      issue.path.includes("formatVersion"),
    );
    if (versionIssue) {
      throw new BundleParseError(
        "This bundle was exported from a newer or incompatible version of Print My Proxy",
      );
    }
    throw new BundleParseError("Bundle manifest is malformed");
  }

  const images: Record<string, ParsedBundleImage> = {};
  for (const [id, ref] of Object.entries(manifest.images)) {
    const data = ref.path ? await readFile(zip, ref.path) : null;
    const blob = data ? new Blob([data], { type: ref.mimeType }) : null;
    images[id] = { ...ref, blob };
  }

  const presets: ParsedBundlePreset[] = [];
  for (const preset of manifest.presets ?? []) {
    const basePdfData = preset.basePdf
      ? await readFile(zip, preset.basePdf.path)
      : null;
    const cardBackMimeType =
      preset.defaultCardBack?.kind === "local"
        ? preset.defaultCardBack.mimeType
        : undefined;
    const defaultCardBackData =
      preset.defaultCardBack?.kind === "local" && preset.defaultCardBack.path
        ? await readFile(zip, preset.defaultCardBack.path)
        : null;

    presets.push({
      ...preset,
      basePdfBytes: basePdfData ? new Uint8Array(basePdfData) : null,
      defaultCardBackBlob: defaultCardBackData
        ? new Blob([defaultCardBackData], { type: cardBackMimeType })
        : null,
    });
  }

  return {
    presets,
    projects: manifest.projects ?? [],
    settings: manifest.settings ?? null,
    images,
  };
};
