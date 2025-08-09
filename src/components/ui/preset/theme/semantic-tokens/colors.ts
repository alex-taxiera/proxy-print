import { defineSemanticTokens } from "@pandacss/dev";

export const colors = defineSemanticTokens.colors({
  bg: {
    canvas: { value: { _light: "{colors.gray.1}", _dark: "{colors.gray.1}" } },
    default: { value: { _light: "white", _dark: "{colors.gray.2}" } },
    subtle: { value: { _light: "{colors.gray.2}", _dark: "{colors.gray.3}" } },
    muted: { value: { _light: "{colors.gray.3}", _dark: "{colors.gray.4}" } },
    emphasized: {
      value: { _light: "{colors.gray.4}", _dark: "{colors.gray.5}" },
    },
    disabled: {
      value: { _light: "{colors.gray.5}", _dark: "{colors.gray.6}" },
    },
    error: { value: { _light: "{colors.red.3}", _dark: "{colors.red.3}" } },

    warning: {
      value: { _light: "{colors.yellow.2}", _dark: "{colors.yellow.2}" },
    },
    success: {
      value: { _light: "{colors.green.2}", _dark: "{colors.green.2}" },
    },
    info: { value: { _light: "{colors.blue.3}", _dark: "{colors.blue.3}" } },
  },
  fg: {
    default: {
      value: { _light: "{colors.gray.12}", _dark: "{colors.gray.12}" },
    },
    muted: { value: { _light: "{colors.gray.11}", _dark: "{colors.gray.11}" } },
    subtle: {
      value: { _light: "{colors.gray.10}", _dark: "{colors.gray.10}" },
    },
    disabled: {
      value: { _light: "{colors.gray.9}", _dark: "{colors.gray.9}" },
    },
    error: { value: { _light: "{colors.red.9}", _dark: "{colors.red.9}" } },
    warning: {
      value: { _light: "{colors.yellow.10}", _dark: "{colors.yellow.10}" },
    },
    success: {
      value: { _light: "{colors.green.10}", _dark: "{colors.green.10}" },
    },
    info: { value: { _light: "{colors.blue.9}", _dark: "{colors.blue.9}" } },
  },
  border: {
    default: { value: { _light: "{colors.gray.7}", _dark: "{colors.gray.7}" } },
    muted: { value: { _light: "{colors.gray.6}", _dark: "{colors.gray.6}" } },
    subtle: { value: { _light: "{colors.gray.4}", _dark: "{colors.gray.4}" } },
    disabled: {
      value: { _light: "{colors.gray.5}", _dark: "{colors.gray.5}" },
    },
    outline: {
      value: { _light: "{colors.gray.a9}", _dark: "{colors.gray.a9}" },
    },
    error: { value: { _light: "{colors.red.9}", _dark: "{colors.red.9}" } },
    warning: {
      value: { _light: "{colors.yellow.10}", _dark: "{colors.yellow.10}" },
    },
    success: {
      value: { _light: "{colors.green.10}", _dark: "{colors.green.10}" },
    },
    info: { value: { _light: "{colors.blue.9}", _dark: "{colors.blue.9}" } },
  },
});
