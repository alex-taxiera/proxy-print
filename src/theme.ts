import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react";

import { button } from "@/components/ui/button.recipe";

const customConfig = defineConfig({
  theme: {
    tokens: {
      colors: {
        accent: {
          50: { value: "#e0dffe" },
          100: { value: "#b1a9ff" },
          200: { value: "#6e6ade" },
          300: { value: "#5b5bd6" },
          400: { value: "#5958b1" },
          500: { value: "#4a4a95" },
          600: { value: "#3d3e82" },
          700: { value: "#303374" },
          800: { value: "#262a65" },
          900: { value: "#202248" },
          950: { value: "#171625" },
          1000: { value: "#13131e" },
        },
        gray: {
          50: { value: "#edeef0" },
          100: { value: "#b0b4ba" },
          200: { value: "#777b84" },
          300: { value: "#696e77" },
          400: { value: "#5a6169" },
          500: { value: "#43484e" },
          600: { value: "#363a3f" },
          700: { value: "#2e3135" },
          800: { value: "#272a2d" },
          900: { value: "#212225" },
          950: { value: "#18191b" },
          1000: { value: "#111113" },
        },
      },
    },
    semanticTokens: {
      colors: {
        accent: {
          contrast: {
            value: { _light: "{colors.white}", _dark: "{colors.white}" },
          },
          fg: {
            value: {
              _light: "{colors.accent.700}",
              _dark: "{colors.accent.300}",
            },
          },
          subtle: {
            value: {
              _light: "{colors.accent.100}",
              _dark: "{colors.accent.900}",
            },
          },
          muted: {
            value: {
              _light: "{colors.accent.200}",
              _dark: "{colors.accent.800}",
            },
          },
          emphasized: {
            value: {
              _light: "{colors.accent.300}",
              _dark: "{colors.accent.700}",
            },
          },
          solid: {
            value: {
              _light: "{colors.accent.600}",
              _dark: "{colors.accent.600}",
            },
          },
          focusRing: {
            value: {
              _light: "{colors.accent.500}",
              _dark: "{colors.accent.500}",
            },
          },
          border: {
            value: {
              _light: "{colors.accent.500}",
              _dark: "{colors.accent.400}",
            },
          },
        },
      },
    },
    recipes: {
      button,
    },
  },
  globalCss: {
    "#root": {
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
    },
  },
});

export const system = createSystem(defaultConfig, customConfig);
