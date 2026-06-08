import { collapsibleAnatomy } from "@ark-ui/react";
import { defineSlotRecipe } from "@chakra-ui/react";

export const collapsible = defineSlotRecipe({
  slots: collapsibleAnatomy.keys(),
  base: {
    root: {
      display: "flex",
    },
    content: {
      overflow: "hidden",
    },
  },
  variants: {
    direction: {
      down: {
        root: {
          alignItems: "flex-start",
          flexDirection: "column",
          width: "full",
        },
        content: {
          width: "full",
          _open: {
            animationName: "expand-height, fade-in",
            animationDuration: "moderate",
            "&[data-has-collapsed-size]": {
              animationName: "expand-height",
            },
          },
          _closed: {
            animationName: "collapse-height, fade-out",
            animationDuration: "moderate",
            "&[data-has-collapsed-size]": {
              animationName: "collapse-height",
            },
          },
        },
      },
      right: {
        root: {
          alignItems: "stretch",
          flexDirection: "row",
          height: "full",
        },
        content: {
          height: "full",
          _open: {
            animationName: "expand-width, fade-in",
            animationDuration: "moderate",
            "&[data-has-collapsed-size]": {
              animationName: "expand-width",
            },
          },
          _closed: {
            animationName: "collapse-width, fade-out",
            animationDuration: "moderate",
            "&[data-has-collapsed-size]": {
              animationName: "collapse-width",
            },
          },
        },
      },
      left: {
        root: {
          flexDirection: "row",
          height: "full",
        },
        content: {
          height: "full",
          _open: {
            animationName: "expand-width, fade-in",
            animationDuration: "moderate",
            "&[data-has-collapsed-size]": {
              animationName: "expand-width",
            },
          },
          _closed: {
            animationName: "collapse-width, fade-out",
            animationDuration: "moderate",
            "&[data-has-collapsed-size]": {
              animationName: "collapse-width",
            },
          },
        },
      },
    },
  },
  defaultVariants: {
    direction: "down",
  },
});
