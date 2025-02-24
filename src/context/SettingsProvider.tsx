import { ComponentProps, useCallback, useMemo, useState } from "react";
import {
  SettingsContext,
  DEFAULT_SETTINGS,
  SettingsSchema,
  Settings,
} from "./SettingsContext";

export const SettingsProvider = (
  props: Omit<ComponentProps<typeof SettingsContext.Provider>, "value">
) => {
  const savedSettings = localStorage.getItem("settings");

  const defaultSettings = useMemo(() => {
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings) as unknown;
        return SettingsSchema.parse(parsedSettings);
      } catch (error) {
        localStorage.removeItem("settings");
        console.error(error);
      }
    }

    localStorage.setItem("settings", JSON.stringify(DEFAULT_SETTINGS));
    return DEFAULT_SETTINGS;
  }, [savedSettings]);

  const [value, setter] = useState<Settings>(defaultSettings);

  const setSettings = useCallback((updater: (old: Settings) => Settings) => {
    setter((old) => {
      const updated = updater(old);
      localStorage.setItem("settings", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const cssVars = useMemo(() => {
    const guideThickness = value.enableBleedEdge ? Number(value.guidesThickness) : 1
    const imageContainerBuffer = value.enableBleedEdge ? guideThickness : 0
    return {
      "--image-zoom": value.enableBleedEdge ? '6.2mm' : '0mm',
      "--image-container-buffer": `${imageContainerBuffer}px`,
      "--bleed-edge": `${value.enableBleedEdge ? value.bleedEdge : 0}mm`,
      "--guides-display": value.guidesThickness !== '0' ? "block" : "none",
      "--guides-color": value.guidesColor,
      "--guides-thickness": `${guideThickness}px`,
      "--guides-at-bleed-edge": value.guidesAtBleedEdge ? "0" : "1",
      "--page-height": `${value.pageHeight}in`,
      "--page-width": `${value.pageWidth}in`,
      "--grid-columns": value.numberOfColumns,
    } as React.CSSProperties;
  }, [value]);

  const contextValue = useMemo(
    () => ({ settings: value, setSettings, cssVars }),
    [value, setSettings, cssVars]
  );

  return <SettingsContext.Provider {...props} value={contextValue} />;
};
