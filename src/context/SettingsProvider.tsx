import { ComponentProps, useCallback, useMemo, useState } from "react";

import { invertHexColor } from "~/utils/invert-hex-color";

import {
  DEFAULT_SETTINGS,
  Settings,
  SettingsContext,
  SettingsSchema,
} from "./SettingsContext";

export const isSettingValueEmpty = (
  value?: string | null | boolean,
): value is "" | null | undefined => {
  return value === "" || value == null;
};

export const SettingsProvider = (
  props: Omit<ComponentProps<typeof SettingsContext.Provider>, "value">,
) => {
  const savedSettings = localStorage.getItem("settings");

  const defaultSettings = useMemo(() => {
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings) as unknown;
        const { data, success } = SettingsSchema.safeParse(parsedSettings);
        if (success) {
          return data;
        } else {
          return SettingsSchema.parse({
            ...DEFAULT_SETTINGS,
            ...(parsedSettings as Settings),
          });
        }
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
    const enableBleedEdge = true; // value.enableBleedEdge;
    const guideThickness = enableBleedEdge ? Number(value.guidesThickness) : 1;
    const imageContainerBuffer = enableBleedEdge ? guideThickness : 0;

    return {
      "--page-unit": value.unit,
      "--page-width": `${value.pageWidth}${value.unit}`,
      "--page-height": `${value.pageHeight}${value.unit}`,
      "--grid-columns": value.numberOfColumns,
      "--bleed-edge": `${enableBleedEdge ? value.bleedEdge : 0}mm`,
      "--guides-color": value.guidesColor,
      "--guides-color-inverted": invertHexColor(value.guidesColor),
      "--guides-thickness": `${guideThickness}px`,
      "--guides-at-bleed-edge": value.guidesAtBleedEdge ? "0" : "1",
      "--guides-display": value.guidesThickness !== "0" ? "block" : "none",
      "--image-container-buffer": `${imageContainerBuffer}px`,
      "--image-zoom": enableBleedEdge ? "6.2mm" : "0mm",
      "--card-width": `${value.cardWidth}mm`,
      "--card-height": `${value.cardHeight}mm`,
      "--row-gap": `${value.rowGap}mm`,
      "--column-gap": `${value.columnGap}mm`,
    };
  }, [value]);

  const contextValue = useMemo(
    () => ({ settings: value, setSettings, cssVars }),
    [value, setSettings, cssVars],
  );

  return <SettingsContext.Provider {...props} value={contextValue} />;
};
