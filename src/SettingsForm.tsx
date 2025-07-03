import { useCallback, useContext } from "react";
import { DEFAULT_SETTINGS, Settings, SettingsContext } from "./context/SettingsContext";

import "./SettingsForm.css";
import { ImagesContext } from "./context/ImagesContext";

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
    (key: keyof typeof settings, eventKey: "value" | "select" | "checked" = "value") =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setSettings((old) => {
          const updatedSettings = {
            ...old,
            [key]: eventKey !== "select"
              ? (e.target as HTMLInputElement)[eventKey]
              : (e.target as HTMLSelectElement).value ?? DEFAULT_SETTINGS[key],
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
        Unit
        <select
          disabled={isRendering}
          value={settings.unit}
          onChange={handleChange("unit", "value")}
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
          value={settings.pageWidth}
          onChange={handleChange("pageWidth")}
        />
      </label>
      <label>
        Page Height ({settings.unit})
        <input
          disabled={isRendering}
          type="number"
          min="0"
          value={settings.pageHeight}
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
