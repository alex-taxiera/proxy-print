import { defineGlobalStyles } from "@pandacss/dev";

export const globalCss = defineGlobalStyles({
  ":root": {
    "--global-font-body":
      "Inter, system-ui, Avenir, Helvetica, Arial, sans-serif",
  },
  body: {
    background: "bg.canvas",
    color: "fg.default",
    _dark: {
      colorScheme: "dark",
    },
  },
  "#root": {
    height: "100svh",
    position: "fixed",
    inset: "0",
    display: "flex",
    flexDirection: "column",
  },
  "*, *::before, *::after": {
    borderColor: "border.subtle",
    borderStyle: "solid",
    boxSizing: "border-box",
  },
  "*::placeholder": {
    opacity: 1,
    color: "fg.subtle",
  },
  "*::selection": {
    bg: "colorPalette.a3",
  },
  // Storybook docs story
  ".docs-story": {
    background: "bg.canvas",
  },
});
