import {
  Button,
  IconButton,
  Tabs,
  Input,
  parseColor,
  Bleed,
  Icon,
  Link,
  HStack,
  VStack,
  createListCollection,
  StackProps,
  Collapsible,
} from "@chakra-ui/react";
import {
  LuFlaskConical,
  LuGraduationCap,
  LuRefreshCcw,
  LuUser,
} from "react-icons/lu";

import {
  AccordionItem,
  AccordionItemContent,
  AccordionItemTrigger,
  AccordionRoot,
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ColorPickerRoot,
  ColorPickerLabel,
  ColorPickerControl,
  ColorPickerInput,
  ColorPickerTrigger,
  ColorPickerContent,
  ColorPickerArea,
  ColorPickerEyeDropper,
  ColorPickerSliders,
  ColorPickerSwatchGroup,
} from "@/components/ui/color-picker";
import { Field } from "@/components/ui/field";
import { Fieldset } from "@/components/ui/fieldset";
import {
  FileUploadRoot,
  FileUploadTrigger,
  FileUploadList,
} from "@/components/ui/file-upload";
import {
  NumberInputRoot,
  NumberInputField,
} from "@/components/ui/number-input";
import {
  SelectRoot,
  SelectLabel,
  SelectTrigger,
  SelectValueText,
  SelectContent,
  SelectItemGroup,
  SelectItem,
  SelectItemText,
  SelectControl,
  SelectIndicatorGroup,
  SelectIndicator,
} from "@/components/ui/select";
import { Tooltip } from "@/components/ui/tooltip";

import {
  CARD_DIMENSIONS,
  MAX_BLEED,
  MAX_GUIDES_THICKNESS,
  PAGE_DIMENSIONS,
} from "@/context/SettingsContext";
import { useSettingsFormState } from "@/hooks/useSettingsFormState";
import { useSettingsStore } from "@/store/settingsStore";
import { createFileHash } from "@/utils/create-file-hash";

import { UpscaleSetting } from "../UpscaleSetting";
import { BasePDFInput } from "./BasePDFInput";

const DefaultCardBackSection = () => {
  const defaultCardBack = useSettingsStore((s) => s.defaultCardBack);
  const setDefaultCardBack = useSettingsStore((s) => s.setDefaultCardBack);

  const acceptedFile = defaultCardBack
    ? "file" in defaultCardBack
      ? defaultCardBack.file
      : new File([new ArrayBuffer(0)], defaultCardBack.name)
    : null;

  return (
    <Field label="Default Card Back">
      <FileUploadRoot
        maxFiles={1}
        accept={{ "image/*": [".jpg", ".jpeg", ".png", ".bmp", ".webp"] }}
        onFileChange={(details) => {
          const file = details.acceptedFiles[0];
          if (!file) {
            setDefaultCardBack(null);
          } else {
            void createFileHash(file).then((hash) => {
              setDefaultCardBack({ file, hash });
            });
          }
        }}
        acceptedFiles={acceptedFile ? [acceptedFile] : []}
      >
        {defaultCardBack ? (
          <FileUploadList clearable />
        ) : (
          <FileUploadTrigger asChild>
            <Button variant="outline" size="sm" type="button">
              Upload card back…
            </Button>
          </FileUploadTrigger>
        )}
      </FileUploadRoot>
    </Field>
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

const PAGE_SIZE_OPTIONS = Object.entries(PAGE_DIMENSIONS).map(
  ([label, dimensions]) => ({
    label,
    unit: dimensions.unit,
    value: `${dimensions.width}${dimensions.unit}-${dimensions.height}${dimensions.unit}`,
    hidden: false,
  }),
);

const Container = (props: StackProps) => (
  <VStack
    width="full"
    gap="4"
    alignItems="stretch"
    alignSelf="stretch"
    justifyContent="center"
    {...props}
  />
);

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
    items: PAGE_SIZE_OPTIONS.concat({
      label: "Custom",
      unit: formState.unit,
      value: "custom",
      hidden: true,
    }),
  });

  const displayPageSizeValue = PAGE_SIZE_OPTIONS.some(
    (option) => option.value === pageSizeValue,
  )
    ? pageSizeValue
    : "custom";

  const rotatePage = () => {
    void handle({
      pageWidth: formState.pageHeight,
      pageHeight: formState.pageWidth,
    });
  };

  const basePdfName = useSettingsStore((s) => s.basePdfName);
  const isPageSizeLocked = basePdfName !== null;

  const maxGuidesThickness = Math.min(
    MAX_GUIDES_THICKNESS,
    Math.round((MAX_BLEED - Number(formState.bleedEdge)) * 10000) / 10000,
  );
  const maxBleedEdge = MAX_BLEED - Number(formState.guidesThickness);

  const maxGuideLength = Number(formState.cardWidth) / 2;

  return (
    <Tabs.Root asChild defaultValue="basic" fitted width="full">
      <form>
        <Bleed inline={{ base: "2", lg: "4" }}>
          <Tabs.List>
            <Tabs.Trigger value="basic" aria-label="Basic Settings">
              <Tooltip
                openDelay={100}
                closeDelay={200}
                positioning={{
                  placement: "top",
                }}
                content="Basic Settings"
              >
                <Icon fontSize="2xl">
                  <LuUser />
                </Icon>
              </Tooltip>
            </Tabs.Trigger>
            <Tabs.Trigger value="advanced" aria-label="Advanced Settings">
              <Tooltip
                openDelay={100}
                closeDelay={200}
                positioning={{
                  placement: "top",
                }}
                content="Advanced Settings"
              >
                <Icon fontSize="2xl">
                  <LuGraduationCap />
                </Icon>
              </Tooltip>
            </Tabs.Trigger>
            <Tabs.Trigger
              value="experimental"
              aria-label="Experimental Settings"
            >
              <Tooltip
                openDelay={100}
                closeDelay={200}
                positioning={{
                  placement: "top",
                }}
                content="Experimental Settings"
              >
                <Icon fontSize="2xl">
                  <LuFlaskConical />
                </Icon>
              </Tooltip>
            </Tabs.Trigger>
          </Tabs.List>
        </Bleed>
        <Tabs.Content value="basic" asChild>
          <Container>
            <Field
              label="Output Filename"
              invalid={formErrors.filename.length > 0}
              errorText={formErrors.filename[0]?.message}
            >
              <Input
                minLength={1}
                maxLength={50}
                value={formState.filename}
                onChange={buildTextInputChangeHandler("filename")}
              />
            </Field>

            <Collapsible.Root gap="3">
              <Field>
                <SelectRoot
                  collection={cardSizeCollection}
                  value={[cardSizeValue]}
                  onValueChange={cardSizeChangeHandler}
                >
                  <HStack
                    width="full"
                    alignItems="flex-end"
                    justifyContent="space-between"
                  >
                    <SelectLabel>Card Size</SelectLabel>
                    <Collapsible.Trigger asChild>
                      <Link
                        as="button"
                        fontWeight="semibold"
                        fontSize="xs"
                        colorPalette="accent"
                      >
                        Customize
                      </Link>
                    </Collapsible.Trigger>
                  </HStack>
                  <SelectControl>
                    <SelectTrigger>
                      <SelectValueText textTransform="capitalize" />
                    </SelectTrigger>
                    <SelectIndicatorGroup />
                  </SelectControl>
                  <SelectContent>
                    {cardSizeCollection.items
                      .filter((item) => !item.hidden)
                      .map((item) => (
                        <SelectItem key={item.value} item={item}>
                          <SelectItemText textTransform="capitalize">
                            {item.label}
                          </SelectItemText>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </SelectRoot>
              </Field>
              <Collapsible.Content>
                <VStack
                  width="full"
                  gap="4"
                  alignItems="stretch"
                  alignSelf="stretch"
                  justifyContent="center"
                  paddingLeft="4"
                >
                  <Field
                    label="Card Width (mm)"
                    invalid={formErrors.cardWidth.length > 0}
                    errorText={formErrors.cardWidth[0]?.message}
                  >
                    <NumberInputRoot
                      min={1}
                      value={formState.cardWidth}
                      onValueChange={buildNumberInputChangeHandler("cardWidth")}
                    >
                      <NumberInputField />
                    </NumberInputRoot>
                  </Field>
                  <Field
                    label="Card Height (mm)"
                    invalid={formErrors.cardHeight.length > 0}
                    errorText={formErrors.cardHeight[0]?.message}
                  >
                    <NumberInputRoot
                      min={1}
                      value={formState.cardHeight}
                      onValueChange={buildNumberInputChangeHandler(
                        "cardHeight",
                      )}
                    >
                      <NumberInputField />
                    </NumberInputRoot>
                  </Field>
                </VStack>
              </Collapsible.Content>
            </Collapsible.Root>

            <Collapsible.Root gap="3">
              <Field>
                <SelectRoot
                  collection={pageSizeCollection}
                  value={[displayPageSizeValue]}
                  onValueChange={pageSizeChangeHandler}
                  disabled={isPageSizeLocked}
                >
                  <HStack
                    width="full"
                    alignItems="flex-end"
                    justifyContent="space-between"
                  >
                    <SelectLabel>Page Size</SelectLabel>
                    <Collapsible.Trigger asChild>
                      <Link
                        as="button"
                        fontWeight="semibold"
                        fontSize="xs"
                        colorPalette="accent"
                      >
                        Customize
                      </Link>
                    </Collapsible.Trigger>
                  </HStack>
                  <Tooltip
                    disabled={!isPageSizeLocked}
                    openDelay={100}
                    closeDelay={200}
                    content="Locked to Base PDF dimensions"
                  >
                    <SelectControl>
                      <SelectTrigger>
                        <SelectValueText textTransform="capitalize" />
                      </SelectTrigger>
                      <SelectIndicatorGroup>
                        <Tooltip
                          openDelay={100}
                          closeDelay={200}
                          content="Rotate Page"
                        >
                          <IconButton
                            type="button"
                            variant="ghost"
                            pointerEvents="auto"
                            size="xs"
                            aria-label="Rotate Page"
                            disabled={isPageSizeLocked}
                            onClick={(e) => {
                              e.stopPropagation();
                              rotatePage();
                            }}
                          >
                            <LuRefreshCcw />
                          </IconButton>
                        </Tooltip>
                        <SelectIndicator />
                      </SelectIndicatorGroup>
                    </SelectControl>
                  </Tooltip>
                  <SelectContent>
                    {pageSizeCollection.group().map(([type, group]) => (
                      <SelectItemGroup
                        key={type}
                        label={type === "mm" ? "ISO" : "US"}
                      >
                        {group
                          .filter((item) => !item.hidden)
                          .map((item) => (
                            <SelectItem key={item.value} item={item}>
                              <SelectItemText textTransform="capitalize">
                                {item.label}
                              </SelectItemText>
                            </SelectItem>
                          ))}
                      </SelectItemGroup>
                    ))}
                  </SelectContent>
                </SelectRoot>
              </Field>
              <Collapsible.Content>
                <VStack
                  width="full"
                  gap="4"
                  alignItems="stretch"
                  alignSelf="stretch"
                  justifyContent="center"
                  paddingLeft="4"
                >
                  <Field disabled={isPageSizeLocked}>
                    <SelectRoot
                      collection={unitsCollection}
                      value={[formState.unit]}
                      onValueChange={buildSelectChangeHandler("unit")}
                      disabled={isPageSizeLocked}
                    >
                      <SelectLabel>Page Unit</SelectLabel>
                      <SelectControl>
                        <SelectTrigger>
                          <SelectValueText />
                        </SelectTrigger>
                        <SelectIndicatorGroup />
                      </SelectControl>
                      <SelectContent>
                        {unitsCollection.items.map((item) => (
                          <SelectItem key={item.value} item={item}>
                            <SelectItemText>{item.label}</SelectItemText>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </SelectRoot>
                  </Field>
                  <Field
                    label={`Page Width (${formState.unit})`}
                    invalid={formErrors.pageWidth.length > 0}
                    disabled={isPageSizeLocked}
                    errorText={formErrors.pageWidth[0]?.message}
                  >
                    <NumberInputRoot
                      min={1}
                      value={formState.pageWidth}
                      onValueChange={buildNumberInputChangeHandler("pageWidth")}
                      disabled={isPageSizeLocked}
                    >
                      <NumberInputField />
                    </NumberInputRoot>
                  </Field>
                  <Field
                    label={`Page Height (${formState.unit})`}
                    invalid={formErrors.pageHeight.length > 0}
                    disabled={isPageSizeLocked}
                    errorText={formErrors.pageHeight[0]?.message}
                  >
                    <NumberInputRoot
                      min={1}
                      value={formState.pageHeight}
                      onValueChange={buildNumberInputChangeHandler(
                        "pageHeight",
                      )}
                      disabled={isPageSizeLocked}
                    >
                      <NumberInputField />
                    </NumberInputRoot>
                  </Field>
                </VStack>
              </Collapsible.Content>
            </Collapsible.Root>

            <Field
              label="Bleed Edge (mm)"
              disabled={!formState.enableBleedEdge}
              invalid={formErrors.bleedEdge.length > 0}
              errorText={formErrors.bleedEdge[0]?.message}
            >
              <NumberInputRoot
                min={0}
                max={maxBleedEdge}
                step={0.5}
                value={formState.bleedEdge}
                onValueChange={buildNumberInputChangeHandler("bleedEdge")}
              >
                <NumberInputField />
              </NumberInputRoot>
            </Field>
            <Field
              label="Guides Width (mm)"
              invalid={formErrors.guidesThickness.length > 0}
              errorText={formErrors.guidesThickness[0]?.message}
            >
              <NumberInputRoot
                min={0}
                max={maxGuidesThickness}
                step={0.01}
                value={formState.guidesThickness}
                onValueChange={buildNumberInputChangeHandler("guidesThickness")}
              >
                <NumberInputField />
              </NumberInputRoot>
            </Field>
            <Field
              invalid={formErrors.guidesColor.length > 0}
              errorText={formErrors.guidesColor[0]?.message}
            >
              <ColorPickerRoot
                value={parseColor(formState.guidesColor)}
                onValueChange={buildColorPickerChangeHandler("guidesColor")}
              >
                <ColorPickerLabel>Guides Color</ColorPickerLabel>
                <ColorPickerControl>
                  <ColorPickerInput />
                  <ColorPickerTrigger />
                </ColorPickerControl>
                <ColorPickerContent>
                  <ColorPickerArea />
                  <ColorPickerEyeDropper />
                  <ColorPickerSliders />
                  <ColorPickerSwatchGroup />
                </ColorPickerContent>
              </ColorPickerRoot>
            </Field>
            <DefaultCardBackSection />
          </Container>
        </Tabs.Content>
        <Tabs.Content value="advanced" asChild width="unset">
          <Bleed inline={{ base: "2", lg: "4" }}>
            <AccordionRoot collapsible defaultValue={["image-quality"]}>
              <AccordionItem value="image-quality">
                <AccordionItemTrigger paddingX={{ base: "2", lg: "4" }}>
                  Image Quality
                </AccordionItemTrigger>
                <AccordionItemContent asChild>
                  <Container paddingX={{ base: "2", lg: "4" }}>
                    <UpscaleSetting />
                    <Fieldset>
                      <Checkbox
                        size="md"
                        checked={formState.convertToJpg}
                        onCheckedChange={buildCheckboxChangeHandler(
                          "convertToJpg",
                        )}
                      >
                        Convert images to JPG
                      </Checkbox>
                      <Collapsible.Root open={formState.convertToJpg}>
                        <Collapsible.Content>
                          <Field
                            label="JPG Quality"
                            invalid={formErrors.jpgQuality.length > 0}
                            errorText={formErrors.jpgQuality[0]?.message}
                          >
                            <NumberInputRoot
                              min={0.1}
                              max={1}
                              step={0.01}
                              disabled={!formState.convertToJpg}
                              value={formState.jpgQuality}
                              onValueChange={buildNumberInputChangeHandler(
                                "jpgQuality",
                              )}
                            >
                              <NumberInputField />
                            </NumberInputRoot>
                          </Field>
                        </Collapsible.Content>
                      </Collapsible.Root>
                    </Fieldset>
                    <Field
                      label="Max DPI"
                      invalid={formErrors.maxDpi.length > 0}
                      errorText={formErrors.maxDpi[0]?.message}
                    >
                      <NumberInputRoot
                        min={300}
                        max={1200}
                        step={100}
                        value={formState.maxDpi}
                        onValueChange={buildNumberInputChangeHandler("maxDpi")}
                      >
                        <NumberInputField />
                      </NumberInputRoot>
                    </Field>
                  </Container>
                </AccordionItemContent>
              </AccordionItem>
              <AccordionItem value="alignment">
                <AccordionItemTrigger paddingX={{ base: "2", lg: "4" }}>
                  Alignment
                </AccordionItemTrigger>
                <AccordionItemContent asChild>
                  <Container paddingX={{ base: "2", lg: "4" }}>
                    <Fieldset legend="Card Spacing">
                      <HStack width="full" gap="2">
                        <Field
                          label="Vertical (mm)"
                          invalid={formErrors.rowGap.length > 0}
                          errorText={formErrors.rowGap[0]?.message}
                        >
                          <NumberInputRoot
                            min={0}
                            max={100}
                            value={formState.rowGap}
                            onValueChange={buildNumberInputChangeHandler(
                              "rowGap",
                            )}
                          >
                            <NumberInputField />
                          </NumberInputRoot>
                        </Field>
                        <Field
                          label="Horizontal (mm)"
                          invalid={formErrors.columnGap.length > 0}
                          errorText={formErrors.columnGap[0]?.message}
                        >
                          <NumberInputRoot
                            min={0}
                            max={100}
                            value={formState.columnGap}
                            onValueChange={buildNumberInputChangeHandler(
                              "columnGap",
                            )}
                          >
                            <NumberInputField />
                          </NumberInputRoot>
                        </Field>
                      </HStack>
                    </Fieldset>
                    <Fieldset legend="Front Page Offset">
                      <HStack width="full" gap="2">
                        <Field
                          label="X Offset (mm)"
                          invalid={formErrors.offsetX.length > 0}
                          errorText={formErrors.offsetX[0]?.message}
                          flex="1"
                        >
                          <NumberInputRoot
                            step={0.1}
                            value={formState.offsetX}
                            onValueChange={buildNumberInputChangeHandler(
                              "offsetX",
                            )}
                          >
                            <NumberInputField />
                          </NumberInputRoot>
                        </Field>
                        <Field
                          label="Y Offset (mm)"
                          invalid={formErrors.offsetY.length > 0}
                          errorText={formErrors.offsetY[0]?.message}
                          flex="1"
                        >
                          <NumberInputRoot
                            step={0.1}
                            value={formState.offsetY}
                            onValueChange={buildNumberInputChangeHandler(
                              "offsetY",
                            )}
                          >
                            <NumberInputField />
                          </NumberInputRoot>
                        </Field>
                      </HStack>
                    </Fieldset>
                    <Field
                      label="Rotation (°)"
                      invalid={formErrors.pageRotation.length > 0}
                      errorText={formErrors.pageRotation[0]?.message}
                    >
                      <NumberInputRoot
                        step={0.1}
                        min={-180}
                        max={180}
                        value={formState.pageRotation}
                        onValueChange={buildNumberInputChangeHandler(
                          "pageRotation",
                        )}
                      >
                        <NumberInputField />
                      </NumberInputRoot>
                    </Field>
                    <Fieldset legend="Back Page Offset">
                      <HStack width="full" gap="2">
                        <Field
                          label="X Offset (mm)"
                          invalid={formErrors.backOffsetX.length > 0}
                          errorText={formErrors.backOffsetX[0]?.message}
                          flex="1"
                        >
                          <NumberInputRoot
                            step={0.1}
                            value={formState.backOffsetX}
                            onValueChange={buildNumberInputChangeHandler(
                              "backOffsetX",
                            )}
                          >
                            <NumberInputField />
                          </NumberInputRoot>
                        </Field>
                        <Field
                          label="Y Offset (mm)"
                          invalid={formErrors.backOffsetY.length > 0}
                          errorText={formErrors.backOffsetY[0]?.message}
                          flex="1"
                        >
                          <NumberInputRoot
                            step={0.1}
                            value={formState.backOffsetY}
                            onValueChange={buildNumberInputChangeHandler(
                              "backOffsetY",
                            )}
                          >
                            <NumberInputField />
                          </NumberInputRoot>
                        </Field>
                      </HStack>
                    </Fieldset>
                    <Field
                      label="Rotation (°)"
                      invalid={formErrors.backPageRotation.length > 0}
                      errorText={formErrors.backPageRotation[0]?.message}
                    >
                      <NumberInputRoot
                        step={0.1}
                        min={-180}
                        max={180}
                        value={formState.backPageRotation}
                        onValueChange={buildNumberInputChangeHandler(
                          "backPageRotation",
                        )}
                      >
                        <NumberInputField />
                      </NumberInputRoot>
                    </Field>
                  </Container>
                </AccordionItemContent>
              </AccordionItem>
              <AccordionItem value="guides">
                <AccordionItemTrigger paddingX={{ base: "2", lg: "4" }}>
                  Guides
                </AccordionItemTrigger>
                <AccordionItemContent asChild>
                  <Container paddingX={{ base: "2", lg: "4" }}>
                    <Field
                      label="Guide Length (mm)"
                      helperText="Set to 0 for auto length"
                      invalid={formErrors.guideLength.length > 0}
                      errorText={formErrors.guideLength[0]?.message}
                    >
                      <NumberInputRoot
                        min={0}
                        max={maxGuideLength}
                        step={0.5}
                        value={formState.guideLength}
                        onValueChange={buildNumberInputChangeHandler(
                          "guideLength",
                        )}
                      >
                        <NumberInputField />
                      </NumberInputRoot>
                    </Field>
                    <Checkbox
                      size="md"
                      checked={formState.extendedGuidesOnly}
                      onCheckedChange={buildCheckboxChangeHandler(
                        "extendedGuidesOnly",
                      )}
                    >
                      Extended Guides Only
                    </Checkbox>
                    <Checkbox
                      size="md"
                      checked={formState.guidesAtBleedEdge}
                      onCheckedChange={buildCheckboxChangeHandler(
                        "guidesAtBleedEdge",
                      )}
                    >
                      Guides at Bleed Edge
                    </Checkbox>
                    <Checkbox
                      size="md"
                      checked={formState.backPagesShowGuides}
                      onCheckedChange={buildCheckboxChangeHandler(
                        "backPagesShowGuides",
                      )}
                    >
                      Show Guides on Back Pages
                    </Checkbox>
                  </Container>
                </AccordionItemContent>
              </AccordionItem>
            </AccordionRoot>
          </Bleed>
        </Tabs.Content>
        <Tabs.Content value="experimental" asChild>
          <Container>
            <BasePDFInput />
          </Container>
        </Tabs.Content>
      </form>
    </Tabs.Root>
  );
};
