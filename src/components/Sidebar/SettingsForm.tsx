import {
  CheckboxCheckedChangeDetails,
  ColorPickerValueChangeDetails,
  NumberInputValueChangeDetails,
  parseColor,
  SelectValueChangeDetails,
} from "@ark-ui/react";
import { faArrowsRotate } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useContext, useMemo, useState } from "react";

import { hstack, vstack } from "styled-system/patterns";

import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import { Collapsible } from "~/components/ui/collapsible";
import { ColorPicker } from "~/components/ui/color-picker";
import { Field } from "~/components/ui/field";
import { IconButton } from "~/components/ui/icon-button";
import { NumberInput } from "~/components/ui/number-input";
import { Select, createListCollection } from "~/components/ui/select";
import { Tooltip } from "~/components/ui/tooltip";

import {
  CARD_DIMENSIONS,
  cardSizeToNameMap,
  DEFAULT_SETTINGS,
  MAX_BLEED,
  MAX_GUIDES_THICKNESS,
  PAGE_DIMENSIONS,
  pageSizeToNameMap,
  Settings,
  SettingsContext,
  SettingsSchema,
  Unit,
} from "~/context/SettingsContext";
import {
  ScryfallImageQueryData,
  LocalImageQueryData,
  localImagesQueryKey,
  scryfallImagesQueryKey,
  ScryfallImageQueryKey,
  LocalImageQueryKey,
} from "~/queries/images";
import { addBleedEdge, needsBleedFromFile } from "~/utils/add-bleed";

const useHandleBleedEdgeForCardSizeChange = () => {
  const queryClient = useQueryClient();

  return useCallback(
    async (settings: Settings) => {
      // reprocess all image data in scryfall or local queries
      const scryfallQueries =
        queryClient.getQueriesData<ScryfallImageQueryData>({
          queryKey: scryfallImagesQueryKey(),
        });

      const cardWidth = Number(settings.cardWidth);
      const cardHeight = Number(settings.cardHeight);

      const nextScryfallData = await Promise.all(
        scryfallQueries.map(async ([key, old]) => {
          const data = await addBleedEdge(
            old!.original,
            old!.mimeType,
            cardWidth,
            cardHeight,
          );
          return [key, data] as [ScryfallImageQueryKey, Blob];
        }),
      );

      for (const [key, next] of nextScryfallData) {
        queryClient.setQueryData<ScryfallImageQueryData, ScryfallImageQueryKey>(
          key,
          (old) => {
            if (!old) {
              return undefined;
            }

            return {
              ...old,
              data: next,
            };
          },
        );
      }

      const localQueries = queryClient.getQueriesData<LocalImageQueryData>({
        queryKey: localImagesQueryKey(),
      });

      const nextLocalData = await Promise.all(
        localQueries.map(async ([key, old]) => {
          const needsBleedEdge = await needsBleedFromFile(
            old!.original,
            cardWidth,
            cardHeight,
          );
          console.log("needsBleedEdge", needsBleedEdge);
          console.log("old!.original.name", old!.original.name);
          if (needsBleedEdge) {
            const data = await addBleedEdge(
              old!.original,
              old!.mimeType,
              cardWidth,
              cardHeight,
            );
            return [key, data] as [LocalImageQueryKey, Blob];
          } else {
            return [key, old!.original] as [LocalImageQueryKey, File];
          }
        }),
      );

      for (const [key, next] of nextLocalData) {
        queryClient.setQueryData<LocalImageQueryData>(key, (old) => {
          if (!old) {
            return undefined;
          }

          return {
            ...old,
            data: next,
          };
        });
      }
    },
    [queryClient],
  );
};

const calculatePageDimensions = (value: string, unit: Settings["unit"]) => {
  const convertedValue =
    unit === "in" ? Number(value) / 25.4 : Number(value) * 25.4;
  const rounded = Math.round(convertedValue * 100) / 100;
  return rounded.toString();
};

const unitsCollection = createListCollection({
  items: Array.from(
    new Set(Object.values(PAGE_DIMENSIONS).map(({ unit }) => unit)),
  ).map((unit) => ({
    value: unit,
    label: unit,
  })),
});

export const SettingsForm = () => {
  const { settings, setSettings } = useContext(SettingsContext);
  const [formState, setFormState] = useState(settings);

  const handleBleedEdgeForCardSizeChange =
    useHandleBleedEdgeForCardSizeChange();

  const formErrors = useMemo(() => {
    const { error } = SettingsSchema.safeParse(formState);
    const keys = Object.keys(settings) as Array<keyof Settings>;

    return keys.reduce(
      (errorMap, key) => ({
        ...errorMap,
        [key]: error?.issues.filter((issue) => issue.path.includes(key)) ?? [],
      }),
      {} as Record<keyof Settings, NonNullable<typeof error>["issues"]>,
    );
  }, [formState, settings]);

  const handle = useCallback(
    async (updates: Partial<Settings>) => {
      const nextState = {
        ...formState,
        ...Object.fromEntries(
          Object.entries(updates).map(([key, value]) => [
            key,
            value ?? DEFAULT_SETTINGS[key as keyof Settings],
          ]),
        ),
      };

      const updatedKeys = Object.keys(updates) as Array<keyof Settings>;

      if (
        updatedKeys.includes("cardHeight") ||
        updatedKeys.includes("cardWidth")
      ) {
        await handleBleedEdgeForCardSizeChange(nextState);
      }

      if (
        nextState.unit !== formState.unit &&
        !updatedKeys.includes("pageHeight") &&
        !updatedKeys.includes("pageWidth")
      ) {
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
    [formState, handleBleedEdgeForCardSizeChange, setSettings],
  );

  const buildTextInputChangeHandler = useCallback(
    (key: keyof Settings) => (event: React.ChangeEvent<HTMLInputElement>) => {
      void handle({ [key]: event.target.value });
    },
    [handle],
  );

  const buildNumberInputChangeHandler = useCallback(
    (key: keyof Settings) => (details: NumberInputValueChangeDetails) => {
      void handle({ [key]: details.value });
    },
    [handle],
  );

  const buildCheckboxChangeHandler = useCallback(
    (key: keyof Settings) => (details: CheckboxCheckedChangeDetails) => {
      void handle({ [key]: details.checked });
    },
    [handle],
  );

  const buildSelectChangeHandler = useCallback(
    (key: keyof Settings) => (details: SelectValueChangeDetails) => {
      void handle({ [key]: details.value[0] });
    },
    [handle],
  );

  const cardSizeChangeHandler = useCallback(
    (details: SelectValueChangeDetails) => {
      const value = details.value[0] as `${number}-${number}`;
      const cardSize = cardSizeToNameMap[value];

      void handle({
        cardHeight: CARD_DIMENSIONS[cardSize].height.toString(),
        cardWidth: CARD_DIMENSIONS[cardSize].width.toString(),
      });
    },
    [handle],
  );

  const isLandscape =
    Number(formState.pageWidth) > Number(formState.pageHeight);

  const pageSizeChangeHandler = useCallback(
    (details: SelectValueChangeDetails) => {
      const value = details.value[0] as `${number}${Unit}-${number}${Unit}`;
      const pageSize = pageSizeToNameMap[value];

      const pageWidth = PAGE_DIMENSIONS[pageSize].width;
      const pageHeight = PAGE_DIMENSIONS[pageSize].height;

      void handle({
        pageWidth: isLandscape ? pageHeight.toString() : pageWidth.toString(),
        pageHeight: isLandscape ? pageWidth.toString() : pageHeight.toString(),
        unit: PAGE_DIMENSIONS[pageSize].unit,
      });
    },
    [handle, isLandscape],
  );

  const buildColorPickerChangeHandler = useCallback(
    (key: keyof Settings) => (details: ColorPickerValueChangeDetails) => {
      void handle({ [key]: details.value.toString("hex") });
    },
    [handle],
  );

  const cardSizeValue = `${formState.cardWidth}-${formState.cardHeight}`;

  const cardSizeCollection = createListCollection({
    items: Object.entries(CARD_DIMENSIONS)
      .map(([label, dimensions]) => ({
        label,
        value: `${dimensions.width}-${dimensions.height}`,
        hidden: false,
      }))
      .concat({
        label: "Custom",
        value: cardSizeValue,
        hidden: true,
      }),
  });

  const pageSizeValue = isLandscape
    ? `${formState.pageHeight}${formState.unit}-${formState.pageWidth}${formState.unit}`
    : `${formState.pageWidth}${formState.unit}-${formState.pageHeight}${formState.unit}`;

  const pageSizeCollection = createListCollection({
    groupBy: (item) => item.unit,
    items: Object.entries(PAGE_DIMENSIONS)
      .map(([label, dimensions]) => ({
        label,
        unit: dimensions.unit,
        value: `${dimensions.width}${dimensions.unit}-${dimensions.height}${dimensions.unit}`,
        hidden: false,
      }))
      .concat({
        label: "Custom",
        unit: formState.unit,
        value: pageSizeValue,
        hidden: true,
      }),
  });

  const rotatePage = useCallback(() => {
    void handle({
      pageWidth: formState.pageHeight,
      pageHeight: formState.pageWidth,
    });
  }, [formState.pageHeight, formState.pageWidth, handle]);

  const maxGuidesThickness = useMemo(
    () =>
      Math.min(
        MAX_GUIDES_THICKNESS,
        Math.round((MAX_BLEED - Number(formState.bleedEdge)) * 10000) / 10000,
      ),
    [formState.bleedEdge],
  );
  const maxBleedEdge = useMemo(
    () => MAX_BLEED - Number(formState.guidesThickness),
    [formState.guidesThickness],
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
      <Field.Root invalid={formErrors.filename.length > 0}>
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
      <Field.Root invalid={formErrors.guidesColor.length > 0}>
        <ColorPicker
          value={parseColor(formState.guidesColor)}
          onValueChange={buildColorPickerChangeHandler("guidesColor")}
        >
          Guides Color
        </ColorPicker>
        {formErrors.guidesColor.map((issue, i) => (
          <Field.ErrorText key={i}>{issue.message}</Field.ErrorText>
        ))}
      </Field.Root>
      {/* <Field.Root
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
      </Field.Root> */}
      <Collapsible.Root
        className={vstack({
          width: "full",
          alignItems: "stretch",
          alignSelf: "stretch",
        })}
      >
        <Field.Root>
          <Select.Root
            collection={cardSizeCollection}
            value={[cardSizeValue]}
            onValueChange={cardSizeChangeHandler}
          >
            <div
              className={hstack({
                width: "full",
                alignItems: "flex-end",
                justifyContent: "space-between",
              })}
            >
              <Select.Label>Card Size</Select.Label>
              <Collapsible.Trigger asChild>
                <Button variant="link" size="xs" colorPalette="gray">
                  Customize
                </Button>
              </Collapsible.Trigger>
            </div>
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
                  {cardSizeCollection.items
                    .filter((item) => !item.hidden)
                    .map((item) => (
                      <Select.Item key={item.value} item={item}>
                        <Select.ItemText textTransform="capitalize">
                          {item.label}
                        </Select.ItemText>
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
        <Collapsible.Content
          className={vstack({
            width: "full",
            alignItems: "stretch",
            gap: "2",
            alignSelf: "stretch",
            justifyContent: "center",
            paddingLeft: "4",
          })}
        >
          <Field.Root invalid={formErrors.cardWidth.length > 0}>
            <NumberInput
              min={1}
              value={formState.cardWidth}
              onValueChange={buildNumberInputChangeHandler("cardWidth")}
            >
              Card Width (mm)
            </NumberInput>
            {formErrors.cardWidth.map((issue, i) => (
              <Field.ErrorText key={i}>{issue.message}</Field.ErrorText>
            ))}
          </Field.Root>
          <Field.Root invalid={formErrors.cardHeight.length > 0}>
            <NumberInput
              min={1}
              value={formState.cardHeight}
              onValueChange={buildNumberInputChangeHandler("cardHeight")}
            >
              Card Height (mm)
            </NumberInput>
            {formErrors.cardHeight.map((issue, i) => (
              <Field.ErrorText key={i}>{issue.message}</Field.ErrorText>
            ))}
          </Field.Root>
        </Collapsible.Content>
      </Collapsible.Root>
      <Collapsible.Root
        className={vstack({
          width: "full",
          alignItems: "stretch",
          alignSelf: "stretch",
        })}
      >
        <Field.Root>
          <Select.Root
            collection={pageSizeCollection}
            value={[pageSizeValue]}
            onValueChange={pageSizeChangeHandler}
          >
            <div
              className={hstack({
                width: "full",
                alignItems: "flex-end",
                justifyContent: "space-between",
              })}
            >
              <Select.Label>Page Size</Select.Label>
              <Collapsible.Trigger asChild>
                <Button
                  alignSelf="flex-end"
                  variant="link"
                  size="xs"
                  colorPalette="gray"
                >
                  Customize
                </Button>
              </Collapsible.Trigger>
            </div>
            <Select.Control position="relative">
              <Select.Trigger>
                <Select.ValueText textTransform="capitalize" />
              </Select.Trigger>
              <div
                className={hstack({
                  position: "absolute",
                  right: "3",
                  top: "0",
                  height: "full",
                  pointerEvents: "none",
                  gap: "1",
                })}
              >
                <Tooltip.Root openDelay={100} closeDelay={200}>
                  <Tooltip.Trigger asChild>
                    <IconButton
                      type="button"
                      pointerEvents="auto"
                      size="xs"
                      aria-label="Rotate Page"
                      onClick={(e) => {
                        e.stopPropagation();
                        rotatePage();
                      }}
                    >
                      <FontAwesomeIcon icon={faArrowsRotate} size="lg" />
                    </IconButton>
                  </Tooltip.Trigger>
                  <Tooltip.Positioner>
                    <Tooltip.Arrow>
                      <Tooltip.ArrowTip />
                    </Tooltip.Arrow>
                    <Tooltip.Content>Rotate Page</Tooltip.Content>
                  </Tooltip.Positioner>
                </Tooltip.Root>
                <Select.Indicator asChild>
                  <Select.IndicatorIcon />
                </Select.Indicator>
              </div>
            </Select.Control>
            <Select.Positioner>
              <Select.Content>
                {pageSizeCollection.group().map(([type, group]) => (
                  <Select.ItemGroup key={type}>
                    <Select.ItemGroupLabel>
                      {type === "mm" ? "ISO" : "US"}
                    </Select.ItemGroupLabel>
                    {group
                      .filter((item) => !item.hidden)
                      .map((item) => (
                        <Select.Item key={item.value} item={item}>
                          <Select.ItemText textTransform="capitalize">
                            {item.label}
                          </Select.ItemText>
                          <Select.ItemIndicator asChild>
                            <Select.ItemIndicatorIcon />
                          </Select.ItemIndicator>
                        </Select.Item>
                      ))}
                  </Select.ItemGroup>
                ))}
              </Select.Content>
            </Select.Positioner>
          </Select.Root>
        </Field.Root>
        <Collapsible.Content
          className={vstack({
            width: "full",
            alignItems: "stretch",
            gap: "2",
            alignSelf: "stretch",
            justifyContent: "center",
            paddingLeft: "4",
          })}
        >
          <Field.Root invalid={formErrors.unit.length > 0}>
            {/* TODO: Make more simple Select */}
            <Select.Root
              collection={unitsCollection}
              value={[formState.unit]}
              onValueChange={buildSelectChangeHandler("unit")}
            >
              <Select.Label>Page Unit</Select.Label>
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
          <Field.Root invalid={formErrors.pageWidth.length > 0}>
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
          <Field.Root invalid={formErrors.pageHeight.length > 0}>
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
        </Collapsible.Content>
      </Collapsible.Root>
      <Field.Root
        disabled={!formState.enableBleedEdge}
        invalid={formErrors.bleedEdge.length > 0}
      >
        <NumberInput
          min={0}
          max={maxBleedEdge}
          step={0.5}
          value={formState.bleedEdge}
          onValueChange={buildNumberInputChangeHandler("bleedEdge")}
        >
          Bleed Edge (mm)
        </NumberInput>
        {formErrors.bleedEdge.map((issue, i) => (
          <Field.ErrorText key={i}>{issue.message}</Field.ErrorText>
        ))}
      </Field.Root>
      <Field.Root invalid={formErrors.guidesThickness.length > 0}>
        <NumberInput
          min={0}
          max={maxGuidesThickness}
          step={0.01}
          value={formState.guidesThickness}
          onValueChange={buildNumberInputChangeHandler("guidesThickness")}
        >
          Guides Width (mm)
        </NumberInput>
        {formErrors.guidesThickness.map((issue, i) => (
          <Field.ErrorText key={i}>{issue.message}</Field.ErrorText>
        ))}
      </Field.Root>
      <Field.Root invalid={formErrors.rowGap.length > 0}>
        <Field.Label>Row Gap (mm)</Field.Label>
        <NumberInput
          min={0}
          value={formState.rowGap}
          onValueChange={buildNumberInputChangeHandler("rowGap")}
        ></NumberInput>
        {formErrors.rowGap.map((issue, i) => (
          <Field.ErrorText key={i}>{issue.message}</Field.ErrorText>
        ))}
      </Field.Root>
      <Field.Root invalid={formErrors.columnGap.length > 0}>
        <Field.Label>Column Gap (mm)</Field.Label>
        <NumberInput
          min={0}
          value={formState.columnGap}
          onValueChange={buildNumberInputChangeHandler("columnGap")}
        ></NumberInput>
        {formErrors.columnGap.map((issue, i) => (
          <Field.ErrorText key={i}>{issue.message}</Field.ErrorText>
        ))}
      </Field.Root>
      {/* <Field.Root invalid={formErrors.enableBleedEdge.length > 0}>
        <Field.Label>Enable Bleed Edge</Field.Label>
        <Checkbox
          size="lg"
          checked={formState.enableBleedEdge}
          onCheckedChange={buildCheckboxChangeHandler("enableBleedEdge")}
        />
        {formErrors.enableBleedEdge.map((issue, i) => (
          <Field.ErrorText key={i}>{issue.message}</Field.ErrorText>
        ))}
      </Field.Root> */}
      <Field.Root invalid={formErrors.extendedGuidesOnly.length > 0}>
        <Field.Label>Extended Guides Only</Field.Label>
        <Checkbox
          size="lg"
          checked={formState.extendedGuidesOnly}
          onCheckedChange={buildCheckboxChangeHandler("extendedGuidesOnly")}
        />
        {formErrors.extendedGuidesOnly.map((issue, i) => (
          <Field.ErrorText key={i}>{issue.message}</Field.ErrorText>
        ))}
      </Field.Root>
      <Field.Root invalid={formErrors.guidesAtBleedEdge.length > 0}>
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
