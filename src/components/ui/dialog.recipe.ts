import { defineSlotRecipe } from "@chakra-ui/react";
import { dialogAnatomy } from "@chakra-ui/react/anatomy";

export const dialog = defineSlotRecipe({
  slots: dialogAnatomy.keys(),
  base: {
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
