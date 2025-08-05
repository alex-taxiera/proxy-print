import { createContext } from "react";
import zod from "zod";

export const SettingsSchema = zod.object({
  filename: zod.string(),
  unit: zod.enum(["in", "mm"]),
  pageWidth: zod.string(),
  pageHeight: zod.string(),
  numberOfColumns: zod.string(),
  enableBleedEdge: zod.boolean(),
  bleedEdge: zod.string(),
  guidesColor: zod.string(),
  guidesThickness: zod.string(),
  guidesAtBleedEdge: zod.boolean(),
});

export type Settings = zod.infer<typeof SettingsSchema>;

export const DEFAULT_SETTINGS = {
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
