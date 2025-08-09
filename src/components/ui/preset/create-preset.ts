import { type SemanticTokens, definePreset } from "@pandacss/dev";

import { recipes, slotRecipes } from "../styled/_recipes";
import blue from "./colors/blue";
import green from "./colors/green";
import red from "./colors/red";
import yellow from "./colors/yellow";
import type { PresetOptions } from "./options";
import { breakpoints } from "./theme/breakpoints";
import { conditions } from "./theme/conditions";
import { globalCss } from "./theme/global-css";
import { keyframes } from "./theme/keyframes";
import { semanticTokens } from "./theme/semantic-tokens";
import { textStyles } from "./theme/text-styles";
import { tokens } from "./theme/tokens";
import { createRadii } from "./utils/create-radii";

export const createPreset = (options: PresetOptions) => {
  const { accentColor, grayColor, radius } = options;

  const standardizeGrayTokens = (tokens: SemanticTokens["colors"]) =>
    JSON.parse(
      JSON.stringify(tokens).replace(new RegExp(grayColor.name, "g"), "gray"),
    ) as SemanticTokens["colors"];

  return definePreset({
    name: "@park-ui/panda-preset",
    presets: ["@pandacss/preset-base"],
    conditions,
    globalCss: {
      ...globalCss,
      html: {
        colorPalette: accentColor.name,
      },
    },
    theme: {
      extend: {
        breakpoints,
        keyframes,
        recipes,
        slotRecipes,
        textStyles,
        tokens: {
          ...tokens,
          colors: {
            ...tokens.colors,
            red: red.tokens,
            yellow: yellow.tokens,
            green: green.tokens,
            blue: blue.tokens,
            gray: grayColor.tokens ?? {},
            [accentColor.name]: accentColor.tokens,
            accent: accentColor.tokens!,
          },
        },
        semanticTokens: {
          ...semanticTokens,
          colors: {
            ...semanticTokens.colors,
            red: red.semanticTokens,
            yellow: yellow.semanticTokens,
            green: green.semanticTokens,
            blue: blue.semanticTokens,
            gray: standardizeGrayTokens(grayColor.semanticTokens)!,
            [accentColor.name]: accentColor.semanticTokens,
            accent: accentColor.semanticTokens!,
          },
          radii: createRadii(radius),
        },
      },
    },
  });
};
