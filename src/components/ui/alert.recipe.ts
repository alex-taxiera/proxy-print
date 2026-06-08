import { defineSlotRecipe } from "@chakra-ui/react";
import { alertAnatomy } from "@chakra-ui/react/anatomy";

export const alert = defineSlotRecipe({
  slots: [...alertAnatomy.keys(), "dismissButton"],
  base: {
    dismissButton: {
      position: "absolute",
      top: "3",
      right: "3",
      zIndex: "1",
      color: "fg.muted",
    },
  },
});
