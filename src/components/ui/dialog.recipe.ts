import { defineSlotRecipe } from "@chakra-ui/react";
import { dialogAnatomy } from "@chakra-ui/react/anatomy";

export const dialog = defineSlotRecipe({
  slots: dialogAnatomy.keys(),
  base: {
    // Dialogs open below the desktop app's title bar so the window can still
    // be dragged and closed. The variable is 0px on the web (see theme.ts).
    backdrop: {
      top: "var(--title-bar-height)",
      h: "calc(100dvh - var(--title-bar-height))",
    },
    positioner: {
      top: "var(--title-bar-height)",
      height: "calc(100dvh - var(--title-bar-height))",
    },
    body: {
      borderColor: "border",
      "&[data-overflow-y]:not(:first-child)": {
        borderTopWidth: "1px ",
      },
      "&[data-overflow-y]:not(:last-child)": {
        borderBottomWidth: "1px",
      },
    },
  },
});
