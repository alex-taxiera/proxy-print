import { get, set, del } from "idb-keyval";
import { nanoid } from "nanoid";
import { create } from "zustand";
import { persist, PersistStorage, StorageValue } from "zustand/middleware";

import {
  GoogleImageData,
  LocalImageData,
  ProjectsMap,
  ScryfallImageData,
  SlotInputData,
} from "@/context/ImagesContext";
import {
  DEFAULT_SETTINGS,
  Settings,
  SettingsSchema,
} from "@/context/SettingsContext";
import { invertHexColor } from "@/utils/invert-hex-color";

// ---------------------------------------------------------------------------
// IDB adapter — uses PersistStorage<T> (not StateStorage) so that Zustand
// never calls JSON.stringify/parse on the stored value. This allows native
// IDB structured-clone serialisation of Uint8Array (base PDF bytes).
// ---------------------------------------------------------------------------

function createIdbStorage<T>(): PersistStorage<T> {
  return {
    getItem: async (name) => {
      const value = await get<StorageValue<T>>(name);
      return value ?? null;
    },
    setItem: async (name, value) => {
      await set(name, value);
    },
    removeItem: async (name) => {
      await del(name);
    },
  };
}

// ---------------------------------------------------------------------------
// Persisted slice — what actually gets written to IDB (subset of full store)
// ---------------------------------------------------------------------------

export type BasePdfData = {
  name: string;
  bytes: Uint8Array;
  pageCount: number;
};

export type BasePdfsMap = Record<string, BasePdfData>;

export type PresetData = {
  settings: Settings;
  basePdfId: string | null;
  defaultCardBack: GoogleImageData | LocalImageData | ScryfallImageData | null;
};

export type PresetsMap = Record<string, PresetData>;

type PersistedSettings = {
  settings: Settings;
  basePdfs: BasePdfsMap;
  activeBasePdfId: string | null;
  defaultCardBack: GoogleImageData | LocalImageData | ScryfallImageData | null;
  presets: PresetsMap;
  activePresetName: string | null;
  projects: ProjectsMap;
};

// ---------------------------------------------------------------------------
// computeCssVars — extracted from SettingsProvider so consumers that only
// need CSS custom properties don't have to subscribe to the whole context.
// ---------------------------------------------------------------------------

export function computeCssVars(value: Settings): Record<string, string> {
  const enableBleedEdge = true; // value.enableBleedEdge
  const guideThickness = enableBleedEdge ? Number(value.guidesThickness) : 1;
  const imageContainerBuffer = enableBleedEdge ? guideThickness : 0;
  const guideLengthMm =
    Number(value.guideLength) > 0
      ? Number(value.guideLength)
      : enableBleedEdge
        ? Number(value.bleedEdge)
        : 0;

  return {
    "--page-unit": value.unit,
    "--page-width": `${value.pageWidth}${value.unit}`,
    "--page-height": `${value.pageHeight}${value.unit}`,
    "--grid-columns": value.numberOfColumns,
    "--bleed-edge": `${enableBleedEdge ? value.bleedEdge : 0}mm`,
    "--guides-color": value.guidesColor,
    "--guides-color-inverted": invertHexColor(value.guidesColor),
    "--guides-thickness": `${guideThickness}mm`,
    "--guides-at-bleed-edge": value.guidesAtBleedEdge ? "0" : "1",
    "--guides-display": value.guidesThickness !== "0" ? "block" : "none",
    "--guide-length": guideLengthMm > 0 ? `${guideLengthMm}mm` : "initial",
    "--image-container-buffer": `${imageContainerBuffer}mm`,
    "--image-zoom": enableBleedEdge ? "6.2mm" : "0mm",
    "--card-width": `${value.cardWidth}mm`,
    "--card-height": `${value.cardHeight}mm`,
    "--row-gap": `${value.rowGap}mm`,
    "--column-gap": `${value.columnGap}mm`,
  };
}

// ---------------------------------------------------------------------------
// Store types
// ---------------------------------------------------------------------------

export interface SettingsStoreState {
  settings: Settings;
  formState: Settings;
  basePdfs: BasePdfsMap;
  activeBasePdfId: string | null;
  defaultCardBack: GoogleImageData | LocalImageData | ScryfallImageData | null;
  presets: PresetsMap;
  activePresetName: string | null;
  projects: ProjectsMap;
  activeProjectName: string | null;
  _hasHydrated: boolean;
}

export interface SettingsStoreActions {
  setSettings: (updater: (old: Settings) => Settings) => void;
  setFormState: (next: Settings) => void;
  /** Adds a new base PDF to the library, sets it active, and returns its id. */
  addBasePdf: (data: {
    name: string;
    bytes: Uint8Array;
    pageCount: number;
  }) => string;
  renameBasePdf: (id: string, name: string) => void;
  deleteBasePdf: (id: string) => void;
  setActiveBasePdfId: (id: string | null) => void;
  /** Merge imported base PDFs into the map, without touching activeBasePdfId. */
  importBasePdfs: (entries: BasePdfsMap) => void;
  setDefaultCardBack: (
    data: GoogleImageData | LocalImageData | ScryfallImageData | null,
  ) => void;
  savePreset: (name: string) => void;
  loadPreset: (name: string) => void;
  deletePreset: (name: string) => void;
  /** Merge imported presets into the map, keyed by name, without touching activePresetName. */
  importPresets: (entries: Record<string, PresetData>) => void;
  saveProject: (name: string, slots: SlotInputData[]) => void;
  deleteProject: (name: string) => void;
  /** Merge imported projects into the map, keyed by name, without touching activeProjectName. */
  importProjects: (entries: ProjectsMap) => void;
  setActiveProjectName: (name: string | null) => void;
  setHasHydrated: (value: boolean) => void;
}

export type SettingsStore = SettingsStoreState & SettingsStoreActions;

// ---------------------------------------------------------------------------
// coerceSettings — lenient validation used both for the legacy localStorage
// migration and for settings arriving from an imported bundle, so a bundle
// exported by a slightly different app version can still be applied.
// ---------------------------------------------------------------------------

export function coerceSettings(raw: unknown): Settings | null {
  const { data, success } = SettingsSchema.safeParse(raw);
  if (success) {
    return data;
  }
  try {
    return SettingsSchema.parse({
      ...DEFAULT_SETTINGS,
      ...(raw as Settings),
    });
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Load initial settings — one-time migration from localStorage if present
// ---------------------------------------------------------------------------

function loadInitialSettings(): Settings {
  try {
    const raw = localStorage.getItem("settings");
    if (raw) {
      const parsed = JSON.parse(raw) as unknown;
      const coerced = coerceSettings(parsed);
      localStorage.removeItem("settings");
      if (coerced) {
        return coerced;
      }
    }
  } catch {
    // ignore
  }
  return DEFAULT_SETTINGS;
}

// ---------------------------------------------------------------------------
// Zustand store
// ---------------------------------------------------------------------------

const applyValidKeysToSettings = (
  current: Settings,
  next: Settings,
): Settings => {
  const updatedSettings = { ...current, ...next };
  const { data, success, error } = SettingsSchema.safeParse(updatedSettings);
  if (success) {
    return data;
  }
  const validKeys = Object.keys(updatedSettings).filter(
    (key) => !error.issues?.some((issue) => issue.path.includes(key)),
  );
  return {
    ...current,
    ...Object.fromEntries(
      validKeys.map((key) => [key, updatedSettings[key as keyof Settings]]),
    ),
  };
};

export const selectActiveBasePdf = (s: SettingsStore): BasePdfData | null =>
  s.activeBasePdfId ? (s.basePdfs[s.activeBasePdfId] ?? null) : null;

export const selectIsPresetDirty = (s: SettingsStore): boolean => {
  if (!s.activePresetName) return false;
  const preset = s.presets[s.activePresetName];
  if (!preset) return false;
  return JSON.stringify(s.formState) !== JSON.stringify(preset.settings);
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => {
      const initialSettings = loadInitialSettings();
      return {
        settings: initialSettings,
        formState: initialSettings,
        basePdfs: {},
        activeBasePdfId: null,
        defaultCardBack: null,
        presets: {},
        activePresetName: null,
        projects: {},
        activeProjectName: null,
        _hasHydrated: false,

        setSettings: (updater) =>
          set((state) => {
            const newSettings = updater(state.settings);
            return { settings: newSettings, formState: newSettings };
          }),

        setFormState: (next) =>
          set((state) => ({
            formState: next,
            settings: applyValidKeysToSettings(state.settings, next),
          })),

        addBasePdf: (data) => {
          const id = nanoid();
          set((state) => ({
            basePdfs: { ...state.basePdfs, [id]: data },
            activeBasePdfId: id,
          }));
          return id;
        },

        renameBasePdf: (id, name) =>
          set((state) => {
            const existing = state.basePdfs[id];
            if (!existing) return {};
            return {
              basePdfs: { ...state.basePdfs, [id]: { ...existing, name } },
            };
          }),

        deleteBasePdf: (id) =>
          set((state) => {
            const remaining = Object.fromEntries(
              Object.entries(state.basePdfs).filter(([k]) => k !== id),
            );
            return {
              basePdfs: remaining,
              activeBasePdfId:
                state.activeBasePdfId === id ? null : state.activeBasePdfId,
            };
          }),

        setActiveBasePdfId: (id) => set({ activeBasePdfId: id }),

        importBasePdfs: (entries) =>
          set((state) => ({
            basePdfs: { ...state.basePdfs, ...entries },
          })),

        setDefaultCardBack: (data) => {
          set({ defaultCardBack: data });
        },

        savePreset: (name) =>
          set((state) => ({
            presets: {
              ...state.presets,
              [name]: {
                settings: state.formState,
                basePdfId: state.activeBasePdfId,
                defaultCardBack: state.defaultCardBack,
              },
            },
            settings: applyValidKeysToSettings(state.settings, state.formState),
            activePresetName: name,
          })),

        loadPreset: (name) =>
          set((state) => {
            const preset = state.presets[name];
            if (!preset) return {};
            return {
              settings: preset.settings,
              formState: preset.settings,
              activeBasePdfId: preset.basePdfId,
              defaultCardBack: preset.defaultCardBack,
              activePresetName: name,
            };
          }),

        deletePreset: (name) =>
          set((state) => {
            const remaining = Object.fromEntries(
              Object.entries(state.presets).filter(([k]) => k !== name),
            );
            return {
              presets: remaining,
              activePresetName:
                state.activePresetName === name ? null : state.activePresetName,
            };
          }),

        importPresets: (entries) =>
          set((state) => ({
            presets: { ...state.presets, ...entries },
          })),

        saveProject: (name, slots) =>
          set((state) => ({
            projects: {
              ...state.projects,
              [name]: { slots },
            },
            activeProjectName: name,
          })),

        deleteProject: (name) =>
          set((state) => ({
            projects: Object.fromEntries(
              Object.entries(state.projects).filter(([k]) => k !== name),
            ),
            activeProjectName:
              state.activeProjectName === name ? null : state.activeProjectName,
          })),

        importProjects: (entries) =>
          set((state) => ({
            projects: { ...state.projects, ...entries },
          })),

        setActiveProjectName: (name) => set({ activeProjectName: name }),

        setHasHydrated: (value) => set({ _hasHydrated: value }),
      };
    },
    {
      name: "proxy-print-settings",
      version: 11,
      storage: createIdbStorage<PersistedSettings>(),
      migrate: (persistedState, version) => {
        if (!persistedState) {
          return persistedState as SettingsStore;
        }

        const state = persistedState as Partial<SettingsStore>;

        if (version < 5) {
          return {
            ...state,
            settings: {
              ...DEFAULT_SETTINGS,
              ...state.settings,
            },
            presets: {},
            activePresetName: null,
            projects: {},
          } as SettingsStore;
        }

        if (version < 6) {
          return {
            ...state,
            presets: {},
            activePresetName: null,
            projects: {},
          } as SettingsStore;
        }

        if (version < 7) {
          return {
            ...state,
            projects: {},
          } as SettingsStore;
        }

        if (version < 8) {
          return {
            ...state,
            activeProjectName: null,
          } as SettingsStore;
        }

        if (version < 9) {
          return {
            ...state,
            activeProjectName: null,
          } as SettingsStore;
        }

        if (version < 10) {
          return {
            ...state,
            settings: {
              ...DEFAULT_SETTINGS,
              ...state.settings,
            },
            presets: Object.fromEntries(
              Object.entries(state.presets ?? {}).map(([name, preset]) => [
                name,
                {
                  ...preset,
                  settings: {
                    ...DEFAULT_SETTINGS,
                    ...preset.settings,
                  },
                },
              ]),
            ),
          } as SettingsStore;
        }

        if (version < 11) {
          const legacy = persistedState as {
            basePdfBytes?: Uint8Array | null;
            basePdfName?: string | null;
            basePdfPageCount?: number | null;
            presets?: Record<
              string,
              {
                settings?: Settings;
                basePdfBytes?: Uint8Array | null;
                basePdfName?: string | null;
                basePdfPageCount?: number | null;
                defaultCardBack?: PresetData["defaultCardBack"];
              }
            >;
          };

          const basePdfs: BasePdfsMap = {};
          const idForBasePdf = new Map<string, string>();

          const registerBasePdf = (
            bytes: Uint8Array | null | undefined,
            name: string | null | undefined,
            pageCount: number | null | undefined,
          ): string | null => {
            if (!bytes || !name) return null;
            const key = `${name}:${bytes.length}`;
            const existing = idForBasePdf.get(key);
            if (existing) return existing;
            const id = nanoid();
            idForBasePdf.set(key, id);
            basePdfs[id] = { name, bytes, pageCount: pageCount ?? 0 };
            return id;
          };

          const activeBasePdfId = registerBasePdf(
            legacy.basePdfBytes,
            legacy.basePdfName,
            legacy.basePdfPageCount,
          );

          const presets = Object.fromEntries(
            Object.entries(legacy.presets ?? {}).map(([name, preset]) => [
              name,
              {
                settings: preset.settings,
                defaultCardBack: preset.defaultCardBack ?? null,
                basePdfId: registerBasePdf(
                  preset.basePdfBytes,
                  preset.basePdfName,
                  preset.basePdfPageCount,
                ),
              },
            ]),
          );

          return {
            ...state,
            basePdfs,
            activeBasePdfId,
            presets,
          } as SettingsStore;
        }

        return persistedState as SettingsStore;
      },
      partialize: (state) => ({
        settings: state.settings,
        basePdfs: state.basePdfs,
        activeBasePdfId: state.activeBasePdfId,
        defaultCardBack: state.defaultCardBack,
        presets: state.presets,
        activePresetName: state.activePresetName,
        projects: state.projects,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
        // Sync formState to the persisted settings now that they've loaded.
        if (state) {
          state.setFormState(state.settings);
        }
      },
    },
  ),
);
