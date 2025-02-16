import { useCallback, useContext } from "react";
import { DEFAULT_SETTINGS, SettingsContext, Settings } from "./SettingsContext";

import "./SettingsForm.css";

const getMaxGuideWidth = (settings: Settings) => {
  const bleedEdge = Number(settings.bleedEdge)

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

  const handleChange = useCallback(
    (key: keyof typeof settings, eventKey: "value" | "checked" = "value") =>
      (e: React.ChangeEvent<HTMLInputElement>) => {
        setSettings((old) => {
          const updatedSettings = {
            ...old,
            [key]: e.target[eventKey] || DEFAULT_SETTINGS[key],
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
        Page Width (in)
        <input
          type="number"
          min="0"
          value={settings.pageWidth}
          onChange={handleChange("pageWidth")}
        />
      </label>
      <label>
        Page Height (in)
        <input
          type="number"
          min="0"
          value={settings.pageHeight}
          onChange={handleChange("pageHeight")}
        />
      </label>
      <label>
        Columns
        <input
          type="number"
          min="1"
          value={settings.numberOfColumns}
          onChange={handleChange("numberOfColumns")}
        />
      </label>
      <label>
        Bleed Edge (mm)
        <input
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
          type="color"
          value={settings.guidesColor}
          onChange={handleChange("guidesColor")}
        />
      </label>
      <label>
        Guides Width (px)
        <input
          type="number"
          min="0"
          max={maxGuideWidth}
          value={settings.guidesThickness}
          onChange={handleChange("guidesThickness")}
        />
      </label>
      <label>
        Guides at Bleed
        <input
          type="checkbox"
          checked={settings.guidesAtBleedEdge}
          onChange={handleChange("guidesAtBleedEdge", "checked")}
        />
      </label>
    </form>
  );
};
