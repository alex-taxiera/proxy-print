import { toastAnatomy } from "@ark-ui/react/toast";
import { defineSlotRecipe } from "@pandacss/dev";

export const toast = defineSlotRecipe({
  className: "toast",
  slots: toastAnatomy.keys(),
  base: {
    root: {
      background: "bg.default",
      borderRadius: "l3",
      minWidth: "xs",
      height: "var(--height)",
      opacity: "var(--opacity)",
      overflowWrap: "anywhere",
      p: "4",
      display: "grid",
      gridTemplateAreas: `
        "title"
        "description"
        "action"
      `,
      columnGap: "4",
      position: "relative",
      scale: "var(--scale)",
      translate: "var(--x) var(--y) 0",
      willChange: "translate, opacity, scale",
      zIndex: "var(--z-index)",
      transitionDuration: "slow",
      transitionProperty: "translate, scale, opacity, height",
      transitionTimingFunction: "default",
      '&[data-type="info"], &[data-type="loading"]': {
        background: "bg.info",
      },
      '&[data-type="loading"]': {
        gridTemplateAreas: `
          "progress title"
          "progress description"
          "progress action"
        `,
        gridTemplateColumns: "min-content 1fr",
      },
      '&[data-type="success"]': {
        background: "bg.success",
      },
      '&[data-type="warning"]': {
        background: "bg.warning",
      },
      '&[data-type="error"]': {
        background: "bg.error",
      },
    },
    title: {
      color: "fg.default",
      fontWeight: "semibold",
      textStyle: "sm",
      gridArea: "title",
      whiteSpace: "nowrap",
    },
    description: {
      color: "fg.muted",
      textStyle: "sm",
      gridArea: "description",
    },
    actionTrigger: {
      mt: "2",
      gridArea: "action",
    },
    closeTrigger: {
      position: "absolute",
      top: "1",
      right: "1",
    },
  },
});
