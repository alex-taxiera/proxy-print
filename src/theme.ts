import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react";

import { accordion } from "@/components/ui/accordion.recipe";
import { alert } from "@/components/ui/alert.recipe";
import { button } from "@/components/ui/button.recipe";
import { checkbox } from "@/components/ui/checkbox.recipe";
import { collapsible } from "@/components/ui/collapsible.recipe";
import { colorPicker } from "@/components/ui/color-picker.recipe";
import { fileUpload } from "@/components/ui/file-upload.recipe";
import { input } from "@/components/ui/input.recipe";
import { menu } from "@/components/ui/menu.recipe";
import { numberInput } from "@/components/ui/number-input.recipe";
import { select } from "@/components/ui/select.recipe";
import { textarea } from "@/components/ui/textarea.recipe";

import { guide } from "@/components/Preview/Card/Guides";

const customConfig = defineConfig({
  theme: {
    tokens: {
      colors: {
        accent: {
          50: { value: "#f4f4fc" },
          100: { value: "#e7e7f9" },
          200: { value: "#d1d1f3" },
          300: { value: "#abaeeb" },
          400: { value: "#8484df" },
          500: { value: "#6767d8" },
          600: { value: "#5b5bd6" },
          700: { value: "#4d4db8" },
          800: { value: "#3f3f96" },
          900: { value: "#343475" },
          950: { value: "#21214a" },
        },
        gray: {
          50: { value: "#f8f9fb" },
          100: { value: "#f1f3f6" },
          200: { value: "#dfe2e8" },
          300: { value: "#c1c6ce" },
          400: { value: "#a0a7b1" },
          500: { value: "#828a95" },
          600: { value: "#696e77" },
          700: { value: "#535860" },
          800: { value: "#3d4249" },
          900: { value: "#282b30" },
          950: { value: "#16181b" },
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
              _light: "{colors.accent.800}",
              _dark: "{colors.accent.400}",
            },
          },
          subtle: {
            value: {
              _light: "{colors.accent.300}",
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
      input,
      textarea,
    },
    slotRecipes: {
      accordion,
      alert,
      checkbox,
      collapsible,
      colorPicker,
      fileUpload,
      menu,
      numberInput,
      select,
      guide,
    },
  },
  globalCss: {
    "#root": {
      height: "100vh",
      display: "flex",
      flexDirection: "column",
    },
  },
});

export const system = createSystem(defaultConfig, customConfig);
