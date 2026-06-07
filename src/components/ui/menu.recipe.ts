import { defineSlotRecipe } from "@chakra-ui/react";
import { menuAnatomy } from "@chakra-ui/react/anatomy";

export const menu = defineSlotRecipe({
  slots: menuAnatomy.keys(),
  base: {
    itemGroupLabel: {
      py: "2.5",
      "&:first-child": {
        pt: "0",
        pb: "2.5"
      }
    },
    itemGroup: {
      pt: "1",
      "&:not(:first-child)": {
        pt: "2.5"
      }
    }
  },
});
