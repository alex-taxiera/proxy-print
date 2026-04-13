import { parseColor, Portal } from "@ark-ui/react";
import {
  faArrowsRotate,
  faFlask,
  faUser,
  faUserGraduate,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { PDFDocument } from "pdf-lib";
import { useCallback, useMemo, useRef, useState } from "react";

import { css } from "styled-system/css";
import { hstack, vstack } from "styled-system/patterns";

import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import { Collapsible } from "~/components/ui/collapsible";
import { ColorPicker } from "~/components/ui/color-picker";
import { Field } from "~/components/ui/field";
import { IconButton } from "~/components/ui/icon-button";
import { NumberInput } from "~/components/ui/number-input";
import { Select, createListCollection } from "~/components/ui/select";
import { Tabs } from "~/components/ui/tabs";
import { Tooltip } from "~/components/ui/tooltip";

import {
  CARD_DIMENSIONS,
  MAX_BLEED,
  MAX_GUIDES_THICKNESS,
  PAGE_DIMENSIONS,
} from "~/context/SettingsContext";
import { useSettingsFormState } from "~/hooks/useSettingsFormState";
import { useSettingsStore } from "~/store/settingsStore";
import { createFileHash } from "~/utils/create-file-hash";

import { UpscaleSetting } from "../UpscaleSetting";

const DefaultCardBackSection = () => {
  const defaultCardBack = useSettingsStore((s) => s.defaultCardBack);
  const setDefaultCardBack = useSettingsStore((s) => s.setDefaultCardBack);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [thumbSrc, setThumbSrc] = useState<string | null>(null);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const hash = await createFileHash(file);
      setDefaultCardBack({ file, hash });
      const url = URL.createObjectURL(file);
      setThumbSrc(url);
      e.target.value = "";
    },
    [setDefaultCardBack],
  );

  const handleClear = useCallback(() => {
    setDefaultCardBack(null);
    setThumbSrc(null);
  }, [setDefaultCardBack]);

  const displayName = defaultCardBack
    ? "file" in defaultCardBack
      ? defaultCardBack.file.name
      : defaultCardBack.name
    : null;

  return (
    <Field.Root>
      <Field.Label>Default Card Back</Field.Label>
      <input
        ref={fileInputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.bmp,.webp"
        style={{ display: "none" }}
        onChange={(e) => void handleFileChange(e)}
      />
      {defaultCardBack ? (
        <div className={hstack({ gap: "2", alignItems: "center" })}>
          {thumbSrc && (
            <img
              src={thumbSrc}
              alt="Default card back thumbnail"
              style={{
                width: 32,
                height: 44,
                objectFit: "cover",
                borderRadius: 2,
              }}
            />
          )}
          <span
            style={{
              flex: 1,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              fontSize: "0.75rem",
            }}
          >
            {displayName}
          </span>
          <IconButton
            size="xs"
            variant="ghost"
            colorPalette="gray"
            aria-label="Remove default card back"
            onClick={handleClear}
          >
            <FontAwesomeIcon icon={faXmark} />
          </IconButton>
        </div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          colorPalette="gray"
          onClick={() => fileInputRef.current?.click()}
          type="button"
        >
          Upload card back…
        </Button>
      )}
    </Field.Root>
  );
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
  const {
    formState,
    formErrors,
    handle,
    buildTextInputChangeHandler,
    buildNumberInputChangeHandler,
    buildCheckboxChangeHandler,
    buildSelectChangeHandler,
    cardSizeChangeHandler,
    pageSizeChangeHandler,
    buildColorPickerChangeHandler,
    cardSizeValue,
    pageSizeValue,
  } = useSettingsFormState();

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

  const basePdfName = useSettingsStore((s) => s.basePdfName);
  const setBasePdf = useSettingsStore((s) => s.setBasePdf);
  const basePdfInputRef = useRef<HTMLInputElement>(null);
  const isPageSizeLocked = basePdfName !== null;

  const handleBasePdfChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const bytes = await file.arrayBuffer();
      const bytesArray = new Uint8Array(bytes);
      const doc = await PDFDocument.load(bytesArray);
      const page = doc.getPage(0);
      const { width: widthPts, height: heightPts } = page.getSize();
      const pageCount = doc.getPageCount();

      // Convert pts to the current unit.
      const ptsPerUnit = formState.unit === "mm" ? 72 / 25.4 : 72;
      const pageWidth = (widthPts / ptsPerUnit).toFixed(3);
      const pageHeight = (heightPts / ptsPerUnit).toFixed(3);

      setBasePdf({ bytes: bytesArray, name: file.name, pageCount });
      void handle({ pageWidth, pageHeight });

      // Reset so the same file can be re-selected.
      e.target.value = "";
    },
    [formState.unit, handle, setBasePdf],
  );

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
    <Tabs.Root asChild defaultValue="basic">
      <form>
        <Tabs.List justifyContent="space-evenly">
          <Tabs.Trigger value="basic" aria-label="Basic Settings">
            <Tooltip.Root
              openDelay={100}
              closeDelay={200}
              positioning={{
                placement: "top",
              }}
            >
              <Tooltip.Trigger asChild>
                <FontAwesomeIcon icon={faUser} size="lg" />
              </Tooltip.Trigger>
              <Portal>
                <Tooltip.Positioner>
                  <Tooltip.Arrow>
                    <Tooltip.ArrowTip />
                  </Tooltip.Arrow>
                  <Tooltip.Content>Basic Settings</Tooltip.Content>
                </Tooltip.Positioner>
              </Portal>
            </Tooltip.Root>
          </Tabs.Trigger>
          <Tabs.Trigger value="advanced" aria-label="Advanced Settings">
            <Tooltip.Root
              openDelay={100}
              closeDelay={200}
              positioning={{
                placement: "top",
              }}
            >
              <Tooltip.Trigger asChild>
                <FontAwesomeIcon icon={faUserGraduate} size="lg" />
              </Tooltip.Trigger>
              <Portal>
                <Tooltip.Positioner>
                  <Tooltip.Arrow>
                    <Tooltip.ArrowTip />
                  </Tooltip.Arrow>
                  <Tooltip.Content>Advanced Settings</Tooltip.Content>
                </Tooltip.Positioner>
              </Portal>
            </Tooltip.Root>
          </Tabs.Trigger>
          <Tabs.Trigger value="experimental" aria-label="Experimental Settings">
            <Tooltip.Root
              openDelay={100}
              closeDelay={200}
              positioning={{
                placement: "top",
              }}
            >
              <Tooltip.Trigger asChild>
                <FontAwesomeIcon icon={faFlask} size="lg" />
              </Tooltip.Trigger>
              <Portal>
                <Tooltip.Positioner>
                  <Tooltip.Arrow>
                    <Tooltip.ArrowTip />
                  </Tooltip.Arrow>
                  <Tooltip.Content>Experimental Settings</Tooltip.Content>
                </Tooltip.Positioner>
              </Portal>
            </Tooltip.Root>
          </Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content
          value="basic"
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
                disabled={isPageSizeLocked}
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
                <Tooltip.Root
                  disabled={!isPageSizeLocked}
                  openDelay={100}
                  closeDelay={200}
                >
                  <Tooltip.Trigger asChild>
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
                              disabled={isPageSizeLocked}
                              onClick={(e) => {
                                e.stopPropagation();
                                rotatePage();
                              }}
                            >
                              <FontAwesomeIcon
                                icon={faArrowsRotate}
                                size="lg"
                              />
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
                  </Tooltip.Trigger>
                  <Portal>
                    <Tooltip.Positioner>
                      <Tooltip.Arrow>
                        <Tooltip.ArrowTip />
                      </Tooltip.Arrow>
                      <Tooltip.Content>
                        Locked to Base PDF dimensions{" "}
                      </Tooltip.Content>
                    </Tooltip.Positioner>
                  </Portal>
                </Tooltip.Root>
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
              <Field.Root
                invalid={formErrors.unit.length > 0}
                disabled={isPageSizeLocked}
              >
                {/* TODO: Make more simple Select */}
                <Select.Root
                  collection={unitsCollection}
                  value={[formState.unit]}
                  onValueChange={buildSelectChangeHandler("unit")}
                  disabled={isPageSizeLocked}
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
              <Field.Root
                invalid={formErrors.pageWidth.length > 0}
                disabled={isPageSizeLocked}
              >
                <NumberInput
                  min={1}
                  value={formState.pageWidth}
                  onValueChange={buildNumberInputChangeHandler("pageWidth")}
                  disabled={isPageSizeLocked}
                >
                  Page Width ({formState.unit})
                </NumberInput>
                {formErrors.pageWidth.map((issue, i) => (
                  <Field.ErrorText key={i}>{issue.message}</Field.ErrorText>
                ))}
              </Field.Root>
              <Field.Root
                invalid={formErrors.pageHeight.length > 0}
                disabled={isPageSizeLocked}
              >
                <NumberInput
                  min={1}
                  value={formState.pageHeight}
                  onValueChange={buildNumberInputChangeHandler("pageHeight")}
                  disabled={isPageSizeLocked}
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
          <DefaultCardBackSection />
        </Tabs.Content>
        <Tabs.Content
          value="advanced"
          className={vstack({
            width: "full",
            alignItems: "stretch",
            gap: "2",
            alignSelf: "stretch",
            justifyContent: "center",
          })}
        >
          <UpscaleSetting />
          <Field.Root invalid={formErrors.convertToJpg.length > 0}>
            <Field.Label>Convert images to JPG</Field.Label>
            <Checkbox
              size="lg"
              checked={formState.convertToJpg}
              onCheckedChange={buildCheckboxChangeHandler("convertToJpg")}
            />
            {formErrors.convertToJpg.map((issue, i) => (
              <Field.ErrorText key={i}>{issue.message}</Field.ErrorText>
            ))}
          </Field.Root>
          <Collapsible.Root open={formState.convertToJpg}>
            <Collapsible.Content
              className={vstack({
                width: "full",
                paddingLeft: "4",
              })}
            >
              <Field.Root invalid={formErrors.jpgQuality.length > 0}>
                <NumberInput
                  min={0.1}
                  max={1}
                  step={0.01}
                  disabled={!formState.convertToJpg}
                  value={formState.jpgQuality}
                  onValueChange={buildNumberInputChangeHandler("jpgQuality")}
                >
                  JPG Quality
                </NumberInput>
                {formErrors.jpgQuality.map((issue, i) => (
                  <Field.ErrorText key={i}>{issue.message}</Field.ErrorText>
                ))}
              </Field.Root>
            </Collapsible.Content>
          </Collapsible.Root>
          <Field.Root invalid={formErrors.maxDpi.length > 0}>
            <NumberInput
              min={300}
              max={1200}
              step={100}
              value={formState.maxDpi}
              onValueChange={buildNumberInputChangeHandler("maxDpi")}
            >
              Max DPI
            </NumberInput>
            {formErrors.maxDpi.map((issue, i) => (
              <Field.ErrorText key={i}>{issue.message}</Field.ErrorText>
            ))}
          </Field.Root>
          <span
            className={css({
              fontSize: "xs",
              color: "fg.muted",
              fontWeight: "semibold",
            })}
          >
            Card Spacing
          </span>
          <div className={hstack({ width: "full", gap: "2" })}>
            <Field.Root invalid={formErrors.rowGap.length > 0}>
              <Field.Label>Vertical (mm)</Field.Label>
              <NumberInput
                min={0}
                max={100}
                value={formState.rowGap}
                onValueChange={buildNumberInputChangeHandler("rowGap")}
              ></NumberInput>
              {formErrors.rowGap.map((issue, i) => (
                <Field.ErrorText key={i}>{issue.message}</Field.ErrorText>
              ))}
            </Field.Root>
            <Field.Root invalid={formErrors.columnGap.length > 0}>
              <Field.Label>Horizontal (mm)</Field.Label>
              <NumberInput
                min={0}
                max={100}
                value={formState.columnGap}
                onValueChange={buildNumberInputChangeHandler("columnGap")}
              ></NumberInput>
              {formErrors.columnGap.map((issue, i) => (
                <Field.ErrorText key={i}>{issue.message}</Field.ErrorText>
              ))}
            </Field.Root>
          </div>
          <span
            className={css({
              fontSize: "xs",
              color: "fg.muted",
              fontWeight: "semibold",
            })}
          >
            Front Page Alignment
          </span>
          <div className={hstack({ width: "full", gap: "2" })}>
            <Field.Root
              invalid={formErrors.offsetX.length > 0}
              className={css({ flex: 1 })}
            >
              <NumberInput
                step={0.1}
                value={formState.offsetX}
                onValueChange={buildNumberInputChangeHandler("offsetX")}
              >
                X Offset (mm)
              </NumberInput>
              {formErrors.offsetX.map((issue, i) => (
                <Field.ErrorText key={i}>{issue.message}</Field.ErrorText>
              ))}
            </Field.Root>
            <Field.Root
              invalid={formErrors.offsetY.length > 0}
              className={css({ flex: 1 })}
            >
              <NumberInput
                step={0.1}
                value={formState.offsetY}
                onValueChange={buildNumberInputChangeHandler("offsetY")}
              >
                Y Offset (mm)
              </NumberInput>
              {formErrors.offsetY.map((issue, i) => (
                <Field.ErrorText key={i}>{issue.message}</Field.ErrorText>
              ))}
            </Field.Root>
          </div>
          <Field.Root invalid={formErrors.pageRotation.length > 0}>
            <NumberInput
              step={0.1}
              min={-180}
              max={180}
              value={formState.pageRotation}
              onValueChange={buildNumberInputChangeHandler("pageRotation")}
            >
              Rotation (°)
            </NumberInput>
            {formErrors.pageRotation.map((issue, i) => (
              <Field.ErrorText key={i}>{issue.message}</Field.ErrorText>
            ))}
          </Field.Root>
          <span
            className={css({
              fontSize: "xs",
              color: "fg.muted",
              fontWeight: "semibold",
            })}
          >
            Back Page Alignment
          </span>
          <div className={hstack({ width: "full", gap: "2" })}>
            <Field.Root
              invalid={formErrors.backOffsetX.length > 0}
              className={css({ flex: 1 })}
            >
              <NumberInput
                step={0.1}
                value={formState.backOffsetX}
                onValueChange={buildNumberInputChangeHandler("backOffsetX")}
              >
                X Offset (mm)
              </NumberInput>
              {formErrors.backOffsetX.map((issue, i) => (
                <Field.ErrorText key={i}>{issue.message}</Field.ErrorText>
              ))}
            </Field.Root>
            <Field.Root
              invalid={formErrors.backOffsetY.length > 0}
              className={css({ flex: 1 })}
            >
              <NumberInput
                step={0.1}
                value={formState.backOffsetY}
                onValueChange={buildNumberInputChangeHandler("backOffsetY")}
              >
                Y Offset (mm)
              </NumberInput>
              {formErrors.backOffsetY.map((issue, i) => (
                <Field.ErrorText key={i}>{issue.message}</Field.ErrorText>
              ))}
            </Field.Root>
          </div>
          <Field.Root invalid={formErrors.backPageRotation.length > 0}>
            <NumberInput
              step={0.1}
              min={-180}
              max={180}
              value={formState.backPageRotation}
              onValueChange={buildNumberInputChangeHandler("backPageRotation")}
            >
              Rotation (°)
            </NumberInput>
            {formErrors.backPageRotation.map((issue, i) => (
              <Field.ErrorText key={i}>{issue.message}</Field.ErrorText>
            ))}
          </Field.Root>
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
          <Field.Root invalid={formErrors.backPagesShowGuides.length > 0}>
            <Field.Label>Show Guides on Back Pages</Field.Label>
            <Checkbox
              size="lg"
              checked={formState.backPagesShowGuides}
              onCheckedChange={buildCheckboxChangeHandler("backPagesShowGuides")}
            />
            {formErrors.backPagesShowGuides.map((issue, i) => (
              <Field.ErrorText key={i}>{issue.message}</Field.ErrorText>
            ))}
          </Field.Root>
        </Tabs.Content>
        <Tabs.Content
          value="experimental"
          className={vstack({
            width: "full",
            alignItems: "stretch",
            gap: "2",
            alignSelf: "stretch",
            justifyContent: "center",
          })}
        >
          <Field.Root>
            <Field.Label>Base PDF</Field.Label>
            <Field.HelperText>
              Cards will be printed on top of this PDF. Page size is locked to
              the PDF&apos;s dimensions.
            </Field.HelperText>
            <input
              ref={basePdfInputRef}
              type="file"
              accept=".pdf,application/pdf"
              style={{ display: "none" }}
              onChange={(e) => {
                void handleBasePdfChange(e);
              }}
            />
            {basePdfName ? (
              <div
                className={hstack({
                  width: "full",
                  gap: "2",
                  alignItems: "center",
                })}
              >
                <span
                  style={{
                    flex: 1,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {basePdfName}
                </span>
                <IconButton
                  type="button"
                  size="xs"
                  variant="ghost"
                  aria-label="Remove base PDF"
                  onClick={() => setBasePdf(null)}
                >
                  <FontAwesomeIcon icon={faXmark} />
                </IconButton>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                alignSelf="flex-start"
                onClick={() => basePdfInputRef.current?.click()}
              >
                Choose PDF…
              </Button>
            )}
          </Field.Root>
        </Tabs.Content>
      </form>
    </Tabs.Root>
  );
};
