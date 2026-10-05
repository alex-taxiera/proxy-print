import { describe, expect, it } from "vitest";

import {
  DEFAULT_SETTINGS,
  Settings,
  SettingsSchema,
} from "@/context/SettingsContext";
import { migrateUpscaleSettingV12 } from "@/store/settingsStore";

import {
  migrateLegacyUpscaleSetting,
  resolveUpscaleMethod,
} from "./upscale-methods";

const legacySettings = (upscaleScryfallImages: boolean) => {
  const legacy: Record<string, unknown> = {
    ...DEFAULT_SETTINGS,
    upscaleScryfallImages,
  };
  delete legacy.upscaleMethod;
  return legacy as unknown as Settings;
};

describe("migrateLegacyUpscaleSetting", () => {
  it("maps an enabled checkbox to anime-fast", () => {
    expect(migrateLegacyUpscaleSetting(legacySettings(true))).toEqual({
      ...DEFAULT_SETTINGS,
      upscaleMethod: "anime-fast",
    });
  });

  it("maps a disabled checkbox to none", () => {
    expect(migrateLegacyUpscaleSetting(legacySettings(false))).toEqual({
      ...DEFAULT_SETTINGS,
      upscaleMethod: "none",
    });
  });

  it("lets the legacy key win over a merged-in default", () => {
    expect(
      migrateLegacyUpscaleSetting({
        upscaleMethod: "none",
        upscaleScryfallImages: true,
      }),
    ).toEqual({ upscaleMethod: "anime-fast" });
  });

  it("leaves current settings and non-objects untouched", () => {
    expect(migrateLegacyUpscaleSetting(DEFAULT_SETTINGS)).toBe(
      DEFAULT_SETTINGS,
    );
    expect(migrateLegacyUpscaleSetting(null)).toBeNull();
    expect(migrateLegacyUpscaleSetting("x")).toBe("x");
  });

  it("is applied when parsing settings", () => {
    expect(SettingsSchema.parse(legacySettings(true)).upscaleMethod).toBe(
      "anime-fast",
    );
  });
});

describe("migrateUpscaleSettingV12", () => {
  it("migrates the active settings and every preset", () => {
    const migrated = migrateUpscaleSettingV12({
      settings: legacySettings(true),
      presets: {
        on: {
          settings: legacySettings(true),
          basePdfId: null,
          defaultCardBack: null,
        },
        off: {
          settings: legacySettings(false),
          basePdfId: null,
          defaultCardBack: null,
        },
      },
    });

    expect(migrated.settings?.upscaleMethod).toBe("anime-fast");
    expect(migrated.settings).not.toHaveProperty("upscaleScryfallImages");
    expect(migrated.presets?.on.settings.upscaleMethod).toBe("anime-fast");
    expect(migrated.presets?.off.settings.upscaleMethod).toBe("none");
  });
});

describe("resolveUpscaleMethod", () => {
  it("falls back to bicubic when upscaling is off", () => {
    expect(resolveUpscaleMethod("none")).toBe("bicubic");
    expect(resolveUpscaleMethod("anime-fast")).toBe("anime-fast");
  });
});
