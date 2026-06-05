import { defineRecipe } from "@chakra-ui/react";

export const button = defineRecipe({
  variants: {
    variant: {
      solid: {
        colorPalette: "accent",
      },
    },
  },
});
