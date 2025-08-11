import { ComponentProps, useCallback, useMemo, useState } from "react";
import {
  CARD_DIMENSIONS,
  DEFAULT_SETTINGS,
  Settings,
  SettingsContext,
  SettingsSchema,
} from "./SettingsContext";
import { invertHexColor } from "../utils/invert-hex-color";

export const isSettingValueEmpty = (
  value?: string | null | boolean
): value is "" | null | undefined => {
  return value === "" || value == null;
};

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

  const calculatePageDimensions = (value: string, unit: "in" | "mm") => {
    const convertedValue =
      unit === "in" ? Number(value) / 25.4 : Number(value) * 25.4;
    return convertedValue.toFixed(2).toString();
  };

  const setSettings = useCallback((updater: (old: Settings) => Settings) => {
    setter((old) => {
      const updated = updater(old);

      if (updated.unit !== old.unit) {
        updated.pageHeight = calculatePageDimensions(
          updated.pageHeight,
          updated.unit
        );
        updated.pageWidth = calculatePageDimensions(
          updated.pageWidth,
          updated.unit
        );
      }

      localStorage.setItem("settings", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const cssVars = useMemo(() => {
    const guideThickness = value.enableBleedEdge
      ? Number(value.guidesThickness)
      : 1;
    const imageContainerBuffer = value.enableBleedEdge ? guideThickness : 0;
    const cardWidth = `${CARD_DIMENSIONS[value.cardSize].width}mm`;
    const cardHeight = `${CARD_DIMENSIONS[value.cardSize].height}mm`;

    return {
      "--image-zoom": value.enableBleedEdge ? "6.2mm" : "0mm",
      "--image-container-buffer": `${imageContainerBuffer}px`,
      "--bleed-edge": `${value.enableBleedEdge ? value.bleedEdge : 0}mm`,
      "--guides-display": value.guidesThickness !== "0" ? "block" : "none",
      "--guides-color": value.guidesColor,
      "--guides-color-inverted": invertHexColor(value.guidesColor),
      "--guides-thickness": `${guideThickness}px`,
      "--guides-at-bleed-edge": value.guidesAtBleedEdge ? "0" : "1",
      "--page-unit": value.unit,
      "--page-height": `${value.pageHeight}${value.unit}`,
      "--page-width": `${value.pageWidth}${value.unit}`,
      "--grid-columns": value.numberOfColumns,
      "--card-width": cardWidth,
      "--card-height": cardHeight,
    } as React.CSSProperties;
  }, [value]);

  const contextValue = useMemo(
    () => ({ settings: value, setSettings, cssVars }),
    [value, setSettings, cssVars]
  );

  return <SettingsContext.Provider {...props} value={contextValue} />;
};
