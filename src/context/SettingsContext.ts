import { createContext } from "react";
import zod from "zod";

export const SettingsSchema = zod.object({
  enableBleedEdge: zod.boolean(),
  bleedEdge: zod.string().regex(/^\d+(\.\d+)?$/, "Must be a valid number").min(1).refine(val => parseFloat(val) >= 0, "Must be 0 or greater"),
  guides: zod.boolean(),
  guidesColor: zod.string().min(1),
  guidesThickness: zod.string().regex(/^\d+(\.\d+)?$/, "Must be a valid number").min(1).refine(val => parseFloat(val) > 0, "Must be greater than 0"),
  guidesAtBleedEdge: zod.boolean(),
  pageHeight: zod.string().regex(/^\d+(\.\d+)?$/, "Must be a valid number").min(1).refine(val => parseFloat(val) > 0, "Must be greater than 0"),
  pageWidth: zod.string().regex(/^\d+(\.\d+)?$/, "Must be a valid number").min(1).refine(val => parseFloat(val) > 0, "Must be greater than 0"),
  numberOfColumns: zod.string().regex(/^\d+$/, "Must be a whole number").min(1).refine(val => parseInt(val) >= 1, "Must be 1 or greater"),
  unit: zod.enum(["in", "mm"]),
  cardSize: zod.enum(["standard", "japanese"]),
});

export type Settings = zod.infer<typeof SettingsSchema>;

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
