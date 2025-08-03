import { createContext } from "react";
import zod from "zod";

export const SettingsSchema = zod.object({
  enableBleedEdge: zod.boolean(),
  bleedEdge: zod.string(),
  guides: zod.boolean(),
  guidesColor: zod.string(),
  guidesThickness: zod.string(),
  guidesAtBleedEdge: zod.boolean(),
  pageHeight: zod.string(),
  pageWidth: zod.string(),
  numberOfColumns: zod.string(),
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
  cssVars: Record<string, string>;
};
export const SettingsContext = createContext<SettingsContextValue>({
  settings: DEFAULT_SETTINGS,
  setSettings: () => {},
  cssVars: {},
});
