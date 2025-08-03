"use client";
import type { Assign } from "@ark-ui/react";
import { Select, selectAnatomy } from "@ark-ui/react/select";
import type {
  ComponentProps,
  HTMLStyledProps,
  RecipeVariantProps,
} from "styled-system/types";
import { createStyleContext } from "./utils/create-style-context";
import { sva } from "styled-system/css";

const select = sva({
  className: "select",
  slots: selectAnatomy.keys(),
  base: {
    root: {
      display: "flex",
      flexDirection: "column",
      gap: "1.5",
      width: "full",
    },
    content: {
      background: "bg.default",
      borderRadius: "l2",
      boxShadow: "lg",
      display: "flex",
      flexDirection: "column",
      zIndex: "dropdown",
      _hidden: {
        display: "none",
      },
      _open: {
        animation: "fadeIn 0.25s ease-out",
      },
      _closed: {
        animation: "fadeOut 0.2s ease-out",
      },
      _focusVisible: {
        outlineOffset: "2px",
        outline: "2px solid",
        outlineColor: "border.outline",
      },
    },
    item: {
      alignItems: "center",
      borderRadius: "l1",
      cursor: "pointer",
      display: "flex",
      justifyContent: "space-between",
      transitionDuration: "fast",
      transitionProperty: "background, color",
      transitionTimingFunction: "default",
      _hover: {
        background: "gray.a3",
        color: "fg.default",
      },
      _highlighted: {
        background: "gray.a3",
        color: "fg.default",
      },
      _selected: {
        color: "fg.default",
      },
      _disabled: {
        color: "fg.disabled",
        cursor: "not-allowed",
        _hover: {
          background: "transparent",
          color: "fg.disabled",
        },
      },
    },
    itemGroupLabel: {
      fontWeight: "semibold",
      textStyle: "sm",
    },
    itemIndicator: {
      color: "colorPalette.default",
      ml: "2",
    },
    label: {
      color: "fg.default",
      fontWeight: "medium",
    },
    trigger: {
      appearance: "none",
      alignItems: "center",
      borderColor: "border.default",
      borderRadius: "l2",
      cursor: "pointer",
      color: "fg.default",
      display: "inline-flex",
      justifyContent: "space-between",
      outline: 0,
      position: "relative",
      transitionDuration: "normal",
      transitionProperty: "background, box-shadow, border-color",
      transitionTimingFunction: "default",
      width: "full",
      _placeholderShown: {
        color: "fg.subtle",
      },
      _disabled: {
        color: "fg.disabled",
        cursor: "not-allowed",
        "& :where(svg)": {
          color: "fg.disabled",
        },
      },
      "& :where(svg)": {
        color: "fg.subtle",
      },
    },
    clearTrigger: {
      cursor: "pointer",
    },
  },
  defaultVariants: {
    size: "md",
    variant: "outline",
  },
  variants: {
    variant: {
      outline: {
        trigger: {
          borderWidth: "1px",
          _focus: {
            borderColor: "colorPalette.default",
            boxShadow: "0 0 0 1px var(--colors-color-palette-default)",
          },
        },
      },
      ghost: {
        trigger: {
          _hover: {
            background: "gray.a3",
          },
          _focus: {
            background: "gray.a3",
          },
        },
      },
    },
    size: {
      sm: {
        content: { p: "0.5", gap: "1" },
        item: { textStyle: "sm", px: "2", height: "9" },
        itemIndicator: {
          "& :where(svg)": {
            width: "4",
            height: "4",
          },
        },
        itemGroupLabel: {
          px: "2",
          py: "1.5",
        },
        label: { textStyle: "sm" },
        trigger: {
          px: "2.5",
          h: "9",
          minW: "9",
          fontSize: "sm",
          gap: "2",
          "& :where(svg)": {
            width: "4",
            height: "4",
          },
        },
      },
      md: {
        content: { p: "1", gap: "1" },
        item: { textStyle: "md", px: "2", height: "10" },
        itemIndicator: {
          "& :where(svg)": {
            width: "4",
            height: "4",
          },
        },
        itemGroupLabel: {
          px: "2",
          py: "1.5",
        },
        label: { textStyle: "sm" },
        trigger: {
          px: "3",
          h: "10",
          minW: "10",
          fontSize: "md",
          gap: "2",
          "& :where(svg)": {
            width: "4",
            height: "4",
          },
        },
      },
      lg: {
        content: { p: "1.5", gap: "1" },
        item: { textStyle: "md", px: "2", height: "11" },
        itemIndicator: {
          "& :where(svg)": {
            width: "5",
            height: "5",
          },
        },
        itemGroupLabel: {
          px: "2",
          py: "1.5",
        },
        label: { textStyle: "sm" },
        trigger: {
          px: "3.5",
          h: "11",
          minW: "11",
          fontSize: "md",
          gap: "2",
          "& :where(svg)": {
            width: "5",
            height: "5",
          },
        },
      },
    },
  },
});

export type SelectVariants = RecipeVariantProps<typeof select>;

const { withProvider, withContext } = createStyleContext(select);

export type RootProviderProps = ComponentProps<typeof RootProvider>;
export const RootProvider = withProvider<
  HTMLDivElement,
  Assign<
    Assign<
      HTMLStyledProps<"div">,
      Select.RootProviderBaseProps<Select.CollectionItem>
    >,
    SelectVariants
  >
>(Select.RootProvider, "root");

export type RootProps = ComponentProps<typeof Root>;
export const Root = withProvider<
  HTMLDivElement,
  Assign<
    Assign<HTMLStyledProps<"div">, Select.RootBaseProps<Select.CollectionItem>>,
    SelectVariants
  >
>(Select.Root, "root");

export const ClearTrigger = withContext<
  HTMLButtonElement,
  Assign<HTMLStyledProps<"button">, Select.ClearTriggerBaseProps>
>(Select.ClearTrigger, "clearTrigger");

export const Content = withContext<
  HTMLDivElement,
  Assign<HTMLStyledProps<"div">, Select.ContentBaseProps>
>(Select.Content, "content");

export const Control = withContext<
  HTMLDivElement,
  Assign<HTMLStyledProps<"div">, Select.ControlBaseProps>
>(Select.Control, "control");

export const Indicator = withContext<
  HTMLDivElement,
  Assign<HTMLStyledProps<"div">, Select.IndicatorBaseProps>
>(Select.Indicator, "indicator");

export const ItemGroupLabel = withContext<
  HTMLDivElement,
  Assign<HTMLStyledProps<"div">, Select.ItemGroupLabelBaseProps>
>(Select.ItemGroupLabel, "itemGroupLabel");

export const ItemGroup = withContext<
  HTMLDivElement,
  Assign<HTMLStyledProps<"div">, Select.ItemGroupBaseProps>
>(Select.ItemGroup, "itemGroup");

export const ItemIndicator = withContext<
  HTMLDivElement,
  Assign<HTMLStyledProps<"div">, Select.ItemIndicatorBaseProps>
>(Select.ItemIndicator, "itemIndicator");

export const Item = withContext<
  HTMLDivElement,
  Assign<HTMLStyledProps<"div">, Select.ItemBaseProps>
>(Select.Item, "item");

export const ItemText = withContext<
  HTMLDivElement,
  Assign<HTMLStyledProps<"span">, Select.ItemTextBaseProps>
>(Select.ItemText, "itemText");

export const Label = withContext<
  HTMLLabelElement,
  Assign<HTMLStyledProps<"label">, Select.LabelBaseProps>
>(Select.Label, "label");

export const List = withContext<
  HTMLDivElement,
  Assign<HTMLStyledProps<"div">, Select.ListBaseProps>
>(Select.List, "list");

export const Positioner = withContext<
  HTMLDivElement,
  Assign<HTMLStyledProps<"div">, Select.PositionerBaseProps>
>(Select.Positioner, "positioner");

export const Trigger = withContext<
  HTMLButtonElement,
  Assign<HTMLStyledProps<"button">, Select.TriggerBaseProps>
>(Select.Trigger, "trigger");

export const ValueText = withContext<
  HTMLSpanElement,
  Assign<HTMLStyledProps<"span">, Select.ValueTextBaseProps>
>(Select.ValueText, "valueText");

export {
  SelectContext as Context,
  SelectHiddenSelect as HiddenSelect,
} from "@ark-ui/react/select";
