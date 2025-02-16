import { createContext } from "react";
import zod from "zod";

export const SettingsSchema = zod.object({
  bleedEdge: zod.string(),
  guides: zod.boolean(),
  guidesColor: zod.string(),
  guidesThickness: zod.string(),
  pageHeight: zod.string(),
  pageWidth: zod.string(),
  numberOfColumns: zod.string(),
});

export type Settings = zod.infer<typeof SettingsSchema>;

export const DEFAULT_SETTINGS = {
  bleedEdge: "0",
  guides: true,
  guidesColor: "#adff2f",
  guidesThickness: "1",
  pageHeight: "11",
  pageWidth: "8.5",
  numberOfColumns: "3",
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
