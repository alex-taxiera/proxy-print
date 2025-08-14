import {
  CheckboxCheckedChangeDetails,
  ColorPickerValueChangeDetails,
  NumberInputValueChangeDetails,
  parseColor,
  SelectValueChangeDetails,
} from "@ark-ui/react";
import { useCallback, useContext, useMemo, useState } from "react";
import { $ZodIssue } from "zod/v4/core";

import { vstack } from "styled-system/patterns";

import { ImagesContext } from "../../context/ImagesContext";
import {
  CARD_DIMENSIONS,
  DEFAULT_SETTINGS,
  Settings,
  SettingsContext,
  SettingsSchema,
} from "../../context/SettingsContext";
import { Checkbox } from "../ui/checkbox";
import { ColorPicker } from "../ui/color-picker";
import { Field } from "../ui/field";
import { NumberInput } from "../ui/number-input";
import { Select, createListCollection } from "../ui/select";

const unitsCollection = createListCollection({
  items: [
    { label: "in", value: "in" },
    { label: "mm", value: "mm" },
  ],
});

const cardSizeCollection = createListCollection({
  items: Object.keys(CARD_DIMENSIONS).map((cardSize) => ({
    label: cardSize,
    value: cardSize,
  })),
});

const calculatePageDimensions = (value: string, unit: Settings["unit"]) => {
  const convertedValue =
    unit === "in" ? Number(value) / 25.4 : Number(value) * 25.4;
  return convertedValue.toFixed(2).toString();
};

export const SettingsForm = () => {
  const { settings, setSettings } = useContext(SettingsContext);
  const { isRendering } = useContext(ImagesContext);
  const [formState, setFormState] = useState(settings);

  const formErrors = useMemo(() => {
    const { error } = SettingsSchema.safeParse(formState);
    const keys = Object.keys(settings) as Array<keyof Settings>;

    const defaultErrorMap = Object.fromEntries(
      Object.entries(settings).map(
        ([key]) => [key, []] as [keyof Settings, $ZodIssue[]],
      ),
    ) as Record<keyof Settings, $ZodIssue[]>;

    return keys.reduce(
      (errorMap, key) => ({
        ...errorMap,
        [key]: error?.issues.filter((issue) => issue.path.includes(key)) ?? [],
      }),
      defaultErrorMap,
    );
  }, [formState, settings]);

  const handle = useCallback(
    (value: string | boolean, key: keyof Settings) => {
      const nextState = {
        ...formState,
        [key]: value ?? DEFAULT_SETTINGS[key],
      };

      if (nextState.unit !== formState.unit) {
        nextState.pageHeight = calculatePageDimensions(
          nextState.pageHeight,
          nextState.unit,
        );
        nextState.pageWidth = calculatePageDimensions(
          nextState.pageWidth,
          nextState.unit,
        );
      }

      setFormState(nextState);
      setSettings((old) => {
        const updatedSettings = {
          ...old,
          ...nextState,
        };

        const { data, success, error } =
          SettingsSchema.safeParse(updatedSettings);
        if (success) {
          return data;
        } else {
          // Return an object with keys that don't have errors, mixed on top of formState
          const validKeys = Object.keys(updatedSettings).filter(
            (key) => !error.issues?.some((issue) => issue.path.includes(key)),
          );

          const validSettings = validKeys.reduce(
            (acc, key) => {
              acc[key as keyof Settings] =
                updatedSettings[key as keyof Settings];
              return acc;
            },
            {} as Record<string, string | boolean>,
          );

          return { ...old, ...validSettings };
        }
      });
    },
    [formState, setSettings],
  );

  const buildTextInputChangeHandler = useCallback(
    (key: keyof Settings) => (event: React.ChangeEvent<HTMLInputElement>) => {
      handle(event.target.value, key);
    },
    [handle],
  );

  const buildNumberInputChangeHandler = useCallback(
    (key: keyof Settings) => (details: NumberInputValueChangeDetails) => {
      handle(details.value, key);
    },
    [handle],
  );

  const buildCheckboxChangeHandler = useCallback(
    (key: keyof Settings) => (details: CheckboxCheckedChangeDetails) => {
      handle(details.checked, key);
    },
    [handle],
  );

  const buildSelectChangeHandler = useCallback(
    (key: keyof Settings) => (details: SelectValueChangeDetails) => {
      handle(details.value[0], key);
    },
    [handle],
  );

  const buildColorPickerChangeHandler = useCallback(
    (key: keyof Settings) => (details: ColorPickerValueChangeDetails) => {
      handle(details.value.toString("hex"), key);
    },
    [handle],
  );

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
      <Field.Root
        disabled={isRendering}
        invalid={formErrors.filename.length > 0}
      >
        <Field.Label>Filename</Field.Label>
        <Field.Input
          minLength={1}
          maxLength={50}
          value={formState.filename}
          onChange={buildTextInputChangeHandler("filename")}
        />
        {formErrors.filename.map((issue, i) => (
          <Field.ErrorText key={i}>{issue.message}</Field.ErrorText>
        ))}
      </Field.Root>
      <Field.Root
        disabled={isRendering}
        invalid={formErrors.cardSize.length > 0}
      >
        <Select.Root
          collection={cardSizeCollection}
          value={[formState.cardSize]}
          onValueChange={buildSelectChangeHandler("cardSize")}
        >
          <Select.Label>Card Size</Select.Label>
          <Select.Control>
            <Select.Trigger>
              <Select.ValueText textTransform="capitalize" />
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
                    <Select.ItemText textTransform="capitalize">{item.label}</Select.ItemText>
                    <Select.ItemIndicator asChild>
                      <Select.ItemIndicatorIcon />
                    </Select.ItemIndicator>
                  </Select.Item>
                ))}
              </Select.List>
            </Select.Content>
          </Select.Positioner>
        </Select.Root>
        {formErrors.cardSize.map((issue, i) => (
          <Field.ErrorText key={i}>{issue.message}</Field.ErrorText>
        ))}
      </Field.Root>
      <Field.Root disabled={isRendering} invalid={formErrors.unit.length > 0}>
        {/* TODO: Make more simple Select */}
        <Select.Root
          collection={unitsCollection}
          value={[formState.unit]}
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
        {formErrors.unit.map((issue, i) => (
          <Field.ErrorText key={i}>{issue.message}</Field.ErrorText>
        ))}
      </Field.Root>
      <Field.Root
        disabled={isRendering}
        invalid={formErrors.pageWidth.length > 0}
      >
        <NumberInput
          min={1}
          value={formState.pageWidth}
          onValueChange={buildNumberInputChangeHandler("pageWidth")}
        >
          Page Width ({formState.unit})
        </NumberInput>
        {formErrors.pageWidth.map((issue, i) => (
          <Field.ErrorText key={i}>{issue.message}</Field.ErrorText>
        ))}
      </Field.Root>
      <Field.Root
        disabled={isRendering}
        invalid={formErrors.pageHeight.length > 0}
      >
        <NumberInput
          min={1}
          value={formState.pageHeight}
          onValueChange={buildNumberInputChangeHandler("pageHeight")}
        >
          Page Height ({formState.unit})
        </NumberInput>
        {formErrors.pageHeight.map((issue, i) => (
          <Field.ErrorText key={i}>{issue.message}</Field.ErrorText>
        ))}
      </Field.Root>
      <Field.Root
        disabled={isRendering}
        invalid={formErrors.numberOfColumns.length > 0}
      >
        <NumberInput
          min={1}
          value={formState.numberOfColumns}
          onValueChange={buildNumberInputChangeHandler("numberOfColumns")}
        >
          Columns
        </NumberInput>
        {formErrors.numberOfColumns.map((issue, i) => (
          <Field.ErrorText key={i}>{issue.message}</Field.ErrorText>
        ))}
      </Field.Root>
      <Field.Root
        disabled={isRendering}
        invalid={formErrors.enableBleedEdge.length > 0}
      >
        <Field.Label>Enable Bleed Edge</Field.Label>
        <Checkbox
          size="lg"
          checked={formState.enableBleedEdge}
          onCheckedChange={buildCheckboxChangeHandler("enableBleedEdge")}
        />
        {formErrors.enableBleedEdge.map((issue, i) => (
          <Field.ErrorText key={i}>{issue.message}</Field.ErrorText>
        ))}
      </Field.Root>
      <Field.Root
        disabled={isRendering}
        invalid={formErrors.bleedEdge.length > 0}
      >
        <NumberInput
          min={0}
          max={3}
          value={formState.bleedEdge}
          onValueChange={buildNumberInputChangeHandler("bleedEdge")}
        >
          Bleed Edge (mm)
        </NumberInput>
        {formErrors.bleedEdge.map((issue, i) => (
          <Field.ErrorText key={i}>{issue.message}</Field.ErrorText>
        ))}
      </Field.Root>
      <Field.Root
        disabled={isRendering}
        invalid={formErrors.guidesColor.length > 0}
      >
        <ColorPicker
          value={parseColor(formState.guidesColor)}
          onValueChange={buildColorPickerChangeHandler("guidesColor")}
        />
        {formErrors.guidesColor.map((issue, i) => (
          <Field.ErrorText key={i}>{issue.message}</Field.ErrorText>
        ))}
      </Field.Root>
      <Field.Root
        disabled={isRendering}
        invalid={formErrors.guidesThickness.length > 0}
      >
        <NumberInput
          min={0}
          max={3}
          value={formState.guidesThickness}
          onValueChange={buildNumberInputChangeHandler("guidesThickness")}
        >
          Guides Width (px)
        </NumberInput>
        {formErrors.guidesThickness.map((issue, i) => (
          <Field.ErrorText key={i}>{issue.message}</Field.ErrorText>
        ))}
      </Field.Root>
      <Field.Root
        disabled={isRendering}
        invalid={formErrors.guidesAtBleedEdge.length > 0}
      >
        <Field.Label>Guides at Bleed Edge</Field.Label>
        <Checkbox
          size="lg"
          checked={formState.guidesAtBleedEdge}
          onCheckedChange={buildCheckboxChangeHandler("guidesAtBleedEdge")}
        />
        {formErrors.guidesAtBleedEdge.map((issue, i) => (
          <Field.ErrorText key={i}>{issue.message}</Field.ErrorText>
        ))}
      </Field.Root>
    </form>
  );
};
