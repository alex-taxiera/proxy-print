import { createContext } from "react";
import * as zod from "zod";

export const CARD_DIMENSIONS = {
  standard: {
    width: 63,
    height: 88,
  },
  japanese: {
    width: 59,
    height: 86,
  },
  tarot: {
    width: 70,
    height: 120,
  },
} as const satisfies Record<string, { width: number; height: number }>;

export type CardSize = keyof typeof CARD_DIMENSIONS;

export const MAX_BLEED = 3;

export const MAX_GUIDES_THICKNESS = 0.9;

export const cardSizeToNameMap = Object.fromEntries(
  Object.entries(CARD_DIMENSIONS).map(([key, dimensions]) => [
    `${dimensions.width}-${dimensions.height}`,
    key,
  ]),
) as Record<`${number}-${number}`, CardSize>;

export type Unit = "in" | "mm";

export const PAGE_DIMENSIONS = {
  letter: {
    width: 8.5,
    height: 11,
    unit: "in",
  },
  legal: {
    width: 8.5,
    height: 14,
    unit: "in",
  },
  tabloid: {
    width: 11,
    height: 17,
    unit: "in",
  },
  a4: {
    width: 210,
    height: 297,
    unit: "mm",
  },
  a3: {
    width: 297,
    height: 420,
    unit: "mm",
  },
  "a3+": {
    width: 329,
    height: 483,
    unit: "mm",
  },
} as const satisfies Record<
  string,
  { width: number; height: number; unit: Unit }
>;

export type PageSize = keyof typeof PAGE_DIMENSIONS;

export const pageSizeToNameMap = Object.fromEntries(
  Object.entries(PAGE_DIMENSIONS).map(([key, dimensions]) => [
    `${dimensions.width}${dimensions.unit}-${dimensions.height}${dimensions.unit}`,
    key,
  ]),
) as Record<`${number}${Unit}-${number}${Unit}`, PageSize>;

export const getMinSize = (
  settings: Settings,
  key: "pageWidth" | "pageHeight",
) => {
  const cardSize = settings[key === "pageWidth" ? "cardWidth" : "cardHeight"]; // mm
  const bleedEdge = settings.enableBleedEdge ? Number(settings.bleedEdge) : 0; // mm
  const guidesThickness = Number(settings.guidesThickness);
  const minSize = Number(cardSize) + 2 * bleedEdge + guidesThickness;

  if (settings.unit === "in") {
    // Round up to 3 decimal places: multiply by 1000, round up, divide by 1000
    return (Math.ceil((minSize / 25.4) * 1000) / 1000).toFixed(3);
  }

  // Round up to 3 decimal places: multiply by 1000, round up, divide by 1000
  return (Math.ceil(minSize * 1000) / 1000).toFixed(3);
};

export const getMaxSize = (
  settings: Settings,
  key: "pageWidth" | "pageHeight",
) => {
  if (key === "pageWidth") {
    return Infinity;
  }

  const maxSize = 3000; // mm
  if (settings.unit === "in") {
    return (Math.floor((maxSize / 25.4) * 1000) / 1000).toFixed(3);
  }

  return (Math.floor(maxSize * 1000) / 1000).toFixed(3);
};

export const SettingsSchema = zod
  .object({
    filename: zod.string().min(1).max(50),
    enableBleedEdge: zod.boolean(),
    bleedEdge: zod
      .string()
      .regex(/^\d+(\.\d+)?$/, "Must be a valid number")
      .refine((val) => parseFloat(val) >= 0, "Must be 0 or greater")
      .refine(
        (val) => parseFloat(val) <= MAX_BLEED,
        `Must be ${MAX_BLEED} or less`,
      ),
    guidesColor: zod.string().min(1),
    guidesThickness: zod
      .string()
      .regex(/^\d+(\.\d+)?$/, "Must be a valid number")
      .refine((val) => parseFloat(val) >= 0, "Must be 0 or greater")
      .refine(
        (val) => parseFloat(val) <= MAX_GUIDES_THICKNESS,
        `Must be ${MAX_GUIDES_THICKNESS} or less`,
      ),
    guidesAtBleedEdge: zod.boolean(),
    extendedGuidesOnly: zod.boolean(),
    pageHeight: zod
      .string()
      .regex(/^\d+(\.\d+)?$/, "Must be a valid number")
      .refine((val) => parseInt(val) >= 1, "Must be 1 or greater"),
    pageWidth: zod
      .string()
      .regex(/^\d+(\.\d+)?$/, "Must be a valid number")
      .refine((val) => parseInt(val) >= 1, "Must be 1 or greater"),
    numberOfColumns: zod
      .string()
      .regex(/^\d+$/, "Must be a whole number")
      .refine((val) => parseInt(val) >= 1, "Must be 1 or greater"),
    unit: zod.enum(["in", "mm"]),
    cardWidth: zod
      .string()
      .regex(/^\d+(\.\d+)?$/, "Must be a valid number")
      .refine((val) => parseInt(val) >= 1, "Must be 1 or greater")
      .refine((val) => parseInt(val) <= 250, "Must be 250 or less"),
    cardHeight: zod
      .string()
      .regex(/^\d+(\.\d+)?$/, "Must be a valid number")
      .refine((val) => parseInt(val) >= 1, "Must be 1 or greater")
      .refine((val) => parseInt(val) <= 250, "Must be 250 or less"),
    rowGap: zod
      .string()
      .regex(/^\d+(\.\d+)?$/, "Must be a valid number")
      .refine((val) => parseInt(val) >= 0, "Must be 0 or greater")
      .refine((val) => parseInt(val) <= 10, "Must be 10 or less"),
    columnGap: zod
      .string()
      .regex(/^\d+(\.\d+)?$/, "Must be a valid number")
      .refine((val) => parseInt(val) >= 0, "Must be 0 or greater")
      .refine((val) => parseInt(val) <= 10, "Must be 10 or less"),
    maxDpi: zod
      .string()
      .regex(/^\d+$/, "Must be a whole number")
      .refine((val) => parseInt(val) >= 300, "Must be 300 or greater")
      .refine((val) => parseInt(val) <= 1200, "Must be 1200 or less"),
    convertToJpg: zod.boolean(),
    jpgQuality: zod
      .string()
      .regex(/^\d*\.?\d+$/, "Must be a valid number")
      .refine((val) => {
        const num = parseFloat(val);
        return num >= 0.1 && num <= 1;
      }, "Must be between 0.1 and 1"),
    upscaleScryfallImages: zod.boolean(),
  })
  .superRefine((data, ctx) => {
    const { pageWidth, pageHeight, guidesThickness, bleedEdge } = data;
    const minPageWidth = getMinSize(data, "pageWidth");
    const minPageHeight = getMinSize(data, "pageHeight");

    if (Number(guidesThickness) + Number(bleedEdge) > 3) {
      ctx.addIssue({
        code: "custom",
        message:
          "Bleed edge and guides thickness must be less than or equal to 3",
        path: ["guidesThickness"],
      });
      ctx.addIssue({
        code: "custom",
        message:
          "Bleed edge and guides thickness must be less than or equal to 3",
        path: ["bleedEdge"],
      });
    }

    if (Number(pageWidth) < Number(minPageWidth)) {
      ctx.addIssue({
        code: "custom",
        message: `Must be greater than or equal to ${minPageWidth}`,
        path: ["pageWidth"],
      });
    }

    if (Number(pageHeight) < Number(minPageHeight)) {
      ctx.addIssue({
        code: "custom",
        message: `Must be greater than or equal to ${minPageHeight}`,
        path: ["pageHeight"],
      });
    }
  });

export type Settings = zod.infer<typeof SettingsSchema>;

export const DEFAULT_SETTINGS = {
  cardHeight: CARD_DIMENSIONS.standard.height.toString(),
  cardWidth: CARD_DIMENSIONS.standard.width.toString(),
  filename: "cards",
  unit: PAGE_DIMENSIONS.letter.unit,
  pageWidth: PAGE_DIMENSIONS.letter.width.toString(),
  pageHeight: PAGE_DIMENSIONS.letter.height.toString(),
  numberOfColumns: "3",
  enableBleedEdge: true,
  bleedEdge: "0",
  guidesColor: "#adff2f",
  guidesThickness: "0.265",
  guidesAtBleedEdge: false,
  extendedGuidesOnly: false,
  rowGap: "0",
  columnGap: "0",
  maxDpi: "1200",
  convertToJpg: false,
  jpgQuality: "0.95",
  upscaleScryfallImages: false,
} as const satisfies Settings;

export type SettingsContextValue = {
  settings: Settings;
  setSettings: (updater: (old: Settings) => Settings) => void;
  cssVars: Record<string, string>;
};
export const SettingsContext = createContext<SettingsContextValue>({
  settings: DEFAULT_SETTINGS,
  setSettings: () => {},
  cssVars: {},
});
