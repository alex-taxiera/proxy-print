import { defineSlotRecipe } from "@chakra-ui/react";
import { drawerAnatomy } from "@chakra-ui/react/anatomy";

export const drawer = defineSlotRecipe({
  slots: drawerAnatomy.keys(),
  base: {
    // Drawers open below the desktop app's title bar so the window can still
    // be dragged and closed. The variable is 0px on the web (see theme.ts).
    backdrop: {
      top: "var(--title-bar-height)",
      h: "calc(100dvh - var(--title-bar-height))",
    },
    positioner: {
      top: "var(--title-bar-height)",
      height: "calc(100dvh - var(--title-bar-height))",
    },
    content: {
      maxH: "calc(100dvh - var(--title-bar-height))",
    },
  },
});
