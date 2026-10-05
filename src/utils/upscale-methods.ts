export const UPSCALE_SETTING_VALUES = [
  "none",
  "bicubic",
  "lanczos",
  "anime-fast",
] as const;

export type UpscaleSettingValue = (typeof UPSCALE_SETTING_VALUES)[number];

export type UpscaleMethod = Exclude<UpscaleSettingValue, "none">;

export const UPSCALE_METHODS = [
  "bicubic",
  "lanczos",
  "anime-fast",
] as const satisfies readonly UpscaleMethod[];

export const UPSCALE_METHOD_LABELS = {
  none: "None",
  bicubic: "Bicubic",
  lanczos: "Lanczos",
  "anime-fast": "anime-fast (AI)",
} as const satisfies Record<UpscaleSettingValue, string>;

/** Short names for inline use, e.g. "Upscale (Bicubic)". */
export const UPSCALE_METHOD_SHORT_LABELS = {
  bicubic: "Bicubic",
  lanczos: "Lanczos",
  "anime-fast": "anime-fast",
} as const satisfies Record<UpscaleMethod, string>;

/** Methods that run on the GPU via TensorFlow.js and need WebGL or WebGPU. */
export const isAiUpscaleMethod = (method: UpscaleSettingValue) =>
  method === "anime-fast";

/** The method used by one-off "Upscale" actions; "none" falls back to bicubic. */
export const resolveUpscaleMethod = (
  setting: UpscaleSettingValue,
): UpscaleMethod => (setting === "none" ? "bicubic" : setting);

/**
 * Settings before persist v12 stored a boolean `upscaleScryfallImages` that
 * always meant the anime-fast model. Map it onto `upscaleMethod` and drop the
 * legacy key. The legacy key wins when present, since merges like
 * `{ ...DEFAULT_SETTINGS, ...legacy }` inject a default `upscaleMethod` first.
 */
export const migrateLegacyUpscaleSetting = (raw: unknown): unknown => {
  if (
    typeof raw !== "object" ||
    raw === null ||
    !("upscaleScryfallImages" in raw)
  ) {
    return raw;
  }

  const { upscaleScryfallImages, ...rest } = raw as Record<string, unknown>;

  return {
    ...rest,
    upscaleMethod:
      upscaleScryfallImages === true
        ? "anime-fast"
        : (rest.upscaleMethod ?? "none"),
  };
};
