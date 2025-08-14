import { createContext } from "react";
import * as zod from "zod";

export const getMinSize = (
  settings: Settings,
  key: "pageWidth" | "pageHeight",
) => {
  const cardSize =
    CARD_DIMENSIONS[settings.cardSize][
      key === "pageWidth" ? "width" : "height"
    ]; // mm
  const bleedEdge = Number(settings.bleedEdge); // mm
  const guidesThickness = Number(settings.guidesThickness) * 0.264583;
  const minSize = cardSize + 2 * bleedEdge + guidesThickness;

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
      .min(0)
      .max(3)
      .refine((val) => parseFloat(val) >= 0, "Must be 0 or greater"),
    guidesColor: zod.string().min(1),
    guidesThickness: zod
      .string()
      .regex(/^\d+(\.\d+)?$/, "Must be a valid number")
      .min(0)
      .max(3)
      .refine((val) => parseFloat(val) >= 0, "Must be 0 or greater"),
    guidesAtBleedEdge: zod.boolean(),
    pageHeight: zod
      .string()
      .regex(/^\d+(\.\d+)?$/, "Must be a valid number")
      .min(1)
      .refine((val) => parseInt(val) >= 1, "Must be 1 or greater"),
    pageWidth: zod
      .string()
      .regex(/^\d+(\.\d+)?$/, "Must be a valid number")
      .min(1)
      .refine((val) => parseInt(val) >= 1, "Must be 1 or greater"),
    numberOfColumns: zod
      .string()
      .regex(/^\d+$/, "Must be a whole number")
      .min(1)
      .refine((val) => parseInt(val) >= 1, "Must be 1 or greater"),
    unit: zod.enum(["in", "mm"]),
    cardSize: zod.enum(["standard", "japanese", "tarot"]),
  })
  .superRefine((data, ctx) => {
    const { pageWidth, pageHeight } = data;
    const minPageWidth = getMinSize(data, "pageWidth");
    const minPageHeight = getMinSize(data, "pageHeight");

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
} as const satisfies Record<
  Settings["cardSize"],
  { width: number; height: number }
>;

export const DEFAULT_SETTINGS = {
  cardSize: "standard",
  filename: "cards",
  unit: "in",
  pageWidth: "8.5",
  pageHeight: "11",
  numberOfColumns: "3",
  enableBleedEdge: true,
  bleedEdge: "0",
  guidesColor: "#adff2f",
  guidesThickness: "1",
  guidesAtBleedEdge: false,
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
