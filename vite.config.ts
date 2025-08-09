import { sentryVitePlugin } from "@sentry/vite-plugin";
/// <reference types="vitest/config" />
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import react from "@vitejs/plugin-react";
// https://vite.dev/config/
import { fileURLToPath } from "node:url";
import path from "path";
import { defineConfig } from "vite";

const dirname =
  typeof __dirname !== "undefined"
    ? __dirname
    : path.dirname(fileURLToPath(import.meta.url));

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
  plugins: [
    react(),
    sentryVitePlugin({
      org: "proxy-print",
      project: "proxy-print",
    }),
  ],
  worker: {
    format: "es",
  },
  resolve: {
    alias: {
      "styled-system": path.resolve(__dirname, "./styled-system"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "ark-ui": ["@ark-ui/react"],
          "pdf-lib": ["pdf-lib"],
        },
      },
    },

    sourcemap: true,
  },
  test: {
    projects: [
      {
        extends: true,
        plugins: [
          // The plugin will run tests for the stories defined in your Storybook config
          // See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
          storybookTest({
            configDir: path.join(dirname, ".storybook"),
          }),
        ],
        test: {
          name: "storybook",
          browser: {
            enabled: true,
            headless: true,
            provider: "playwright",
            instances: [
              {
                browser: "chromium",
              },
            ],
          },
          setupFiles: [".storybook/vitest.setup.ts"],
        },
      },
    ],
  },
});
