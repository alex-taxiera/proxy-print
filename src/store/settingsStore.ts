import { get, set, del } from "idb-keyval";
import { create } from "zustand";
import { persist, PersistStorage, StorageValue } from "zustand/middleware";

import {
  GoogleImageData,
  LocalImageData,
  ScryfallImageData,
} from "~/context/ImagesContext";
import {
  DEFAULT_SETTINGS,
  Settings,
  SettingsSchema,
} from "~/context/SettingsContext";
import { invertHexColor } from "~/utils/invert-hex-color";

// ---------------------------------------------------------------------------
// IDB adapter — uses PersistStorage<T> (not StateStorage) so that Zustand
// never calls JSON.stringify/parse on the stored value. This allows native
// IDB structured-clone serialisation of Uint8Array (basePdfBytes).
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

type PersistedSettings = {
  settings: Settings;
  basePdfBytes: Uint8Array | null;
  basePdfName: string | null;
  basePdfPageCount: number | null;
  defaultCardBack: GoogleImageData | LocalImageData | ScryfallImageData | null;
};

// ---------------------------------------------------------------------------
// computeCssVars — extracted from SettingsProvider so consumers that only
// need CSS custom properties don't have to subscribe to the whole context.
// ---------------------------------------------------------------------------

export function computeCssVars(value: Settings): Record<string, string> {
  const enableBleedEdge = true; // value.enableBleedEdge
  const guideThickness = enableBleedEdge ? Number(value.guidesThickness) : 1;
  const imageContainerBuffer = enableBleedEdge ? guideThickness : 0;

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
  basePdfBytes: Uint8Array | null;
  basePdfName: string | null;
  basePdfPageCount: number | null;
  defaultCardBack: GoogleImageData | LocalImageData | ScryfallImageData | null;
  _hasHydrated: boolean;
}

export interface SettingsStoreActions {
  setSettings: (updater: (old: Settings) => Settings) => void;
  setBasePdf: (
    data: { bytes: Uint8Array; name: string; pageCount: number } | null,
  ) => void;
  setDefaultCardBack: (
    data: GoogleImageData | LocalImageData | ScryfallImageData | null,
  ) => void;
  setHasHydrated: (value: boolean) => void;
}

export type SettingsStore = SettingsStoreState & SettingsStoreActions;

// ---------------------------------------------------------------------------
// Load initial settings — one-time migration from localStorage if present
// ---------------------------------------------------------------------------

function loadInitialSettings(): Settings {
  try {
    const raw = localStorage.getItem("settings");
    if (raw) {
      const parsed = JSON.parse(raw) as unknown;
      const { data, success } = SettingsSchema.safeParse(parsed);
      if (success) {
        // Migrate: remove legacy localStorage entry once we've read it
        localStorage.removeItem("settings");
        return data;
      }
      // Try a lenient merge
      try {
        const merged = SettingsSchema.parse({
          ...DEFAULT_SETTINGS,
          ...(parsed as Settings),
        });
        localStorage.removeItem("settings");
        return merged;
      } catch {
        localStorage.removeItem("settings");
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

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      settings: loadInitialSettings(),
      basePdfBytes: null,
      basePdfName: null,
      basePdfPageCount: null,
      defaultCardBack: null,
      _hasHydrated: false,

      setSettings: (updater) =>
        set((state) => ({ settings: updater(state.settings) })),

      setBasePdf: (data) => {
        if (data === null) {
          set({
            basePdfBytes: null,
            basePdfName: null,
            basePdfPageCount: null,
          });
        } else {
          set({
            basePdfBytes: data.bytes,
            basePdfName: data.name,
            basePdfPageCount: data.pageCount,
          });
        }
      },

      setDefaultCardBack: (data) => {
        set({ defaultCardBack: data });
      },

      setHasHydrated: (value) => set({ _hasHydrated: value }),
    }),
    {
      name: "proxy-print-settings",
      version: 3,
      storage: createIdbStorage<PersistedSettings>(),
      migrate: (persistedState, version) => {
        if (!persistedState) {
          return persistedState as SettingsStore;
        }

        const state = persistedState as Partial<SettingsStore>;

        if (version < 2) {
          return {
            ...state,
            settings: {
              ...DEFAULT_SETTINGS,
              ...state.settings,
            },
            defaultCardBack: null,
          } as SettingsStore;
        }

        if (version < 3) {
          // Merge DEFAULT_SETTINGS so any newly-added fields get their defaults
          // when loading persisted state that predates them.
          return {
            ...state,
            settings: {
              ...DEFAULT_SETTINGS,
              ...state.settings,
            },
          } as SettingsStore;
        }

        return persistedState as SettingsStore;
      },
      // Only persist settings + base PDF data. _hasHydrated is always runtime-only.
      partialize: (state) => ({
        settings: state.settings,
        basePdfBytes: state.basePdfBytes,
        basePdfName: state.basePdfName,
        basePdfPageCount: state.basePdfPageCount,
        defaultCardBack: state.defaultCardBack,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
