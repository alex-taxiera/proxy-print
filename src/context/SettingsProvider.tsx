import { ComponentProps, useCallback, useMemo, useState } from "react";
import {
  SettingsContext,
  DEFAULT_SETTINGS,
  SettingsSchema,
  Settings,
} from "./SettingsContext";

/**
 * Inverts a hex color code.
 * @param {string} hex - The hex color code (e.g., "#ffffff" or "ffffff").
 * @returns {string} - The inverted hex color code (e.g., "#000000").
 */
function invertHexColor(hex: string): string {
  // Remove the hash (#) if present
  hex = hex.replace(/^#/, '');

  // Ensure the hex code is valid (3 or 6 characters)
  if (hex.length === 3) {
    hex = hex.split('').map(char => char + char).join('');
  }
  if (hex.length !== 6) {
    throw new Error('Invalid hex color code');
  }

  // Invert the color
  const invertedColor = hex
    .match(/.{2}/g) // Split into pairs of two characters
    ?.map(pair => (255 - parseInt(pair, 16)).toString(16).padStart(2, '0')) // Invert and pad
    .join('');

  if (!invertedColor) {
    throw new Error('Invalid hex color code');
  }

  return `#${invertedColor}`;
}

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
      "--guides-color-inverted": invertHexColor(value.guidesColor),
      "--guides-thickness": `${guideThickness}px`,
      "--guides-at-bleed-edge": value.guidesAtBleedEdge ? "0" : "1",
      "--page-unit": value.unit || "in",
      "--page-height": `${value.pageHeight}${value.unit || "in"}`,
      "--page-width": `${value.pageWidth}${value.unit || "in"}`,
      "--grid-columns": value.numberOfColumns,
    } as React.CSSProperties;
  }, [value]);

  const contextValue = useMemo(
    () => ({ settings: value, setSettings, cssVars }),
    [value, setSettings, cssVars]
  );

  return <SettingsContext.Provider {...props} value={contextValue} />;
};
