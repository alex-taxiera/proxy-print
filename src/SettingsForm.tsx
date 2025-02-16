import { useContext } from "react";
import { DEFAULT_SETTINGS, SettingsContext, Settings } from "./SettingsContext";

const getMaxGuideWidth = (settings: Settings) => {
  switch(settings.bleedEdge) {
    case '0':
      return 23;
    case '1':
      return 16;
    case '2':
      return 8;
    case '3':
      return 1;
    default:
      return 0;
  }
}

export const SettingsForm = () => {
  const { settings, setSettings } = useContext(SettingsContext);

  const handleChange = (key: keyof typeof settings) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setSettings((old) => {
      const updatedSettings = {
        ...old,
        [key]: e.target.value || DEFAULT_SETTINGS[key],
      }
      const newMaxGuideWidth = getMaxGuideWidth(updatedSettings)
      if (parseInt(updatedSettings.guidesThickness) > newMaxGuideWidth) {
        updatedSettings.guidesThickness = newMaxGuideWidth.toString()
      }
      return updatedSettings
    });
  };

  const maxGuideWidth = getMaxGuideWidth(settings)

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
        Number of Columns
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
        Guides Thickness (px)
        <input
          type="number"
          min="0"
          max={maxGuideWidth}
          value={settings.guidesThickness}
          onChange={handleChange("guidesThickness")}
        />
      </label>
    </form>
  );


}
