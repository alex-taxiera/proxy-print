import { defineSlotRecipe } from "@chakra-ui/react";
import { colorPickerAnatomy } from "@chakra-ui/react/anatomy";

export const colorPicker = defineSlotRecipe({
  slots: colorPickerAnatomy.keys(),
  base: {
    root: { colorPalette: "accent" },
    channelInput: {
      transitionProperty: "common",
      transitionDuration: "moderate",
    },
  },
});
