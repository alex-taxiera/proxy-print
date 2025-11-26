import { fieldAnatomy } from "@ark-ui/react/field";
import { defineRecipe, defineSlotRecipe } from "@pandacss/dev";

export const field = defineSlotRecipe({
  className: "field",
  slots: fieldAnatomy.keys(),
  base: {
    root: {
      display: "flex",
      flexDirection: "column",
      gap: "1.5",
    },
    label: {
      color: "fg.default",
      fontWeight: "medium",
      textStyle: "sm",
      _disabled: {
        color: "fg.disabled",
      },
    },
    helperText: {
      color: "fg.muted",
      textStyle: "sm",
      _disabled: {
        color: "fg.disabled",
      },
    },
    errorText: {
      alignItems: "center",
      color: "fg.error",
      display: "inline-flex",
      gap: "2",
      textStyle: "sm",
      _disabled: {
        color: "fg.disabled",
      },
    },
  },
});

export const input = defineRecipe({
  className: "input",
  jsx: ["Field.Input"],
  base: {
    appearance: "none",
    background: "none",
    borderColor: "border.default",
    borderRadius: "l2",
    borderWidth: "1px",
    color: "fg.default",
    outline: 0,
    position: "relative",
    transitionDuration: "normal",
    transitionProperty: "box-shadow, border-color",
    transitionTimingFunction: "default",
    width: "full",
    _disabled: {
      opacity: 0.4,
      cursor: "not-allowed",
    },
    _focus: {
      borderColor: "colorPalette.default",
      boxShadow: "0 0 0 1px var(--colors-color-palette-default)",
    },
    _invalid: {
      borderColor: "fg.error",
      _focus: {
        borderColor: "fg.error",
        boxShadow: "0 0 0 1px var(--colors-border-error)",
      },
    },
  },
  defaultVariants: {
    size: "md",
  },
  variants: {
    size: {
      "2xs": { px: "1.5", h: "7", minW: "7", fontSize: "xs" },
      xs: { px: "2", h: "8", minW: "8", fontSize: "xs" },
      sm: { px: "2.5", h: "9", minW: "9", fontSize: "sm" },
      md: { px: "3", h: "10", minW: "10", fontSize: "md" },
      lg: { px: "3.5", h: "11", minW: "11", fontSize: "md" },
      xl: { px: "4", h: "12", minW: "12", fontSize: "lg" },
      "2xl": { px: "4.5", h: "16", minW: "16", textStyle: "3xl" },
    },
  },
});

export const textarea = defineRecipe({
  className: "textarea",
  jsx: ["Field.Textarea"],
  base: {
    appearance: "none",
    background: "none",
    borderColor: "border.default",
    borderRadius: "l2",
    borderWidth: "1px",
    minWidth: 0,
    outline: 0,
    position: "relative",
    transitionDuration: "normal",
    transitionProperty: "border-color, box-shadow",
    width: "full",
    _disabled: {
      opacity: 0.4,
      cursor: "not-allowed",
    },
    _focus: {
      borderColor: "colorPalette.default",
      boxShadow: "0 0 0 1px var(--colors-color-palette-default)",
    },
    _invalid: {
      borderColor: "fg.error",
      _focus: {
        borderColor: "fg.error",
        boxShadow: "0 0 0 1px var(--colors-border-error)",
      },
    },
  },
  defaultVariants: {
    size: "md",
  },
  variants: {
    size: {
      sm: { p: "2.5", fontSize: "sm" },
      md: { p: "3", fontSize: "md" },
      lg: { p: "3.5", fontSize: "md" },
      xl: { p: "4", fontSize: "md" },
    },
  },
});
