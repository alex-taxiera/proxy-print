import { createContext } from "react";
import zod from "zod";

export const getMinSize = (settings: Settings, key: "pageWidth" | "pageHeight") => {
  const cardSize = CARD_DIMENSIONS[settings.cardSize][key === "pageWidth" ? "width" : "height"]; // mm
  const bleedEdge = Number(settings.bleedEdge); // mm
  const guidesThickness = Number(settings.guidesThickness) * 0.264583
  const minSize = cardSize + 2 * bleedEdge + guidesThickness;

  if (settings.unit === "in") {
    // Round up to 3 decimal places: multiply by 1000, round up, divide by 1000
    return (Math.ceil((minSize / 25.4) * 1000) / 1000).toFixed(3);
  }

  // Round up to 3 decimal places: multiply by 1000, round up, divide by 1000
  return (Math.ceil(minSize * 1000) / 1000).toFixed(3);
};

export const SettingsSchema = zod.object({
  enableBleedEdge: zod.boolean(),
  bleedEdge: zod
    .string()
    .regex(/^\d+(\.\d+)?$/, "Must be a valid number")
    .min(1)
    .refine((val) => parseFloat(val) >= 0, "Must be 0 or greater"),
  guides: zod.boolean(),
  guidesColor: zod.string().min(1),
  guidesThickness: zod
    .string()
    .regex(/^\d+(\.\d+)?$/, "Must be a valid number")
    .min(1)
    .refine((val) => parseFloat(val) > 0, "Must be greater than 0"),
  guidesAtBleedEdge: zod.boolean(),
  pageHeight: zod
    .string()
    .regex(/^\d+(\.\d+)?$/, "Must be a valid number")
    .min(1)
    .refine((val) => parseInt(val) >= 1, "Must be 1 or greater"),
    // .superRefine(buildValidatePageSize("pageHeight")),
  pageWidth: zod
    .string()
    .regex(/^\d+(\.\d+)?$/, "Must be a valid number")
    .min(1)
    .refine((val) => parseInt(val) >= 1, "Must be 1 or greater"),
    // .superRefine(buildValidatePageSize("pageWidth")),
  numberOfColumns: zod
    .string()
    .regex(/^\d+$/, "Must be a whole number")
    .min(1)
    .refine((val) => parseInt(val) >= 1, "Must be 1 or greater"),
  unit: zod.enum(["in", "mm"]),
  cardSize: zod.enum(["standard", "japanese", "tarot"]),
}).superRefine((data, ctx) => {
  const { pageWidth, pageHeight } = data;
  const minPageWidth = getMinSize(data, "pageWidth");
  const minPageHeight = getMinSize(data, "pageHeight");

  if (Number(pageWidth) < Number(minPageWidth)) {
    ctx.addIssue({ code: zod.ZodIssueCode.custom, message: "Must be greater than or equal to the minimum page width" });
  }

  if (Number(pageHeight) < Number(minPageHeight)) {
    ctx.addIssue({ code: zod.ZodIssueCode.custom, message: "Must be greater than or equal to the minimum page height" });
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
  tarot:{
    width: 70,
    height: 120
  }
} as const satisfies Record<
  Settings["cardSize"],
  { width: number; height: number }
>;

export const DEFAULT_SETTINGS = {
  enableBleedEdge: true,
  bleedEdge: "0",
  guides: true,
  guidesColor: "#adff2f",
  guidesThickness: "1",
  guidesAtBleedEdge: false,
  pageHeight: "11",
  pageWidth: "8.5",
  numberOfColumns: "3",
  unit: "in",
  cardSize: "standard",
} as const satisfies Settings;

export type SettingsContextValue = {
  settings: Settings;
  setSettings: (updater: (old: Settings) => Settings) => void;
  cssVars: React.CSSProperties;
};
export const SettingsContext = createContext<SettingsContextValue>({
  settings: DEFAULT_SETTINGS,
  setSettings: () => {},
  cssVars: {},
});
