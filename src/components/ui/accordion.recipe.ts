import { defineSlotRecipe } from "@chakra-ui/react";
import { accordionAnatomy } from "@chakra-ui/react/anatomy";

export const accordion = defineSlotRecipe({
  slots: accordionAnatomy.keys(),
  base: {
    itemTrigger: {
      borderRadius: "0",
      _focusVisible: {
        outline: "2px solid",
        outlineOffset: "-2px",
        outlineColor: "colorPalette.focusRing",
      },
      _hover: {
        bg: "colorPalette.emphasized/20",
      },
    },
  },
});
