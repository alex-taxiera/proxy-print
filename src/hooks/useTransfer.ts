import { useQueryClient } from "@tanstack/react-query";
import { nanoid } from "nanoid";

import {
  GoogleImageData,
  ImageData,
  LocalImageData,
  ProjectsMap,
  ScryfallImageData,
  SlotInputData,
} from "@/context/ImagesContext";
import { getQueryKeyForImageData, ImageQueryData } from "@/queries/images";
import {
  BasePdfsMap,
  coerceSettings,
  PresetData,
  useSettingsStore,
} from "@/store/settingsStore";
import { downloadBlob } from "@/utils/download-blob";
import {
  hydrateImageQueryData,
  persistImageQueryData,
} from "@/utils/imageQueryCache";
import {
  BundleImageInput,
  buildBundle,
  BundlePresetInput,
  BundleProjectInput,
} from "@/utils/transfer/build-bundle";
import { bundleImageId } from "@/utils/transfer/image-id";
import { ParsedBundle, parseBundle } from "@/utils/transfer/parse-bundle";
import { resolveNameCollisions } from "@/utils/transfer/resolve-name-collisions";

export type ImportPreview = ParsedBundle & {
  presetNameMap: Map<string, string>;
  projectNameMap: Map<string, string>;
  missingLocalImageCount: number;
};

export function useTransfer() {
  const queryClient = useQueryClient();
  const presets = useSettingsStore((s) => s.presets);
  const basePdfs = useSettingsStore((s) => s.basePdfs);
  const projects = useSettingsStore((s) => s.projects);
  const importPresets = useSettingsStore((s) => s.importPresets);
  const importProjects = useSettingsStore((s) => s.importProjects);
  const importBasePdfs = useSettingsStore((s) => s.importBasePdfs);

  const getImageQueryData = async (
    image: ImageData,
  ): Promise<ImageQueryData | undefined> => {
    const queryKey = getQueryKeyForImageData(image);
    return (
      queryClient.getQueryData<ImageQueryData>(queryKey) ??
      (await hydrateImageQueryData(queryKey)) ??
      undefined
    );
  };

  const exportPresets = async (names: string[]) => {
    const presetInputs: BundlePresetInput[] = [];

    for (const name of names) {
      const preset = presets[name];
      if (!preset) continue;

      let defaultCardBack: BundlePresetInput["defaultCardBack"] = null;
      if (preset.defaultCardBack) {
        if ("file" in preset.defaultCardBack) {
          defaultCardBack = {
            kind: "local",
            hash: preset.defaultCardBack.hash,
            fileName: preset.defaultCardBack.file.name,
            mimeType: preset.defaultCardBack.file.type,
            blob: preset.defaultCardBack.file,
          };
        } else if ("id" in preset.defaultCardBack) {
          defaultCardBack = {
            kind: "google",
            id: preset.defaultCardBack.id,
            name: preset.defaultCardBack.name,
          };
        } else {
          defaultCardBack = {
            kind: "scryfall",
            uri: preset.defaultCardBack.uri,
            name: preset.defaultCardBack.name,
          };
        }
      }

      const basePdf = preset.basePdfId ? basePdfs[preset.basePdfId] : null;

      presetInputs.push({
        name,
        settings: preset.settings,
        basePdf: basePdf
          ? {
              name: basePdf.name,
              pageCount: basePdf.pageCount,
              bytes: basePdf.bytes,
            }
          : null,
        defaultCardBack,
      });
    }

    const blob = await buildBundle({ presets: presetInputs, images: [] });
    const fileName =
      presetInputs.length === 1
        ? `print-my-proxy-preset-${presetInputs[0].name}.zip`
        : `print-my-proxy-presets.zip`;
    downloadBlob(blob, fileName);
  };

  const exportProjects = async (names: string[], includeSettings: boolean) => {
    const projectInputs: BundleProjectInput[] = [];
    const imageInputs = new Map<string, BundleImageInput>();

    for (const name of names) {
      const project = projects[name];
      if (!project) continue;

      const slots: BundleProjectInput["slots"] = [];
      for (const slot of project.slots) {
        const slotIds: { front: string | null; back: string | null } = {
          front: null,
          back: null,
        };

        for (const side of ["front", "back"] as const) {
          const image = slot[side];
          if (!image) continue;

          const id = bundleImageId(image);
          slotIds[side] = id;

          if (!imageInputs.has(id)) {
            const queryData = await getImageQueryData(image);
            imageInputs.set(id, {
              id,
              ref: toImageRef(image, queryData?.mimeType ?? "image/png"),
              blob: queryData?.data ?? null,
            });
          }
        }

        slots.push(slotIds);
      }

      projectInputs.push({ name, slots });
    }

    const blob = await buildBundle({
      projects: projectInputs,
      settings: includeSettings ? useSettingsStore.getState().settings : null,
      images: Array.from(imageInputs.values()),
    });
    const fileName =
      projectInputs.length === 1
        ? `print-my-proxy-project-${projectInputs[0].name}.zip`
        : `print-my-proxy-projects.zip`;
    downloadBlob(blob, fileName);
  };

  const prepareImport = async (file: File): Promise<ImportPreview> => {
    const parsed = await parseBundle(file);

    const presetNameMap = resolveNameCollisions(
      Object.keys(presets),
      parsed.presets.map((p) => p.name),
      false,
    );
    const projectNameMap = resolveNameCollisions(
      Object.keys(projects),
      parsed.projects.map((p) => p.name),
      false,
    );

    const missingLocalImageCount =
      Object.values(parsed.images).filter(
        (img) => img.kind === "local" && !img.blob,
      ).length +
      parsed.presets.filter(
        (p) => p.defaultCardBack?.kind === "local" && !p.defaultCardBackBlob,
      ).length;

    return { ...parsed, presetNameMap, projectNameMap, missingLocalImageCount };
  };

  const applyImport = async (
    preview: ImportPreview,
    options: { overwrite: boolean; applySettings: boolean },
  ) => {
    const presetNameMap = options.overwrite
      ? resolveNameCollisions(
          [],
          preview.presets.map((p) => p.name),
          true,
        )
      : preview.presetNameMap;
    const projectNameMap = options.overwrite
      ? resolveNameCollisions(
          [],
          preview.projects.map((p) => p.name),
          true,
        )
      : preview.projectNameMap;

    const presetEntries: Record<string, PresetData> = {};
    const basePdfEntries: BasePdfsMap = {};
    for (const preset of preview.presets) {
      const resolvedName = presetNameMap.get(preset.name) ?? preset.name;

      let defaultCardBack: PresetData["defaultCardBack"] = null;
      if (preset.defaultCardBack) {
        if (preset.defaultCardBack.kind === "local") {
          if (preset.defaultCardBackBlob) {
            defaultCardBack = {
              hash: preset.defaultCardBack.hash,
              file: new File(
                [preset.defaultCardBackBlob],
                preset.defaultCardBack.fileName,
                { type: preset.defaultCardBack.mimeType },
              ),
            };
          }
        } else if (preset.defaultCardBack.kind === "google") {
          defaultCardBack = {
            id: preset.defaultCardBack.id,
            name: preset.defaultCardBack.name,
          };
        } else {
          defaultCardBack = {
            uri: preset.defaultCardBack.uri,
            name: preset.defaultCardBack.name,
          };
        }
      }

      let basePdfId: string | null = null;
      if (preset.basePdfBytes && preset.basePdf) {
        basePdfId = nanoid();
        basePdfEntries[basePdfId] = {
          name: preset.basePdf.name,
          bytes: preset.basePdfBytes,
          pageCount: preset.basePdf.pageCount,
        };
      }

      presetEntries[resolvedName] = {
        settings: coerceSettings(preset.settings) ?? preset.settings,
        basePdfId,
        defaultCardBack,
      };
    }
    if (Object.keys(basePdfEntries).length > 0) {
      importBasePdfs(basePdfEntries);
    }
    if (Object.keys(presetEntries).length > 0) importPresets(presetEntries);

    // Seed the persistent image cache so the normal project-load flow
    // (hydrate cache -> add slots -> download only what's missing) just works.
    const resolvedImages = new Map<string, ImageData | null>();
    for (const [id, ref] of Object.entries(preview.images)) {
      if (ref.kind === "local") {
        if (!ref.blob) {
          resolvedImages.set(id, null);
          continue;
        }
        const file = new File([ref.blob], ref.fileName, { type: ref.mimeType });
        const image: LocalImageData = { file, hash: ref.hash };
        await persistImageQueryData(getQueryKeyForImageData(image), {
          data: ref.blob,
          mimeType: ref.mimeType,
        });
        resolvedImages.set(id, image);
      } else if (ref.kind === "google") {
        const image: GoogleImageData = { id: ref.id, name: ref.name };
        if (ref.blob) {
          await persistImageQueryData(getQueryKeyForImageData(image), {
            data: ref.blob,
            mimeType: ref.mimeType,
          });
        }
        resolvedImages.set(id, image);
      } else {
        const image: ScryfallImageData = { uri: ref.uri, name: ref.name };
        if (ref.blob) {
          await persistImageQueryData(getQueryKeyForImageData(image), {
            data: ref.blob,
            mimeType: ref.mimeType,
          });
        }
        resolvedImages.set(id, image);
      }
    }

    const projectEntries: ProjectsMap = {};
    for (const project of preview.projects) {
      const resolvedName = projectNameMap.get(project.name) ?? project.name;
      const slots: SlotInputData[] = project.slots.map((slot) => ({
        front: slot.front ? (resolvedImages.get(slot.front) ?? null) : null,
        back: slot.back ? (resolvedImages.get(slot.back) ?? null) : null,
      }));
      projectEntries[resolvedName] = { slots };
    }
    if (Object.keys(projectEntries).length > 0) importProjects(projectEntries);

    if (options.applySettings && preview.settings) {
      const settings = coerceSettings(preview.settings);
      if (settings) {
        useSettingsStore.getState().setSettings(() => settings);
      }
    }
  };

  return { exportPresets, exportProjects, prepareImport, applyImport };
}

function toImageRef(
  image: ImageData,
  mimeType: string,
): BundleImageInput["ref"] {
  if ("id" in image) {
    return { kind: "google", id: image.id, name: image.name, mimeType };
  }
  if ("uri" in image) {
    return { kind: "scryfall", uri: image.uri, name: image.name, mimeType };
  }
  return {
    kind: "local",
    hash: image.hash,
    fileName: image.file.name,
    mimeType,
  };
}
