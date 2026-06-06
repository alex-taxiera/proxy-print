import { defineSlotRecipe } from "@chakra-ui/react";
import { numberInputAnatomy } from "@chakra-ui/react/anatomy";

export const numberInput = defineSlotRecipe({
  slots: numberInputAnatomy.keys(),
  base: {
    root: { colorPalette: "accent" },
    input: {
      transitionProperty: "common",
      transitionDuration: "moderate",
    },
  },
});
