import { SelectValueChangeDetails } from "@ark-ui/react";
import {
  Collapsible,
  createListCollection,
  HStack,
  IconButton,
  Link,
  Text,
  VStack,
} from "@chakra-ui/react";
import {
  LuRectangleHorizontal,
  LuRectangleVertical,
  LuRefreshCcw,
} from "react-icons/lu";

import { Field } from "@/components/ui/field";
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
  PAGE_DIMENSIONS,
  pageSizeToNameMap,
  Unit,
} from "@/context/SettingsContext";

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

type PageSizeValue = { pageWidth: string; pageHeight: string; unit: Unit };

type PageSizeFieldsProps = {
  value: PageSizeValue;
  onChange: (next: Partial<PageSizeValue>) => void;
  disabled?: boolean;
  disabledTooltip?: string;
  errors?: { pageWidth?: string; pageHeight?: string };
};

export const PageSizeFields = ({
  value,
  onChange,
  disabled = false,
  disabledTooltip,
  errors,
}: PageSizeFieldsProps) => {
  const pageSizeCollection = createListCollection({
    groupBy: (item) => item.unit,
    items: PAGE_SIZE_OPTIONS.concat({
      label: "Custom",
      unit: value.unit,
      value: "custom",
      hidden: true,
    }),
  });

  const isLandscape = Number(value.pageWidth) > Number(value.pageHeight);

  const pageSizeValue = isLandscape
    ? `${value.pageHeight}${value.unit}-${value.pageWidth}${value.unit}`
    : `${value.pageWidth}${value.unit}-${value.pageHeight}${value.unit}`;

  const displayPageSizeValue = PAGE_SIZE_OPTIONS.some(
    (option) => option.value === pageSizeValue,
  )
    ? pageSizeValue
    : "custom";

  const pageSizeChangeHandler = (details: SelectValueChangeDetails) => {
    const selected = details.value[0] as `${number}${Unit}-${number}${Unit}`;
    const pageSize = pageSizeToNameMap[selected];

    const pageWidth = PAGE_DIMENSIONS[pageSize].width;
    const pageHeight = PAGE_DIMENSIONS[pageSize].height;

    onChange({
      pageWidth: isLandscape ? pageHeight.toString() : pageWidth.toString(),
      pageHeight: isLandscape ? pageWidth.toString() : pageHeight.toString(),
      unit: PAGE_DIMENSIONS[pageSize].unit,
    });
  };

  const rotatePage = () => {
    onChange({
      pageWidth: value.pageHeight,
      pageHeight: value.pageWidth,
    });
  };

  return (
    <Collapsible.Root gap="3">
      <Field>
        <SelectRoot
          collection={pageSizeCollection}
          value={[displayPageSizeValue]}
          onValueChange={pageSizeChangeHandler}
          disabled={disabled}
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
            disabled={!disabled || !disabledTooltip}
            openDelay={100}
            closeDelay={200}
            content={disabledTooltip}
          >
            <SelectControl>
              <SelectTrigger>
                <SelectValueText textTransform="capitalize" />
              </SelectTrigger>
              <SelectIndicatorGroup>
                <Tooltip openDelay={100} closeDelay={200} content="Rotate Page">
                  <IconButton
                    type="button"
                    variant="ghost"
                    pointerEvents="auto"
                    size="xs"
                    aria-label="Rotate Page"
                    disabled={disabled}
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
              <SelectItemGroup key={type} label={type === "mm" ? "ISO" : "US"}>
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
        <HStack gap="1" color="fg.muted" fontSize="xs">
          {isLandscape ? <LuRectangleHorizontal /> : <LuRectangleVertical />}
          <Text>
            {isLandscape ? "Landscape" : "Portrait"} — {value.pageWidth}×
            {value.pageHeight} {value.unit}
          </Text>
        </HStack>
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
          <Field disabled={disabled}>
            <SelectRoot
              collection={unitsCollection}
              value={[value.unit]}
              onValueChange={(details) =>
                onChange({ unit: details.value[0] as Unit })
              }
              disabled={disabled}
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
            label={`Page Width (${value.unit})`}
            invalid={!!errors?.pageWidth}
            disabled={disabled}
            errorText={errors?.pageWidth}
          >
            <NumberInputRoot
              min={1}
              value={value.pageWidth}
              onValueChange={(details) =>
                onChange({ pageWidth: details.value })
              }
              disabled={disabled}
            >
              <NumberInputField />
            </NumberInputRoot>
          </Field>
          <Field
            label={`Page Height (${value.unit})`}
            invalid={!!errors?.pageHeight}
            disabled={disabled}
            errorText={errors?.pageHeight}
          >
            <NumberInputRoot
              min={1}
              value={value.pageHeight}
              onValueChange={(details) =>
                onChange({ pageHeight: details.value })
              }
              disabled={disabled}
            >
              <NumberInputField />
            </NumberInputRoot>
          </Field>
        </VStack>
      </Collapsible.Content>
    </Collapsible.Root>
  );
};
