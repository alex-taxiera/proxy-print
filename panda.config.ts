import { defineConfig } from "@pandacss/dev";
import { createPreset } from "./src/components/ui/preset";
import iris from "./src/components/ui/preset/colors/iris";
import slate from "./src/components/ui/preset/colors/slate";

export default defineConfig({
  // Whether to use css reset
  preflight: true,

  presets: [
    createPreset({
      accentColor: iris,
      grayColor: slate,
      radius: "sm",
    }),
  ],

  // Where to look for your css declarations
  include: ["./src/**/*.{js,jsx,ts,tsx}", "./stories/**/*.{js,jsx,ts,tsx}"],

  // Files to exclude
  exclude: [],

  // Useful for theme customization
  theme: {
    extend: {},
  },

  // The output directory for your css system
  outdir: "styled-system",

  jsxFramework: "react",
});
