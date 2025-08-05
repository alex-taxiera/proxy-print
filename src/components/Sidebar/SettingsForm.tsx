import { useCallback, useContext } from "react";
import {
  DEFAULT_SETTINGS,
  Settings,
  SettingsContext,
} from "../../context/SettingsContext";

import { ImagesContext } from "../../context/ImagesContext";
import { Field } from "../ui/field";
import { vstack } from "styled-system/patterns";
import { Checkbox } from "../ui/checkbox";
import {
  CheckboxCheckedChangeDetails,
  ColorPickerValueChangeDetails,
  NumberInputValueChangeDetails,
  parseColor,
  SelectValueChangeDetails,
} from "@ark-ui/react";
import { Select, createListCollection } from "../ui/select";
import { ColorPicker } from "../ui/color-picker";
import { NumberInput } from "../ui/number-input";

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
    [setSettings],
  );

  const buildNumberInputChangeHandler = useCallback(
    (key: keyof typeof settings) =>
      (details: NumberInputValueChangeDetails) => {
        handle(details.value, key);
      },
    [handle],
  );

  const buildCheckboxChangeHandler = useCallback(
    (key: keyof typeof settings) => (details: CheckboxCheckedChangeDetails) => {
      handle(details.checked, key);
    },
    [handle],
  );

  const buildSelectChangeHandler = useCallback(
    (key: keyof typeof settings) => (details: SelectValueChangeDetails) => {
      handle(details.value[0] ?? DEFAULT_SETTINGS[key], key);
    },
    [handle],
  );

  const buildColorPickerChangeHandler = useCallback(
    (key: keyof typeof settings) =>
      (details: ColorPickerValueChangeDetails) => {
        handle(details.value.toString("hex"), key);
      },
    [handle],
  );

  const maxGuideWidth = getMaxGuideWidth(settings);

  return (
    <form
      className={vstack({
        width: "full",
        alignItems: "stretch",
        gap: "2",
        alignSelf: "stretch",
        justifyContent: "center",
      })}
    >
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
        <NumberInput
          min={0}
          value={settings.pageWidth}
          onValueChange={buildNumberInputChangeHandler("pageWidth")}
        >
          Page Width ({settings.unit})
        </NumberInput>
      </Field.Root>
      <Field.Root disabled={isRendering}>
        <NumberInput
          min={0}
          value={settings.pageHeight}
          onValueChange={buildNumberInputChangeHandler("pageHeight")}
        >
          Page Height ({settings.unit})
        </NumberInput>
      </Field.Root>
      <Field.Root disabled={isRendering}>
        <NumberInput
          min={1}
          value={settings.numberOfColumns}
          onValueChange={buildNumberInputChangeHandler("numberOfColumns")}
        >
          Columns
        </NumberInput>
      </Field.Root>
      <Field.Root disabled={isRendering}>
        <Field.Label>Enable Bleed Edge</Field.Label>
        <Checkbox
          size="lg"
          checked={settings.enableBleedEdge}
          onCheckedChange={buildCheckboxChangeHandler("enableBleedEdge")}
        />
      </Field.Root>
      <Field.Root disabled={isRendering}>
        <NumberInput
          min={0}
          max={3}
          value={settings.bleedEdge}
          onValueChange={buildNumberInputChangeHandler("bleedEdge")}
        >
          Bleed Edge (mm)
        </NumberInput>
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
      </Field.Root>
      <Field.Root disabled={isRendering}>
        <Field.Label>Guides at Bleed Edge</Field.Label>
        <Checkbox
          size="lg"
          checked={settings.guidesAtBleedEdge}
          onCheckedChange={buildCheckboxChangeHandler("guidesAtBleedEdge")}
        />
      </Field.Root>
    </form>
  );
};
