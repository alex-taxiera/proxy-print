import { defineSlotRecipe } from "@chakra-ui/react";
import { fileUploadAnatomy } from "@chakra-ui/react/anatomy";

export const fileUpload = defineSlotRecipe({
  slots: fileUploadAnatomy.keys(),
  base: {
    dropzone: {
      colorPalette: "accent",
      _hover: {
        cursor: "pointer",
      },
    },
  },
});
