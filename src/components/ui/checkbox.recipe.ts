import { defineSlotRecipe } from "@chakra-ui/react";
import { checkboxAnatomy } from "@chakra-ui/react/anatomy";

export const checkbox = defineSlotRecipe({
  slots: checkboxAnatomy.keys(),
  base: {
    label: {
      display: "inline-flex",
      alignItems: "center",
      gap: "2",
    },
    control: {
      colorPalette: "accent",
    },
  },
});
