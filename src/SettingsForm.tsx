import { useCallback, useContext } from "react";
import {
  DEFAULT_SETTINGS,
  Settings,
  SettingsContext,
} from "./context/SettingsContext";

import { ImagesContext } from "./context/ImagesContext";
import { Field } from "./components/ui/field";
import { grid } from "styled-system/patterns";
import { Checkbox } from "./components/ui/checkbox";
import {
  CheckboxCheckedChangeDetails,
  ColorPickerValueChangeDetails,
  NumberInputValueChangeDetails,
  parseColor,
  SelectValueChangeDetails,
} from "@ark-ui/react";
import { Select, createListCollection } from "./components/ui/select";
import { ColorPicker } from "./components/ui/color-picker";
import { NumberInput } from "./components/ui/number-input";

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

const unitsCollection = createListCollection({
  items: [
    { label: "in", value: "in" },
    { label: "mm", value: "mm" },
  ],
});

const cardSizeCollection = createListCollection({
  items: [
    { label: "Standard", value: "standard" },
    { label: "Japanese", value: "japanese" },
  ],
});

export const SettingsForm = () => {
  const { settings, setSettings } = useContext(SettingsContext);
  const { isRendering } = useContext(ImagesContext);

  const handle = useCallback(
    (value: string | boolean, key: keyof typeof settings) => {
      setSettings((old) => {
        const updatedSettings = {
          ...old,
          [key]: value ?? DEFAULT_SETTINGS[key],
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

  const buildInputChangeHandler = useCallback(
    (key: keyof typeof settings) =>
      (e: React.ChangeEvent<HTMLInputElement>) => {
        handle(e.target.value, key);
      },
    [handle]
  );

  const buildNumberInputChangeHandler = useCallback(
    (key: keyof typeof settings) =>
      (details: NumberInputValueChangeDetails) => {
        handle(details.value, key);
      },
    [handle]
  );

  const buildCheckboxChangeHandler = useCallback(
    (key: keyof typeof settings) => (details: CheckboxCheckedChangeDetails) => {
      handle(details.checked, key);
    },
    [handle]
  );

  const buildSelectChangeHandler = useCallback(
    (key: keyof typeof settings) => (details: SelectValueChangeDetails) => {
      handle(details.value[0] ?? DEFAULT_SETTINGS[key], key);
    },
    [handle]
  );

  const buildColorPickerChangeHandler = useCallback(
    (key: keyof typeof settings) =>
      (details: ColorPickerValueChangeDetails) => {
        handle(details.value.toString("hex"), key);
      },
    [handle]
  );

  const maxGuideWidth = getMaxGuideWidth(settings);

  return (
    <form
      className={grid({
        gridTemplateColumns: "repeat(auto-fit, 165px)",
        gap: "2",
        margin: "1",
        alignSelf: "stretch",
        justifyContent: "center",
      })}
    >
      {/* <label>
        Card Size
        <select
          disabled={isRendering}
          value={settings.cardSize}
          onChange={handleChange("cardSize")}
        >
          <option value="standard">Standard</option>
          <option value="japanese">Japanese</option>
        </select>
      </label> */}
      <Field.Root disabled={isRendering}>
        <Select.Root
          collection={cardSizeCollection}
          value={[settings.cardSize]}
          onValueChange={buildSelectChangeHandler("cardSize")}
        >
          <Select.Label>Card Size</Select.Label>
          <Select.Control>
            <Select.Trigger>
              <Select.ValueText />
              <Select.Indicator asChild>
                <Select.IndicatorIcon />
              </Select.Indicator>
            </Select.Trigger>
          </Select.Control>
          <Select.Positioner>
            <Select.Content>
              <Select.List>
                {cardSizeCollection.items.map((item) => (
                  <Select.Item key={item.value} item={item}>
                    <Select.ItemText>{item.label}</Select.ItemText>
                    <Select.ItemIndicator asChild>
                      <Select.ItemIndicatorIcon />
                    </Select.ItemIndicator>
                  </Select.Item>
                ))}
              </Select.List>
            </Select.Content>
          </Select.Positioner>
        </Select.Root>
      </Field.Root>
      <Field.Root disabled={isRendering}>
        {/* TODO: Make more simple Select */}
        <Select.Root
          collection={unitsCollection}
          value={[settings.unit]}
          onValueChange={buildSelectChangeHandler("unit")}
        >
          <Select.Label>Unit</Select.Label>
          <Select.Control>
            <Select.Trigger>
              <Select.ValueText />
              <Select.Indicator asChild>
                <Select.IndicatorIcon />
              </Select.Indicator>
            </Select.Trigger>
          </Select.Control>
          <Select.Positioner>
            <Select.Content>
              <Select.List>
                {unitsCollection.items.map((item) => (
                  <Select.Item key={item.value} item={item}>
                    <Select.ItemText>{item.label}</Select.ItemText>
                    <Select.ItemIndicator asChild>
                      <Select.ItemIndicatorIcon />
                    </Select.ItemIndicator>
                  </Select.Item>
                ))}
              </Select.List>
            </Select.Content>
          </Select.Positioner>
        </Select.Root>
      </Field.Root>
      <Field.Root disabled={isRendering}>
        <Field.Label>
          Page Width ({settings.unit})
          <Field.Input
            type="number"
            min="0"
            value={settings.pageWidth}
            onChange={buildInputChangeHandler("pageWidth")}
          />
        </Field.Label>
      </Field.Root>
      <Field.Root disabled={isRendering}>
        <Field.Label>
          Page Height ({settings.unit})
          <Field.Input
            type="number"
            min="0"
            value={settings.pageHeight}
            onChange={buildInputChangeHandler("pageHeight")}
          />
        </Field.Label>
      </Field.Root>
      <Field.Root disabled={isRendering}>
        <Field.Label>
          Columns
          <Field.Input
            type="number"
            min="1"
            value={settings.numberOfColumns}
            onChange={buildInputChangeHandler("numberOfColumns")}
          />
        </Field.Label>
      </Field.Root>
      <Field.Root disabled={isRendering}>
        <Field.Label>
          Enable Bleed Edge
          <Checkbox
            size="lg"
            checked={settings.enableBleedEdge}
            onCheckedChange={buildCheckboxChangeHandler("enableBleedEdge")}
          />
        </Field.Label>
      </Field.Root>
      <Field.Root disabled={isRendering}>
        <Field.Label>
          Bleed Edge (mm)
          <Field.Input
            type="number"
            min="0"
            max="3"
            value={settings.bleedEdge}
            onChange={buildInputChangeHandler("bleedEdge")}
          />
        </Field.Label>
      </Field.Root>
      <Field.Root disabled={isRendering}>
        <ColorPicker
          value={parseColor(settings.guidesColor)}
          onValueChange={buildColorPickerChangeHandler("guidesColor")}
        />
      </Field.Root>
      <Field.Root disabled={isRendering}>
        <NumberInput
          min={0}
          max={maxGuideWidth}
          value={settings.guidesThickness}
          onValueChange={buildNumberInputChangeHandler("guidesThickness")}
        >
          Guides Width (px)
        </NumberInput>
        {/* <Field.Label>
          Guides Width (px)
          <Field.Input
            type="number"
            min="0"
            max={maxGuideWidth}
            value={settings.guidesThickness}
            onChange={buildInputChangeHandler("guidesThickness")}
          />
        </Field.Label> */}
      </Field.Root>
      <Field.Root disabled={isRendering}>
        <Field.Label>
          Guides at Bleed Edge
          <Checkbox
            size="lg"
            checked={settings.guidesAtBleedEdge}
            onCheckedChange={buildCheckboxChangeHandler("guidesAtBleedEdge")}
          />
        </Field.Label>
      </Field.Root>
    </form>
  );
};
