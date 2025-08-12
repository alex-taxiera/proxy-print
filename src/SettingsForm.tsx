import { useCallback, useContext } from "react";
import {
  DEFAULT_SETTINGS,
  getMaxSize,
  getMinSize,
  Settings,
  SettingsContext,
} from "./context/SettingsContext";

import "./SettingsForm.css";
import { ImagesContext } from "./context/ImagesContext";
import { isSettingValueEmpty } from "./context/SettingsProvider";

const getMaxGuideWidth = (settings: Settings) => {
  const bleedEdge = Number(settings.bleedEdge);

  if (bleedEdge > 2) {
    return 1;
  }

  if (bleedEdge > 1) {
    return 8;
  }

  if (bleedEdge > 0) {
    return 16;
  }

  return 23;
};

export const SettingsForm = () => {
  const { settings, setSettings } = useContext(SettingsContext);
  const { isRendering } = useContext(ImagesContext);

  const handleChange = useCallback(
    (key: keyof typeof settings, eventKey: "value" | "checked" = "value") =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setSettings((old) => {
          const value =
            e.target instanceof HTMLInputElement
              ? e.target[eventKey]
              : e.target.value;

          const nextValue = isSettingValueEmpty(value) ? DEFAULT_SETTINGS[key] : value;

          if (key === "pageWidth" || key === "pageHeight") {
            const minSize = getMinSize(old, key);
            const maxSize = getMaxSize(old, key);
            if (Number(nextValue) < Number(minSize) || Number(nextValue) > Number(maxSize)) {
              return old;
            }
            // nextValue = Math.max(Number(nextValue), Number(minSize)).toString();
          }

          const updatedSettings = {
            ...old,
            [key]: nextValue,
          };

          const newMaxGuideWidth = getMaxGuideWidth(updatedSettings);

          if (parseInt(updatedSettings.guidesThickness) > newMaxGuideWidth) {
            updatedSettings.guidesThickness = newMaxGuideWidth.toString();
          }
          return updatedSettings;
        });
      },
    [setSettings]
  );

  const maxGuideWidth = getMaxGuideWidth(settings);

  return (
    <form>
      <label>
        Card Size
        <select
          disabled={isRendering}
          value={settings.cardSize}
          onChange={handleChange("cardSize")}
        >
          <option value="standard">Standard</option>
          <option value="japanese">Japanese</option>
        </select>
      </label>
      <label>
        Unit
        <select
          disabled={isRendering}
          value={settings.unit}
          onChange={handleChange("unit")}
        >
          <option value="in">in</option>
          <option value="mm">mm</option>
        </select>
      </label>
      <label>
        Page Width ({settings.unit})
        <input
          disabled={isRendering}
          type="number"
          min="0"
          defaultValue={settings.pageWidth}
          onChange={handleChange("pageWidth")}
        />
      </label>
      <label>
        Page Height ({settings.unit})
        <input
          disabled={isRendering}
          type="number"
          min="0"
          defaultValue={settings.pageHeight}
          onChange={handleChange("pageHeight")}
        />
      </label>
      <label>
        Columns
        <input
          disabled={isRendering}
          type="number"
          min="1"
          value={settings.numberOfColumns}
          onChange={handleChange("numberOfColumns")}
        />
      </label>
      <label>
        Enable Bleed Edge
        <input
          disabled={isRendering}
          type="checkbox"
          checked={settings.enableBleedEdge}
          onChange={handleChange("enableBleedEdge", "checked")}
        />
      </label>
      <label>
        Bleed Edge (mm)
        <input
          disabled={isRendering}
          type="number"
          min="0"
          max="3"
          value={settings.bleedEdge}
          onChange={handleChange("bleedEdge")}
        />
      </label>
      <label>
        Guides Color
        <input
          disabled={isRendering}
          type="color"
          value={settings.guidesColor}
          onChange={handleChange("guidesColor")}
        />
      </label>
      <label>
        Guides Width (px)
        <input
          disabled={isRendering}
          type="number"
          min="0"
          max={maxGuideWidth}
          value={settings.guidesThickness}
          onChange={handleChange("guidesThickness")}
        />
      </label>
      <label>
        Guides at Bleed Edge
        <input
          disabled={isRendering}
          type="checkbox"
          checked={settings.guidesAtBleedEdge}
          onChange={handleChange("guidesAtBleedEdge", "checked")}
        />
      </label>
    </form>
  );
};
