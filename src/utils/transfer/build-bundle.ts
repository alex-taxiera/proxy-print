import JSZip from "jszip";

import { Settings } from "@/context/SettingsContext";

import {
  BundleCardBack,
  BundleImageRef,
  BundleManifest,
  BundlePreset,
  BundleProject,
  DistributiveOmit,
  FORMAT_VERSION,
} from "./schema";

export type BundleImageInput = {
  id: string;
  ref: DistributiveOmit<BundleImageRef, "path">;
  blob: Blob | null;
};

export type BundlePresetInput = {
  name: string;
  settings: Settings;
  basePdf: { name: string; pageCount: number; bytes: Uint8Array } | null;
  defaultCardBack:
    | { kind: "google"; id: string; name: string }
    | { kind: "scryfall"; uri: string; name: string }
    | {
        kind: "local";
        hash: string;
        fileName: string;
        mimeType: string;
        blob: Blob;
      }
    | null;
};

export type BundleProjectInput = {
  name: string;
  slots: { front: string | null; back: string | null }[];
};

export type BuildBundleInput = {
  presets?: BundlePresetInput[];
  projects?: BundleProjectInput[];
  settings?: Settings | null;
  images: BundleImageInput[];
};

const extensionFromMimeType = (mimeType: string) => {
  const ext = mimeType.split("/").pop();
  return ext ? `.${ext}` : "";
};

// JSZip's Blob handling depends on browser-only feature detection (FileReader
// etc.), so file contents are always added as ArrayBuffer, which every
// environment (browser + Node/vitest) supports identically.
const addFile = async (zip: JSZip, path: string, blob: Blob) => {
  zip.file(path, await blob.arrayBuffer());
};

export const buildBundle = async (input: BuildBundleInput): Promise<Blob> => {
  const zip = new JSZip();
  const images: Record<string, BundleImageRef> = {};

  for (const image of input.images) {
    if (image.blob) {
      const path = `images/${image.id}${extensionFromMimeType(image.ref.mimeType)}`;
      await addFile(zip, path, image.blob);
      images[image.id] = { ...image.ref, path };
    } else {
      images[image.id] = { ...image.ref };
    }
  }

  const presets: BundlePreset[] = [];
  for (const [index, preset] of (input.presets ?? []).entries()) {
    let basePdf: BundlePreset["basePdf"] = null;
    if (preset.basePdf) {
      const path = `presets/${index}/base.pdf`;
      zip.file(path, preset.basePdf.bytes);
      basePdf = {
        name: preset.basePdf.name,
        pageCount: preset.basePdf.pageCount,
        path,
      };
    }

    let defaultCardBack: BundleCardBack | null = null;
    if (preset.defaultCardBack) {
      if (preset.defaultCardBack.kind === "local") {
        const cardBack = preset.defaultCardBack;
        const path = `presets/${index}/card-back${extensionFromMimeType(cardBack.mimeType)}`;
        await addFile(zip, path, cardBack.blob);
        defaultCardBack = {
          kind: "local",
          hash: cardBack.hash,
          fileName: cardBack.fileName,
          mimeType: cardBack.mimeType,
          path,
        };
      } else {
        defaultCardBack = preset.defaultCardBack;
      }
    }

    presets.push({
      name: preset.name,
      settings: preset.settings,
      basePdf,
      defaultCardBack,
    });
  }

  const projects: BundleProject[] = (input.projects ?? []).map((project) => ({
    name: project.name,
    slots: project.slots,
  }));

  const manifest: BundleManifest = {
    format: "proxy-print/bundle",
    formatVersion: FORMAT_VERSION,
    ...(input.presets ? { presets } : {}),
    ...(input.projects ? { projects } : {}),
    settings: input.settings ?? null,
    images,
  };

  zip.file("manifest.json", JSON.stringify(manifest));

  const arrayBuffer = await zip.generateAsync({
    type: "arraybuffer",
    compression: "STORE",
  });
  return new Blob([arrayBuffer], { type: "application/zip" });
};
