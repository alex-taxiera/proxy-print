import { defineSlotRecipe } from "@chakra-ui/react";
import { scrollAreaAnatomy } from "@chakra-ui/react/anatomy";

export const scrollArea = defineSlotRecipe({
  slots: scrollAreaAnatomy.keys(),
  base: {
    root: {
      "--scroll-shadow-size": "1rem",
    },
    scrollbar: {
      zIndex: "docked",
    },
    viewport: {
      maskImage: "linear-gradient(#000, #000)",
      "&[data-overflow-y]": {
        maskImage:
          "linear-gradient(transparent 0,#000 min(var(--scroll-shadow-size), var(--scroll-area-overflow-y-start, 0px)),#000 calc(100% - min(var(--scroll-shadow-size), var(--scroll-area-overflow-y-end, 0px))),transparent)",
      },
      "&[data-overflow-x]": {
        maskImage:
          "linear-gradient(90deg,transparent 0,#000 min(var(--scroll-shadow-size), var(--scroll-area-overflow-x-start, 0px)),#000 calc(100% - min(var(--scroll-shadow-size), var(--scroll-area-overflow-x-end, 0px))),transparent)",
      },
      "&[data-overflow-x][data-overflow-y]": {
        maskImage:
          "linear-gradient(transparent 0,#000 min(var(--scroll-shadow-size), var(--scroll-area-overflow-y-start, 0px)),#000 calc(100% - min(var(--scroll-shadow-size), var(--scroll-area-overflow-y-end, 0px))),transparent), linear-gradient(90deg,transparent 0,#000 min(var(--scroll-shadow-size), var(--scroll-area-overflow-x-start, 0px)),#000 calc(100% - min(var(--scroll-shadow-size), var(--scroll-area-overflow-x-end, 0px))),transparent)",
        maskComposite: "intersect",
      },
    },
  },
  defaultVariants: {
    variant: "always",
  },
});
